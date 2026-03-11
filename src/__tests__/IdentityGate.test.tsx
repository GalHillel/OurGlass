import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityGate } from '@/components/IdentityGate';
import { PAYERS} from "@/lib/constants";

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

    it('renders children directly if NOT logged in', async () => {
        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);
        expect(await screen.findByTestId('child')).toBeInTheDocument();
        expect(screen.queryByText('מי משתמש באפליקציה?')).not.toBeInTheDocument();
    });

    it('renders identity selector if logged in but NO identity chosen', async () => {
        mockUser = { id: '123' };

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        expect(await screen.findByText('מי משתמש באפליקציה?')).toBeInTheDocument();
        expect(screen.getByText(PAYERS.HIM)).toBeInTheDocument();
        expect(screen.getByText(PAYERS.HER)).toBeInTheDocument();
        expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('renders children if logged in AND identity chosen', async () => {
        mockUser = { id: '123' };
        mockIdentity = 'him';

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        expect(await screen.findByTestId('child')).toBeInTheDocument();
        expect(screen.queryByText('מי משתמש באפליקציה?')).not.toBeInTheDocument();
    });

    it('sets identity when clicked', async () => {
        mockUser = { id: '123' };

        render(<IdentityGate><div data-testid="child">Safe</div></IdentityGate>);

        fireEvent.click(await screen.findByText(PAYERS.HIM));
        expect(mockSetIdentity).toHaveBeenCalledWith('him');
    });
});