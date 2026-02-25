import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeepFreezeDialog } from '@/components/DeepFreezeDialog';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

describe('DeepFreezeDialog', () => {
    it('renders correctly when open', () => {
        render(
            <DeepFreezeDialog
                isOpen={true}
                amount={850}
                itemName="Sony Headphones"
                onFreeze={vi.fn()}
                onBuyAnyway={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByText(`רגע, זה ${CURRENCY_SYMBOL}850! 🥶`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /כן, תקפיא לי/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: new RegExp('לא, ' + PAYERS.HIM + ' חייב', 'i') })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(
            <DeepFreezeDialog
                isOpen={false}
                amount={850}
                itemName="Sony Headphones"
                onFreeze={vi.fn()}
                onBuyAnyway={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByText(/${CURRENCY_SYMBOL}850/)).not.toBeInTheDocument();
    });

    it('calls onFreeze when freeze button clicked', () => {
        const onFreeze = vi.fn();
        render(
            <DeepFreezeDialog
                isOpen={true}
                amount={850}
                itemName="Sony"
                onFreeze={onFreeze}
                onBuyAnyway={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /כן, תקפיא לי/i }));
        expect(onFreeze).toHaveBeenCalledTimes(1);
    });

    it('calls onBuyAnyway when buy button clicked', () => {
        const onBuyAnyway = vi.fn();
        render(
            <DeepFreezeDialog
                isOpen={true}
                amount={850}
                itemName="Sony"
                onFreeze={vi.fn()}
                onBuyAnyway={onBuyAnyway}
                onCancel={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: new RegExp('לא, ' + PAYERS.HIM + ' חייב', 'i') }));
        expect(onBuyAnyway).toHaveBeenCalledTimes(1);
    });
});
