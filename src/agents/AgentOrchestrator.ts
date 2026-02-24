// Blueprint Agent Orchestrator — 8 specialized agents
import { LLMClient } from './LLMClient';
import { ProjectStateManager, PHASE_DEFINITIONS } from '../state/ProjectStateManager';

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

    constructor(client: LLMClient, stateManager: ProjectStateManager) {
        this.client = client;
        this.stateManager = stateManager;
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

        // Build cumulative context (all approved artifacts from prior phases + level + tech stack)
        const context = this.stateManager.buildContext(phaseId);

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
