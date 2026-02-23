import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/quests/route';

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: vi.fn().mockReturnValue({
                    generateContent: vi.fn().mockResolvedValue({
                        response: {
                            text: () => JSON.stringify({
                                quests: [
                                    { id: '1', title: 'Save Money', icon: 'Target', color: 'blue' }
                                ]
                            })
                        }
                    })
                })
            };
        })
    };
});

describe('Quests API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns empty array if no API key', async () => {
        process.env.GEMINI_API_KEY = '';
        const req = new Request('http://localhost/api/quests', { method: 'POST', body: JSON.stringify({}) });
        const res = await POST(req);
        const data = await res.json();
        expect(data).toEqual({ quests: [] });
    });

    it('generates quests correctly', async () => {
        const req = new Request('http://localhost/api/quests', { method: 'POST', body: JSON.stringify({ budget: 5000 }) });
        const res = await POST(req);
        const data = await res.json();
        expect(data.quests).toHaveLength(1);
        expect(data.quests[0].title).toBe('Save Money');
    });
});
