import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer';

// Vaul Drawer uses MatchMedia internally which might not be mocked in JSDOM natively
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // Deprecated
            removeListener: vi.fn(), // Deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

describe('Drawer', () => {
    it.skip('opens and closes drawer content', async () => {
        render(
            <Drawer>
                <DrawerTrigger>Open Drawer</DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                        <DrawerDescription>This action cannot be undone.</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <DrawerClose>Cancel</DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );

        expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument();

        // Open Dialog
        fireEvent.click(screen.getByText('Open Drawer'));

        // Verify Content
        await waitFor(() => {
            expect(screen.getByText('Are you absolutely sure?')).toBeVisible();
        });

        // Click Cancel
        fireEvent.click(screen.getByText('Cancel'));

        // Verify Closed
        await waitFor(() => {
            expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument();
        });
    });
});
