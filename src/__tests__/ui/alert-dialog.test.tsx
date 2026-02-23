import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

describe('AlertDialog', () => {
    it('opens and actions work correctly', async () => {
        render(
            <AlertDialog>
                <AlertDialogTrigger>Delete Account</AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );

        expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument();

        // Open Dialog
        fireEvent.click(screen.getByText('Delete Account'));

        // Verify Content
        await waitFor(() => {
            expect(screen.getByText('Are you absolutely sure?')).toBeVisible();
            expect(screen.getByText('This action cannot be undone.')).toBeVisible();
        });

        // Click Cancel
        fireEvent.click(screen.getByText('Cancel'));

        // Verify Closed
        await waitFor(() => {
            expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument();
        });
    });
});
