import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from '@/components/ui/progress';

describe('Progress', () => {
    it('renders correctly with given value', () => {
        const { container } = render(<Progress value={45} />);

        const root = container.firstChild as HTMLElement;
        expect(root).toHaveClass('bg-secondary');

        // The indicator is inside the root, using a transform
        const indicator = root.firstChild as HTMLElement;
        expect(indicator).toHaveClass('bg-primary');
        expect(indicator).toHaveStyle({ transform: 'translateX(-55%)' }); // 100 - 45 = 55
    });

    it('handles undefined or 0 value safely', () => {
        const { container } = render(<Progress value={0} />);
        const indicator = container.firstChild?.firstChild as HTMLElement;

        expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' }); // 100 - 0 = 100
    });

    it('merges custom className to the root', () => {
        const { container } = render(<Progress value={50} className="custom-progress" />);
        const root = container.firstChild as HTMLElement;

        expect(root).toHaveClass('custom-progress');
    });
});
