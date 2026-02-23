import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSettleUp, useGuiltFreeWallets } from '@/hooks/useJointFinance';
import { renderReactQueryHook } from './test-utils';
import { waitFor } from '@testing-library/react';

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLt = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn(() => ({
            select: mockSelect,
        }))
    })
}));

// Mock Auth Provider
let mockProfile: any = null;
vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        profile: mockProfile
    })
}));

// Mock Billing periods
vi.mock('@/lib/billing', () => ({
    getBillingPeriodForDate: vi.fn(() => ({
        start: new Date('2026-02-10T00:00:00Z'),
        end: new Date('2026-03-10T00:00:00Z')
    }))
}));

describe('useJointFinance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfile = null;

        // Setup fluent Supabase mock chain
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ gte: mockGte });
        mockGte.mockReturnValue({ lt: mockLt });
        mockLt.mockReturnValue({ order: mockOrder, in: mockIn });
        mockOrder.mockResolvedValue({ data: [], error: null });
        mockIn.mockResolvedValue({ data: [], error: null });
    });

    describe('useSettleUp', () => {
        it('returns pending state with no data when no couple_id exists', async () => {
            const { result } = renderReactQueryHook(() => useSettleUp(new Date()));

            // Query is disabled, so it stays pending and fetchStatus idle
            await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));

            expect(result.current.data).toBeUndefined();
            expect(mockSelect).not.toHaveBeenCalled();
        });

        it('calculates settle up logic correctly with transactions', async () => {
            mockProfile = { couple_id: '123', income_split_ratio: 0.6 }; // Him pays 60% of joint

            const transactions = [
                { id: 1, amount: 200, payer: 'him' },
                { id: 2, amount: 300, payer: 'her' },
                { id: 3, amount: 1000, payer: 'joint' },
                { id: 4, amount: 500, payer: null } // Default to joint
            ];

            mockOrder.mockResolvedValue({ data: transactions, error: null });

            const { result } = renderReactQueryHook(() => useSettleUp(new Date()));

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            const data = result.current.data!;
            expect(data.himTotal).toBe(200);
            expect(data.herTotal).toBe(300);
            expect(data.jointTotal).toBe(1500); // 1000 + 500

            // Him share of joint: 1500 * 0.6 = 900
            // Him actually paid of joint: 1500 / 2 = 750
            // Him owes: 900 - 750 = 150
            expect(data.himOwes).toBe(150);
            expect(data.transactions.him).toHaveLength(1);
            expect(data.transactions.her).toHaveLength(1);
            expect(data.transactions.joint).toHaveLength(2);
        });

        it('handles supabase fetch errors gracefully', async () => {
            mockProfile = { couple_id: '123' };
            mockOrder.mockResolvedValue({ data: null, error: new Error('DB Error') });

            const { result } = renderReactQueryHook(() => useSettleUp(new Date()));

            await waitFor(() => expect(result.current.isError).toBe(true));
        });
    });

    describe('useGuiltFreeWallets', () => {
        it('returns pending state with no data when no couple_id exists', async () => {
            mockProfile = { pocket_him: 1000, pocket_her: 800 };
            const { result } = renderReactQueryHook(() => useGuiltFreeWallets(new Date()));

            await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));

            expect(result.current.data).toBeUndefined();
            expect(mockSelect).not.toHaveBeenCalled();
        });

        it('calculates remaining wallets based on personal transactions', async () => {
            mockProfile = { couple_id: '123', pocket_him: 1000, pocket_her: 1000 };

            const transactions = [
                { amount: 300, payer: 'him' },
                { amount: 200, payer: 'her' },
                { amount: 800, payer: 'her' }, // She spent her whole wallet
                { amount: 500, payer: 'joint' } // Joint should be ignored
            ];

            mockIn.mockResolvedValue({ data: transactions, error: null });

            const { result } = renderReactQueryHook(() => useGuiltFreeWallets(new Date()));

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            const data = result.current.data!;
            expect(data.himSpent).toBe(300);
            expect(data.herSpent).toBe(1000);

            expect(data.himRemaining).toBe(700); // 1000 - 300
            expect(data.herRemaining).toBe(0);   // 1000 - 1000
            expect(data.pocketHim).toBe(1000);
            expect(data.pocketHer).toBe(1000);
        });

        it('never returns negative remaining wallet', async () => {
            mockProfile = { couple_id: '123', pocket_him: 500, pocket_her: 500 };

            const transactions = [{ amount: 1000, payer: 'him' }];
            mockIn.mockResolvedValue({ data: transactions, error: null });

            const { result } = renderReactQueryHook(() => useGuiltFreeWallets(new Date()));

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(result.current.data?.himRemaining).toBe(0); // Should cap at 0, not -500
        });
    });
});
