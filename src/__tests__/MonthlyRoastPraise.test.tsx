import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MonthlyRoastPraise } from '@/components/MonthlyRoastPraise';
import * as query from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
    };
});

describe('MonthlyRoastPraise', () => {
    it('shows empty state when no transactions', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: undefined, isLoading: false, isError: false } as any);
        render(<MonthlyRoastPraise transactions={[]} subscriptions={[]} liabilities={[]} balance={100} budget={1000} monthlyIncome={5000} />);

        expect(screen.getByText('הוסף הוצאה כדי לקבל ניתוח AI')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: undefined, isLoading: true, isError: false } as any);
        const txs: any[] = [{ id: '1' }];
        render(<MonthlyRoastPraise transactions={txs} subscriptions={[]} liabilities={[]} balance={100} budget={1000} monthlyIncome={5000} />);

        expect(screen.getByText('ה-AI מנתח את ההוצאות שלך...')).toBeInTheDocument();
    });

    it('renders insights', () => {
        const mockInsights = [
            { type: 'roast', emoji: '🔥', text: 'You spent too much on coffee' },
            { type: 'praise', emoji: '✨', text: 'Great job saving' }
        ];
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: mockInsights, isLoading: false, isError: false } as any);

        const txs: any[] = [{ id: '1' }];
        render(<MonthlyRoastPraise transactions={txs} subscriptions={[]} liabilities={[]} balance={100} budget={1000} monthlyIncome={5000} />);

        expect(screen.getByText('You spent too much on coffee')).toBeInTheDocument();
        expect(screen.getByText('Great job saving')).toBeInTheDocument();
    });
});
