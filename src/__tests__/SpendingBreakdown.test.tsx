import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpendingBreakdown } from '@/components/SpendingBreakdown';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

describe('SpendingBreakdown', () => {
    it('shows empty state if no transactions', () => {
        render(<SpendingBreakdown transactions={[]} />);
        expect(screen.getByText('אין נתונים להצגה')).toBeInTheDocument();
    });

    it('renders breakdowns correctly grouped and sorted', () => {
        const transactions = [
            { category: 'אוכל', amount: 300 },
            { category: 'תחבורה', amount: 50 },
            { category: 'אוכל', amount: 200 }, // Total food = 500
        ];

        render(<SpendingBreakdown transactions={transactions as never} />);

        expect(screen.getByText('אוכל')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}500`)).toBeInTheDocument();

        expect(screen.getByText('תחבורה')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}50`)).toBeInTheDocument();

        // Food text should appear before transportation because they are sorted manually descending
        const textElements = screen.getAllByText(/אוכל|תחבורה/);
        expect(textElements[0].textContent).toBe('אוכל');
    });
});
