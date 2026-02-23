import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Radix uses ResizeObserver which fails in basic jsdom
beforeAll(() => {
    // @ts-ignore
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
});

describe('Popover', () => {
    it('opens and renders correctly', async () => {
        render(
            <Popover>
                <PopoverTrigger>Open Menu</PopoverTrigger>
                <PopoverContent>
                    Place content for the popover here.
                </PopoverContent>
            </Popover>
        );

        expect(screen.queryByText('Place content for the popover here.')).not.toBeInTheDocument();

        // Click trigger
        fireEvent.click(screen.getByText('Open Menu'));

        await waitFor(() => {
            expect(screen.getByText('Place content for the popover here.')).toBeVisible();
        });
    });
});
