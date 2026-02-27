import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AddTransactionDrawer } from '@/components/AddTransactionDrawer';
import { useAuth } from '@/components/AuthProvider';
import { useAppStore } from '@/stores/appStore';
import { useDeepFreeze } from '@/hooks/useDeepFreeze';
import { Transaction } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

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
    triggerHaptic: vi.fn(),
    hapticForAmount: vi.fn(),
    hapticError: vi.fn(),
}));
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

const thenableSelect = (data: unknown) => ({
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error: null }),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve({ data, error: null }).then(resolve, reject),
});

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockImplementation(() => ({
            upsert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockImplementation(() => thenableSelect([{ id: '1' }])),
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
    constructor(type: string, props: PointerEventInit) {
        super(type, props);
    }
} as unknown as typeof PointerEvent;

describe('AddTransactionDrawer', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockCheckTransaction = vi.fn().mockReturnValue(false); // return true if frozen
    const wrapper = ({ children }: { children: ReactNode }) => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as unknown as Mock).mockReturnValue({
            user: { id: '123' },
            profile: { couple_id: '456' }
        });
        (useAppStore as unknown as Mock).mockReturnValue({
            appIdentity: 'him'
        });
        (useDeepFreeze as unknown as Mock).mockReturnValue({
            isFreezeDialogOpen: false,
            checkTransaction: mockCheckTransaction,
            handleFreeze: vi.fn(),
            handleBuyAnyway: vi.fn(),
            closeDialog: vi.fn()
        });
    });

    it('renders drawer content when open', () => {
        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />, { wrapper });
        expect(screen.getByText('הוספת הוצאה')).toBeInTheDocument();
        expect(screen.getByText('סכום ההוצאה')).toBeInTheDocument();
    });

    it('handles keypad entry and submit', async () => {
        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />, { wrapper });

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
        const initialData: Partial<Transaction> = {
            id: '1',
            type: 'expense',
            amount: 250,
            description: 'Lunch',
            category: 'מסעדה',
            payer: 'her',
            date: '2025-01-01T00:00:00Z',
            mood_rating: 4
        };

        render(<AddTransactionDrawer isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} initialData={initialData as Transaction} />, { wrapper });

        expect(screen.getByText('עריכת הוצאה')).toBeInTheDocument();
        // Displays amount
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Lunch')).toBeInTheDocument();
    });
});
