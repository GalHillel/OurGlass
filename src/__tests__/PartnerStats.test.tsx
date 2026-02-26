import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PartnerStats } from '@/components/PartnerStats';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

describe('PartnerStats', () => {
    it('returns null if total is 0', () => {
        const { container } = render(<PartnerStats transactions={[]} subscriptions={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calculates totals correctly from transactions and subscriptions', () => {
        const transactions = [
            { payer: 'him', amount: 100 },
            { payer: 'joint', amount: 200 },
            { payer: 'her', amount: 300 }
        ];

        const subscriptions = [
            { owner: 'him', amount: 50 },
            { owner: 'joint', amount: 150 }
        ];

        render(<PartnerStats transactions={transactions as never} subscriptions={subscriptions as never} />);

        // him = 100 + 50 = 150
        // joint = 200 + 150 = 350
        // her = 300 + 0 = 300

        expect(screen.getByText(PAYERS.HIM)).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}150`)).toBeInTheDocument();

        expect(screen.getByText('משותף')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}350`)).toBeInTheDocument();

        expect(screen.getByText(PAYERS.HER)).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}300`)).toBeInTheDocument();
    });
});
