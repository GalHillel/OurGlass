import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

describe('PWAInstallPrompt', () => {
    const originalNavigator = window.navigator;

    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        // Default: Mock standalone false
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not render if not iOS', () => {
        Object.defineProperty(window, 'navigator', {
            configurable: true,
            value: { ...originalNavigator, userAgent: 'Android' }
        });

        const { container } = render(<PWAInstallPrompt />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders on iOS if not standalone after delay', async () => {
        Object.defineProperty(window, 'navigator', {
            configurable: true,
            value: { ...originalNavigator, userAgent: 'iPhone' }
        });

        render(<PWAInstallPrompt />);

        expect(screen.queryByText('להתקין כאפליקציה למסך הבית')).not.toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(3500);
        });

        expect(screen.getByText('להתקין כאפליקציה למסך הבית')).toBeInTheDocument();
    });

    it('does not render if already dismissed', async () => {
        Object.defineProperty(window, 'navigator', {
            configurable: true,
            value: { ...originalNavigator, userAgent: 'iPhone' }
        });
        localStorage.setItem('pwa_prompt_dismissed', 'true');

        render(<PWAInstallPrompt />);

        await act(async () => {
            vi.advanceTimersByTime(3500);
        });

        expect(screen.queryByText('להתקין כאפליקציה למסך הבית')).not.toBeInTheDocument();
    });
});
