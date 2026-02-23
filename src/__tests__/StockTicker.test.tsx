import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockTicker } from '@/components/StockTicker';

global.fetch = vi.fn();

describe('StockTicker', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        (global.fetch as any).mockResolvedValue(new Promise(() => { })); // pending forever
        const { container } = render(<StockTicker />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('fetches and renders stocks', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                stocks: {
                    'SPY': { price: 500, changePercent: 1.5 },
                    'QQQ': { price: 400, changePercent: -0.5 }
                }
            })
        });

        render(<StockTicker userSymbols={['SPY', 'QQQ']} />);

        await waitFor(() => {
            // SPY text appears multiple times since it's duplicated for scrolling loop
            const spies = screen.getAllByText('SPY');
            expect(spies.length).toBeGreaterThan(0);
        });
    });
});
