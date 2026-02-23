import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WishlistActionDrawer } from '@/components/WishlistActionDrawer';

vi.mock('@/utils/haptics', () => ({ triggerHaptic: vi.fn() }));

vi.mock('vaul', () => ({
    Drawer: {
        Root: ({ children, open }: any) => open ? <div>{children}</div> : null,
        Portal: ({ children }: any) => <div>{children}</div>,
        Overlay: () => <div />,
        Content: ({ children }: any) => <div>{children}</div>,
        Title: ({ children }: any) => <h2>{children}</h2>,
        Description: ({ children }: any) => <p>{children}</p>,
    }
}));

describe('WishlistActionDrawer', () => {
    const mockItem = { id: '1', name: 'MacBook', price: 10000, saved_amount: 2000, created_at: new Date().toISOString() };

    it('renders deposit mode correctly', () => {
        const onConfirm = vi.fn();
        render(<WishlistActionDrawer isOpen={true} onClose={vi.fn()} item={mockItem as any} mode="deposit" onConfirm={onConfirm} />);

        expect(screen.getByText('הפקדה לחלום')).toBeInTheDocument();
        expect(screen.getByText('MacBook')).toBeInTheDocument();
        // missing: 8000
        expect(screen.getByText('חסרים ₪8,000')).toBeInTheDocument();
    });

    it('renders withdraw mode correctly', () => {
        const onConfirm = vi.fn();
        render(<WishlistActionDrawer isOpen={true} onClose={vi.fn()} item={mockItem as any} mode="withdraw" onConfirm={onConfirm} />);

        expect(screen.getByText('משיכה מהחיסכון')).toBeInTheDocument();
        // available for withdraw: 2000
        expect(screen.getByText('זמינים למשיכה ₪2,000')).toBeInTheDocument();
    });

    it('allows confirming amount', () => {
        const onConfirm = vi.fn();
        render(<WishlistActionDrawer isOpen={true} onClose={vi.fn()} item={mockItem as any} mode="deposit" onConfirm={onConfirm} />);

        const input = screen.getByPlaceholderText('0');
        fireEvent.change(input, { target: { value: '150' } });

        fireEvent.click(screen.getByText(/הפקד ₪150/));

        expect(onConfirm).toHaveBeenCalledWith(mockItem, 150);
    });
});
