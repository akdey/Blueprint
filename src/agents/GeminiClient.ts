// Gemini API Client for Blueprint agents
import * as https from 'https';
import * as http from 'http';

interface GeminiContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiRequest {
    contents: GeminiContent[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        topP?: number;
    };
    systemInstruction?: {
        parts: { text: string }[];
    };
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: { text: string }[];
        };
        finishReason: string;
    }[];
}

export class GeminiClient {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generate(
        systemPrompt: string,
        userPrompt: string,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        const body: GeminiRequest = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }],
                },
            ],
            systemInstruction: {
                parts: [{ text: systemPrompt }],
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.95,
            },
        };

        return new Promise((resolve, reject) => {
            const bodyStr = JSON.stringify(body);
            const urlObj = new URL(url);

            const options: https.RequestOptions = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(bodyStr),
                },
            };

            let responseData = '';

            const req = https.request(options, (res: http.IncomingMessage) => {
                res.on('data', (chunk: Buffer) => {
                    responseData += chunk.toString();
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`Gemini API error ${res.statusCode}: ${responseData}`));
                            return;
                        }
                        const parsed = JSON.parse(responseData) as GeminiResponse;
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        resolve(text);
                    } catch (err) {
                        reject(new Error(`Failed to parse Gemini response: ${err}`));
                    }
                });
            });

            req.on('error', (err: Error) => {
                reject(new Error(`Network error: ${err.message}`));
            });

            req.write(bodyStr);
            req.end();
        });
    }

    async validate(): Promise<boolean> {
        try {
            const result = await this.generate(
                'You are a helpful assistant.',
                'Reply with only "OK" and nothing else.'
            );
            return result.toLowerCase().includes('ok');
        } catch {
            return false;
        }
    }
}
