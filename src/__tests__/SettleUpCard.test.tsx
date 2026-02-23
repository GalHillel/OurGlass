import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettleUpCard } from '@/components/SettleUpCard';
import * as query from '@tanstack/react-query';
import * as hooks from '@/hooks/useJointFinance';
import * as auth from '@/components/AuthProvider';

// Mock utilities
vi.mock('@/utils/haptics', () => ({ triggerHaptic: vi.fn(), hapticSuccess: vi.fn() }));
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            insert: vi.fn().mockResolvedValue({ error: null })
        })
    })
}));

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
    };
});

describe('SettleUpCard', () => {
    it('shows loading state initially', () => {
        vi.spyOn(hooks, 'useSettleUp').mockReturnValue({ data: null, isLoading: true } as never);
        const { container } = render(<SettleUpCard />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('displays settled state when himOwes is near 0', () => {
        vi.spyOn(auth, 'useAuth').mockReturnValue({ profile: { couple_id: '123' } } as never);
        vi.spyOn(hooks, 'useSettleUp').mockReturnValue({
            data: { himTotal: 1000, herTotal: 1000, jointTotal: 0, splitRatio: 0.5, himOwes: 0 },
            isLoading: false
        } as never);

        render(<SettleUpCard />);
        expect(screen.getByText('מסודר! אין חובות 🎉')).toBeInTheDocument();
    });

    it('displays amount owed and allows settling', () => {
        vi.spyOn(auth, 'useAuth').mockReturnValue({ profile: { couple_id: '123' } } as never);
        const mockMutate = vi.fn();
        vi.spyOn(query, 'useMutation').mockReturnValue({ mutate: mockMutate, isPending: false } as never);
        vi.spyOn(hooks, 'useSettleUp').mockReturnValue({
            data: { himTotal: 500, herTotal: 1500, jointTotal: 0, splitRatio: 0.5, himOwes: 500 },
            isLoading: false
        } as never);

        render(<SettleUpCard />);
        expect(screen.getByText('הוא חייב/ת ₪500')).toBeInTheDocument();

        fireEvent.click(screen.getByText('סמן כמסודר'));
        expect(mockMutate).toHaveBeenCalledWith({ amount: 500, himOwes: 500 });
    });
});
