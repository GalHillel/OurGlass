import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PartnerStats } from '@/components/PartnerStats';

describe('PartnerStats', () => {
    it('returns null if total is 0', () => {
        const { container } = render(<PartnerStats transactions={[]} subscriptions={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calculates totals correctly from transactions and subscriptions', () => {
        const transactions: any[] = [
            { payer: 'him', amount: 100 },
            { payer: 'joint', amount: 200 },
            { payer: 'her', amount: 300 }
        ];

        const subscriptions: any[] = [
            { owner: 'him', amount: 50 },
            { owner: 'joint', amount: 150 }
        ];

        render(<PartnerStats transactions={transactions} subscriptions={subscriptions} />);

        // him = 100 + 50 = 150
        // joint = 200 + 150 = 350
        // her = 300 + 0 = 300

        expect(screen.getByText('גל')).toBeInTheDocument();
        expect(screen.getByText('₪150')).toBeInTheDocument();

        expect(screen.getByText('משותף')).toBeInTheDocument();
        expect(screen.getByText('₪350')).toBeInTheDocument();

        expect(screen.getByText('איריס')).toBeInTheDocument();
        expect(screen.getByText('₪300')).toBeInTheDocument();
    });
});
