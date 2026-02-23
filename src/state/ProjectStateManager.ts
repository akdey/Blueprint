import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type PhaseStatus = 'pending' | 'current' | 'completed' | 'error';
export type ProjectLevel = 'prototype' | 'mvp' | 'production';

export interface TechStackQuestion {
    id: string;
    question: string;
    description?: string;
    options: string[];
    recommended: string;
    selected: string;
    reason?: string;
}

export interface PhaseState {
    id: number;
    name: string;
    status: PhaseStatus;
    artifact: string | null;
    editedArtifact: string | null;
    error: string | null;
    completedAt: string | null;
}

export interface ProjectState {
    projectName: string;
    projectDescription: string;
    projectLevel: ProjectLevel;        // prototype | mvp | production
    clientName?: string;
    clientWebsiteUrl?: string;
    industry?: string;
    clientBranding?: string;
    customStandards?: string;          // User-defined coding standards/patterns
    techStack?: TechStackQuestion[];
    currentPhase: number;
    phases: PhaseState[];
    createdAt: string;
    updatedAt: string;
}

// ── 8-Phase workflow (Testing merged 5+6, Execution removed) ─────────────────
export const PHASE_DEFINITIONS = [
    { id: 1, name: 'Identity', subtitle: 'Vision, Branding & Color Palettes', icon: '✦', agentType: 'branding', artifactFile: '01_identity.md' },
    { id: 2, name: 'Scope', subtitle: 'Requirements & User Stories', icon: '◈', agentType: 'requirements', artifactFile: '02_scope.md' },
    { id: 3, name: 'Skeleton', subtitle: 'System Architecture & Modules', icon: '⬡', agentType: 'architecture', artifactFile: '03_skeleton.md' },
    { id: 4, name: 'Contract', subtitle: 'FastAPI Endpoint Definitions', icon: '⬢', agentType: 'api', artifactFile: '04_contract.md' },
    { id: 5, name: 'Testing', subtitle: 'TDD Strategy + Mocking Patterns', icon: '◉', agentType: 'testing', artifactFile: '05_testing.md' },
    { id: 6, name: 'Data', subtitle: 'SQLAlchemy Database Modeling', icon: '◈', agentType: 'database', artifactFile: '06_data.md' },
    { id: 7, name: 'Design', subtitle: 'UI/UX, Wow Factor & Animations', icon: '◇', agentType: 'ui', artifactFile: '07_design.md' },
    { id: 8, name: 'Handoff', subtitle: 'One-Shot Master Prompt', icon: '⬟', agentType: 'handoff', artifactFile: '08_handoff.md' },
];

const STATE_KEY = 'blueprint.projectState';
const ARTIFACTS_DIR = '.blueprint';

export class ProjectStateManager {
    private context: vscode.ExtensionContext;
    private state: ProjectState | null = null;

    constructor(context: vscode.ExtensionContext) { this.context = context; }

