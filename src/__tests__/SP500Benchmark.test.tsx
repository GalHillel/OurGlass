import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SP500Benchmark } from '@/components/SP500Benchmark';
import * as wealthData from '@/hooks/useWealthData';

vi.mock('@/hooks/useWealthData', () => ({
    useWealthHistory: vi.fn(),
    useSP500History: vi.fn(),
    isLiabilityActive: vi.fn()
}));

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        from: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [] }) }),
        channel: () => ({ on: () => ({ subscribe: vi.fn() }) })
    })
}));

// Mock recharts
vi.mock('recharts', async () => {
    return {
        LineChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
        Line: () => <div />,
        XAxis: () => <div />,
        YAxis: () => <div />,
        Tooltip: () => <div />,
        ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>
    };
});

describe('SP500Benchmark', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(wealthData.useSP500History).mockReturnValue({
            data: [
                { date: '2000-01-01', price: 1000 },
                { date: '2100-01-01', price: 2000 }
            ],
            isLoading: false
        } as unknown as ReturnType<typeof wealthData.useSP500History>);
        vi.mocked(wealthData.useWealthHistory).mockReturnValue(
            { data: [], isLoading: false } as unknown as ReturnType<typeof wealthData.useWealthHistory>
        );
    });

    it('shows loading state initially', () => {
        vi.mocked(wealthData.useWealthHistory).mockReturnValue(
            { data: [], isLoading: true } as unknown as ReturnType<typeof wealthData.useWealthHistory>
        );
        const { container } = render(<SP500Benchmark initialWealth={100000} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('returns null if insufficient snapshots', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        vi.mocked(wealthData.useWealthHistory).mockReturnValue(
            { data: [{ snapshot_date: todayStr, net_worth: 100000 }], isLoading: false } as unknown as ReturnType<typeof wealthData.useWealthHistory>
        );
        const { container } = render(<SP500Benchmark initialWealth={100000} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders comparison correctly', async () => {
        const mockData = [
            { snapshot_date: '2022-01-01', net_worth: 100000 },
            { snapshot_date: '2023-01-01', net_worth: 120000 },
        ];
        vi.mocked(wealthData.useWealthHistory).mockReturnValue(
            { data: mockData, isLoading: false } as unknown as ReturnType<typeof wealthData.useWealthHistory>
        );

        render(<SP500Benchmark initialWealth={100000} />);

        // Use more permissive matcher first to check if anything renders
        const header = screen.getByTestId('benchmark-header');
        expect(header).toBeInTheDocument();
        fireEvent.click(header);
        expect(await screen.findByTestId('wealth-return')).toBeInTheDocument();
    });
});
