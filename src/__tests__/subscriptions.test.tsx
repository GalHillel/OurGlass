import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubscriptionsPage from '@/app/subscriptions/page';

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({ profile: { budget: 20000, couple_id: 'couple-1' } })
}));

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
                data: [{ id: '1', name: 'Netflix', amount: 50, category: 'בילוי' }]
            })
        })
    })
}));

vi.mock('@/components/SwipeableRow', () => ({ SwipeableRow: ({ children }: any) => <div data-testid="swipeable">{children}</div> }));

describe('Subscriptions Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.skip('renders subscriptions', async () => {
        render(<SubscriptionsPage />);

        expect(await screen.findByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('₪50')).toBeInTheDocument();
    });
});
