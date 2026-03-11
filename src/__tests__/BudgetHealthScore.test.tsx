import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetHealthScore } from '@/components/BudgetHealthScore';
import { CURRENCY_SYMBOL } from "@/lib/constants";

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
        circle: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <circle {...props}>{children}</circle>,
    },
    useAnimation: () => ({ start: vi.fn() }),
}));

describe('BudgetHealthScore', () => {
    const defaultProps = {
        balance: 5000,
        budget: 10000,
        monthlyIncome: 12000,
        totalExpenses: 5000,
        daysInMonth: 30,
        daysPassed: 15
    };

    it('renders the component with excellent status when on track', () => {
        render(<BudgetHealthScore {...defaultProps} />);

        expect(screen.getByText('בריאות פיננסית')).toBeInTheDocument();
        // Since we are exactly on track (50% budget over 50% time), score should be high.
        expect(screen.getByText('מצוין!')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL} 333`)).toBeInTheDocument(); // 5000 / 15 days = 333
        expect(screen.getByText('15')).toBeInTheDocument(); // 30 - 15 = 15 days remaining
    });

    it.skip('shows warning status when overspending pace', () => {
        // Spent 8000 in 15 days out of 10000 budget
        render(<BudgetHealthScore {...defaultProps} totalExpenses={8000} balance={2000} />);

        expect(screen.getByText('שים לב')).toBeInTheDocument(); // Score lower
        expect(screen.getByText(`${CURRENCY_SYMBOL} 133`)).toBeInTheDocument(); // 2000 / 15
    });

    it('shows critical status when balance is negative', () => {
        // Spent 11000 in 15 days out of 10000 budget
        render(<BudgetHealthScore {...defaultProps} totalExpenses={11000} balance={-1000} />);

        expect(screen.getByText('בעייתי')).toBeInTheDocument(); // critical
        expect(screen.getByText(`${CURRENCY_SYMBOL} 0`)).toBeInTheDocument(); // Safe to spend is 0
        expect(screen.getByText(`- ${CURRENCY_SYMBOL} 1,000`)).toBeInTheDocument();
    });

    it('handles zero days remaining edge case', () => {
        render(<BudgetHealthScore {...defaultProps} daysPassed={30} balance={100} />);
        expect(screen.getByText('מצוין!')).toBeInTheDocument(); // Finished month positive
        expect(screen.getByText(`${CURRENCY_SYMBOL} 0`)).toBeInTheDocument(); // 0 safe to spend because 0 days left
    });
});
