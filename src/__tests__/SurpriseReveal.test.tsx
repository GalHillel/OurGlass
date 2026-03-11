import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SurpriseReveal } from '@/components/SurpriseReveal';
import { CURRENCY_SYMBOL } from "@/lib/constants";

vi.mock('@/utils/haptics', () => ({ triggerHaptic: vi.fn(), hapticSuccess: vi.fn(), hapticHeavy: vi.fn() }));

describe('SurpriseReveal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null if not a surprise', () => {
        const tx = { is_surprise: false } as never;
        const { container } = render(<SurpriseReveal transaction={tx} isRecipient={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it.skip('shows locked state if release date is in future', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);

        const tx = { is_surprise: true, surprise_reveal_date: futureDate.toISOString() } as never;
        render(<SurpriseReveal transaction={tx} isRecipient={true} />);

        expect(screen.getByText(/הפתעה! תתגלה ב-/)).toBeInTheDocument();
    });

    it('allows reveal if date is reached', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        const tx = { is_surprise: true, surprise_reveal_date: pastDate.toISOString(), amount: 500, description: 'Secret Gift' } as never;
        render(<SurpriseReveal transaction={tx} isRecipient={true} />);

        expect(screen.getByText('לחץ/י לגלות! 🎁')).toBeInTheDocument();

        // Click to reveal
        fireEvent.click(screen.getByText('לחץ/י לגלות! 🎁'));

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        // Content should be visible
        expect(screen.getByText('Secret Gift')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}500`)).toBeInTheDocument();
        expect(screen.getByText('✨ נחשף!')).toBeInTheDocument();
    });
});
