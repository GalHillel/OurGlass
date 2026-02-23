import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from '@/components/ui/slider';

describe('Slider', () => {
    it('renders correctly with default props', () => {
        render(<Slider value={[50]} onValueChange={vi.fn()} aria-label="Progress slider" />);
        const slider = screen.getByRole('slider', { name: 'Progress slider' });

        expect(slider).toBeInTheDocument();
        expect(slider).toHaveValue('50');
    });

    it('calls onValueChange when sliding', () => {
        const onValueChange = vi.fn();
        render(<Slider value={[20]} max={100} onValueChange={onValueChange} aria-label="Progress slider" />);

        const slider = screen.getByRole('slider', { name: 'Progress slider' });
        fireEvent.change(slider, { target: { value: '75' } });

        expect(onValueChange).toHaveBeenCalledWith([75]);
    });

    it('calculates UI percentages correctly', () => {
        const { container } = render(<Slider value={[25]} max={100} onValueChange={vi.fn()} />);
        // Progress bar div
        const progressBar = container.querySelector('.bg-white.transition-all') as HTMLElement;
        expect(progressBar).toHaveStyle({ width: '25%' });

        // Thumb div
        const thumb = container.querySelector('.bg-black') as HTMLElement;
        expect(thumb).toHaveStyle({ left: 'calc(25% - 10px)' });
    });

    it('respects min, max, and step props', () => {
        render(<Slider value={[5]} min={0} max={10} step={1} onValueChange={vi.fn()} aria-label="Small range" />);
        const slider = screen.getByRole('slider', { name: 'Small range' });

        expect(slider).toHaveAttribute('max', '10');
        expect(slider).toHaveAttribute('min', '0');
        expect(slider).toHaveAttribute('step', '1');
    });

    it('always renders in LTR mode', () => {
        const { container } = render(<Slider value={[50]} onValueChange={vi.fn()} />);
        const rootDiv = container.firstChild as HTMLElement;

        expect(rootDiv).toHaveAttribute('dir', 'ltr');
    });
});
