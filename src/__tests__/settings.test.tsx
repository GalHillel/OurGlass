import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '@/app/settings/page';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

const mockUpdateProfile = vi.fn();

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        user: { id: 'test-user', email: 'test@example.com' },
        profile: { name: 'Test User', hourly_wage: 50, budget: 10000, monthly_income: 15000 },
        updateProfile: mockUpdateProfile
    })
}));

const mockUpsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({
            upsert: mockUpsert
        }),
        auth: { signOut: vi.fn().mockResolvedValue({}) }
    })
}));

describe('Settings Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders profile data correctly', () => {
        render(<SettingsPage />);

        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('allows updating profile and shows savings potential', async () => {
        render(<SettingsPage />);

        // Potential savings logic: Income (15000) - Budget (10000) = 5000
        expect(screen.getByText(new RegExp(`\\${CURRENCY_SYMBOL}5,000`))).toBeInTheDocument();

        fireEvent.click(screen.getByText('שמור שינויים'));

        await waitFor(() => {
            expect(mockUpsert).toHaveBeenCalled();
            expect(mockUpdateProfile).toHaveBeenCalled();
        });
    });
});
