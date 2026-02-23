import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

describe('Dialog', () => {
    it('opens dialog when trigger is clicked', async () => {
        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>Make changes here.</DialogDescription>
                    </DialogHeader>
                    <div>Form goes here</div>
                    <DialogFooter>
                        <DialogClose>Save</DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );

        // Initially content is not in the document
        expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();

        // Click trigger
        fireEvent.click(screen.getByText('Open Dialog'));

        // Content becomes visible via portal/overlay
        await waitFor(() => {
            expect(screen.getByText('Edit profile')).toBeVisible();
            expect(screen.getByText('Make changes here.')).toBeVisible();
            expect(screen.getByText('Form goes here')).toBeVisible();
        });

        // Click built-in close or our custom close button
        fireEvent.click(screen.getByText('Save'));

        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByText('Edit profile')).not.toBeInTheDocument();
        });
    });
});
