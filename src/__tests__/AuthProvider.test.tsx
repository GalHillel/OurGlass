import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/components/AuthProvider';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getSession: mockGetSession,
            onAuthStateChange: mockOnAuthStateChange
        },
        from: (table: string) => ({
            select: mockSelect,
        })
    })
}));

beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });

    // Default to no session
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
    });
});

const TestConsumer = () => {
    const { user, profile, loading } = useAuth();
    if (loading) return <div>Loading Auth...</div>;
    if (!user) return <div>No User</div>;
    return (
        <div>
            <div>User: {user.id}</div>
            <div>Profile: {profile?.first_name || 'No Profile'}</div>
        </div>
    );
};

describe('AuthProvider', () => {
    it('provides null user initially when no session', async () => {
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByText('Loading Auth...')).toBeInTheDocument();

        // Wait for effect to settle
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByText('No User')).toBeInTheDocument();
    });

    it('fetches profile if session exists', async () => {
        const mockUser = { id: 'user123' };
        const mockProfileData = { first_name: 'Gal' };

        mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });
        mockSingle.mockResolvedValue({ data: mockProfileData });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByText('User: user123')).toBeInTheDocument();
        expect(screen.getByText('Profile: Gal')).toBeInTheDocument();
    });
});
