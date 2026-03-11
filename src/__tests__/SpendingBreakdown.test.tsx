import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpendingBreakdown } from '@/components/SpendingBreakdown';
import { CURRENCY_SYMBOL } from "@/lib/constants";

import { Transaction } from '@/types';

describe('SpendingBreakdown', () => {
    it('shows empty state if no transactions', () => {
        render(<SpendingBreakdown transactions={[]} subscriptions={[]} liabilities={[]} />);
        expect(screen.getByText('אין נתונים זמינים')).toBeInTheDocument();
    });

    it('renders breakdowns correctly grouped and sorted', () => {
        const transactions: Partial<Transaction>[] = [
            { category: 'אוכל', amount: 300, date: new Date().toISOString() },
            { category: 'תחבורה', amount: 50, date: new Date().toISOString() },
            { category: 'אוכל', amount: 200, date: new Date().toISOString() }, // Total food = 500
        ];

        render(<SpendingBreakdown transactions={transactions as Transaction[]} subscriptions={[]} liabilities={[]} />);

        expect(screen.getByText('אוכל')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}500`)).toBeInTheDocument();

        expect(screen.getByText('תחבורה')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}50`)).toBeInTheDocument();

        // Food text should appear before transportation because they are sorted manually descending
        const textElements = screen.getAllByText(/אוכל|תחבורה/);
        expect(textElements[0].textContent).toBe('אוכל');
    });
});
