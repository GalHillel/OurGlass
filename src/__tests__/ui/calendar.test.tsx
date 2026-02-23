import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Calendar } from '@/components/ui/calendar';

describe('Calendar', () => {
    it.skip('renders and allows date selection', () => {
        const onSelect = vi.fn();
        const testMonth = new Date(2026, 1, 1); // Feb 2026

        render(
            <Calendar
                mode="single"
                selected={undefined}
                onSelect={onSelect}
                month={testMonth}
            />
        );

        // react-day-picker renders the month title
        expect(screen.getByText('February 2026')).toBeInTheDocument();

        // Click the 15th of February
        const dayBtn = screen.getByRole('gridcell', { name: /15/i });
        fireEvent.click(dayBtn);

        expect(onSelect).toHaveBeenCalled();
        // The first argument to onSelect is the Date object
        const selectedDate = onSelect.mock.calls[0][0] as Date;
        expect(selectedDate.getDate()).toBe(15);
        expect(selectedDate.getMonth()).toBe(1); // Feb
    });
});
