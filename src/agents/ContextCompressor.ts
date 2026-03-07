/**
 * ContextCompressor.ts
 * Blueprint — Smart context compression for the multi-agent pipeline.
 *
 * Strategy:
 *   - Uses Microsoft LLMLingua-2 (JS port: @atjsh/llmlingua-2) for semantic compression
 *     of older phase artifacts, preserving meaning at 50% token reduction.
 *   - Falls back to deterministic truncation if LLMLingua2 is unavailable
 *     (first load, model not yet downloaded, or extension sandbox restrictions).
 *   - Enforces a total context budget of MAX_CONTEXT_CHARS across all phases.
 *
 * Phase context policy (who gets what):
 *   Phases 1-3:  All prior phases → verbatim (context is still small)
 *   Phase 4:     Phases 2,3 → verbatim | Phase 1 → compressed
 *   Phase 5:     Phases 3,4 → verbatim | Phases 1,2 → compressed
 *   Phase 6:     Phases 3,4 → verbatim | Phases 1,2 → compressed
 *   Phase 7:     Phases 1,3 → verbatim | Phases 2,4 → compressed | Phases 5,6 → headline
 *   Phase 8:     Phases 6,7 → verbatim | Phases 3,4,5 → compressed | Phases 1,2 → headline
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const COMPRESS_RATIO = 0.50;        // Target 50% token reduction via LLMLingua2
const HEADLINE_MAX_CHARS = 400;     // Characters kept per headline-only phase

// ── Phase context policy ──────────────────────────────────────────────────────
// For each target phase, defines which prior phases get each treatment tier.
// phaseId 1-9 → { verbatim: number[], compressed: number[], headline: number[] }
const PHASE_CONTEXT_POLICY: Record<number, { verbatim: number[]; compressed: number[]; headline: number[] }> = {
    1: { verbatim: [], compressed: [], headline: [] },
    2: { verbatim: [1], compressed: [], headline: [] },
    3: { verbatim: [1, 2], compressed: [], headline: [] },
    4: { verbatim: [2, 3], compressed: [1], headline: [] },
    5: { verbatim: [3, 4], compressed: [1, 2], headline: [] },
    6: { verbatim: [3, 4], compressed: [1, 2], headline: [] },
    7: { verbatim: [1, 3], compressed: [2, 4], headline: [5, 6] },
    8: { verbatim: [6, 7], compressed: [3, 4, 5], headline: [1, 2] },
    9: { verbatim: [2, 4, 6], compressed: [3, 8], headline: [1, 5, 7] }, // Seeding needs Scope, APIs, and DB Models most
};

// ── LLMLingua-2 dynamic import (graceful — may fail in restrictive environments) ─
let llmLinguaCompress: ((text: string, ratio: number) => Promise<string>) | null = null;

async function initLLMLingua(): Promise<void> {
    if (llmLinguaCompress) return;
    try {
        // Dynamic import — if the package isn't available, we catch and fall back
        const mod = await import('@atjsh/llmlingua-2' as any);
        const compressor = new mod.LLMLingua2Compressor();
        llmLinguaCompress = async (text: string, ratio: number): Promise<string> => {
            return compressor.compress(text, { ratio });
        };
        console.log('[Blueprint] LLMLingua-2 loaded — semantic compression enabled.');
    } catch (err) {
        console.log('[Blueprint] LLMLingua-2 unavailable — using fallback truncation.', err);
        llmLinguaCompress = null;
    }
}

// ── ContextCompressor class ───────────────────────────────────────────────────

export class ContextCompressor {
    private ready = false;

    constructor() {
        // Start loading LLMLingua2 in background — don't block construction
        initLLMLingua().then(() => { this.ready = true; });
    }

    /**
     * Estimates token count from character count.
     * Rule of thumb: 1 token ≈ 4 chars for English mixed with code.
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Compresses a single artifact using LLMLingua2 or fallback truncation.
     * @param artifact  The full artifact markdown text
     * @param ratio     Target compression ratio (0.5 = keep 50% of tokens)
     */
    async compressArtifact(artifact: string, ratio = COMPRESS_RATIO): Promise<string> {
        if (!artifact?.trim()) return '';

        const targetChars = Math.floor(artifact.length * ratio);

        // Try LLMLingua2 first (semantic compression)
        if (llmLinguaCompress) {
            try {
                const compressed = await llmLinguaCompress(artifact, ratio);
                if (compressed && compressed.length > 50) {
                    return `[COMPRESSED — ~${Math.round((1 - compressed.length / artifact.length) * 100)}% reduced]\n${compressed}`;
                }
            } catch (_) {
                // Fall through to deterministic fallback
            }
        }

        // Deterministic fallback: preserve headers + first sentence of each paragraph
        return this._deterministicCompress(artifact, targetChars);
    }

    /**
     * Returns just the first HEADLINE_MAX_CHARS of an artifact — used for very old phases.
     * Prefix is annotated so the LLM knows it is truncated.
     */
    headlineOnly(artifact: string, phaseName: string): string {
        if (!artifact?.trim()) return '';
        const snippet = artifact.slice(0, HEADLINE_MAX_CHARS).trim();
        const ellipsis = artifact.length > HEADLINE_MAX_CHARS ? '\n...[see .blueprint artifact for full content]' : '';
        return `[HEADLINE ONLY — ${phaseName}]\n${snippet}${ellipsis}`;
    }

    /**
     * Smart context budgeter.
     * Takes the full set of prior phase artifacts and applies the policy for the
     * target phase, then enforces the provided maxChars budget.
     *
     * @param upToPhase  The phase we are about to run (1-8)
     * @param artifacts  Map of phaseId → { name: string, content: string }
     * @param maxChars   The maximum allowed characters (based on LLM provider limit)
     * @returns Compressed context string ready to inject into the user prompt
     */
    async buildBudgetedContext(
        upToPhase: number,
        artifacts: Map<number, { name: string; subtitle: string; content: string }>,
        maxChars: number
    ): Promise<string> {
        const policy = PHASE_CONTEXT_POLICY[upToPhase] ?? { verbatim: [], compressed: [], headline: [] };
        const sections: Array<{ phaseId: number; label: string; content: string }> = [];

        // Process phases in order from lowest to highest (oldest first)
        for (let i = 1; i < upToPhase; i++) {
            const artifact = artifacts.get(i);
            if (!artifact?.content?.trim()) continue;

            const { name, subtitle, content } = artifact;
            const label = `Phase ${i}: ${name} — ${subtitle}`;

            if (policy.verbatim.includes(i)) {
                sections.push({ phaseId: i, label, content });
            } else if (policy.compressed.includes(i)) {
                const compressed = await this.compressArtifact(content, COMPRESS_RATIO);
                sections.push({ phaseId: i, label, content: compressed });
            } else if (policy.headline.includes(i)) {
                sections.push({ phaseId: i, label, content: this.headlineOnly(content, name) });
            }
            // If phase not in any list, it is excluded from context for this agent
        }

        // Enforce total budget — trim from oldest first if over budget
        return this._enforceBudget(sections, maxChars);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Deterministic compression that preserves Markdown headers and the first
     * sentence of each paragraph — keeps structural meaning even when truncating.
     */
    private _deterministicCompress(text: string, maxChars: number): string {
        const lines = text.split('\n');
        const kept: string[] = [];
        let total = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            // Always keep headers (structure)
            const isHeader = trimmed.startsWith('#');
            // Keep bullet points and table rows (data dense)
            const isBulletOrTable = trimmed.startsWith('-') || trimmed.startsWith('|') || trimmed.startsWith('*');
            // Keep code fences
            const isCode = trimmed.startsWith('```');
            // Keep first sentence of prose paragraphs
            const isProse = trimmed.length > 0 && !isHeader && !isBulletOrTable && !isCode;

            if (isHeader || isBulletOrTable || isCode) {
                kept.push(line);
                total += line.length + 1;
            } else if (isProse) {
                // Take only through the first sentence
                const firstSentence = trimmed.match(/^[^.!?]+[.!?]/)?.[0] ?? trimmed.slice(0, 120);
                kept.push(firstSentence);
                total += firstSentence.length + 1;
            } else {
                kept.push(line); // blank lines, structural separators
                total += line.length + 1;
            }

            if (total >= maxChars) {
                kept.push('\n...[compressed — see .blueprint artifact for full content]');
                break;
            }
        }

        return `[COMPRESSED — deterministic fallback]\n${kept.join('\n')}`;
    }

    /**
     * Enforces MAX_CONTEXT_CHARS by trimming from the oldest sections first.
     * Always preserves at least headline-level content for every section.
     */
    private _enforceBudget(
        sections: Array<{ phaseId: number; label: string; content: string }>,
        budget: number
    ): string {
        const parts: string[] = [];
        let remaining = budget;

        for (const section of sections) {
            const header = `\n---\n## ${section.label}\n> ⚠ APPROVED ARTIFACT — treat as ground truth.\n\n`;
            const available = remaining - header.length;

            if (available <= HEADLINE_MAX_CHARS) {
                // Squeeze to headline only
                const headline = section.content.slice(0, HEADLINE_MAX_CHARS);
                parts.push(`${header}${headline}\n...[budget exceeded — full content in .blueprint artifact]`);
                break;
            }

            const body = section.content.slice(0, available);
            const truncated = body.length < section.content.length
                ? `${body}\n...[budget trimmed — full content in .blueprint artifact]`
                : body;

            parts.push(`${header}${truncated}`);
            remaining -= header.length + truncated.length;
        }

        return parts.join('\n');
    }
}
