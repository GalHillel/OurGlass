import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWealthHistory, useLiabilities, useTotalLiabilities } from '@/hooks/useWealthData';
import { renderReactQueryHook } from './test-utils';
import { waitFor } from '@testing-library/react';

// Mock Supabase
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

// Mock Auth Provider
let mockProfile: { couple_id: string } | null = null;
vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        profile: mockProfile
    })
}));

describe('useWealthData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfile = null;

        // Setup fluent chain for selects
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ gte: mockGte, order: mockOrder });
        mockGte.mockReturnValue({ order: mockOrder });
        mockOrder.mockResolvedValue({ data: [], error: null });
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
            expect(mockSelect).toHaveBeenCalled();
            expect(mockEq).toHaveBeenCalledWith('couple_id', '123');
            expect(mockGte).toHaveBeenCalled();
        });
    });

    describe('useLiabilities', () => {
        it('returns undefined when no couple_id', async () => {
            const { result } = renderReactQueryHook(() => useLiabilities());
            await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
            expect(result.current.data).toBeUndefined();
        });

        it('fetches liabilities successfully', async () => {
            mockProfile = { couple_id: '123' };
            const fakeData = [
                { id: 1, name: 'Mortgage', current_balance: -500000, monthly_payment: 5000 }
            ];
            mockOrder.mockResolvedValue({ data: fakeData, error: null });

            const { result } = renderReactQueryHook(() => useLiabilities());
            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data).toEqual(fakeData);
        });
    });

    describe('useTotalLiabilities', () => {
        it('calculates totals correctly from liabilities', async () => {
            mockProfile = { couple_id: '123' };
            const fakeData = [
                { id: 1, current_balance: -100000, monthly_payment: 1000 },
                { id: 2, current_balance: -50000, monthly_payment: 500 }
            ];
            mockOrder.mockResolvedValue({ data: fakeData, error: null });

            const { result } = renderReactQueryHook(() => useTotalLiabilities());
            await waitFor(() => expect(result.current.count).toBe(2));

            expect(result.current.total).toBe(-150000);
            expect(result.current.monthlyPayments).toBe(1500);
            expect(result.current.count).toBe(2);
        });
    });
});
