import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityGate } from '@/components/IdentityGate';

// Mock dependencies
const mockSetIdentity = vi.fn();
let mockUser: { id: string } | null = null;
let mockIdentity: string | null = null;

vi.mock('@/components/AuthProvider', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: false,
    }),
}));

vi.mock('@/stores/appStore', () => ({
    useAppStore: () => ({
        appIdentity: mockIdentity,
        setAppIdentity: mockSetIdentity,
    }),
}));

vi.mock('@/utils/haptics', () => ({
    hapticSuccess: vi.fn(),
}));

describe('IdentityGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUser = null;
        mockIdentity = null;
    });

    it('renders children directly if NOT logged in', () => {
        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.queryByText('מי משתמש באפליקציה?')).not.toBeInTheDocument();
    });

    it('renders identity selector if logged in but NO identity chosen', () => {
        mockUser = { id: '123' };

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        expect(screen.getByText('מי משתמש באפליקציה?')).toBeInTheDocument();
        expect(screen.getByText('גל')).toBeInTheDocument();
        expect(screen.getByText('איריס')).toBeInTheDocument();
        expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('renders children if logged in AND identity chosen', () => {
        mockUser = { id: '123' };
        mockIdentity = 'him';

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.queryByText('מי משתמש באפליקציה?')).not.toBeInTheDocument();
    });

    it('sets identity when clicked', () => {
        mockUser = { id: '123' };

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        fireEvent.click(screen.getByText('גל'));
        expect(mockSetIdentity).toHaveBeenCalledWith('him');
    });
});
