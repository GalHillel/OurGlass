import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WealthPage from '@/app/wealth/page';

vi.mock('@/hooks/useWealth', () => ({
    useWealth: () => ({
        netWorth: 150000,
        investmentsValue: 100000,
        cashValue: 50000,
        assets: [{ id: '1', name: 'Apartment', type: 'real_estate', investment_type: 'real_estate', current_amount: 500000 }],
        loading: false,
        refetch: vi.fn()
    })
}));

vi.mock('@/hooks/useWealthData', () => ({
    useTotalLiabilities: () => ({ total: 50000 })
}));

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
    })
}));

// Mock dynamic and child components that might have complex rendering
vi.mock('@/components/StockPortfolio', () => ({ StockPortfolio: () => <div data-testid="stock-portfolio" /> }));
vi.mock('@/components/NetWorthHistory', () => ({ NetWorthHistory: () => <div data-testid="net-worth-history" /> }));
vi.mock('@/components/LiabilitiesSection', () => ({ LiabilitiesSection: () => <div data-testid="liabilities" /> }));
vi.mock('@/components/RebalancingCoach', () => ({ RebalancingCoach: () => <div data-testid="rebalancing" /> }));
vi.mock('@/components/SP500Benchmark', () => ({ SP500Benchmark: () => <div data-testid="sp500" /> }));

describe('Wealth Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.skip('renders net worth and assets', () => {
        render(<WealthPage />);

        // 150000 - 50000 = 100000 true net worth
        expect(screen.getByText('100,000')).toBeInTheDocument();
        expect(screen.getByText('Apartment')).toBeInTheDocument();

        // Check sections rendered
        expect(screen.getByTestId('stock-portfolio')).toBeInTheDocument();
        expect(screen.getByTestId('net-worth-history')).toBeInTheDocument();
    });
});
