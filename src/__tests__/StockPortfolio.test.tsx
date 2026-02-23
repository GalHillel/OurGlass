import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockPortfolio } from '@/components/StockPortfolio';
import * as auth from '@/components/AuthProvider';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
        },
        from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnThis(),
        })
    })
}));

// Mock fetch for prices
global.fetch = vi.fn();

describe('StockPortfolio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(auth, 'useAuth').mockReturnValue({ profile: { couple_id: 'c1' } } as any);
    });

    it('renders empty state initially', () => {
        (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ stocks: {} }) });
        render(<StockPortfolio assets={[]} />);
        expect(screen.getByText('אין עדיין מניות?')).toBeInTheDocument();
    });

    it.skip('renders assets and fetches their prices', async () => {
        const assets: any[] = [
            { id: '1', type: 'stock', symbol: 'AAPL', quantity: 10, current_amount: 1500 }
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                exchangeRate: 3.7,
                stocks: { 'AAPL': { price: 160, changePercent: 2.5 } }
            })
        });

        render(<StockPortfolio assets={assets} />);

        // Wait for fetch to complete and render
        await waitFor(() => {
            expect(screen.getByText('AAPL')).toBeInTheDocument();
            expect(screen.getByText('10 יח׳')).toBeInTheDocument();
            // 160 * 10 * 3.7 = 5920
            expect(screen.getByText('₪5,920')).toBeInTheDocument();
        });
    });

    it('opens add dialog', () => {
        (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ stocks: {} }) });
        render(<StockPortfolio assets={[]} />);

        const addButtons = screen.getAllByText(/הוסף מניה/);
        fireEvent.click(addButtons[0]);

        expect(screen.getByText('הוספת מניה לתיק')).toBeInTheDocument();
        expect(screen.getByText('סימול (Ticker)')).toBeInTheDocument();
    });
});
