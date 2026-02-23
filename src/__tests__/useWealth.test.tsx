import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWealth } from '@/hooks/useWealth';
import { renderReactQueryHook } from './test-utils';
import { waitFor } from '@testing-library/react';

// Mock Supabase
const mockSelect = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn(() => ({
            select: mockSelect,
        }))
    })
}));

// Mock Auth Provider
let mockUser: { id: string } | null = null;
let mockAuthLoading = false;
vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: mockAuthLoading
    })
}));

// Mock fetch for /api/stocks
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useWealth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUser = null;
        mockAuthLoading = false;

        mockSelect.mockReturnValue({ order: mockOrder });
        mockOrder.mockResolvedValue({ data: [], error: null });
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ stocks: {}, usdToIls: 3.65 })
        });
    });

    it('returns default zero values when no user is present', async () => {
        const { result } = renderReactQueryHook(() => useWealth());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.netWorth).toBe(0);
        expect(result.current.investmentsValue).toBe(0);
        expect(result.current.cashValue).toBe(0);
        expect(result.current.assets).toEqual([]);
    });

    it('fetches goals and calculates wealth correctly (pure cash)', async () => {
        mockUser = { id: '123' };

        const goals = [
            { id: 1, type: 'cash', current_amount: 50000, interest_rate: 0 },
            { id: 2, type: 'cash', current_amount: 20000, interest_rate: 0 }
        ];

        mockOrder.mockResolvedValue({ data: goals, error: null });

        const { result } = renderReactQueryHook(() => useWealth());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.netWorth).toBe(70000);
        expect(result.current.cashValue).toBe(70000);
        expect(result.current.investmentsValue).toBe(0);
        expect(result.current.assets).toHaveLength(2);
    });

    it('calculates stocks correctly via /api/stocks live prices', async () => {
        mockUser = { id: '123' };

        const goals = [
            { id: 1, type: 'stock', symbol: 'AAPL', quantity: 10 },
            { id: 2, investment_type: 'crypto', symbol: 'BTC', quantity: 0.5 } // Handled as crypto
        ];

        mockOrder.mockResolvedValue({ data: goals, error: null });
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                stocks: {
                    'AAPL': { price: 150, changePercent: 1.5 },
                    'BTC': { price: 60000, changePercent: 2.0 }
                },
                usdToIls: 3.7
            })
        });

        const { result } = renderReactQueryHook(() => useWealth());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // AAPL: 10 * 150 * 3.7 = 5550
        // BTC: 0.5 * 60000 * 3.7 = 111000
        // Total = 116550

        expect(mockFetch).toHaveBeenCalledWith('/api/stocks', expect.any(Object));
        expect(result.current.netWorth).toBe(116550);
        expect(result.current.investmentsValue).toBe(116550);
        expect(result.current.cashValue).toBe(0);
    });

    it('falls back to current_amount if stock API fails', async () => {
        mockUser = { id: '123' };

        const goals = [
            { id: 1, type: 'stock', symbol: 'AAPL', quantity: 10, current_amount: 5000 }
        ];

        mockOrder.mockResolvedValue({ data: goals, error: null });
        mockFetch.mockRejectedValue(new Error('API Down'));

        const { result } = renderReactQueryHook(() => useWealth());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.netWorth).toBe(5000); // the fallback current_amount
    });

    it('calculates daily interest for cash correctly', async () => {
        mockUser = { id: '123' };

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const goals = [
            // 10% annual interest rate, 10,000 principal, 3 days ago
            {
                id: 1,
                type: 'cash',
                current_amount: 10000,
                interest_rate: 10,
                last_interest_calc: threeDaysAgo.toISOString()
            }
        ];

        mockOrder.mockResolvedValue({ data: goals, error: null });

        const { result } = renderReactQueryHook(() => useWealth());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // 10% annual / 365 = 0.00027397 daily
        // 10000 * (1 + 0.00027397)^3 = ~10008.22
        expect(result.current.netWorth).toBeGreaterThan(10008);
        expect(result.current.netWorth).toBeLessThan(10009);
    });
});
