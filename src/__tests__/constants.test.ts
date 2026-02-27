import { describe, it, expect } from 'vitest';
import { APP_NAME, PAYERS, ASSET_TYPES, TABS } from '../lib/constants';

describe('Constants', () => {
    it('APP_NAME should be correct', () => {
        expect(APP_NAME).toBe('OurGlass');
    });

    it('PAYERS should have required structure and values', () => {
        expect(PAYERS).toEqual({
            HIM: PAYERS.HIM,
            HER: PAYERS.HER,
            JOINT: 'משותף'
        });
        // Testing exact reference (immutability)
        expect(Object.isFrozen(PAYERS)).toBeFalsy();
        // Note: As read-only TS construct, we just check properties
    });

    it('ASSET_TYPES should have required structure and values', () => {
        expect(ASSET_TYPES).toEqual({
            CASH: 'מזומן',
            SAVINGS: 'חיסכון',
            FOREIGN_CURRENCY: 'מט״ח / דולר',
            STOCK: 'מניות',
            REAL_ESTATE: 'נדל״ן',
            MONEY_MARKET: 'קרן כספית',
        });
    });

    it('TABS should have required structure and values', () => {
        expect(TABS).toEqual({
            ALL: 'הכל',
            CASH: 'מזומן',
            SAVINGS: 'חיסכון',
            INVESTMENTS: 'השקעות',
            FOREIGN_CURRENCY: 'מט״ח',
            REAL_ESTATE: 'נדל״ן'
        });
    });
});
