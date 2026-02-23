import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomeMosaic } from '@/components/HomeMosaic';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ReactorCore', () => ({ ReactorCore: () => <div data-testid="mock-reactor">Reactor</div> }));
vi.mock('@/components/QuestsAndBadges', () => ({ QuestsAndBadges: () => <div data-testid="mock-quests">Quests</div> }));
vi.mock('@/components/BudgetHealthScore', () => ({ BudgetHealthScore: () => <div data-testid="mock-health">Health</div> }));
vi.mock('@/components/StockPortfolio', () => ({ StockPortfolio: () => <div data-testid="mock-stocks">Stocks</div> }));
vi.mock('@/components/SettleUpCard', () => ({ SettleUpCard: () => <div data-testid="mock-settle">Settle</div> }));
vi.mock('@/components/MonthlySummary', () => ({ MonthlySummary: () => <div data-testid="mock-summary">Summary</div> }));

describe('HomeMosaic', () => {
    const defaultProps = {
        balance: 5000,
        budget: 10000,
        monthlyIncome: 15000,
        totalExpenses: 5000,
        daysInMonth: 30,
        daysPassed: 15,
        assets: [{ id: '1', name: 'Stock', type: 'stock', current_amount: 1000 }, { id: '2', name: 'Cash', type: 'cash', current_amount: 2000 }],
        transactions: [],
        subscriptions: [],
        liabilities: [],
        onRefresh: vi.fn(),
        burnRateStatus: 'safe' as const,
        cycleStart: new Date(),
        cycleEnd: new Date(),
        onQuickAdd: vi.fn(),
        selectedDate: null,
        onDateSelect: vi.fn(),
        selectedFilterCategory: null,
        onCategorySelect: vi.fn()
    };

    it('renders all mosaic tiles', () => {
        render(<HomeMosaic {...defaultProps} />);

        expect(screen.getByTestId('mock-reactor')).toBeInTheDocument();
        expect(screen.getByText('תחזית AI')).toBeInTheDocument();
        expect(screen.getByText('מצב רוח')).toBeInTheDocument();
        expect(screen.getByText('רמת חיסכון')).toBeInTheDocument();
        expect(screen.getByText('התחשבנות')).toBeInTheDocument();

        // Ensure calculations are rendered on tiles
        expect(screen.getByText('₪10,000')).toBeInTheDocument(); // actual savings (15k - 5k)
        expect(screen.getByText('67% מההכנסה')).toBeInTheDocument(); // 10k/15k
    });
});
