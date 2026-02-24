/**
 * Blueprint Multi-Provider LLM Client
 * Supports: Gemini, OpenAI, Groq, Azure OpenAI
 * Uses Node's built-in `https` module — zero external dependencies.
 */
import * as https from 'https';
import * as http from 'http';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LLMProvider = 'gemini' | 'openai' | 'groq' | 'azure-openai' | 'litellm';

export interface LLMConfig {
    provider: LLMProvider;
    // Gemini
    geminiApiKey?: string;
    geminiModel?: string;
    // OpenAI
    openaiApiKey?: string;
    openaiModel?: string;
    openaiBaseUrl?: string;
    // Groq
    groqApiKey?: string;
    groqModel?: string;
    // Azure OpenAI
    azureApiKey?: string;
    azureEndpoint?: string;
    azureDeploymentName?: string;
    azureApiVersion?: string;
    // LiteLLM
    litellmApiKey?: string;
    litellmModel?: string;
    litellmBaseUrl?: string;
}

export interface LLMClient {
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
    validate(): Promise<boolean>;
    getLabel(): string;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLLMClient(config: LLMConfig): LLMClient {
    switch (config.provider) {
        case 'gemini':
            return new GeminiClient(
                config.geminiApiKey || '',
                config.geminiModel || 'gemini-2.0-flash'
            );
        case 'openai':
            return new OpenAIClient(
                config.openaiApiKey || '',
                config.openaiModel || 'gpt-4o',
                config.openaiBaseUrl || 'https://api.openai.com/v1'
            );
        case 'groq':
            return new GroqClient(
                config.groqApiKey || '',
                config.groqModel || 'llama-3.3-70b-versatile'
            );
        case 'azure-openai':
            return new AzureOpenAIClient(
                config.azureApiKey || '',
                config.azureEndpoint || '',
                config.azureDeploymentName || '',
                config.azureApiVersion || '2024-08-01-preview'
            );
        case 'litellm':
            return new OpenAIClient(
                config.litellmApiKey || 'sk-none',
                config.litellmModel || 'gpt-4o',
                config.litellmBaseUrl || 'http://localhost:4000/v1'
            );
        default:
            throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
}

export function validateConfig(config: LLMConfig): string | null {
    switch (config.provider) {
        case 'gemini':
            if (!config.geminiApiKey) return 'Gemini API key is required. Add it in Blueprint settings.';
            return null;
        case 'openai':
            if (!config.openaiApiKey) return 'OpenAI API key is required. Add it in Blueprint settings.';
            return null;
        case 'groq':
            if (!config.groqApiKey) return 'Groq API key is required. Add it in Blueprint settings.';
            return null;
        case 'azure-openai':
            if (!config.azureApiKey) return 'Azure OpenAI API key is required. Add it in Blueprint settings.';
            if (!config.azureEndpoint) return 'Azure OpenAI endpoint is required. Add it in Blueprint settings.';
            if (!config.azureDeploymentName) return 'Azure deployment name is required. Add it in Blueprint settings.';
            return null;
        case 'litellm':
            if (!config.litellmBaseUrl) return 'LiteLLM base URL is required. Add it in Blueprint settings.';
            return null;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function httpsPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(body);
        const urlObj = new URL(url);

        const options: https.RequestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                ...headers,
            },
        };

        let data = '';
        const req = https.request(options, (res: http.IncomingMessage) => {
            res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                } else {
                    resolve(data);
                }
            });
        });
        req.on('error', (err: Error) => reject(new Error(`Network error: ${err.message}`)));
        req.write(bodyStr);
        req.end();
    });
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

class GeminiClient implements LLMClient {
    constructor(private apiKey: string, private model: string) { }

    getLabel(): string { return `Gemini — ${this.model}`; }

    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const body = {
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192, topP: 0.95 },
        };

        const raw = await httpsPost(url, body, {});
        const parsed = JSON.parse(raw);

        if (parsed.error) {
            throw new Error(`Gemini error: ${parsed.error.message}`);
        }

        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned an empty response.');
        return text;
    }

    async validate(): Promise<boolean> {
        try {
            const r = await this.generate('Reply with OK.', 'OK');
            return r.toLowerCase().includes('ok');
        } catch { return false; }
    }
}

// ─── OpenAI (Chat Completions) ────────────────────────────────────────────────

class OpenAIClient implements LLMClient {
    constructor(
        private apiKey: string,
        private model: string,
        private baseUrl: string
    ) { }

    getLabel(): string { return `OpenAI — ${this.model}`; }

    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;

        const body = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 8192,
            temperature: 0.7,
        };

        const raw = await httpsPost(url, body, {
            Authorization: `Bearer ${this.apiKey}`,
        });

        const parsed = JSON.parse(raw);
        if (parsed.error) throw new Error(`OpenAI error: ${parsed.error.message}`);

        const text = parsed.choices?.[0]?.message?.content;
        if (!text) throw new Error('OpenAI returned an empty response.');
        return text;
    }

    async validate(): Promise<boolean> {
        try {
            const r = await this.generate('Reply with OK.', 'OK');
            return r.toLowerCase().includes('ok');
        } catch { return false; }
    }
}

// ─── Groq (OpenAI-compatible) ─────────────────────────────────────────────────

class GroqClient implements LLMClient {
    private inner: OpenAIClient;

    constructor(private apiKey: string, private model: string) {
        this.inner = new OpenAIClient(
            apiKey,
            model,
            'https://api.groq.com/openai/v1'
        );
    }

    getLabel(): string { return `Groq — ${this.model}`; }

    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        return this.inner.generate(systemPrompt, userPrompt);
    }

    async validate(): Promise<boolean> {
        return this.inner.validate();
    }
}

// ─── Azure OpenAI ─────────────────────────────────────────────────────────────

class AzureOpenAIClient implements LLMClient {
    constructor(
        private apiKey: string,
        private endpoint: string,
        private deploymentName: string,
        private apiVersion: string
    ) { }

    getLabel(): string { return `Azure OpenAI — ${this.deploymentName}`; }

    async generate(systemPrompt: string, userPrompt: string): Promise<string> {
        const base = this.endpoint.replace(/\/$/, '');
        const url = `${base}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;

        const body = {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 8192,
            temperature: 0.7,
        };

        const raw = await httpsPost(url, body, {
            'api-key': this.apiKey,
        });

        const parsed = JSON.parse(raw);
        if (parsed.error) throw new Error(`Azure OpenAI error: ${parsed.error.message}`);

        const text = parsed.choices?.[0]?.message?.content;
        if (!text) throw new Error('Azure OpenAI returned an empty response.');
        return text;
    }

    async validate(): Promise<boolean> {
        try {
            const r = await this.generate('Reply with OK.', 'OK');
            return r.toLowerCase().includes('ok');
        } catch { return false; }
    }
}
