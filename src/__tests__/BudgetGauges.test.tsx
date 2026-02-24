import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BudgetGauges } from '@/components/BudgetGauges';

describe('BudgetGauges', () => {
    it('calculates safe daily spend correctly', () => {
        // 3000 balance / 10 days = 300 daily
        render(<BudgetGauges balance={3000} budget={10000} daysRemaining={10} />);

        expect(screen.getByText((content) => content.includes('300'))).toBeInTheDocument(); // 300 daily
        expect(screen.getByText((content) => content.includes('70'))).toBeInTheDocument(); // 10000-3000=7000, 7000/10000 = 70% burn
    });

    it('handles negative balance correctly safely', () => {
        // -500 balance -> 0 daily
        render(<BudgetGauges balance={-500} budget={10000} daysRemaining={5} />);

        expect(screen.getByText((content) => content.includes('0'))).toBeInTheDocument(); // 0 daily
        expect(screen.getByText((content) => content.includes('100'))).toBeInTheDocument(); // capped at 100% burn
    });

    it('handles zero days remaining safely', () => {
        render(<BudgetGauges balance={1500} budget={4000} daysRemaining={0} />);

        // Division by 1 if daysRemaining <= 0
        expect(screen.getByText((content) => content.includes('1,500'))).toBeInTheDocument();
    });
});
