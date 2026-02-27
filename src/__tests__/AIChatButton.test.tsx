import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIChatButton } from '@/components/AIChatButton';
import { useAuth } from '@/components/AuthProvider';
import { useAppStore } from '@/stores/appStore';
import { useWealth } from '@/hooks/useWealth';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

vi.mock('next/navigation', () => ({
    usePathname: vi.fn(() => '/')
}));

// Mock all external dependencies
vi.mock('@/components/AuthProvider');
vi.mock('@/stores/appStore');
vi.mock('@/hooks/useWealth');
vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
            then: vi.fn().mockImplementation((res) => Promise.resolve(res({ data: [], error: null })))
        })
    })
}));
vi.mock('@/components/ChatInterface', () => ({
    ChatInterface: () => <div data-testid="mock-chat-interface">Chat UI</div>
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <button {...props}>{children}</button>,
        span: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('AIChatButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.mocked(useAuth).mockReturnValue({
            user: { id: '123' },
            profile: { id: '123', couple_id: '456', name: 'Test' },
            loading: false,
            signOut: vi.fn()
        } as unknown as ReturnType<typeof useAuth>);
        vi.mocked(useAppStore).mockReturnValue(
            { appIdentity: 'him' } as unknown as ReturnType<typeof useAppStore>
        );
        vi.mocked(useWealth).mockReturnValue(
            {
                netWorth: 300000,
                assets: [],
                loading: false,
                cashValue: 0,
                investmentsValue: 0,
                refetch: vi.fn()
            } as unknown as ReturnType<typeof useWealth>
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the floating button', () => {
        render(<AIChatButton />);
        const btn = screen.getByRole('button');
        expect(btn).toBeInTheDocument();
    });

    it('shows proactive bubble after 5 seconds', async () => {
        render(<AIChatButton />);

        // Advance time to trigger the timeout
        act(() => {
            vi.advanceTimersByTime(11000);
        });

        // Flush microtasks after timer callback
        for (let i = 0; i < 10; i++) {
            await act(async () => {
                await Promise.resolve();
            });
        }

        expect(screen.queryByText(/תובנה חכמה/)).toBeInTheDocument();

        // Bubble presence is enough for this unit test
    });
});
