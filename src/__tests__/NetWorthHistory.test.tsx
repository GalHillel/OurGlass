import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NetWorthHistory } from '@/components/NetWorthHistory';
import * as hooks from '@/hooks/useWealthData';

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [] }) })
    })
}));

// Mock recharts
vi.mock('recharts', async () => {
    const ActualRecharts = await vi.importActual('recharts');
    return {
        ...ActualRecharts as Record<string, unknown>,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('NetWorthHistory', () => {
    it('shows loading state', () => {
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [], isLoading: true } as never);
        const { container } = render(<NetWorthHistory />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows collapsed header with title when no data exists', () => {
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [], isLoading: false } as never);
        render(<NetWorthHistory />);
        // The collapsed accordion should show the title
        expect(screen.getByText('היסטוריית שווי')).toBeInTheDocument();
    });

    it('shows empty state message when expanded and no data exists', () => {
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [], isLoading: false } as never);
        render(<NetWorthHistory />);
        // Click to expand the accordion
        fireEvent.click(screen.getByText('היסטוריית שווי'));
        expect(screen.getByText('נתוני היסטוריה ייאספו בקרוב')).toBeInTheDocument();
    });

    it('renders chart and trend data', () => {
        const mockSnapshots = [
            { snapshot_date: new Date('2023-01-01').toISOString(), net_worth: 100000, cash_value: 0, investments_value: 0, liabilities_value: 0 },
            { snapshot_date: new Date('2023-01-02').toISOString(), net_worth: 110000, cash_value: 0, investments_value: 0, liabilities_value: 0 },
        ];
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: mockSnapshots, isLoading: false } as never);

        render(<NetWorthHistory />);
        expect(screen.getByText('היסטוריית שווי')).toBeInTheDocument();
        // (110000 - 100000) / 100000 = 10%
        expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument();
    });

    it.skip('changes period when button clicked', () => {
        const spy = vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [], isLoading: false } as never);
        render(<NetWorthHistory />);

        fireEvent.click(screen.getByText('30 יום'));
        // Checks that when clicked it triggers a re-render with the new period. The hook will be called with 30
        expect(spy).toHaveBeenCalledWith(30);
    });
});
