import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialOnboarding } from '@/components/FinancialOnboarding';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

// Mock dependencies
const mockUpdateProfile = vi.fn();
const mockSupabaseUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        user: { id: 'user-1' },
        updateProfile: mockUpdateProfile,
    }),
}));

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            update: mockSupabaseUpdate,
        })
    })
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@/utils/haptics', () => ({
    hapticSuccess: vi.fn()
}));

describe('FinancialOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabaseUpdate.mockReturnValue({ eq: mockEq });
        mockEq.mockResolvedValue({ error: null });
    });

    it.skip('navigates through steps and saves on complete', async () => {
        const onComplete = vi.fn();
        render(<FinancialOnboarding onComplete={onComplete} />);

        // Step 1: Welcome
        expect(screen.getByText('!ברוכים הבאים ל-OurGlass')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /הבא/i }));

        // Step 2: Profile
        expect(screen.getByText('מי אתם?')).toBeInTheDocument();
        const nameInput = screen.getByPlaceholderText('למשל: {PAYERS.HIM}');
        fireEvent.change(nameInput, { target: { value: 'Gal' } });

        fireEvent.click(screen.getByRole('button', { name: /הבא/i }));

        // Step 3: Budget
        expect(screen.getByText('הגדרת תקציב')).toBeInTheDocument();
        const incomeInput = screen.getByPlaceholderText('20,000');
        fireEvent.change(incomeInput, { target: { value: '25000' } });

        fireEvent.click(screen.getByRole('button', { name: /הבא/i }));

        // Step 4: Goals / Done
        expect(screen.getByText('!הכל מוכן')).toBeInTheDocument();

        // Finish
        fireEvent.click(screen.getByRole('button', { name: /בואו נתחיל!/i }));

        await waitFor(() => {
            expect(mockSupabaseUpdate).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Gal',
                monthly_income: 25000,
                onboarding_completed: true,
            }));
            expect(mockUpdateProfile).toHaveBeenCalledWith({
                name: 'Gal',
                monthly_income: 25000,
                budget: 20000 // default fallback
            });
            expect(onComplete).toHaveBeenCalled();
        });
    });
});
