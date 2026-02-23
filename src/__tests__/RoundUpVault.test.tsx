import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoundUpVault } from '@/components/RoundUpVault';

describe('RoundUpVault', () => {
    it('returns null if potential is under 10', () => {
        const txs = [
            { amount: 15 }, // change: 5
        ];
        const { container } = render(<RoundUpVault transactions={txs as never} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calculates round up correctly', () => {
        const txs = [
            { amount: 15 }, // change: 5 (20)
            { amount: 33 }, // change: 7 (40)
            { amount: 99 }, // change: 1 (100)
        ]; // Total change = 5+7+1 = 13

        render(<RoundUpVault transactions={txs as never} />);

        expect(screen.getByText('כספת האגורות')).toBeInTheDocument();
        expect(screen.getByText('₪13')).toBeInTheDocument();
        expect(screen.getByText(/היו לך עוד ₪13 בצד החודש!/)).toBeInTheDocument();
    });
});
