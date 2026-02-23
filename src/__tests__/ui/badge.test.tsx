import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
    it('renders with default variant', () => {
        render(<Badge>Default Badge</Badge>);
        // Since Badge doesn't have an inherent role by default other than generic phrasing, we'll query by Text
        const badge = screen.getByText('Default Badge');

        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-primary');
        expect(badge).toHaveClass('text-primary-foreground');
    });

    it('applies destructive variant styles', () => {
        render(<Badge variant="destructive">Error Box</Badge>);
        const badge = screen.getByText('Error Box');

        expect(badge).toHaveClass('bg-destructive');
        expect(badge).toHaveClass('text-white');
    });

    it('supports asChild pattern via Radix Slot', () => {
        render(
            <Badge asChild>
                <a href="/tags/important">Important Link</a>
            </Badge>
        );

        const link = screen.getByRole('link', { name: 'Important Link' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/tags/important');
        expect(link).toHaveClass('bg-primary'); // Should have badge styling
        expect(link.tagName.toLowerCase()).toBe('a');
    });

    it('merges custom className correctly', () => {
        render(<Badge className="custom-badge-prop">Testing</Badge>);
        const badge = screen.getByText('Testing');
        expect(badge).toHaveClass('custom-badge-prop');
    });
});
