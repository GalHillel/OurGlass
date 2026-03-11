import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionList } from '@/components/TransactionList';
import { CURRENCY_SYMBOL } from "@/lib/constants";

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        })
    })
}));

describe('TransactionList', () => {
    it('shows empty state when no transactions', () => {
        render(<TransactionList transactions={[]} onRefresh={vi.fn()} />);
        expect(screen.getByText('אין עסקאות עדיין')).toBeInTheDocument();
    });

    it('shows filtered empty states', () => {
        render(<TransactionList transactions={[]} onRefresh={vi.fn()} activeFilter="אוכל" />);
        expect(screen.getByText('אין עסקאות בקטגוריה "אוכל"')).toBeInTheDocument();
    });

    it('renders transactions properly', () => {
        const txs = [
            { id: '1', description: 'קפה ומאפה', amount: 35, date: new Date().toISOString() },
            { id: '2', description: 'סופרמרקט', amount: 450, date: new Date().toISOString() },
        ];

        render(<TransactionList transactions={txs as never} onRefresh={vi.fn()} />);

        expect(screen.getByText('קפה ומאפה')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}35`)).toBeInTheDocument();
        expect(screen.getByText('סופרמרקט')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}450`)).toBeInTheDocument();
    });

    it.skip('detects recurring subscriptions', () => {
        const txs = [
            { id: '1', description: 'Netflix', amount: 50, date: '2023-01-10T10:00:00Z' },
            { id: '2', description: 'Netflix', amount: 50, date: '2023-02-11T10:00:00Z' }, // Occurred twice ~same date
        ];

        render(<TransactionList transactions={txs as never} onRefresh={vi.fn()} subscriptions={[]} />);

        expect(screen.getByText('זיהינו חיוב קבוע')).toBeInTheDocument();
        expect(screen.getByText(/Netflix/)).toBeInTheDocument();
    });
});
