import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonthlySummary } from '@/components/MonthlySummary';

const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({ eq: () => ({ single: mockSingle }) }),
            update: () => {
                const chain = { eq: mockEq };
                mockUpdate();
                mockEq.mockReturnValue({ error: null });
                return chain;
            },
            insert: mockInsert
        })
    })
}));

vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

describe('MonthlySummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSingle.mockResolvedValue({ data: { id: 'fortress-id', current_amount: 10000 }, error: null });
        mockEq.mockResolvedValue({ error: null });
        mockInsert.mockResolvedValue({ error: null });
    });

    it('renders and handles surplus flow', async () => {
        const onRefresh = vi.fn();
        render(<MonthlySummary currentBalance={2000} onRefresh={onRefresh} />);

        // Open dialog
        fireEvent.click(screen.getByText('סגירת חודש'));

        expect(screen.getByText('כל הכבוד! נשארתם בפלוס')).toBeInTheDocument();
        expect(screen.getByText('₪2,000')).toBeInTheDocument();

        // Next step
        fireEvent.click(screen.getByText(/מה עושים עם הכסף/));

        expect(screen.getByText('המבצר המשותף')).toBeInTheDocument();

        // Action
        fireEvent.click(screen.getByText(/כן, תעביר למבצר/));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockInsert).toHaveBeenCalled();
            expect(onRefresh).toHaveBeenCalled();
        });

        expect(screen.getByText('בוצע בהצלחה!')).toBeInTheDocument();
    });

    it('renders and handles deficit flow', async () => {
        render(<MonthlySummary currentBalance={-500} onRefresh={vi.fn()} />);

        fireEvent.click(screen.getByText('סגירת חודש'));

        expect(screen.getByText('אופס... נכנסתם למינוס')).toBeInTheDocument();
        expect(screen.getByText('₪-500')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/איך מכסים את זה/));

        fireEvent.click(screen.getByText(/כסה אותנו/));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });
    });
});
