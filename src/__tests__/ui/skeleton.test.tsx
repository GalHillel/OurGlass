import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
    it('renders correctly with animation class', () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild as HTMLElement;

        expect(skeleton).toBeInTheDocument();
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('bg-accent');
    });

    it('merges custom className', () => {
        const { container } = render(<Skeleton className="w-10 h-10 rounded-full" />);
        const skeleton = container.firstChild as HTMLElement;

        expect(skeleton).toHaveClass('w-10');
        expect(skeleton).toHaveClass('h-10');
        expect(skeleton).toHaveClass('rounded-full');
        expect(skeleton).toHaveClass('animate-pulse'); // Base class preserved
    });
});
