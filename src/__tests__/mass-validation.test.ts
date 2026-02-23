import { describe, it, expect, vi } from 'vitest';
import { calculateBurnRate, detectSpendingAnomaly, calculateFutureWealth, getHebrewError } from '@/lib/utils';
import { getDaysRemainingInCycle } from '@/lib/billing';
import { getRank } from '@/lib/ranks';

describe('Mass Validation - Utilities', () => {
    // 100 test cases for calculateBurnRate
    const burnRateCases = Array.from({ length: 100 }, (_, i) => [
        i * 100, // balance
        (i % 30) + 1, // days remaining
        i * 10 // avg daily spend
    ]);

    describe('calculateBurnRate extensive testing', () => {
        it.each(burnRateCases)('calculates correctly for balance %i, daysLeft %i, spend %i', (balance, daysLeft, spend) => {
            const result = calculateBurnRate(balance, daysLeft, spend);
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('daysUntilZero');

            if (balance <= 0) {
                expect(result.status).toBe('critical');
                expect(result.daysUntilZero).toBe(0);
            } else if (spend <= 0) {
                expect(result.status).toBe('safe');
            }
        });
    });

    // 150 test cases for calculateFutureWealth
    const wealthCases = Array.from({ length: 150 }, (_, i) => [
        i * 1000, // currentWealth
        i * 100, // monthlySavings
        (i % 15) / 100, // annualReturnRate (0% to 14%)
        (i % 30) + 1 // years
    ]);

    describe('calculateFutureWealth extensive testing', () => {
        it.each(wealthCases)('calculates correctly for wealth %i, savings %i, rate %f, years %i', (current, savings, rate, years) => {
            const result = calculateFutureWealth(current, savings, rate, years);
            expect(result).toBeGreaterThanOrEqual(current + (savings * years * 12));
            if (rate > 0) {
                expect(result).toBeGreaterThan(current + (savings * years * 12));
            }
        });
    });

    // 100 test cases for detectSpendingAnomaly
    const anomalyCases = Array.from({ length: 100 }, (_, i) => [
        i * 50, // amount
        (i % 20) * 40 + 1 // average
    ]);

    describe('detectSpendingAnomaly extensive testing', () => {
        it.each(anomalyCases)('detects anomaly for amount %i against average %i', (amount, avg) => {
            const result = detectSpendingAnomaly(amount, avg);
            if (amount > avg * 1.5) {
                expect(result).not.toBeNull();
                expect(result?.isAnomaly).toBe(true);
            } else {
                expect(result).toBeNull();
            }
        });
    });

    // 100 test cases for getHebrewError
    const errorCodes = ['23505', 'network', 'fetch', 'null value', 'foreign key', 'constraint', 'unknown1', 'unknown2'];
    const errorCases = Array.from({ length: 100 }, (_, i) => [
        { message: errorCodes[i % errorCodes.length] }
    ]);

    describe('getHebrewError extensive testing', () => {
        it.each(errorCases)('resolves string for error message %s', (err) => {
            const result = getHebrewError(err);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(5);
        });
    });
});

describe('Mass Validation - Ranks', () => {
    // 200 test cases for getRank with varying wealth
    const rankCases = Array.from({ length: 200 }, (_, i) => [
        (i - 10) * 10000 // Test negative numbers up to 1.9M
    ]);

    describe('getRank extensive testing', () => {
        it.each(rankCases)('retrieves correct rank attributes for netWorth %i', (wealth) => {
            const result = getRank(wealth);
            expect(result).toHaveProperty('currentRank');
            expect(result).toHaveProperty('progress');
            expect(result.progress).toBeGreaterThanOrEqual(0);
            expect(result.progress).toBeLessThanOrEqual(100);

            if (wealth < 0) {
                expect(result.currentRank.id).toBe('apprentice');
            }
            if (wealth >= 1000000) {
                expect(result.currentRank.id).toBe('unicorn');
                expect(result.nextRank).toBeNull();
            }
        });
    });
});

describe('Mass Validation - Billing', () => {
    // 100 test cases for getDaysRemainingInCycle
    const billingCases = Array.from({ length: 100 }, (_, i) => [
        new Date(2026, i % 12, (i % 28) + 1).toISOString() // random current date in 2026
    ]);

    describe('getDaysRemainingInCycle extensive testing', () => {
        it.each(billingCases)('calculates days correctly for current %s', (currentDateStr) => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(currentDateStr as string));

            const result = getDaysRemainingInCycle();
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(31);

            vi.useRealTimers();
        });
    });
});
