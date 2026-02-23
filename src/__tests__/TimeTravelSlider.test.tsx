import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeTravelSlider } from '@/components/TimeTravelSlider';

vi.mock('@/utils/haptics', () => ({ triggerHaptic: vi.fn() }));

describe('TimeTravelSlider', () => {
    it('renders slider and handles clicks', () => {
        const mockChange = vi.fn();
        const currentDate = new Date();

        render(<TimeTravelSlider currentDate={currentDate} onDateChange={mockChange} />);

        expect(screen.getByText('הווה')).toBeInTheDocument();

        fireEvent.click(screen.getByText('הווה'));
        expect(mockChange).toHaveBeenCalled();
    });
});
