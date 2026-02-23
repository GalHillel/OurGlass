import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/smart-insight/route';

// Mock the Gemini API
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: vi.fn().mockReturnValue({
                    generateContent: vi.fn().mockResolvedValue({
                        response: {
                            text: () => JSON.stringify({
                                type: 'tip',
                                text: 'Test insight',
                                action: 'Act now'
                            })
                        }
                    })
                })
            };
        })
    };
});

describe('Smart Insight API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns null if no API key', async () => {
        process.env.GEMINI_API_KEY = '';
        const req = new Request('http://localhost/api/smart-insight', {
            method: 'POST',
            body: JSON.stringify({ transactions: [] })
        });
        const res = await POST(req);
        const data = await res.json();
        expect(data).toBeNull();
    });

    it('generates an insight correctly', async () => {
        const req = new Request('http://localhost/api/smart-insight', {
            method: 'POST',
            body: JSON.stringify({ transactions: [{ amount: 100 }] })
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('type', 'tip');
        expect(data).toHaveProperty('text', 'Test insight');
    });
});