    private getArtifactsDir(): string | null {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) return null;
        return path.join(folders[0].uri.fsPath, ARTIFACTS_DIR);
    }

    async load(): Promise<ProjectState | null> {
        const stored = this.context.workspaceState.get<ProjectState>(STATE_KEY);
        if (stored) { this.state = stored; return this.state; }
        return null;
    }

    async save(): Promise<void> {
        if (!this.state) return;
        this.state.updatedAt = new Date().toISOString();
        await this.context.workspaceState.update(STATE_KEY, this.state);
    }

    async initialize(
        projectName: string,
        projectDescription: string,
        projectLevel: ProjectLevel,
        clientName?: string,
        clientWebsiteUrl?: string,
        industry?: string,
        customStandards?: string
    ): Promise<ProjectState> {
        const phases: PhaseState[] = PHASE_DEFINITIONS.map(def => ({
            id: def.id, name: def.name,
            status: def.id === 1 ? 'current' : 'pending',
            artifact: null, editedArtifact: null, error: null, completedAt: null,
        }));
        this.state = {
            projectName, projectDescription,
            projectLevel,
            clientName, clientWebsiteUrl, industry,
            customStandards,
            currentPhase: 1, phases,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        await this.save();
        return this.state;
    }

    async updateTechStack(questions: TechStackQuestion[]): Promise<void> {
        if (!this.state) return;
        this.state.techStack = questions;
        await this.save();
    }

    async updateClientBranding(branding: string): Promise<void> {
        if (!this.state) return;
        this.state.clientBranding = branding;
        await this.save();
    }

    getState(): ProjectState | null { return this.state; }

    getPhase(phaseId: number): PhaseState | null {
        return this.state?.phases.find(p => p.id === phaseId) || null;
    }

    async updatePhaseArtifact(phaseId: number, artifact: string): Promise<void> {
        if (!this.state) return;
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.artifact = artifact;
        phase.editedArtifact = artifact;
        this._writeArtifactFile(phaseId, artifact);
        await this.save();
    }

    async updateEditedArtifact(phaseId: number, editedContent: string): Promise<void> {
        if (!this.state) return;
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.editedArtifact = editedContent;
        this._writeArtifactFile(phaseId, editedContent);
        await this.save();
    }

    async completePhase(phaseId: number): Promise<void> {
        if (!this.state) return;
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.status = 'completed';
        phase.completedAt = new Date().toISOString();
        // Find next AVAILABLE phase from PHASE_DEFINITIONS (handles gaps)
        const nextDef = PHASE_DEFINITIONS.find(d => d.id > phaseId);
        if (nextDef) {
            const next = this.state.phases.find(p => p.id === nextDef.id);
            if (next) { next.status = 'current'; this.state.currentPhase = next.id; }
        }
        await this.save();
    }

    async setPhaseError(phaseId: number, error: string): Promise<void> {
        if (!this.state) return;
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.status = 'error'; phase.error = error;
        await this.save();
    }

    async setPhaseGenerating(phaseId: number): Promise<void> {
        if (!this.state) return;
        const phase = this.state.phases.find(p => p.id === phaseId);
        if (!phase) return;
        phase.status = 'current'; phase.artifact = null;
        phase.editedArtifact = null; phase.error = null;
        await this.save();
    }

    /** Builds cumulative context — all edited+approved artifacts feed into every subsequent agent */
    buildContext(upToPhase: number): string {
        if (!this.state) return '';
        let ctx = `# Project: ${this.state.projectName}\n\n`;
        ctx += `## Overview\n${this.state.projectDescription}\n\n`;

        // ── Project level directive ────────────────────────────────────────────
        const levelMap: Record<ProjectLevel, string> = {
            prototype: 'PROTOTYPE — Simplest working demo. Prioritise speed and clarity over completeness. SQLite, no complex auth, minimal error handling. Get it running.',
            mvp: 'MVP — Production-like but not over-engineered. Balance speed with correctness. PostgreSQL, proper auth, basic monitoring.',
            production: 'PRODUCTION — Enterprise-grade. Full security, scalability, observability, automated tests, CI/CD, zero-downtime deployments.',
        };
        ctx += `## Build Level: ${this.state.projectLevel.toUpperCase()}\n`;
        ctx += `> ${levelMap[this.state.projectLevel]}\n\n`;

        if (this.state.clientName) {
            ctx += `## Client / Brand: ${this.state.clientName}\n`;
            if (this.state.industry) ctx += `Industry: ${this.state.industry}\n`;
            if (this.state.clientBranding) {
                ctx += `\n### Brand Context (from ${this.state.clientWebsiteUrl || 'website'})\n${this.state.clientBranding}\n`;
            }
            ctx += '\n';
        }

        if (this.state.customStandards) {
            ctx += `## User-Defined Standards & Guidelines\n`;
            ctx += `> STRIKE DIRECTIVE: Follow these custom standards and folder structures exactly as specified below.\n\n`;
            ctx += `${this.state.customStandards}\n\n`;
        }

        if (this.state.techStack?.length) {
            ctx += `## Tech Stack Decisions\n`;
            ctx += `> These decisions were confirmed by the user. Adhere to them strictly.\n\n`;
            this.state.techStack.forEach(q => {
                ctx += `- **${q.question}**: ${q.selected}\n`;
            });
            ctx += '\n';
        }

        for (let i = 1; i < upToPhase; i++) {
            const phase = this.state.phases.find(p => p.id === i);
            const def = PHASE_DEFINITIONS.find(d => d.id === i);
            if (phase && def && (phase.editedArtifact || phase.artifact)) {
                ctx += `---\n## Phase ${i}: ${def.name} — ${def.subtitle}\n`;
                ctx += `> ⚠ APPROVED ARTIFACT — treat this as ground truth.\n\n`;
                ctx += (phase.editedArtifact || phase.artifact) + '\n\n';
            }
        }
        return ctx;
    }

    async reset(): Promise<void> {
        this.state = null;
        await this.context.workspaceState.update(STATE_KEY, undefined);
    }

    hasExistingProject(): boolean {
        return !!this.context.workspaceState.get<ProjectState>(STATE_KEY);
    }

    private _writeArtifactFile(phaseId: number, content: string): void {
        const artifactsDir = this.getArtifactsDir();
        if (!artifactsDir) return;
        if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
        const def = PHASE_DEFINITIONS.find(d => d.id === phaseId);
        if (!def) return;
        fs.writeFileSync(path.join(artifactsDir, def.artifactFile), content, 'utf-8');
    }
}
