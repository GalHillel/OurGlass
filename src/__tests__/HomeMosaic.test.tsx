import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HomeMosaic, type HomeMosaicProps } from '@/components/HomeMosaic';
import { CURRENCY_SYMBOL } from "@/lib/constants";

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null }),
                    order: () => Promise.resolve({ data: [], error: null }),
                }),
                order: () => Promise.resolve({ data: [], error: null }),
            }),
        }),
    }),
}));

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ReactorCore', () => ({ ReactorCore: () => <div data-testid="mock-reactor">Reactor</div> }));
vi.mock('@/components/QuestsAndBadges', () => ({ QuestsAndBadges: () => <div data-testid="mock-quests">Quests</div> }));
vi.mock('@/components/BudgetHealthScore', () => ({ BudgetHealthScore: () => <div data-testid="mock-health">Health</div> }));
vi.mock('@/components/StockPortfolio', () => ({ StockPortfolio: () => <div data-testid="mock-stocks">Stocks</div> }));
vi.mock('@/components/AIHubBanner', () => ({ AIHubBanner: () => <div data-testid="mock-aihub">AI Hub</div> }));
vi.mock('@/components/SmartInsights', () => ({ SmartInsights: () => <div data-testid="mock-smart">Smart</div> }));
vi.mock('@/components/MonthlyRoastPraise', () => ({ MonthlyRoastPraise: () => <div data-testid="mock-roast">Roast</div> }));

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
        render(<HomeMosaic {...(defaultProps as unknown as HomeMosaicProps)} />);

        expect(screen.getByTestId('mock-reactor')).toBeInTheDocument();
        expect(screen.getByTestId('mock-aihub')).toBeInTheDocument();
        expect(screen.getByText('בריאות')).toBeInTheDocument();
        expect(screen.getByText('חיסכון חודשי')).toBeInTheDocument();

        // Ensure calculations are rendered on tiles
        expect(screen.getByText(`${CURRENCY_SYMBOL}10,000`)).toBeInTheDocument(); // actual savings (15k - 5k)
        expect(screen.getByText('67% מההכנסה')).toBeInTheDocument(); // 10k/15k
    });
});
