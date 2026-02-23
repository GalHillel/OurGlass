import { describe, it, expect } from 'vitest';
import {
    getCurrentBillingPeriod,
    getDaysRemainingInCycle,
    getBillingCycleProgress,
    getBillingPeriodForDate,
    filterByBillingCycle,
} from '@/lib/billing';

describe('getCurrentBillingPeriod', () => {
    it('returns a period with start before end', () => {
        const period = getCurrentBillingPeriod();
        expect(period.start.getTime()).toBeLessThan(period.end.getTime());
    });

    it('start is always on the 10th', () => {
        const period = getCurrentBillingPeriod();
        expect(period.start.getDate()).toBe(10);
    });

    it('end is always on the 10th', () => {
        const period = getCurrentBillingPeriod();
        expect(period.end.getDate()).toBe(10);
    });

    it('period is roughly 1 month long', () => {
        const period = getCurrentBillingPeriod();
        const diffDays = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThanOrEqual(28);
        expect(diffDays).toBeLessThanOrEqual(31);
    });
});

describe('getDaysRemainingInCycle', () => {
    it('returns a non-negative number', () => {
        const days = getDaysRemainingInCycle();
        expect(days).toBeGreaterThanOrEqual(0);
    });

    it('returns at most 31 days', () => {
        const days = getDaysRemainingInCycle();
        expect(days).toBeLessThanOrEqual(31);
    });
});

describe('getBillingCycleProgress', () => {
    it('returns a percentage between 0 and 100', () => {
        const progress = getBillingCycleProgress();
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
    });
});

describe('getBillingPeriodForDate', () => {
    it('returns correct period for date after 10th', () => {
        const testDate = new Date(2026, 1, 15); // Feb 15
        const period = getBillingPeriodForDate(testDate);
        expect(period.start.getDate()).toBe(10);
        expect(period.start.getMonth()).toBe(1); // Feb
        expect(period.end.getDate()).toBe(10);
        expect(period.end.getMonth()).toBe(2); // Mar
    });

    it('returns correct period for date before 10th', () => {
        const testDate = new Date(2026, 1, 5); // Feb 5
        const period = getBillingPeriodForDate(testDate);
        expect(period.start.getDate()).toBe(10);
        expect(period.start.getMonth()).toBe(0); // Jan
        expect(period.end.getDate()).toBe(10);
        expect(period.end.getMonth()).toBe(1); // Feb
    });
});

describe('filterByBillingCycle', () => {
    it('filters items correctly based on created_at', () => {
        const currentPeriod = getCurrentBillingPeriod();

        // Ensure strictly outside and inside points based on the current period
        const insideDate = new Date(currentPeriod.start.getTime() + 86400000).toISOString(); // 1 day after start
        const outsideDateBefore = new Date(currentPeriod.start.getTime() - 86400000).toISOString(); // 1 day before start
        const outsideDateAfter = new Date(currentPeriod.end.getTime() + 86400000).toISOString(); // 1 day after end

        const items = [
            { id: 1, created_at: insideDate },
            { id: 2, created_at: outsideDateBefore },
            { id: 3, created_at: outsideDateAfter },
        ];

        const filtered = filterByBillingCycle(items);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
    });

    it('filters items correctly based on date property', () => {
        const currentPeriod = getCurrentBillingPeriod();
        const insideDate = new Date(currentPeriod.start.getTime() + 86400000).toISOString();

        const items = [
            { id: 1, date: insideDate }, // Uses date instead of created_at
            { id: 2, date: new Date(currentPeriod.start.getTime() - 86400000).toISOString() },
        ];

        const filtered = filterByBillingCycle(items);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe(1);
    });

    it('handles empty arrays', () => {
        expect(filterByBillingCycle([])).toEqual([]);
    });

    it('handles items with invalid dates safely (excludes them)', () => {
        const items = [{ id: 1, created_at: 'invalid-date' }];
        expect(filterByBillingCycle(items)).toEqual([]);
    });
});

