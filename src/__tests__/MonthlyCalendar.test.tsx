import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';

describe('MonthlyCalendar', () => {
    const transactions = [
        { id: '1', amount: 150, description: 'Grocery', date: new Date().toISOString() }
    ];

    it('renders calendar with current month header', () => {
        render(<MonthlyCalendar transactions={transactions} selectedDate={null} onDateSelect={vi.fn()} />);
        // Checking for days of week headers
        expect(screen.getByText('א')).toBeInTheDocument();
        expect(screen.getByText('ש')).toBeInTheDocument();
    });

    it('calls onDateSelect when a day is clicked', () => {
        const onSelect = vi.fn();
        render(<MonthlyCalendar transactions={transactions} selectedDate={null} onDateSelect={onSelect} />);

        // Find today (will have the "today" class or just be the one string representing today's day)
        const todayStr = new Date().getDate().toString();
        // Since there are multiple elements possibly with this text, queryAll and click the first
        const dayButtons = screen.getAllByText(todayStr);
        fireEvent.click(dayButtons[dayButtons.length - 1].parentElement || dayButtons[0]);

        expect(onSelect).toHaveBeenCalled();
    });

    it('shows transactions for selected date', () => {
        const selectedDate = new Date();
        render(<MonthlyCalendar transactions={transactions} selectedDate={selectedDate} onDateSelect={vi.fn()} />);

        expect(screen.getByText('Grocery')).toBeInTheDocument();
        expect(screen.getAllByText('₪150').length).toBeGreaterThanOrEqual(1);
    });
});
