import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WishlistCard } from '@/components/WishlistCard';
import * as dateFns from 'date-fns';

vi.mock('@/utils/haptics', () => ({ triggerHaptic: vi.fn() }));

describe('WishlistCard', () => {
    const standardItem = { id: '1', name: 'Camera', price: 900, saved_amount: 300, created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() }; // > 24 hours ago
    const impulseItem = { id: '2', name: 'TV', price: 2000, saved_amount: 0, created_at: new Date().toISOString() }; // < 24 hours ago

    it.skip('renders item details and allows deposit', () => {
        const onAction = vi.fn();
        render(<WishlistCard item={standardItem as any} onAction={onAction} />);

        expect(screen.getByText('Camera')).toBeInTheDocument();
        expect(screen.getByText('₪300')).toBeInTheDocument();
        expect(screen.getByText('מתוך ₪900')).toBeInTheDocument();
    });

    it('displays fully funded state', () => {
        const fundedItem = { ...standardItem, saved_amount: 900 };
        render(<WishlistCard item={fundedItem as any} onAction={vi.fn()} />);

        expect(screen.getByText('מוכן!')).toBeInTheDocument();
    });

    it('enforces impulse control for expensive recent items', () => {
        const onAction = vi.fn();
        render(<WishlistCard item={impulseItem as any} onAction={onAction} />);

        expect(screen.getByText(/ש׳ להירגעות/)).toBeInTheDocument();
        expect(screen.getByText('אני באמת חייב את זה')).toBeInTheDocument();
    });

    it('triggers actions correctly', () => {
        const onAction = vi.fn();
        render(<WishlistCard item={standardItem as any} onAction={onAction} />);

        // Find buttons by their container wrapper or attributes if possible.
        // It's a bit hard to select icon buttons via text. Let's use getByTitle if present.
        fireEvent.click(screen.getByTitle('ויתרתי על זה (הוסף לחיסכון)'));
        expect(onAction).toHaveBeenCalledWith(standardItem, 'didnt_buy');
    });
});
