import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/mood-insight/route';

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(function () {
            return {
                getGenerativeModel: vi.fn().mockReturnValue({
                    generateContent: vi.fn().mockResolvedValue({
                        response: {
                            text: () => JSON.stringify({ text: 'Good mood, good saving', type: 'success' })
                        }
                    })
                })
            };
        })
    };
});

describe('Mood Insight API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns info if chartData is missing', async () => {
        const req = new Request('http://localhost/api/mood-insight', { method: 'POST', body: JSON.stringify({}) });
        const res = await POST(req);
        const data = await res.json();
        expect(data.text).toBe('');
    });

    it('generates mood insight correctly with valid chat data', async () => {
        const req = new Request('http://localhost/api/mood-insight', {
            method: 'POST',
            body: JSON.stringify({ chartData: [{ mood: 5, spent: 10 }, { mood: 3, spent: 100 }] })
        });
        const res = await POST(req);
        const data = await res.json();
        expect(data.type).toBe('success');
        expect(data.text).toContain('Good mood');
    });
});
