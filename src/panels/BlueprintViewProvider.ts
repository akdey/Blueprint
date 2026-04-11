import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { ProjectStateManager, PHASE_DEFINITIONS, TechStackQuestion } from '../state/ProjectStateManager';
import { createLLMClient, validateConfig, LLMConfig, LLMProvider } from '../agents/LLMClient';
import { AgentOrchestrator } from '../agents/AgentOrchestrator';

export class BlueprintViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'blueprint.sidebarView';
    private _view?: vscode.WebviewView;
    private _orchestrator: AgentOrchestrator | null = null;
    private _isGenerating = false;

    constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _stateManager: ProjectStateManager
    ) { }

    resolveWebviewView(webviewView: vscode.WebviewView, _ctx: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'media'))],
        };
        webviewView.webview.html = this._getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((msg: any) => this._handle(msg), undefined, this._context.subscriptions);
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('blueprint')) this._sendInit();
        }, undefined, this._context.subscriptions);
    }

    public focus() { this._view?.show(true); }

    private _getHtml(webview: vscode.Webview): string {
        const htmlPath = path.join(this._context.extensionPath, 'media', 'sidebar.html');
        if (!fs.existsSync(htmlPath)) return '<html><body>Blueprint UI missing.</body></html>';
        let html = fs.readFileSync(htmlPath, 'utf-8');
        html = html.replace(/\{\{MEDIA_URI\}\}/g,
            webview.asWebviewUri(vscode.Uri.file(path.join(this._context.extensionPath, 'media'))).toString());
        return html;
    }

    // ── Message router ──────────────────────────────────────────────────────────

    private async _handle(m: any): Promise<void> {
        switch (m.type) {
            case 'ready': await this._sendInit(); break;
            case 'openSettings': vscode.commands.executeCommand('workbench.action.openSettings', 'blueprint'); break;
            case 'browseFile': await this._handleBrowseFile(m.target); break;
            case 'initProject': await this._handleInitProject(m); break;
            case 'confirmTechStack': await this._handleConfirmTechStack(m); break;
            case 'skipTechStack': this._post({ type: 'techStackDismissed' }); break;
            case 'runPhase': await this._handleRunPhase(m.phaseId); break;
            case 'approvePhase': await this._handleApprovePhase(m.phaseId, m.editedContent, m.saveAndPreview ?? false); break;
            case 'regeneratePhase': await this._handleRunPhase(m.phaseId, true); break;
            case 'selectPhase': this._handleSelectPhase(m.phaseId); break;
            case 'openArtifact': await this._handleOpenArtifact(m.phaseId); break;
            case 'openMarkdownPreview': await this._handleOpenMarkdownPreview(m.phaseId); break;
            case 'invokeHandoff': await this._handleInvokeHandoff(); break;
            case 'copyToClipboard': await vscode.env.clipboard.writeText(m.content);
                this._post({ type: 'toast', text: 'Copied!', variant: 'success' }); break;
            case 'newProject': this._post({ type: 'showSetup' }); break;
        }
    }

    // ── Init ────────────────────────────────────────────────────────────────────

    private async _sendInit(): Promise<void> {
        const cfg = this._getLLMConfig();
        const configError = validateConfig(cfg);
        const existing = await this._stateManager.load();
        this._post({
            type: 'init',
            providerInfo: this._providerInfo(cfg),
            isConfigured: !configError,
            configError,
            hasWorkspace: !!(vscode.workspace.workspaceFolders?.length),
            existingState: existing,
        });
    }

    private _getLLMConfig(): LLMConfig {
        const c = vscode.workspace.getConfiguration('blueprint');
        return {
            provider: c.get<LLMProvider>('provider', 'gemini'),
            geminiApiKey: c.get<string>('gemini.apiKey', ''),
            geminiModel: c.get<string>('gemini.model', 'gemini-2.0-flash'),
            openaiApiKey: c.get<string>('openai.apiKey', ''),
            openaiModel: c.get<string>('openai.model', 'gpt-4o'),
            openaiBaseUrl: c.get<string>('openai.baseUrl', 'https://api.openai.com/v1'),
            groqApiKey: c.get<string>('groq.apiKey', ''),
            groqModel: c.get<string>('groq.model', 'llama-3.3-70b-versatile'),
            azureApiKey: c.get<string>('azure.apiKey', ''),
            azureEndpoint: c.get<string>('azure.endpoint', ''),
            azureDeploymentName: c.get<string>('azure.deploymentName', ''),
            azureApiVersion: c.get<string>('azure.apiVersion', '2024-08-01-preview'),
            litellmApiKey: c.get<string>('litellm.apiKey', 'sk-none'),
            litellmModel: c.get<string>('litellm.model', 'gpt-4o'),
            litellmBaseUrl: c.get<string>('litellm.baseUrl', 'http://localhost:4000/v1'),
        };
    }

    private _providerInfo(cfg: LLMConfig) {
        const map: Record<string, { label: string; model: string }> = {
            'gemini': { label: 'Google Gemini', model: cfg.geminiModel || 'gemini-2.0-flash' },
            'openai': { label: 'OpenAI', model: cfg.openaiModel || 'gpt-4o' },
            'groq': { label: 'Groq', model: cfg.groqModel || 'llama-3.3-70b-versatile' },
            'azure-openai': { label: 'Azure OpenAI', model: cfg.azureDeploymentName || '(not configured)' },
            'litellm': { label: 'LiteLLM', model: cfg.litellmModel || 'gpt-4o' },
        };
        return { provider: cfg.provider, ...map[cfg.provider] };
    }

    // ── Project Init (setup → main, no tech stack screen at start) ─────────────

    private async _handleInitProject(m: any): Promise<void> {
        const cfg = this._getLLMConfig();
        const err = validateConfig(cfg);
        if (err) { this._post({ type: 'error', message: err }); return; }
        if (!vscode.workspace.workspaceFolders?.length) {
            this._post({ type: 'error', message: 'Open a workspace folder first.' }); return;
        }
        try {
            await this._stateManager.initialize(
                m.projectName,
                m.description,
                m.projectLevel || 'prototype',
                m.clientName,
                m.clientWebsiteUrl,
                m.industry,
                m.customStandards
            );
            this._orchestrator = new AgentOrchestrator(createLLMClient(cfg), this._stateManager, cfg.geminiApiKey);
            this._post({ type: 'stateUpdate', state: this._stateManager.getState() });
            // Fetch client branding in background if URL provided
            if (m.clientWebsiteUrl) {
                this._fetchBrandingBg(m.clientName, m.clientWebsiteUrl, createLLMClient(cfg));
            }
        } catch (e) {
            this._post({ type: 'error', message: String(e) });
        }
    }

    // ── Tech stack analysis (triggered mid-flow AFTER scope is confirmed) ────────

    private async _handleAnalyzeTechStack(m: any): Promise<void> {
        const cfg = this._getLLMConfig();
        const err = validateConfig(cfg);
        if (err) { this._post({ type: 'error', message: err }); return; }

        this._post({ type: 'techStackLoading' });

        try {
            const client = createLLMClient(cfg);
            const state = this._stateManager.getState();
            const level = state?.projectLevel || 'prototype';

            const levelGuide: Record<string, string> = {
                prototype: 'PROTOTYPE: Recommend the absolute simplest option. SQLite over Postgres, FastAPI without extras, no auth complexity, localStorage over Redis, monolith over microservices.',
                mvp: 'MVP: Recommend balanced choices. PostgreSQL is fine, basic JWT auth, simple caching. Production-like but not over-engineered.',
                production: 'PRODUCTION: Recommend production-grade options with justifications. PostgreSQL with pooling, Redis caching, OAuth2, observability stack.',
            };

            const userPrompt =
                `PROJECT: ${m.projectName || state?.projectName}\n` +
                `INDUSTRY: ${m.industry || state?.industry || 'General'}\n` +
                `BUILD LEVEL: ${level.toUpperCase()} — ${levelGuide[level]}\n\n` +
                `REQUIREMENTS:\n${m.description || state?.projectDescription}\n\n` +
                (m.scopeContent ? `CONFIRMED FEATURE LIST (approved by user):\n${m.scopeContent.substring(0, 2000)}\n\n` : '') +
                `Generate 4-6 tech stack questions for a ${level.toUpperCase()} build.\n` +
                `STRICT RULES:\n` +
                `- DO NOT ask about: version control, git, CI/CD pipelines, deployment platforms, infrastructure, hosting, Docker, Kubernetes\n` +
                `- ONLY ask about: frontend framework, backend framework, database, auth strategy, UI component library, caching/state management\n` +
                `- Recommend the option that best fits the BUILD LEVEL\n` +
                `- Phrase recommendations as "Best for ${level}:", include a specific reason\n` +
                `- Only ask questions relevant to THIS specific project type\n\n` +
                `Return ONLY a valid JSON array. Each item must have:\n` +
                `{ id, question, description (one concise line), options (string[], max 4 choices), recommended (string), reason (string) }`;

            const raw = await client.generate(
                'You are a pragmatic tech stack advisor. Return only valid JSON arrays, no markdown, no extra text.',
                userPrompt
            );

            const match = raw.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('No JSON in response');
            const questions = JSON.parse(match[0]).map((q: any) => ({ ...q, selected: q.recommended }));
            this._post({ type: 'techStackQuestions', questions });
        } catch (_) {
            this._post({ type: 'techStackDismissed' });
        }
    }

    private async _handleConfirmTechStack(m: any): Promise<void> {
        if (m.answers?.length) await this._stateManager.updateTechStack(m.answers);
        this._post({ type: 'techStackDismissed' });
        this._post({ type: 'toast', text: '✓ Tech stack saved — feeding into all remaining agents', variant: 'success' });
    }

    // ── File browse ──────────────────────────────────────────────────────────────

    private async _handleBrowseFile(target: string): Promise<void> {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: target === 'standards' ? 'Import Standards' : 'Import Requirements',
            filters: { 'Documents': ['txt', 'md'], 'All Files': ['*'] },
        });
        if (!uris?.length) return;
        try {
            const content = fs.readFileSync(uris[0].fsPath, 'utf-8');
            this._post({
                type: 'fileLoaded',
                content,
                filename: path.basename(uris[0].fsPath),
                target: target
            });
        } catch (e) {
            this._post({ type: 'toast', text: `Could not read file: ${e}`, variant: 'error' });
        }
    }

    // ── Client branding (background) ─────────────────────────────────────────────

    private async _fetchBrandingBg(clientName: string, url: string, client: any): Promise<void> {
        try {
            // Step 1: Fetch the main HTML page
            const html = await this._fetchUrl(url);
            if (!html) return;

            // Step 2: Discover and fetch linked external stylesheets (the real brand tokens)
            const cssUrls = this._extractLinkedStylesheets(html, url);
            const externalCss = await this._fetchExternalCss(cssUrls);

            // Step 3: Extract all brand signals from HTML + external CSS combined
            const signals = this._extractBrandSignals(html, externalCss);

            const branding = await client.generate(
                'You are an elite brand analyst. Respond in structured Markdown, max 300 words.',
                `Analyze the web design signals below to extract the TRUE brand identity of "${clientName}".\n\n` +
                `CRITICAL RULES:\n` +
                `1. Differentiate core brand colors from generic web colors. Many sites use standard blue (#0000ff, #007bff) for links/buttons, or grey/black for text. Do NOT report these as the primary brand color.\n` +
                `2. Look for variables named --primary, --brand, --theme, or --accent.\n` +
                `3. Look for the most frequently used non-grayscale hex color that isn't standard link blue.\n\n` +
                `Extract:\n` +
                `- Primary/Secondary/Accent colors (hex codes)\n` +
                `- Font families (prioritize custom/Google fonts over system UI stacks)\n` +
                `- Design style (minimal, bold, corporate, playful, etc.)\n` +
                `- Brand tone (formal, casual, energetic, etc.)\n\n` +
                `--- RAW CSS/HTML SIGNALS ---\n${signals}`
            );
            await this._stateManager.updateClientBranding(branding);
            this._post({ type: 'toast', text: `✓ ${clientName} brand context loaded from website`, variant: 'success' });
        } catch (_) { /* silent — branding is optional */ }
    }

    /**
     * Extracts all <link rel="stylesheet"> hrefs from HTML and resolves them to absolute URLs.
     * Caps at 5 URLs to avoid fetching bloated CSS bundles.
     */
    private _extractLinkedStylesheets(html: string, baseUrl: string): string[] {
        const base = new URL(baseUrl);
        const urls: string[] = [];

        // Match <link rel="stylesheet" href="..."> (order-insensitive attrs)
        const linkPattern = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']stylesheet["'][^>]*>/gi;
        let match: RegExpExecArray | null;
        while ((match = linkPattern.exec(html)) !== null && urls.length < 5) {
            const href = (match[1] || match[2] || '').trim();
            if (!href || href.startsWith('data:')) continue;
            try {
                const resolved = new URL(href, base).toString();
                // Only include CSS from same origin or common CDNs (fonts, etc.)
                urls.push(resolved);
            } catch { /* skip malformed hrefs */ }
        }
        return urls;
    }

    /**
     * Fetches up to 3 CSS files in parallel, each capped at 30KB.
     * Uses individual 5-second timeouts per file to avoid hanging.
     */
    private async _fetchExternalCss(urls: string[]): Promise<string[]> {
        const MAX_CSS_FILES = 3;
        const MAX_CSS_BYTES = 30_000; // 30KB per file — enough to capture all custom properties

        const fetches = urls.slice(0, MAX_CSS_FILES).map(url =>
            new Promise<string>(resolve => {
                const timeout = setTimeout(() => resolve(''), 5000);
                try {
                    const mod = url.startsWith('https') ? https : http;
                    let data = '';
                    (mod as typeof https).get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } } as any, (res: any) => {
                        res.on('data', (chunk: any) => {
                            data += chunk;
                            if (data.length > MAX_CSS_BYTES) res.destroy();
                        });
                        res.on('end', () => { clearTimeout(timeout); resolve(data); });
                        res.on('error', () => { clearTimeout(timeout); resolve(''); });
                    }).on('error', () => { clearTimeout(timeout); resolve(''); });
                } catch { clearTimeout(timeout); resolve(''); }
            })
        );

        return Promise.all(fetches);
    }

    /**
     * Extracts brand signals from HTML and any fetched external CSS files.
     * Scans for: CSS custom properties, @font-face, meta tags, inline styles.
     */
    private _extractBrandSignals(html: string, externalCss: string[] = []): string {
        const out: string[] = [];
        const allCss = externalCss.join('\n');

        // ── Meta tags ────────────────────────────────────────────────────────────
        const themeColor = html.match(/<meta[^>]+name="theme-color"[^>]+content="([^"]+)"/i);
        if (themeColor) out.push(`Theme color: ${themeColor[1]}`);

        const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
        if (ogTitle) out.push(`Brand title: ${ogTitle[1]}`);

        const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
        if (ogDesc) out.push(`Brand description: ${ogDesc[1]}`);

        // ── Google Fonts (inline HTML) ────────────────────────────────────────────
        const fonts = html.match(/fonts\.googleapis\.com[^"]+family=([^"&]+)/g);
        if (fonts?.length) out.push(`Google Fonts (HTML): ${fonts.slice(0, 5).join(', ')}`);

        // ── Google Fonts (external CSS @import) ───────────────────────────────────
        const cssGFonts = allCss.match(/fonts\.googleapis\.com[^"')]+family=([^"')&]+)/g);
        if (cssGFonts?.length) out.push(`Google Fonts (CSS): ${cssGFonts.slice(0, 5).join(', ')}`);

        // ── @font-face declarations ───────────────────────────────────────────────
        const fontFaces = allCss.match(/@font-face\s*\{[^}]+font-family:\s*([^;"']+)/gi);
        if (fontFaces?.length) {
            const families = fontFaces.slice(0, 4).map(ff => ff.replace(/@font-face[^family]+font-family:\s*/i, '').trim());
            out.push(`@font-face families: ${families.join(', ')}`);
        }

        // ── CSS custom properties from EXTERNAL stylesheets (the gold mine) ─────
        const allCssVars = [
            // Color-related variables
            ...(allCss.match(/--[\w-]*(?:color|bg|background|primary|secondary|accent|brand|theme|text|foreground|surface)[\w-]*\s*:\s*[^;]{3,40}/gi) || []),
            // Font-related variables
            ...(allCss.match(/--[\w-]*(?:font|type|heading|body)[\w-]*\s*:\s*[^;]{3,60}/gi) || []),
        ];
        if (allCssVars.length) {
            out.push(`CSS custom properties (external stylesheets):\n${allCssVars.slice(0, 30).join('\n')}`);
        }

        // ── CSS custom properties from INLINE styles ──────────────────────────────
        const inlineStyleTag = html.match(/<style[^>]*>([\s\S]{0,3000})/i);
        if (inlineStyleTag) {
            const inlineVars = inlineStyleTag[1].match(/--[\w-]*(?:color|bg|primary|secondary|accent|brand)[\w-]*\s*:\s*[^;]{3,40}/gi);
            if (inlineVars?.length) {
                out.push(`CSS custom properties (inline):\n${inlineVars.slice(0, 15).join('\n')}`);
            }
        }

        // ── Hex colours found anywhere in CSS ────────────────────────────────────
        const hexColors = allCss.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g);
        if (hexColors?.length) {
            const unique = [...new Set(hexColors)];
            out.push(`Hex colors found in CSS: ${unique.slice(0, 20).join(', ')}`);
        }

        return out.join('\n\n') || 'Limited brand signals available — no external CSS or meta tags found.';
    }

    private _fetchUrl(url: string): Promise<string | null> {
        return new Promise(resolve => {
            const timeout = setTimeout(() => resolve(null), 8000);
            try {
                const mod = url.startsWith('https') ? https : http;
                let data = '';
                (mod as typeof https).get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } } as any, (res: any) => {
                    res.on('data', (chunk: any) => { data += chunk; if (data.length > 80000) res.destroy(); });
                    res.on('end', () => { clearTimeout(timeout); resolve(data); });
                    res.on('error', () => { clearTimeout(timeout); resolve(null); });
                }).on('error', () => { clearTimeout(timeout); resolve(null); });
            } catch { clearTimeout(timeout); resolve(null); }
        });
    }

    // ── Phase execution ──────────────────────────────────────────────────────────

    private async _handleRunPhase(phaseId: number, isRegenerate = false): Promise<void> {
        if (this._isGenerating) {
            this._post({ type: 'toast', text: 'Already generating — please wait.', variant: 'warning' });
            return;
        }
        const cfg = this._getLLMConfig();
        const err = validateConfig(cfg);
        if (err) { this._post({ type: 'error', message: err }); return; }

        this._orchestrator = new AgentOrchestrator(createLLMClient(cfg), this._stateManager);
        if (isRegenerate) await this._stateManager.setPhaseGenerating(phaseId);

        this._isGenerating = true;
        this._post({ type: 'phaseGenerating', phaseId });

        try {
            const result = await this._orchestrator.runPhase(phaseId, (ph, status) => {
                if (status === 'optimizing-kv-cache') {
                    this._post({ type: 'phaseStatus', phaseId: ph, status: 'KV Cache Preparing...', sub: 'Optimizing context for April 2026 models' });
                }
            });
            await this._stateManager.updatePhaseArtifact(phaseId, result);
            this._post({ type: 'phaseReady', phaseId, content: result, state: this._stateManager.getState() });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await this._stateManager.setPhaseError(phaseId, msg);
            this._post({ type: 'phaseError', phaseId, error: msg });
        } finally {
            this._isGenerating = false;
            // Clean up cache if this was the last phase
            if (phaseId === 8 && this._orchestrator) {
                await this._orchestrator.dispose();
            }
        }
    }

    private async _handleApprovePhase(phaseId: number, editedContent: string, saveAndPreview = false): Promise<void> {
        await this._stateManager.updateEditedArtifact(phaseId, editedContent);
        await this._stateManager.completePhase(phaseId);
        this._post({ type: 'phaseApproved', phaseId, state: this._stateManager.getState() });
        const def = PHASE_DEFINITIONS.find(d => d.id === phaseId);

        if (saveAndPreview) {
            // Open the raw .md file in the editor so the user can inspect it
            await this._handleOpenArtifact(phaseId);
            this._post({ type: 'toast', text: `Phase ${phaseId}: ${def?.name} approved ✓ — file saved & opened`, variant: 'success' });
        } else {
            // Auto-open the rendered preview to the side on approval
            await this._handleOpenMarkdownPreview(phaseId);
            this._post({ type: 'toast', text: `Phase ${phaseId}: ${def?.name} approved ✓`, variant: 'success' });
        }

        // Trigger tech stack questionnaire after scope/requirements phase is approved.
        // Falls back to first phase when scope phase is commented out (testing mode).
        const state = this._stateManager.getState();
        const alreadyHasStack = !!(state?.techStack?.length);
        if (!alreadyHasStack) {
            const requirementsPhase = PHASE_DEFINITIONS.find(d => d.agentType === 'requirements');
            const triggerAfter = requirementsPhase?.id ?? PHASE_DEFINITIONS[0]?.id ?? 1;
            if (phaseId === triggerAfter) {
                await this._handleAnalyzeTechStack({
                    projectName: state?.projectName,
                    description: state?.projectDescription,
                    industry: state?.industry,
                    scopeContent: editedContent,
                });
            }
        }
    }

    private _handleSelectPhase(phaseId: number): void {
        const state = this._stateManager.getState();
        const phase = state?.phases.find(p => p.id === phaseId);
        if (phase) this._post({ type: 'phaseSelected', phaseId, phase, state });
    }

    // ── Artifact & preview ───────────────────────────────────────────────────────

    private async _handleOpenMarkdownPreview(phaseId: number): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) return;
        const def = PHASE_DEFINITIONS.find(d => d.id === phaseId);
        if (!def) return;
        const uri = vscode.Uri.file(path.join(folders[0].uri.fsPath, '.blueprint', def.artifactFile));
        if (!fs.existsSync(uri.fsPath)) return;
        try {
            // Use standard preview (opens as a tab in active column)
            await vscode.commands.executeCommand('markdown.showPreview', uri);
        } catch {
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Active });
        }
    }

    private async _handleOpenArtifact(phaseId: number): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) return;
        const def = PHASE_DEFINITIONS.find(d => d.id === phaseId);
        if (!def) return;
        const uri = vscode.Uri.file(path.join(folders[0].uri.fsPath, '.blueprint', def.artifactFile));
        try {
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Active, preview: false });
        } catch {
            vscode.window.showErrorMessage(`Artifact not yet generated for Phase ${phaseId}.`);
        }
    }

    // ── Handoff / Invoke ─────────────────────────────────────────────────────────

    private async _handleInvokeHandoff(): Promise<void> {
        const state = this._stateManager.getState();
        if (!state) return;
        const handoff = state.phases.find(p => p.id === 8);
        const content = handoff?.editedArtifact || handoff?.artifact || '';
        if (!content) { vscode.window.showErrorMessage('Complete Phase 8 first.'); return; }

        // 1. Always copy to clipboard
        await vscode.env.clipboard.writeText(content);

        // 2. Get the saved artifact .md file URI
        const folders = vscode.workspace.workspaceFolders;
        const def = PHASE_DEFINITIONS.find(d => d.id === 8);
        const artifactUri = folders?.length && def
            ? vscode.Uri.file(path.join(folders[0].uri.fsPath, '.blueprint', def.artifactFile))
            : null;

        let injected = false;

        // 3a. Try github.copilot.chat.attachFile — attaches .md as #file context (Copilot / Antigravity)
        if (artifactUri && fs.existsSync(artifactUri.fsPath)) {
            try {
                // Open chat first, then attach the file
                await vscode.commands.executeCommand('workbench.action.chat.open',
                    `Please read the attached Blueprint spec and help me build this application step by step.`);
                await vscode.commands.executeCommand('github.copilot.chat.attachFile', artifactUri);
                this._post({ type: 'toast', text: '🚀 Blueprint attached to AI Chat as #file context!', variant: 'success' });
                injected = true;
            } catch { /* Copilot Chat not available */ }
        }

        // 3b. Fallback: open chat with #file: reference in the query
        if (!injected && artifactUri) {
            try {
                const rel = vscode.workspace.asRelativePath(artifactUri);
                await vscode.commands.executeCommand('workbench.action.chat.open',
                    `#file:${rel} Please read the Blueprint spec file and help me build this application.`);
                this._post({ type: 'toast', text: '🚀 Chat opened with #file reference + clipboard ready!', variant: 'success' });
                injected = true;
            } catch { /* no chat extension */ }
        }

        // 3c. Fallback: open in editor + clipboard
        if (!injected) {
            const doc = await vscode.workspace.openTextDocument({ content, language: 'markdown' });
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });
            this._post({ type: 'toast', text: '🚀 Master prompt in editor + clipboard — paste into any chat!', variant: 'success' });
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    public async resetProject(): Promise<void> {
        if (this._orchestrator) await this._orchestrator.dispose();
        await this._stateManager.reset();
        this._orchestrator = null;
        this._post({ type: 'showSetup' });
    }

    private _post(msg: Record<string, unknown>): void {
        this._view?.webview.postMessage(msg);
    }
}
