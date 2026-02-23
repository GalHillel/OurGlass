import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { POST } from '@/app/api/market-data/route';

global.fetch = vi.fn();

describe('Market Data API', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv, FINNHUB_API_KEY: 'test-key' };
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns 400 if symbols are missing', async () => {
        const req = new Request('http://localhost/api/market-data', { method: 'POST', body: JSON.stringify({}) });
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it.skip('fetches exchange rate and stocks', async () => {
        // Mock two fetch calls: 1 for exchange rate, 1 for stock quote (AAPL)
        (global.fetch as Mock).mockImplementation((url: string) => {
            if (url.includes('exchangerate-api.com')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ rates: { ILS: 3.7 } })
                });
            }
            if (url.includes('finnhub.io')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ c: 150, dp: 2.5 })
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        const req = new Request('http://localhost/api/market-data', { method: 'POST', body: JSON.stringify({ symbols: ['AAPL'] }) });
        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.exchangeRate).toBe(3.7);
        expect(data.stocks['AAPL'].price).toBe(150);
        expect(data.stocks['AAPL'].changePercent).toBe(2.5);
    });
});
