import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RebalancingCoach } from '@/components/RebalancingCoach';

describe('RebalancingCoach', () => {
    it('returns null if total wealth is 0', () => {
        const { container } = render(<RebalancingCoach assets={[]} totalWealth={0} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders and identifies when portfolio needs rebalancing', () => {
        const assets: any[] = [
            { type: 'stock', investment_type: 'none', current_amount: 80000 },
            { type: 'cash', investment_type: 'none', current_amount: 20000 },
        ];

        // Target: stocks 40%, cash 25%, etc...
        // Current: stocks 80%, cash 20%
        // Diff for stocks is > 10% (80 - 40 = +40%) -> needs rebalancing

        render(<RebalancingCoach assets={assets} totalWealth={100000} />);

        expect(screen.getByText('מנטור איזון תיק')).toBeInTheDocument();
        expect(screen.getByText('דורש תשומת לב')).toBeInTheDocument();
    });

    it('identifies when portfolio is well balanced', () => {
        const assets: any[] = [
            { type: 'stock', investment_type: 'none', current_amount: 40000 }, // 40%
            { type: 'cash', investment_type: 'none', current_amount: 25000 }, // 25%
            { type: 'investment', investment_type: 'real_estate', current_amount: 20000 }, // 20%
            { type: 'investment', investment_type: 'crypto', current_amount: 10000 }, // 10%
            { type: 'other', investment_type: 'none', current_amount: 5000 }, // 5%
        ];

        render(<RebalancingCoach assets={assets} totalWealth={100000} />);

        expect(screen.getByText('מצוין')).toBeInTheDocument();
        expect(screen.getByText('התיק מאוזן היטב!')).toBeInTheDocument();
    });
});
