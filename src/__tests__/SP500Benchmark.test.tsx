import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SP500Benchmark } from '@/components/SP500Benchmark';
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

describe('SP500Benchmark', () => {
    beforeEach(() => {
        vi.spyOn(hooks, 'useSP500History').mockReturnValue({ data: [], isLoading: false } as never);
    });

    it('shows loading state initially', () => {
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [], isLoading: true } as never);
        const { container } = render(<SP500Benchmark initialWealth={100000} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('returns null if insufficient snapshots', () => {
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: [{ snapshot_date: '2023-01-01', net_worth: 100000 }], isLoading: false } as never);
        const { container } = render(<SP500Benchmark initialWealth={100000} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders comparison correctly', () => {
        const mockData = [
            { snapshot_date: new Date('2022-01-01').toISOString(), net_worth: 100000 },
            { snapshot_date: new Date('2023-01-01').toISOString(), net_worth: 120000 }, // 20% > SP500 10.5%
        ];
        vi.spyOn(hooks, 'useWealthHistory').mockReturnValue({ data: mockData, isLoading: false } as never);

        render(<SP500Benchmark initialWealth={100000} />);

        expect(screen.getByText(/ביצועים מול השוק/)).toBeInTheDocument();
        expect(screen.getByText(/מנצחים את השוק/)).toBeInTheDocument();
        // 20% return
        expect(screen.getByText(/20/)).toBeInTheDocument();
    });
});
