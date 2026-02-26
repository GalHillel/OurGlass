import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';
import * as ai from 'ai';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

vi.mock('@ai-sdk/google', () => ({
    google: vi.fn().mockReturnValue('mock-gemini')
}));

vi.mock('ai', () => ({
    convertToModelMessages: vi.fn().mockResolvedValue([]),
    streamText: vi.fn().mockReturnValue({
        toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('streamed response'))
    })
}));

describe('Chat API', () => {
    it('handles chat requests and formats context', async () => {
        const req = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello' }],
                context: {
                    income: 10000,
                    recentTransactions: [
                        { category: 'Food', amount: 100, description: 'Lunch', date: '2023-01-01' }
                    ]
                }
            })
        });

        const res = await POST(req);
        expect(res).toBeInstanceOf(Response);
        expect(ai.streamText).toHaveBeenCalled();
        const callArgs = vi.mocked(ai.streamText).mock.calls[0][0];
        expect(callArgs.system).toContain(`${CURRENCY_SYMBOL}10,000`);
        expect(callArgs.system).toContain("CRITICAL MATH RULE: Do not double-count subscriptions");
        expect(callArgs.system).toContain(`Monthly Budget (from settings): ${CURRENCY_SYMBOL}10,000`);
        expect(callArgs.system).toContain('Food');
    });
});
