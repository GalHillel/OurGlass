import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskAnalysisCard } from '@/components/RiskAnalysisCard';

describe('RiskAnalysisCard', () => {
    it('returns null if total wealth is 0', () => {
        const { container } = render(<RiskAnalysisCard investments={[]} totalWealth={0} cash={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it.skip('identifies high crypto risk', () => {
        const investments = [
            { type: 'crypto', amount: 30000, name: 'Bitcoin' },
            { type: 'stock', amount: 30000, name: 'AAPL' },
        ];

        render(<RiskAnalysisCard investments={investments} totalWealth={100000} cash={10000} />);

        expect(screen.getByText('סיכון גבוה')).toBeInTheDocument();
        expect(screen.getByText(/חשיפה גבוהה לקריפטו/)).toBeInTheDocument();
    });

    it('identifies cash drag risk', () => {
        const investments = [
            { type: 'stock', amount: 40000, name: 'AAPL' }
        ];

        render(<RiskAnalysisCard investments={investments} totalWealth={100000} cash={50000} />); // 50% cash

        // Could be medium if cash drag is only warning
        expect(screen.getByText('שים לב')).toBeInTheDocument();
        expect(screen.getByText(/יותר מדי מזומן/)).toBeInTheDocument();
    });

    it('identifies concentration risk', () => {
        const investments = [
            { type: 'stock', amount: 80000, name: 'AAPL' } // 80% of total wealth in one asset
        ];

        render(<RiskAnalysisCard investments={investments} totalWealth={100000} cash={10000} />);

        expect(screen.getByText('שים לב')).toBeInTheDocument();
        expect(screen.getByText(/תלות גבוהה בנכס בודד: AAPL/)).toBeInTheDocument();
    });
});
