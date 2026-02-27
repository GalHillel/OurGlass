import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav } from '@/components/BottomNav';
import { triggerHaptic } from '@/utils/haptics';

type DashboardStoreState = {
    navItems: Array<{ id: string; enabled: boolean; order: number }>;
    features: {
        enableStocksPage: boolean;
        enableLounge: boolean;
        enableWishlist: boolean;
        enableSubscriptions: boolean;
    };
    _hasHydrated: boolean;
};

// Mock routing
const mockPush = vi.fn();
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => mockPathname()
}));

vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn()
}));

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        user: { id: 'u1' },
        profile: { id: 'u1', couple_id: 'c1', budget: 20000, monthly_income: 20000 },
        loading: false,
    })
}));

vi.mock('@/stores/appStore', () => ({
    useAppStore: () => ({ appIdentity: 'him' })
}));

vi.mock('@/hooks/useWealth', () => ({
    useWealth: () => ({
        netWorth: 0,
        assets: [],
        loading: false,
        cashValue: 0,
        investmentsValue: 0,
        refetch: vi.fn(),
        usdToIls: 3.7,
    })
}));

vi.mock('@/stores/dashboardStore', () => ({
    useDashboardStore: (selector?: (s: DashboardStoreState) => unknown) => {
        const state: DashboardStoreState = {
            navItems: [
                { id: 'home', enabled: true, order: 0 },
                { id: 'wealth', enabled: true, order: 1 },
                { id: 'settings', enabled: true, order: 2 },
            ],
            features: {
                enableStocksPage: true,
                enableLounge: true,
                enableWishlist: true,
                enableSubscriptions: true,
            },
            _hasHydrated: true,
        };
        return selector ? selector(state) : state;
    },
}));

describe('BottomNav', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does not render on /login page', () => {
        mockPathname.mockReturnValue('/login');
        const { container } = render(<BottomNav />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders navigation items on non-login pages', () => {
        mockPathname.mockReturnValue('/');
        render(<BottomNav />);

        expect(screen.getByText('בית')).toBeInTheDocument();
        expect(screen.getByText('עושר')).toBeInTheDocument();
        expect(screen.getByText('הגדרות')).toBeInTheDocument();
    });

    it('triggers haptic and navigation on click', () => {
        mockPathname.mockReturnValue('/');
        render(<BottomNav />);

        const link = screen.getByRole('link', { name: 'עושר' });
        expect(link).toHaveAttribute('href', '/wealth');
        fireEvent.click(link); // Click Wealth item

        expect(triggerHaptic).toHaveBeenCalledTimes(1);
    });

    it('highlights active item', () => {
        mockPathname.mockReturnValue('/settings');
        render(<BottomNav />);

        const activeSpan = screen.getByText('הגדרות');
        expect(activeSpan).toHaveClass('text-blue-200'); // Active state class

        const inactiveSpan = screen.getByText('בית');
        expect(inactiveSpan).not.toHaveClass('text-blue-200');
    });
});
