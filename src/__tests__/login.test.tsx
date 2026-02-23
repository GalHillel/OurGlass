import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/app/login/page';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() })
}));

const mockSignInWithPassword = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
            getSession: mockGetSession
        }
    })
}));

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue({ data: { session: null } });
    });

    it.skip('renders loading splash initially', () => {
        // Suppress act warnings for this quick render check
        const originalError = console.error;
        console.error = vi.fn();

        render(<LoginPage />);
        expect(screen.getByTestId('loading-splash')).toBeInTheDocument();

        console.error = originalError;
    });

    it.skip('shows error if no credentials', async () => {
        const originalEnv = process.env;
        process.env = { ...originalEnv, NEXT_PUBLIC_AUTO_EMAIL: '', NEXT_PUBLIC_AUTO_PASSWORD: '' };

        render(<LoginPage />);

        await waitFor(() => {
            expect(screen.getByText('שגיאה בהתחברות')).toBeInTheDocument();
        });

        process.env = originalEnv;
    });
});
