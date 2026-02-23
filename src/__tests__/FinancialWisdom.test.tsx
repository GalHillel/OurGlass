import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinancialWisdom } from '@/components/FinancialWisdom';

describe('FinancialWisdom', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows a tip if not seen today', async () => {
        const { container } = render(<FinancialWisdom />);

        // Initially empty because of a 1.5s delay
        expect(screen.queryByText('טיפ יומי')).not.toBeInTheDocument();

        // Advance 1.5s
        await act(async () => {
            vi.advanceTimersByTime(1500);
        });

        expect(screen.getByText('טיפ יומי')).toBeInTheDocument();
    });

    it('does not show tip if already seen today', async () => {
        localStorage.setItem('last_daily_tip_date', new Date().toDateString());

        render(<FinancialWisdom />);

        // Advance time just in case
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        expect(screen.queryByText('טיפ יומי')).not.toBeInTheDocument();
    });
});
