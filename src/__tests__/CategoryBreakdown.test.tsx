import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryBreakdown, normalizeCategory } from '@/components/CategoryBreakdown';

describe('CategoryBreakdown', () => {
    it('normalizes categories properly', () => {
        expect(normalizeCategory('אוכל')).toBe('אוכל');
        expect(normalizeCategory('streaming')).toBe('חשבונות');
        expect(normalizeCategory('UNKNOWN')).toBe('אחר');
        expect(normalizeCategory(null)).toBe('אחר');
    });

    it('renders empty state when no data exists', () => {
        render(<CategoryBreakdown transactions={[]} />);
        expect(screen.getByText('אין עדיין הוצאות החודש')).toBeInTheDocument();
    });

    it('aggregates transactions correctly by category', () => {
        const txs = [
            { id: '1', amount: 100, category: 'אוכל', date: '2026-02-01' },
            { id: '2', amount: 50, category: 'אוכל', date: '2026-02-02' },
            { id: '3', amount: 200, category: 'דלק', date: '2026-02-03' },
        ];

        render(<CategoryBreakdown transactions={txs as never} />);

        // Total should be 350
        expect(screen.getByText('סה״כ ₪350')).toBeInTheDocument();

        // Categories should appear
        expect(screen.getByText('אוכל')).toBeInTheDocument();
        expect(screen.getByText('דלק')).toBeInTheDocument();

        // Amounts
        expect(screen.getByText('₪150')).toBeInTheDocument(); // Food
        expect(screen.getByText('₪200')).toBeInTheDocument(); // Gas
    });

    it('calls onCategorySelect when a category is clicked', () => {
        const txs = [{ id: '1', amount: 100, category: 'אוכל', date: '2026-02-01' }];
        const onSelect = vi.fn();

        render(<CategoryBreakdown transactions={txs as never} onCategorySelect={onSelect} />);

        fireEvent.click(screen.getByText('אוכל'));
        expect(onSelect).toHaveBeenCalledWith('אוכל');
    });

    it.skip('shows transactions list when a category is selected', () => {
        const txs = [{ id: '1', amount: 100, category: 'אוכל', description: 'AmPm', date: '2026-02-01' }];

        render(<CategoryBreakdown transactions={txs as never} selectedCategory="אוכל" />);

        expect(screen.getByText('הוצאות בקטגוריית אוכל (1)')).toBeInTheDocument();
        expect(screen.getByText('AmPm')).toBeInTheDocument();
        expect(screen.getByText('₪100')).toBeInTheDocument();
    });
});
