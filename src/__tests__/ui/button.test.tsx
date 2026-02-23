import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
    it('renders with default variant and size', () => {
        render(<Button>Click Me</Button>);
        const btn = screen.getByRole('button', { name: 'Click Me' });

        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass('bg-primary');
        expect(btn).toHaveClass('h-9'); // default size
    });

    it('applies destructive variant styles', () => {
        render(<Button variant="destructive">Delete</Button>);
        const btn = screen.getByRole('button', { name: 'Delete' });

        expect(btn).toHaveClass('bg-destructive');
        expect(btn).toHaveClass('text-white');
    });

    it('applies large size styles', () => {
        render(<Button size="lg">Large</Button>);
        const btn = screen.getByRole('button', { name: 'Large' });

        expect(btn).toHaveClass('h-10');
    });

    it('handles clicks', () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Interactive</Button>);

        fireEvent.click(screen.getByRole('button', { name: 'Interactive' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports asChild pattern via Radix Slot', () => {
        render(
            <Button asChild>
                <a href="/test">Link Button</a>
            </Button>
        );

        const link = screen.getByRole('link', { name: 'Link Button' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/test');
        expect(link).toHaveClass('bg-primary'); // Should still have button classes
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>);
        const btn = screen.getByRole('button', { name: 'Disabled' });

        expect(btn).toBeDisabled();
    });
});
