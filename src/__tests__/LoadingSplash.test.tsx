import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadingSplash } from '@/components/LoadingSplash';

describe('LoadingSplash', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders initially and title is visible', () => {
        render(<LoadingSplash />);
        expect(screen.getByText('OurGlass')).toBeInTheDocument();
        expect(screen.getByText('Initializing Secure Uplink...')).toBeInTheDocument();
    });

    it('calls onComplete and unmounts after 2.5 seconds', () => {
        const onComplete = vi.fn();
        const { container } = render(<LoadingSplash onComplete={onComplete} />);

        expect(screen.getByText('OurGlass')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(container).toBeEmptyDOMElement();
    });
});
