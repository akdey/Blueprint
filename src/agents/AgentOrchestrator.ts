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

export type AgentProgressCallback = (phase: number, status: string, content?: string) => void;

export class AgentOrchestrator {
    private client: LLMClient;
    private stateManager: ProjectStateManager;
    private compressor: ContextCompressor;

    constructor(client: LLMClient, stateManager: ProjectStateManager) {
        this.client = client;
        this.stateManager = stateManager;
        // ContextCompressor starts loading LLMLingua2 in background immediately.
        // If LLMLingua2 loads before the first later-phase run, semantic compression is used.
        // Otherwise it falls back to deterministic truncation — always safe.
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

        // Phases 1-3 are small enough to use verbatim context.
        // Phases 4-8 use smart context budgeting with LLMLingua2 compression.
        let context: string;
        if (phaseId <= 3) {
            // Legacy path — no compression needed, phases are early and context is small
            context = this.stateManager.buildContext(phaseId);
        } else {
            // Smart path — applies per-phase context policy + enforces provider-specific char budget
            const providerName = this.client.getLabel().toLowerCase();
            const maxChars = providerName.includes('groq') ? 24_000 : 100_000;
            context = await this.stateManager.buildSmartContext(phaseId, this.compressor, maxChars);
        }

        const userPrompt = this.buildUserPrompt(phaseId, state.projectName, state.projectDescription, context);

        try {
            const result = await this.client.generate(systemPrompt, userPrompt);
            onProgress(phaseId, 'review', result);
            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            throw new Error(`Phase ${phaseId} generation failed: ${errorMsg}`);
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
