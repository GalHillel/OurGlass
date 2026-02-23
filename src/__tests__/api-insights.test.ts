import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/insights/route';

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: vi.fn().mockReturnValue({
                    generateContent: vi.fn().mockResolvedValue({
                        response: {
                            text: () => JSON.stringify([
                                { type: 'roast', text: 'You spent too much!', emoji: '🔥' }
                            ])
                        }
                    })
                })
            };
        })
    };
});

describe('Insights API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns 500 if no API key', async () => {
        process.env.GEMINI_API_KEY = '';
        const req = new Request('http://localhost/api/insights', { method: 'POST', body: JSON.stringify({}) });
        const res = await POST(req);
        expect(res.status).toBe(500);
    });

    it('generates insights correctly', async () => {
        const req = new Request('http://localhost/api/insights', {
            method: 'POST',
            body: JSON.stringify({ transactions: [{ amount: 100 }], balance: 1000, budget: 500, monthlyIncome: 2000, subscriptions: [] })
        });
        const res = await POST(req);
        const data = await res.json();
        expect(data.insights).toHaveLength(1);
        expect(data.insights[0].type).toBe('roast');
    });
});
