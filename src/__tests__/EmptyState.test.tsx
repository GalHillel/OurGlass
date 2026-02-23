import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '@/components/EmptyState';
import { AlertCircle } from 'lucide-react';

describe('EmptyState', () => {
    it('renders icon, title, and description correctly', () => {
        render(
            <EmptyState
                icon={AlertCircle}
                title="No items found"
                description="Try adding some items"
            />
        );

        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Try adding some items')).toBeInTheDocument();
    });

    it('renders action button if actionLabel and onAction are provided', () => {
        const onAction = vi.fn();
        render(
            <EmptyState
                icon={AlertCircle}
                title="Empty"
                description="Desc"
                actionLabel="Add Item"
                onAction={onAction}
            />
        );

        const button = screen.getByRole('button', { name: 'Add Item' });
        expect(button).toBeInTheDocument();

        fireEvent.click(button);
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders hint when provided', () => {
        render(
            <EmptyState
                icon={AlertCircle}
                title="Empty"
                description="Desc"
                hint="You can add max 5 items."
            />
        );

        expect(screen.getByText('You can add max 5 items.')).toBeInTheDocument();
    });
});
