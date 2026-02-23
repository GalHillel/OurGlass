import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickActions } from '@/components/QuickActions';
import { triggerHaptic } from '@/utils/haptics';

vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn()
}));

describe('QuickActions', () => {
    it('renders actions and triggers onAction', () => {
        const onAction = vi.fn();
        render(<QuickActions onAction={onAction} />);

        const foodAction = screen.getByText('אוכל');
        expect(foodAction).toBeInTheDocument();

        fireEvent.click(foodAction);

        expect(triggerHaptic).toHaveBeenCalled();
        expect(onAction).toHaveBeenCalledWith('אוכל', 'אוכל');
    });
});
