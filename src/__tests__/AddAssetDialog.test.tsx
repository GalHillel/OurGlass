import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddAssetDialog } from '@/components/AddAssetDialog';
import { useAuth } from '@/components/AuthProvider';

vi.mock('@/components/AuthProvider', () => ({
    useAuth: vi.fn()
}));

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockImplementation(() => ({
            insert: mockInsert,
            update: vi.fn().mockReturnThis(),
            eq: mockUpdate
        }))
    })
}));

describe('AddAssetDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            profile: { couple_id: '123' }
        });
    });

    it('renders the dialog when open', () => {
        render(<AddAssetDialog isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        expect(screen.getByText('הוספת נכס חדש')).toBeInTheDocument();
        expect(screen.getByText('סוג הנכס')).toBeInTheDocument();
        expect(screen.getByText('שם הנכס')).toBeInTheDocument();
    });

    it('handles saving a new cash asset', async () => {
        render(<AddAssetDialog isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

        const nameInput = screen.getByPlaceholderText('לדוגמה: קרן השתלמות, טסלה...');
        const amountInputs = screen.getAllByRole('spinbutton'); // Number inputs

        fireEvent.change(nameInput, { target: { value: 'Test Asset' } });
        // The first number input is amount
        fireEvent.change(amountInputs[0], { target: { value: '1000' } });

        const saveButton = screen.getByText('שמור נכס');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalled();
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('populates initial data for editing', () => {
        const initialData = {
            id: '1',
            name: 'Existing Asset',
            current_amount: 5000,
            type: 'cash',
            investment_type: 'cash',
        };

        render(<AddAssetDialog isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} initialData={initialData as any} />);

        expect(screen.getByText('עריכת נכס')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Asset')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
    });
});
