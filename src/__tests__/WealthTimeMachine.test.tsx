import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WealthTimeMachine } from '@/components/WealthTimeMachine';

// Mock slider since radix slider might be complex to test directly without full layout
vi.mock('@/components/ui/slider', () => ({
    Slider: ({ value, onValueChange, min, max, step }: any) => (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={e => onValueChange([parseFloat(e.target.value)])}
            data-testid="mock-slider"
        />
    )
}));

describe('WealthTimeMachine', () => {
    it('opens dialog and shows initial projection', () => {
        render(<WealthTimeMachine currentNetWorth={100000} monthlySavings={5000} />);

        fireEvent.click(screen.getByText('מכונת הזמן'));

        expect(screen.getByText('סימולטור עושר עתידי')).toBeInTheDocument();
        // default 5 years, 5000 monthly, 7% rate
        // Math matches calculateFutureWealth logic
        expect(screen.getByText(/בעוד 5 שנים, השווי שלך יהיה:/)).toBeInTheDocument();
    });
});
