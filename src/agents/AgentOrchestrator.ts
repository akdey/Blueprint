// Blueprint Agent Orchestrator — 8 specialized agents with smart context budgeting.
// Uses ContextCompressor (LLMLingua-2) to keep per-agent token usage within budget.
import { LLMClient } from './LLMClient';
import { ProjectStateManager, PHASE_DEFINITIONS } from '../state/ProjectStateManager';
import { ContextCompressor } from './ContextCompressor';

// Import Prompts
import * as IdentityPrompt from './prompts/identity';
import * as ScopePrompt from './prompts/scope';
import * as SkeletonPrompt from './prompts/skeleton';
import * as ContractPrompt from './prompts/contract';
import * as TestingPrompt from './prompts/testing';
import * as DataPrompt from './prompts/data';
import * as DesignPrompt from './prompts/design';
import * as HandoffPrompt from './prompts/handoff';
import * as SeedingPrompt from './prompts/seeding';
import { GeminiCacheManager } from './LLMClient';


export type AgentProgressCallback = (phase: number, status: string, content?: string) => void;

// Context budgets per provider (in characters, based on free/standard tier TPM limits)
const PROVIDER_CONTEXT_LIMITS: Record<string, number> = {
    'groq': 128_000,     // ~32K tokens (Groq 2026 limits)
    'gemini': 2_000_000, // ~500K tokens (Gemini 1.5/3.1 window)
    'openai': 128_000,   // ~32K tokens (GPT-4o/5.4 window)
    'azure': 128_000,
    'litellm': 128_000
};

export class AgentOrchestrator {
    private compressor: ContextCompressor;
    private cachedContentName: string | null = null;
    private geminiApiKey: string | null = null;

    constructor(private client: LLMClient, private stateManager: ProjectStateManager, geminiApiKey?: string) {
        this.geminiApiKey = geminiApiKey || null;
        // ContextCompressor starts loading LLMLingua2 in background immediately.
        this.compressor = new ContextCompressor();
    }

    async runPhase(
        phaseId: number,
        onProgress: AgentProgressCallback
    ): Promise<string> {
        const def = PHASE_DEFINITIONS.find(d => d.id === phaseId);
        if (!def) throw new Error(`Unknown phase: ${phaseId}`);

        const state = this.stateManager.getState();
        if (!state) throw new Error('No active project state');

        onProgress(phaseId, 'generating');

        const systemPrompt = this.getSystemPrompt(def.agentType);
        if (!systemPrompt) throw new Error(`No system prompt for agent type: ${def.agentType}`);

        // ── KV Cache Management (Gemini Exclusive) ───────────────────────────
        let activeCache: string | undefined;
        if (this.client.getLabel().toLowerCase().includes('gemini') && this.geminiApiKey) {
            try {
                if (!this.cachedContentName) {
                    onProgress(phaseId, 'optimizing-kv-cache');
                    const manager = new GeminiCacheManager(this.geminiApiKey);
                    const staticPrefix = this.stateManager.getStaticPrefix();
                    const modelId = this.client.getLabel().split(' — ')[1] || 'gemini-3.1-flash';
                    
                    this.cachedContentName = await manager.createCache(
                        modelId,
                        `blueprint-${state.projectName.toLowerCase().replace(/\s+/g, '-')}`,
                        systemPrompt, // We use the first agent's system prompt as the base cache instruction
                        staticPrefix
                    );
                }
                activeCache = this.cachedContentName;
            } catch (err) {
                console.error('[Blueprint] Cache creation failed, falling back to standard prompt.', err);
            }
        }

        // Phases 1-3 are small enough to use verbatim context.
        // Phases 4-8 use smart context budgeting with LLMLingua2 compression.
        let context: string;
        if (phaseId <= 3) {
            context = this.stateManager.buildContext(phaseId);
        } else {
            const providerName = this.client.getLabel().toLowerCase();
            let maxChars = 128_000; 
            for (const [key, limit] of Object.entries(PROVIDER_CONTEXT_LIMITS)) {
                if (providerName.includes(key)) {
                    maxChars = limit;
                    break;
                }
            }
            context = await this.stateManager.buildSmartContext(phaseId, this.compressor, maxChars);
        }

        // If we have an active KV cache, the static prefix is ALREADY in the cache.
        // We only send the delta (dynamic context artifacts).
        let finalContext = context;
        if (activeCache) {
            const staticPrefix = this.stateManager.getStaticPrefix();
            if (context.startsWith(staticPrefix)) {
                finalContext = context.substring(staticPrefix.length).trim();
            }
        }

        const userPrompt = this.buildUserPrompt(phaseId, state.projectName, state.projectDescription, finalContext);

        try {
            const result = await this.client.generate(systemPrompt, userPrompt, activeCache);
            onProgress(phaseId, 'review', result);
            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            throw new Error(`Phase ${phaseId} generation failed: ${errorMsg}`);
        }
    }

    /** Clean up the KV cache when orchestrator session is destroyed */
    async dispose(): Promise<void> {
        if (this.cachedContentName && this.geminiApiKey) {
            try {
                const manager = new GeminiCacheManager(this.geminiApiKey);
                await manager.deleteCache(this.cachedContentName);
                this.cachedContentName = null;
            } catch (err) {
                console.error('[Blueprint] Cache cleanup failed.', err);
            }
        }
    }

    private getSystemPrompt(agentType: string): string {
        switch (agentType) {
            case 'branding': return IdentityPrompt.SYSTEM_PROMPT;
            case 'requirements': return ScopePrompt.SYSTEM_PROMPT;
            case 'architecture': return SkeletonPrompt.SYSTEM_PROMPT;
            case 'api': return ContractPrompt.SYSTEM_PROMPT;
            case 'testing': return TestingPrompt.SYSTEM_PROMPT;
            case 'database': return DataPrompt.SYSTEM_PROMPT;
            case 'ui': return DesignPrompt.SYSTEM_PROMPT;
            case 'handoff': return HandoffPrompt.SYSTEM_PROMPT;
            case 'seeding': return SeedingPrompt.SYSTEM_PROMPT;
            default: return '';
        }
    }

    private buildUserPrompt(
        phaseId: number,
        projectName: string,
        projectDescription: string,
        context: string
    ): string {
        // User prompts follow a cache-friendly structure:
        //   1. STATIC task header (rarely changes — good for cache prefix)
        //   2. Project name + description (stable across phases)
        //   3. Dynamic context (prior phase artifacts — changes; always last)
        switch (phaseId) {
            case 1: return IdentityPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 2: return ScopePrompt.USER_PROMPT(projectName, projectDescription, context);
            case 3: return SkeletonPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 4: return ContractPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 5: return TestingPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 6: return DataPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 7: return DesignPrompt.USER_PROMPT(projectName, projectDescription, context);
            case 8: return HandoffPrompt.USER_PROMPT(projectName, projectDescription, context);
            default: return `Execute Phase ${phaseId} for project: ${projectName}\n\n${context}`;
        }
    }
}
