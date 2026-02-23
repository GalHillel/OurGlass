import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from '@/components/ui/input';

describe('Input', () => {
    it('renders correctly as a text input by default', () => {
        render(<Input placeholder="Enter text" />);
        const input = screen.getByPlaceholderText('Enter text');

        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('border-input');
    });

    it('handles typing and updates value correctly', () => {
        render(<Input placeholder="Type here" />);
        const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'Hello World' } });
        expect(input.value).toBe('Hello World');
    });

    it('applies right LTR styling dynamically for number types', () => {
        render(<Input type="number" placeholder="123" />);
        const input = screen.getByPlaceholderText('123');

        // Ensure numbers are always LTR for correct rendering in RTL languages (Hebrew context)
        expect(input).toHaveStyle({ direction: 'ltr' });
    });

    it('does not apply LTR styling for non-number types', () => {
        render(<Input type="text" placeholder="text" />);
        const input = screen.getByPlaceholderText('text');

        expect(input).not.toHaveStyle({ direction: 'ltr' });
    });

    it('merges custom className correctly', () => {
        render(<Input placeholder="merging" className="custom-input-class" />);
        const input = screen.getByPlaceholderText('merging');

        expect(input).toHaveClass('custom-input-class');
        expect(input).toHaveClass('h-9'); // Base class should remain
    });
});
