import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiquidBackground } from '@/components/LiquidBackground';

describe('LiquidBackground', () => {
    it('renders the fixed background correctly', () => {
        const { container } = render(<LiquidBackground />);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toBeInTheDocument();
        expect(mainDiv).toHaveClass('fixed', 'inset-0', 'bg-slate-950');

        const innerDiv = mainDiv.firstChild as HTMLElement;
        expect(innerDiv).toHaveClass('absolute', 'inset-0', 'bg-gradient-to-b');
    });
});
