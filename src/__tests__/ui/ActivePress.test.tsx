import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivePress } from '@/components/ui/ActivePress';

describe('ActivePress', () => {
    it('renders children correctly', () => {
        render(<ActivePress><div>Test Content</div></ActivePress>);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const onClick = vi.fn();
        render(<ActivePress onClick={onClick}>Clickable</ActivePress>);

        fireEvent.click(screen.getByText('Clickable'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled styles when disabled is true', () => {
        const { container } = render(<ActivePress disabled>Disabled Press</ActivePress>);
        const motionDiv = container.firstChild as HTMLElement;

        expect(motionDiv).toHaveClass('opacity-50');
        expect(motionDiv).toHaveClass('pointer-events-none');
    });

    it('merges custom className', () => {
        const { container } = render(<ActivePress className="custom-class">Custom</ActivePress>);
        const motionDiv = container.firstChild as HTMLElement;

        expect(motionDiv).toHaveClass('custom-class');
        expect(motionDiv).toHaveClass('cursor-pointer');
    });
});
