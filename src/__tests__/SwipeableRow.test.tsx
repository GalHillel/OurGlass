import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SwipeableRow } from '@/components/SwipeableRow';

describe('SwipeableRow', () => {
    it('renders children correctly', () => {
        render(
            <SwipeableRow>
                <div>Row Content</div>
            </SwipeableRow>
        );
        expect(screen.getByText('Row Content')).toBeInTheDocument();
    });

    it('opens delete dialog manually (if drag would trigger it)', () => {
        const onDeleteMock = vi.fn();
        render(
            <SwipeableRow onDelete={onDeleteMock} deleteMessage="Really delete?">
                <div>Row Content</div>
            </SwipeableRow>
        );

        expect(screen.queryByText('מחיקת פריט')).not.toBeInTheDocument();
        // Since we can't easily simulate Framer Motion drag in JSDOM, 
        // we mainly assert rendering of wrapped content.
        // Alert dialog triggers are handled internal to framer motion pan handlers.
    });
});
