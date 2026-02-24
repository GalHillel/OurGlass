import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskAnalysisCard } from '@/components/RiskAnalysisCard';
import { Goal } from '@/types';

describe('RiskAnalysisCard', () => {
    it('returns null if total wealth is 0', () => {
        const { container } = render(<RiskAnalysisCard investments={[]} totalWealth={0} cash={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it.skip('identifies high crypto risk', () => {
        const investments = [
            {
                id: '1',
                name: 'Bitcoin',
                type: 'crypto' as const,
                current_amount: 30000,
                target_amount: 30000,
                growth_rate: 0,
                couple_id: 'c1',
                deep_freeze: false,
                created_at: new Date().toISOString(),
                brick_color: null
            },
            {
                id: '2',
                name: 'AAPL',
                type: 'stock',
                current_amount: 30000,
                target_amount: 30000,
                growth_rate: 0,
                couple_id: 'c1',
                deep_freeze: false,
                created_at: new Date().toISOString(),
                brick_color: null
            },
        ];

        render(<RiskAnalysisCard investments={investments as Goal[]} totalWealth={100000} cash={10000} />);

        expect(screen.getByText('סיכון גבוה')).toBeInTheDocument();
        expect(screen.getByText(/חשיפה גבוהה לקריפטו/)).toBeInTheDocument();
    });

    it('identifies cash drag risk', () => {
        const investments = [
            {
                id: '3',
                name: 'AAPL',
                type: 'stock' as const,
                current_amount: 40000,
                target_amount: 40000,
                growth_rate: 0,
                couple_id: 'c1',
                deep_freeze: false,
                created_at: new Date().toISOString(),
                brick_color: null
            }
        ];

        render(<RiskAnalysisCard investments={investments as Goal[]} totalWealth={100000} cash={50000} />); // 50% cash

        // Could be medium if cash drag is only warning
        expect(screen.getByText('שים לב')).toBeInTheDocument();
        expect(screen.getByText(/יותר מדי מזומן/)).toBeInTheDocument();
    });

    it('identifies concentration risk', () => {
        const investments = [
            {
                id: '4',
                name: 'AAPL',
                type: 'stock' as const,
                current_amount: 80000,
                target_amount: 80000,
                growth_rate: 0,
                couple_id: 'c1',
                deep_freeze: false,
                created_at: new Date().toISOString(),
                brick_color: null
            }
        ];

        render(<RiskAnalysisCard investments={investments as Goal[]} totalWealth={100000} cash={10000} />);

        expect(screen.getByText('שים לב')).toBeInTheDocument();
        expect(screen.getByText(/תלות גבוהה בנכס בודד: AAPL/)).toBeInTheDocument();
    });
});
