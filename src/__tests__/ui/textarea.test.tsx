import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
    it('renders correctly', () => {
        render(<Textarea placeholder="Type message" />);
        const textarea = screen.getByPlaceholderText('Type message');

        expect(textarea).toBeInTheDocument();
        expect(textarea.tagName.toLowerCase()).toBe('textarea');
        expect(textarea).toHaveClass('min-h-16');
    });

    it('handles typing and value updates', () => {
        render(<Textarea placeholder="Type message" />);
        const textarea = screen.getByPlaceholderText('Type message') as HTMLTextAreaElement;

        fireEvent.change(textarea, { target: { value: 'A long message\nWith new lines' } });
        expect(textarea.value).toBe('A long message\nWith new lines');
    });

    it('merges custom className', () => {
        render(<Textarea placeholder="merging" className="custom-textarea" />);
        const textarea = screen.getByPlaceholderText('merging');

        expect(textarea).toHaveClass('custom-textarea');
        expect(textarea).toHaveClass('border-input');
    });

    it('can be disabled', () => {
        render(<Textarea placeholder="Disabled" disabled />);
        const textarea = screen.getByPlaceholderText('Disabled');

        expect(textarea).toBeDisabled();
    });
});
