import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '@/components/ui/label';

describe('Label', () => {
    it('renders correctly', () => {
        render(<Label htmlFor="test-input">Test Label</Label>);
        const label = screen.getByText('Test Label');

        expect(label).toBeInTheDocument();
        expect(label.tagName.toLowerCase()).toBe('label');
        expect(label).toHaveAttribute('for', 'test-input');
    });

    it('applies default classes', () => {
        render(<Label>Styled Label</Label>);
        const label = screen.getByText('Styled Label');

        expect(label).toHaveClass('text-sm');
        expect(label).toHaveClass('font-medium');
    });

    it('merges custom className', () => {
        render(<Label className="custom-label">Merged</Label>);
        const label = screen.getByText('Merged');

        expect(label).toHaveClass('custom-label');
        expect(label).toHaveClass('text-sm');
    });
});
