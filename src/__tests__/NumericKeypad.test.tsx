import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NumericKeypad } from '@/components/NumericKeypad';
import { triggerHaptic } from '@/utils/haptics';

vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn()
}));

describe('NumericKeypad', () => {
    it('calls onKeyPress and haptic feedback when a number is clicked', () => {
        const onKeyPress = vi.fn();
        const onDelete = vi.fn();
        render(<NumericKeypad onKeyPress={onKeyPress} onDelete={onDelete} />);

        fireEvent.click(screen.getByText('5'));

        expect(onKeyPress).toHaveBeenCalledWith('5');
        expect(triggerHaptic).toHaveBeenCalled();
    });

    it('calls onDelete and haptic feedback when delete is clicked', () => {
        const onKeyPress = vi.fn();
        const onDelete = vi.fn();
        // Render and find the delete button (no explicit text, it's an icon in a button)
        render(<NumericKeypad onKeyPress={onKeyPress} onDelete={onDelete} />);

        // We can find the button by the fact it's the last button or contains the icon, but easier to just use querySelector or find the parent button of the svg
        const buttons = screen.getAllByRole('button');
        const deleteButton = buttons[buttons.length - 1]; // Last button is delete

        fireEvent.click(deleteButton);

        expect(onDelete).toHaveBeenCalled();
        expect(triggerHaptic).toHaveBeenCalled();
    });
});
