import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuiltFreeWallets } from '@/components/GuiltFreeWallets';
import * as hooks from '@/hooks/useJointFinance';
import { PAYERS } from "@/lib/constants";

vi.mock('@/hooks/useJointFinance');
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [] }) })
    })
}));

describe('GuiltFreeWallets', () => {
    it('renders skeleton while loading', () => {
        vi.spyOn(hooks, 'useGuiltFreeWallets').mockReturnValue({ data: undefined, isLoading: true } as never);

        const { container } = render(<GuiltFreeWallets />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders nothing if no pocket money configured', () => {
        vi.spyOn(hooks, 'useGuiltFreeWallets').mockReturnValue({
            data: { pocketHim: 0, pocketHer: 0, himRemaining: 0, himSpent: 0, herRemaining: 0, herSpent: 0 },
            isLoading: false
        } as never);

        const { container } = render(<GuiltFreeWallets />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders wallets correctly', async () => {
        vi.spyOn(hooks, 'useGuiltFreeWallets').mockReturnValue({
            data: {
                pocketHim: 1000,
                pocketHer: 1200,
                himRemaining: 200,
                himSpent: 800,
                herRemaining: 300,
                herSpent: 900
            },
            isLoading: false
        } as never);

        render(<GuiltFreeWallets />);

        expect(screen.getByText('תקציב לביזבוזים')).toBeInTheDocument();
        expect(screen.getByText(new RegExp(PAYERS.HIM))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(PAYERS.HER))).toBeInTheDocument();

        // Using regex for numbers to handle CountUp or formatting
        expect(await screen.findByText(/200/)).toBeInTheDocument();
        expect(await screen.findByText(/300/)).toBeInTheDocument();
        expect(screen.getByText(/800/)).toBeInTheDocument();
        expect(screen.getByText(/900/)).toBeInTheDocument();
        expect(screen.getByText(/1,000/)).toBeInTheDocument();
        expect(screen.getByText(/1,200/)).toBeInTheDocument();
    });
});
