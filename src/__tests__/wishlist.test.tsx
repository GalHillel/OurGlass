import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WishlistPage from '@/app/wishlist/page';

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({ profile: { budget: 20000, couple_id: 'couple-1', hourly_wage: 100 } })
}));

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockImplementation((table) => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({
                data: table === 'wishlist' ? [{ id: '1', name: 'Vacation', price: 5000, saved_amount: 1000 }] : []
            })
        }))
    })
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Mock dynamic components and framer motion
vi.mock('@/components/SwipeableRow', () => ({ SwipeableRow: ({ children }: { children: React.ReactNode }) => <div data-testid="swipeable">{children}</div> }));
vi.mock('@/components/WishlistCard', () => ({ WishlistCard: () => <div data-testid="wishlist-card" /> }));

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as Record<string, unknown>,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <button {...props}>{children}</button>
        }
    };
});

describe('Wishlist Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders wishlist items', async () => {
        render(<WishlistPage />);
        // Wait for fetch to populate
        expect(await screen.findByTestId('wishlist-card')).toBeInTheDocument();
    });
});
