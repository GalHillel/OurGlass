import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIChatButton } from '@/components/AIChatButton';
import { useAuth } from '@/components/AuthProvider';

// Mock all external dependencies
vi.mock('@/components/AuthProvider', () => ({
    useAuth: vi.fn()
}));
vi.mock('@/stores/appStore', () => ({
    useAppStore: vi.fn(() => ({ appIdentity: 'him' }))
}));
vi.mock('@/hooks/useWealth', () => ({
    useWealth: vi.fn(() => ({ netWorth: 300000 }))
}));
vi.mock('@/lib/constants', () => ({
    PAYERS: { HIM: 'גל', HER: 'איריס', JOINT: 'משותף' }
}));
vi.mock('@/utils/supabase/client', () => {
    const createMockQuery = () => ({
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { budget: 20000, monthly_income: 15000 } }),
        then: function (resolve: any) {
            resolve({ data: [] });
            return this;
        }
    });

    return {
        createClient: () => ({
            from: vi.fn(() => ({
                select: vi.fn(() => createMockQuery())
            }))
        })
    };
});
vi.mock('@/components/ChatInterface', () => ({
    ChatInterface: () => <div data-testid="mock-chat-interface">Chat UI</div>
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('AIChatButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        (useAuth as any).mockReturnValue({
            user: { id: '123' },
            profile: { first_name: 'Test' }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the floating button', () => {
        render(<AIChatButton />);
        // The button contains the Bot icon
        const btn = screen.getByRole('button');
        expect(btn).toBeInTheDocument();
    });

    it.skip('opens the dialog and fetches context on click', async () => {
        const { unmount } = render(<AIChatButton />);
        const btn = screen.getByRole('button');

        fireEvent.click(btn);

        // Let promises resolve before advancing timers
        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByText('מכין את ההקשר הפיננסי...')).toBeInTheDocument();
        unmount();
    });

    it('shows proactive bubble after 5 seconds', async () => {
        render(<AIChatButton />);

        // Initial state
        expect(screen.queryByText(/זיהיתי|היי|ראיתי|פנויים|ניצלת|נשארו|חיסכון|הוצאת|מנויים|סיכום|גל/)).not.toBeInTheDocument();

        // Advance time to trigger the timeout
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // fetchContext is async, so we need to wait for all its internal promises to resolve
        // Each await in fetchContext (transactions, Promise.all) needs a tick.
        await act(async () => {
            await Promise.resolve(); // trigger fetchContext
            await Promise.resolve(); // after supabase.transactions
            await Promise.resolve(); // after Promise.all
            await Promise.resolve(); // after setState
        });

        // Use a function matcher for more flexibility
        const msgRegex = /זיהיתי|היי|ראיתי|פנויים|ניצלת|נשארו|חיסכון|הוצאת|מנויים|סיכום|גל/;
        expect(screen.getByText((content) => msgRegex.test(content))).toBeInTheDocument();

        // Advance more to check hiding
        act(() => {
            vi.advanceTimersByTime(11000);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.queryByText((content) => msgRegex.test(content))).not.toBeInTheDocument();
    });
});
