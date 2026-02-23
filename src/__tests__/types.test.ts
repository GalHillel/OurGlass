import { describe, it, expect } from 'vitest';
import type {
    Transaction,
    Goal,
    Subscription,
    Asset,
    Liability
} from '@/types';

describe('Types definition', () => {
    it('validates Transaction interface properties', () => {
        // Just a compiler check
        const t: Partial<Transaction> = {
            id: '1',
            amount: 100,
            category: 'Food',
            description: 'Lunch',
            date: '2025-01-01',
            payer: 'him',
            user_id: '123',
            couple_id: '456',
            created_at: '2025-01-01'
        };
        expect(t.id).toBe('1');
    });

    it('validates Asset interface', () => {
        const a: Partial<Asset> = {
            id: '1',
            name: 'Stock',
            type: 'stock',
            current_amount: 50,
            couple_id: '456',
            created_at: '2025-01-01'
        };
        expect(a.type).toBe('stock');
    });
});
