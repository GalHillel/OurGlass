import { describe, it, expect } from 'vitest';
import {
    calculateBurnRate,
    detectSpendingAnomaly,
    calculateFutureWealth,
    cn,
    getHebrewError
} from '@/lib/utils';

describe('cn (Tailwind class merger)', () => {
    it('merges multiple classes', () => {
        expect(cn('p-4', 'm-2')).toBe('p-4 m-2');
    });

    it('handles conditional classes', () => {
        expect(cn('p-4', true && 'text-red-500', false && 'bg-blue-500')).toBe('p-4 text-red-500');
    });

    it('merges tailwind classes properly (resolves conflicts)', () => {
        // text-red-500 should be overwritten by text-blue-500
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
    });
});

describe('getHebrewError', () => {
    it('returns default error for null/undefined', () => {
        expect(getHebrewError(null)).toBe('שגיאה לא ידועה');
        expect(getHebrewError(undefined)).toBe('שגיאה לא ידועה');
    });

    it('handles unique constraint errors', () => {
        expect(getHebrewError({ message: 'duplicate key value violates unique constraint' })).toBe('הפריט כבר קיים במערכת');
        expect(getHebrewError({ code: '23505' })).toBe('הפריט כבר קיים במערכת');
    });

    it('handles check constraint errors', () => {
        expect(getHebrewError({ message: 'violates check constraint' })).toBe('נתונים לא תקינים');
    });

    it('handles null value errors', () => {
        expect(getHebrewError({ message: 'null value in column' })).toBe('חסרים נתונים בגוף הבקשה');
    });

    it('handles foreign key errors', () => {
        expect(getHebrewError({ message: 'violates foreign key constraint' })).toBe('לא ניתן למחוק פריט זה מכיוון שהוא מקושר לנתונים אחרים');
    });

    it('handles network errors', () => {
        expect(getHebrewError({ message: 'network request failed' })).toBe('בעיית תקשורת, נסו שוב מאוחר יותר');
        expect(getHebrewError({ message: 'failed to fetch' })).toBe('בעיית תקשורת, נסו שוב מאוחר יותר');
    });

    it('returns generic error for unknown message', () => {
        expect(getHebrewError({ message: 'some weird database error' })).toBe('אירעה שגיאה בעיבוד הבקשה');
    });

    it('handles object with no message', () => {
        expect(getHebrewError({})).toBe('אירעה שגיאה בעיבוד הבקשה');
    });
});

describe('calculateBurnRate', () => {
    it('returns critical when balance is zero', () => {
        const result = calculateBurnRate(0, 15, 300);
        expect(result.status).toBe('critical');
        expect(result.daysUntilZero).toBe(0);
    });

    it('returns safe when no daily spending', () => {
        const result = calculateBurnRate(5000, 15, 0);
        expect(result.status).toBe('safe');
        expect(result.daysUntilZero).toBe(999);
        expect(result.projectedDate).toBeNull();
    });

    it('returns critical when money runs out before month ends', () => {
        // 3000 balance, 15 days remaining, spending 300/day => 10 days until zero
        const result = calculateBurnRate(3000, 15, 300);
        expect(result.status).toBe('critical');
        expect(result.daysUntilZero).toBe(10);
    });

    it('returns warning on tight margin', () => {
        // 4500 balance, 15 days remaining, spending 300/day => 15 days until zero
        const result = calculateBurnRate(4500, 15, 300);
        expect(result.status).toBe('warning');
        expect(result.daysUntilZero).toBe(15);
    });

    it('returns safe when plenty of buffer', () => {
        // 10000 balance, 10 days remaining, spending 200/day => 50 days
        const result = calculateBurnRate(10000, 10, 200);
        expect(result.status).toBe('safe');
        expect(result.daysUntilZero).toBe(50);
    });
});

describe('detectSpendingAnomaly', () => {
    it('returns null for zero category average', () => {
        expect(detectSpendingAnomaly(100, 0)).toBeNull();
    });

    it('returns null when spending is below threshold', () => {
        // 120 vs average of 100 = 20% deviation (below 50%)
        expect(detectSpendingAnomaly(120, 100)).toBeNull();
    });

    it('detects anomaly when spending exceeds 50% above average', () => {
        // 200 vs average of 100 = 100% above
        const result = detectSpendingAnomaly(200, 100);
        expect(result).not.toBeNull();
        expect(result!.isAnomaly).toBe(true);
        expect(result!.deviationPercent).toBe(100);
    });

    it('detects 60% anomaly correctly', () => {
        const result = detectSpendingAnomaly(160, 100);
        expect(result).not.toBeNull();
        expect(result!.deviationPercent).toBe(60);
    });
});

describe('calculateFutureWealth', () => {
    it('calculates compound growth with no monthly contribution', () => {
        // 100,000 at 10% for 1 year = 110,000 (annual compounding)
        const result = calculateFutureWealth(100000, 0, 0.10, 1);
        expect(result).toBe(110000);
    });

    it('calculates future value with monthly contributions', () => {
        // 0 initial, 1000/month at 7% for 10 years
        const result = calculateFutureWealth(0, 1000, 0.07, 10);
        expect(result).toBeGreaterThan(170000);
        expect(result).toBeLessThan(180000);
    });

    it('returns initial amount for zero rate and zero contributions', () => {
        const result = calculateFutureWealth(50000, 0, 0, 1);
        expect(result).toBe(50000);
    });

    it('combines lump sum and contributions', () => {
        // 50,000 initial + 2000/month at 8% for 5 years
        const result = calculateFutureWealth(50000, 2000, 0.08, 5);
        // Lump sum ≈ 74,012, Contributions ≈ 146,925 → total ≈ 220,937
        expect(result).toBeGreaterThan(210000);
        expect(result).toBeLessThan(230000);
    });
});
