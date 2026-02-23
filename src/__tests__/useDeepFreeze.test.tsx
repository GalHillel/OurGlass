import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeepFreeze } from '@/hooks/useDeepFreeze';

describe('useDeepFreeze', () => {
    const mockOnFreezeConfirmed = vi.fn();
    const mockOnBuyAnywayConfirmed = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useDeepFreeze({
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        expect(result.current.isFreezeDialogOpen).toBe(false);
        expect(result.current.pendingAmount).toBe(0);
        expect(result.current.pendingItemName).toBe("");
    });

    it('intercepts transactions at or above threshold', () => {
        const { result } = renderHook(() => useDeepFreeze({
            threshold: 500,
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        let isIntercepted = false;
        act(() => {
            isIntercepted = result.current.checkTransaction(500, 'New TV');
        });

        expect(isIntercepted).toBe(true);
        expect(result.current.isFreezeDialogOpen).toBe(true);
        expect(result.current.pendingAmount).toBe(500);
        expect(result.current.pendingItemName).toBe('New TV');
    });

    it('does not intercept transactions below threshold', () => {
        const { result } = renderHook(() => useDeepFreeze({
            threshold: 500,
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        let isIntercepted = false;
        act(() => {
            isIntercepted = result.current.checkTransaction(499.99, 'Groceries');
        });

        expect(isIntercepted).toBe(false);
        expect(result.current.isFreezeDialogOpen).toBe(false);
    });

    it('handles freeze confirmation', () => {
        const { result } = renderHook(() => useDeepFreeze({
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        act(() => {
            result.current.checkTransaction(1000, 'Luxury Item');
        });
        expect(result.current.isFreezeDialogOpen).toBe(true);

        act(() => {
            result.current.handleFreeze();
        });

        expect(result.current.isFreezeDialogOpen).toBe(false);
        expect(mockOnFreezeConfirmed).toHaveBeenCalledTimes(1);
        expect(mockOnBuyAnywayConfirmed).not.toHaveBeenCalled();
    });

    it('handles buy anyway confirmation', () => {
        const { result } = renderHook(() => useDeepFreeze({
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        act(() => {
            result.current.checkTransaction(1000, 'Luxury Item');
        });

        act(() => {
            result.current.handleBuyAnyway();
        });

        expect(result.current.isFreezeDialogOpen).toBe(false);
        expect(mockOnBuyAnywayConfirmed).toHaveBeenCalledTimes(1);
        expect(mockOnFreezeConfirmed).not.toHaveBeenCalled();
    });

    it('closes dialog directly via closeDialog', () => {
        const { result } = renderHook(() => useDeepFreeze({
            onFreezeConfirmed: mockOnFreezeConfirmed,
            onBuyAnywayConfirmed: mockOnBuyAnywayConfirmed
        }));

        act(() => {
            result.current.checkTransaction(800, 'Test');
        });
        expect(result.current.isFreezeDialogOpen).toBe(true);

        act(() => {
            result.current.closeDialog();
        });

        expect(result.current.isFreezeDialogOpen).toBe(false);
        expect(mockOnBuyAnywayConfirmed).not.toHaveBeenCalled();
        expect(mockOnFreezeConfirmed).not.toHaveBeenCalled();
    });
});
