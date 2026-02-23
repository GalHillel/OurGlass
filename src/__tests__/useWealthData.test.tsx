import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWealthHistory, useLiabilities, useTotalLiabilities, isLiabilityActive } from '@/hooks/useWealthData';
import { renderReactQueryHook } from './test-utils';
import { waitFor } from '@testing-library/react';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn(() => ({
            select: mockSelect,
            insert: vi.fn(),
            update: vi.fn(),
            delete: vi.fn()
        }))
    })
}));

let mockProfile: { couple_id: string } | null = null;
vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({ profile: mockProfile })
}));

describe('useWealthData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfile = null;
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ gte: mockGte, order: mockOrder });
        mockGte.mockReturnValue({ order: mockOrder });
        mockOrder.mockResolvedValue({ data: [], error: null });
    });

    it('isLiabilityActive handles payoff state and end date', () => {
        expect(isLiabilityActive({ remaining_amount: 1000, end_date: '2999-01-01' } as never)).toBe(true);
        expect(isLiabilityActive({ remaining_amount: 0, end_date: '2999-01-01' } as never)).toBe(false);
        expect(isLiabilityActive({ remaining_amount: 1000, end_date: '2000-01-01' } as never)).toBe(false);
    });

    describe('useWealthHistory', () => {
        it('returns undefined when no couple_id exists', async () => {
            const { result } = renderReactQueryHook(() => useWealthHistory(90));
            await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
            expect(result.current.data).toBeUndefined();
        });

        it('fetches wealth history successfully', async () => {
            mockProfile = { couple_id: '123' };
            const fakeData = [
                { id: 1, snapshot_date: '2026-02-01', total_net_worth: 100000 },
                { id: 2, snapshot_date: '2026-02-15', total_net_worth: 105000 }
            ];
            mockOrder.mockResolvedValue({ data: fakeData, error: null });

            const { result } = renderReactQueryHook(() => useWealthHistory(90));
            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toEqual(fakeData);
            expect(mockEq).toHaveBeenCalledWith('couple_id', '123');
        });
    });

    describe('useLiabilities', () => {
        it('fetches liabilities successfully', async () => {
            mockProfile = { couple_id: '123' };
            const fakeData = [
                { id: 1, name: 'Mortgage', remaining_amount: 500000, monthly_payment: 5000 }
            ];
            mockOrder.mockResolvedValue({ data: fakeData, error: null });

            const { result } = renderReactQueryHook(() => useLiabilities());
            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toEqual(fakeData);
        });
    });

    describe('useTotalLiabilities', () => {
        it('sums remaining balances and only active monthly payments', async () => {
            mockProfile = { couple_id: '123' };
            const fakeData = [
                { id: 1, remaining_amount: 100000, monthly_payment: 1000, end_date: '2999-01-01' },
                { id: 2, remaining_amount: 50000, monthly_payment: 500, end_date: '2000-01-01' }
            ];
            mockOrder.mockResolvedValue({ data: fakeData, error: null });

            const { result } = renderReactQueryHook(() => useTotalLiabilities());
            await waitFor(() => expect(result.current.count).toBe(2));

            expect(result.current.total).toBe(150000);
            expect(result.current.monthlyPayments).toBe(1000);
            expect(result.current.count).toBe(2);
        });
    });
});
