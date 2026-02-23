import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomNav } from '@/components/BottomNav';
import { triggerHaptic } from '@/utils/haptics';

// Mock routing
const mockPush = vi.fn();
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => mockPathname()
}));

vi.mock('@/utils/haptics', () => ({
    triggerHaptic: vi.fn()
}));

describe('BottomNav', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does not render on /login page', () => {
        mockPathname.mockReturnValue('/login');
        const { container } = render(<BottomNav />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders navigation items on non-login pages', () => {
        mockPathname.mockReturnValue('/');
        render(<BottomNav />);

        expect(screen.getByText('בית')).toBeInTheDocument();
        expect(screen.getByText('עושר')).toBeInTheDocument();
        expect(screen.getByText('הגדרות')).toBeInTheDocument();
    });

    it('triggers haptic and navigation on click', () => {
        mockPathname.mockReturnValue('/');
        render(<BottomNav />);

        fireEvent.click(screen.getByText('עושר')); // Click Wealth item

        expect(triggerHaptic).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/wealth');
    });

    it('highlights active item', () => {
        mockPathname.mockReturnValue('/settings');
        render(<BottomNav />);

        const activeSpan = screen.getByText('הגדרות');
        expect(activeSpan).toHaveClass('text-blue-200'); // Active state class

        const inactiveSpan = screen.getByText('בית');
        expect(inactiveSpan).not.toHaveClass('text-blue-200');
    });
});
