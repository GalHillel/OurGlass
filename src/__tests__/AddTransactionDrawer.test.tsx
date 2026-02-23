import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTransactionDrawer } from '@/components/AddTransactionDrawer';
import { useAuth } from '@/components/AuthProvider';
import { useAppStore } from '@/stores/appStore';
import { useDeepFreeze } from '@/hooks/useDeepFreeze';

vi.mock('@/components/AuthProvider', () => ({
    useAuth: vi.fn()
}));
vi.mock('@/stores/appStore', () => ({
    useAppStore: vi.fn()
}));
vi.mock('@/hooks/useDeepFreeze', () => ({
    useDeepFreeze: vi.fn()
}));
vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn()
}));
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

const mockInsert = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockImplementation(() => ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: mockInsert
        }))
    })
}));

// Mock ResizeObserver
global.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
};
global.PointerEvent = class PointerEvent extends Event {
    constructor(type: string, props: any) {
        super(type, props);
    }
} as any;

describe('AddTransactionDrawer', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCheckTransaction = vi.fn().mockReturnValue(false); // return true if frozen

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { id: '123' },
            profile: { couple_id: '456' }
        });
        (useAppStore as any).mockReturnValue({
            appIdentity: 'him'
        });
        (useDeepFreeze as any).mockReturnValue({
            isFreezeDialogOpen: false,
            checkTransaction: mockCheckTransaction,
            handleFreeze: vi.fn(),
            handleBuyAnyway: vi.fn(),
            closeDialog: vi.fn()
        });
    });

    it('renders drawer content when open', () => {
        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByText('הוספת הוצאה')).toBeInTheDocument();
        expect(screen.getByText('סכום ההוצאה')).toBeInTheDocument();
    });

    it('handles keypad entry and submit', async () => {
        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        // Find keypad number 5 and 0
        fireEvent.click(screen.getByRole('button', { name: /5/ }));
        fireEvent.click(screen.getByRole('button', { name: /0/ }));
        fireEvent.click(screen.getByRole('button', { name: /0/ }));

        // Find submit button
        const saveBtn = screen.getByText('שמור הוצאה');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockCheckTransaction).toHaveBeenCalledWith(500, 'אחר'); // Empty description falls back to selected category "אחר"
        });
    });

    it('loads initial data correctly for editing', () => {
        const initialData = {
            id: '1',
            amount: 250,
            description: 'Lunch',
            category: 'מסעדה',
            payer: 'her',
            date: '2025-01-01T00:00:00Z',
            mood_rating: 4
        };

        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} initialData={initialData as any} />);

        expect(screen.getByText('עריכת הוצאה')).toBeInTheDocument();
        // Displays amount
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Lunch')).toBeInTheDocument();
    });
});
