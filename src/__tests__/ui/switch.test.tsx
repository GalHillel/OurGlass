import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
    it('renders unchecked by default', () => {
        render(<Switch aria-label="Toggle setting" />);
        const switchBtn = screen.getByRole('switch', { name: 'Toggle setting' });

        expect(switchBtn).toBeInTheDocument();
        expect(switchBtn).toHaveAttribute('data-state', 'unchecked');
    });

    it('renders checked when defaultChecked is true', () => {
        render(<Switch aria-label="Toggle setting" defaultChecked />);
        const switchBtn = screen.getByRole('switch', { name: 'Toggle setting' });

        expect(switchBtn).toHaveAttribute('data-state', 'checked');
    });

    it('toggles state on click', () => {
        const onCheckedChange = vi.fn();
        render(<Switch aria-label="Toggle setting" onCheckedChange={onCheckedChange} />);
        const switchBtn = screen.getByRole('switch', { name: 'Toggle setting' });

        fireEvent.click(switchBtn);

        expect(switchBtn).toHaveAttribute('data-state', 'checked');
        expect(onCheckedChange).toHaveBeenCalledWith(true);

        fireEvent.click(switchBtn);

        expect(switchBtn).toHaveAttribute('data-state', 'unchecked');
        expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('can be disabled', () => {
        render(<Switch aria-label="Toggle setting" disabled />);
        const switchBtn = screen.getByRole('switch', { name: 'Toggle setting' });

        expect(switchBtn).toBeDisabled();
    });
});
