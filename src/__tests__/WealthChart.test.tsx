import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WealthChart } from '@/components/WealthChart';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

vi.mock('recharts', async () => {
    const ActualRecharts = await vi.importActual('recharts');
    return {
        ...ActualRecharts as Record<string, unknown>,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    };
});

describe('WealthChart', () => {
    it('shows empty state if no value', () => {
        render(<WealthChart assets={[]} />);
        expect(screen.getByText('אין נתונים להצגה')).toBeInTheDocument();
    });

    it('renders chart data based on assets', async () => {
        const assets = [
            { id: '1', type: 'cash', current_amount: 10000 },
            { id: '2', type: 'investment', investment_type: 'crypto', calculatedValue: 5000 },
            { id: '3', type: 'stock', calculatedValue: 15000 },
        ];

        render(<WealthChart assets={assets as never} selectedType={null} onSelect={vi.fn()} />);

        // Total value = 30k
        expect(screen.getByText(`${CURRENCY_SYMBOL}30k`)).toBeInTheDocument();
    });
});
