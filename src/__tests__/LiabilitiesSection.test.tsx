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
        vi.spyOn(hooks, 'useAddLiability').mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as UseMutationResult<Liability, Error, Omit<Liability, "id" | "couple_id" | "created_at">, unknown>);
        vi.spyOn(hooks, 'useDeleteLiability').mockReturnValue({ mutate: vi.fn() } as unknown as UseMutationResult<void, Error, string, unknown>);

        render(<LiabilitiesSection />);

        expect(screen.getByText('אין התחייבויות')).toBeInTheDocument();
    });

    it('renders liabilities correctly', () => {
        const mockLiabilities = [
            {
                id: '1',
                name: 'Car Loan',
                type: 'car' as const,
                principal: 100000,
                current_balance: 80000,
                interest_rate: 3,
                monthly_payment: 2000,
                owner: 'joint' as const
            }
        ];

        vi.spyOn(hooks, 'useLiabilities').mockReturnValue({ data: mockLiabilities, isLoading: false } as unknown as UseQueryResult<Liability[], Error>);
        vi.spyOn(hooks, 'useAddLiability').mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as UseMutationResult<Liability, Error, Omit<Liability, "id" | "couple_id" | "created_at">, unknown>);
        vi.spyOn(hooks, 'useDeleteLiability').mockReturnValue({ mutate: vi.fn() } as unknown as UseMutationResult<void, Error, string, unknown>);

        render(<LiabilitiesSection />);

        expect(screen.getByText('Car Loan')).toBeInTheDocument();
        expect(screen.getByText('₪80,000')).toBeInTheDocument();
        // 100k - 80k = 20k / 100k = 20%
        expect(screen.getByText('20% שולם')).toBeInTheDocument();
    });
});
