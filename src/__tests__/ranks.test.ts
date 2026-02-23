import { describe, it, expect } from 'vitest';
import { getRank, RANKS } from '@/lib/ranks';

describe('getRank', () => {
    it('returns first rank for zero net worth', () => {
        const result = getRank(0);
        expect(result.currentRank.id).toBe('apprentice');
        expect(result.nextRank?.id).toBe('saver');
        expect(result.progress).toBe(0);
    });

    it('handles negative net worth gracefully', () => {
        const result = getRank(-5000);
        expect(result.currentRank.id).toBe('apprentice');
        expect(result.progress).toBe(0);
        expect(result.remaining).toBe(15000);
    });

    it('returns saver rank for 15,000', () => {
        const result = getRank(15000);
        expect(result.currentRank.id).toBe('saver');
        expect(result.nextRank?.id).toBe('investor');
    });

    it('returns investor rank for 75,000', () => {
        const result = getRank(75000);
        expect(result.currentRank.id).toBe('investor');
        expect(result.nextRank?.id).toBe('builder');
    });

    it('returns builder rank for 200,000', () => {
        const result = getRank(200000);
        expect(result.currentRank.id).toBe('builder');
    });

    it('returns tycoon rank for 600,000', () => {
        const result = getRank(600000);
        expect(result.currentRank.id).toBe('tycoon');
    });

    it('returns unicorn rank for 1,500,000', () => {
        const result = getRank(1500000);
        expect(result.currentRank.id).toBe('unicorn');
        expect(result.nextRank).toBeNull();
        expect(result.progress).toBe(100);
    });

    it('calculates progress correctly within a rank', () => {
        // Between saver (10,000) and investor (50,000), at 30,000
        // Progress = (30000 - 10000) / (50000 - 10000) = 20000/40000 = 50%
        const result = getRank(30000);
        expect(result.currentRank.id).toBe('saver');
        expect(result.progress).toBe(50);
        expect(result.remaining).toBe(20000);
    });

    it('has all ranks in ascending wealth order', () => {
        for (let i = 1; i < RANKS.length; i++) {
            expect(RANKS[i].minWealth).toBeGreaterThan(RANKS[i - 1].minWealth);
        }
    });
});
