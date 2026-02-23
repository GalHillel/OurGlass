import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MoodSpendingInsight } from '@/components/MoodSpendingInsight';
import * as query from '@tanstack/react-query';

// Mock recharts to prevent JSDOM issues with SVG measuring
vi.mock('recharts', async () => {
    const ActualRecharts = await vi.importActual('recharts');
    return {
        ...ActualRecharts as Record<string, unknown>,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    };
});

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
    };
});

describe('MoodSpendingInsight', () => {
    it('shows empty state when no mood data exists', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);

        render(<MoodSpendingInsight transactions={[]} subscriptions={[]} liabilities={[]} />);

        expect(screen.getByText('אין עדיין נתוני מצב רוח')).toBeInTheDocument();
    });

    it('renders chart and insight when data is available', () => {
        const txs = [
            { id: '1', amount: 100, mood_rating: 5 },
            { id: '2', amount: 50, mood_rating: 1 },
        ];

        const mockInsight = { type: 'success', text: 'You spend responsibly when happy!' };
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: mockInsight, isLoading: false, isError: false } as never);

        render(<MoodSpendingInsight transactions={txs as never} subscriptions={[]} liabilities={[]} />);

        expect(screen.getByText('מצב רוח vs. הוצאות')).toBeInTheDocument();
        // Stats
        expect(screen.getByText('😄')).toBeInTheDocument();
        expect(screen.getByText('😞')).toBeInTheDocument();

        // Insight text
        expect(screen.getByText('You spend responsibly when happy!')).toBeInTheDocument();
    });
});
