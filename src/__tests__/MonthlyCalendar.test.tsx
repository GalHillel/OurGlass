import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { CURRENCY_SYMBOL } from "@/lib/constants";

import { Transaction } from '@/types';

describe('MonthlyCalendar', () => {
    const transactions = [
        {
            id: '1',
            amount: 150,
            description: 'Grocery',
            date: new Date().toISOString(),
            type: 'expense',
            category_id: 'cat-1',
            user_id: 'user-1',
            couple_id: 'couple-1',
            is_auto_generated: false,
            created_at: new Date().toISOString()
        }
    ];

    it('renders calendar with current month header', () => {
        render(<MonthlyCalendar transactions={transactions as Transaction[]} selectedDate={null} onDateSelect={vi.fn()} />);
        // Checking for days of week headers
        expect(screen.getByText('א')).toBeInTheDocument();
        expect(screen.getByText('ש')).toBeInTheDocument();
    });

    it('calls onDateSelect when a day is clicked', () => {
        const onSelect = vi.fn();
        render(<MonthlyCalendar transactions={transactions as Transaction[]} selectedDate={null} onDateSelect={onSelect} />);

        // Find today (will have the "today" class or just be the one string representing today's day)
        const todayStr = new Date().getDate().toString();
        // Since there are multiple elements possibly with this text, queryAll and click the first
        const dayButtons = screen.getAllByText(todayStr);
        fireEvent.click(dayButtons[dayButtons.length - 1].parentElement || dayButtons[0]);

        expect(onSelect).toHaveBeenCalled();
    });

    it('shows transactions for selected date', () => {
        const selectedDate = new Date();
        render(<MonthlyCalendar transactions={transactions as Transaction[]} selectedDate={selectedDate} onDateSelect={vi.fn()} />);

        expect(screen.getByText('Grocery')).toBeInTheDocument();
        expect(screen.getAllByText(`${CURRENCY_SYMBOL}150`).length).toBeGreaterThanOrEqual(1);
    });
});
