import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DividendForecast } from '@/components/DividendForecast';


describe('DividendForecast', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Mock random to be predictable (0.1 means no random dividends)
        mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    });

    afterEach(() => {
        mathRandomSpy.mockRestore();
    });

    it('renders empty state when no assets', () => {
        render(<DividendForecast assets={[]} />);
        expect(screen.getByText('צפי דיבידנדים')).toBeInTheDocument();
        expect(screen.getByText('אין דיבידנדים צפויים בקרוב')).toBeInTheDocument();
    });

    it.skip('identifies dividend paying stocks based on names', () => {
        const assets = [
            { id: '1', name: 'Apple Inc.', type: 'stock', current_amount: 10000, profile_id: '1', created_at: '' },
            { id: '2', name: 'Bitcoin', type: 'crypto', current_amount: 5000, profile_id: '1', created_at: '' }, // Should be ignored (wrong type)
            { id: '3', name: 'Random Corp', type: 'stock', current_amount: 5000, profile_id: '1', created_at: '' }, // Ignored due to mocked random
        ];

        render(<DividendForecast assets={assets as never} />);

        // Apple should give 50$ (0.5% of 10000)
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
        expect(screen.getByText('+$50')).toBeInTheDocument();
        expect(screen.queryByText('Random Corp')).not.toBeInTheDocument();
    });

    it('calculates total forecast correctly', () => {
        const assets = [
            { id: '1', name: 'Apple Inc.', type: 'stock', current_amount: 10000, profile_id: '1', created_at: '' }, // 50
            { id: '2', name: 'Microsoft ETF', type: 'stock', current_amount: 20000, profile_id: '1', created_at: '' }, // 100
        ];

        render(<DividendForecast assets={assets as never} />);

        expect(screen.getByText('סה״כ צפוי ברבעון: $150')).toBeInTheDocument();
    });
});
