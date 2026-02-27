import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { Liability } from '@/types';
import { LiabilitiesSection } from '@/components/LiabilitiesSection';
import * as hooks from '@/hooks/useWealthData';

vi.mock('@/hooks/useWealthData');
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [] }) })
    })
}));

describe('LiabilitiesSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no liabilities', () => {
        vi.spyOn(hooks, 'useLiabilities').mockReturnValue({ data: [], isLoading: false } as unknown as UseQueryResult<Liability[], Error>);
        vi.spyOn(hooks, 'useAddLiability').mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as UseMutationResult<unknown, Error, Omit<Liability, "id" | "created_at"> & { couple_id?: string }, unknown>);
        vi.spyOn(hooks, 'useDeleteLiability').mockReturnValue({ mutate: vi.fn() } as unknown as UseMutationResult<void, Error, string, unknown>);
        vi.spyOn(hooks, 'isLiabilityActive').mockReturnValue(true);

        render(<LiabilitiesSection />);

        expect(screen.getByText('אין התחייבויות')).toBeInTheDocument();
    });

    it('renders liabilities with progress and category', () => {
        const mockLiabilities = [
            {
                id: '1',
                name: 'Car Loan',
                category: 'Car Loan',
                type: 'car' as const,
                total_amount: 100000,
                remaining_amount: 80000,
                interest_rate: 8.9,
                monthly_payment: 2000,
                end_date: '2999-01-01',
                owner: 'joint' as const
            }
        ];

        vi.spyOn(hooks, 'useLiabilities').mockReturnValue({ data: mockLiabilities, isLoading: false } as unknown as UseQueryResult<Liability[], Error>);
        vi.spyOn(hooks, 'useAddLiability').mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as UseMutationResult<unknown, Error, Omit<Liability, "id" | "created_at"> & { couple_id?: string }, unknown>);
        vi.spyOn(hooks, 'useDeleteLiability').mockReturnValue({ mutate: vi.fn() } as unknown as UseMutationResult<void, Error, string, unknown>);
        vi.spyOn(hooks, 'isLiabilityActive').mockReturnValue(true);

        render(<LiabilitiesSection />);

        expect(screen.getAllByText('Car Loan').length).toBeGreaterThan(0);
        expect(screen.getAllByText((content) => content.includes('80,000')).length).toBeGreaterThan(0);
        expect(screen.getByText(/20%/)).toBeInTheDocument();
    });
});
