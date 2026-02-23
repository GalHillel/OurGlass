import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PredictiveCashflow } from '@/components/PredictiveCashflow';
import * as billing from '@/lib/billing';

vi.mock('recharts', async () => {
    const ActualRecharts = await vi.importActual('recharts');
    return {
        ...ActualRecharts,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>
    };
});

describe('PredictiveCashflow', () => {
    it('renders predictive cashflow correctly', () => {
        // Mock dates so test is predictable
        vi.spyOn(billing, 'getBillingPeriodForDate').mockReturnValue({ start: new Date('2023-01-01'), end: new Date('2023-01-31') });
        vi.spyOn(billing, 'getDaysRemainingInCycle').mockReturnValue(15);

        // Prevent Date issues in components by using predictable fake timers
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-01-16'));

        const transactions: any[] = [
            { amount: 150, date: '2023-01-15' },
        ];

        const subscriptions: any[] = [
            { amount: 100, billing_day: 20, active: true },
        ];

        render(
            <PredictiveCashflow
                balance={5000}
                budget={10000}
                transactions={transactions}
                subscriptions={subscriptions}
                liabilities={[]}
            />
        );

        expect(screen.getByText('תחזית תזרים')).toBeInTheDocument();
        expect(screen.getByText('הוצאה יומית')).toBeInTheDocument();
        expect(screen.getByText('צפי סוף חודש')).toBeInTheDocument();
        expect(screen.getByText('ימים נותרו')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // Mocked remaining

        vi.useRealTimers();
    });
});
