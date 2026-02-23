import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubscriptionKiller } from '@/components/SubscriptionKiller';

describe('SubscriptionKiller', () => {
    it('shows empty state initially', () => {
        render(<SubscriptionKiller subscriptions={[]} />);
        expect(screen.getByText('אין מנויים')).toBeInTheDocument();
    });

    it.skip('identifies duplicates and potential savings', () => {
        const subs: any[] = [
            { id: '1', name: 'Netflix', amount: 50, usage_rating: 5 },
            { id: '2', name: 'Netflix 4K', amount: 70, usage_rating: 5 }, // Duplicate prefix
            { id: '3', name: 'Spotify Free', amount: 0, usage_rating: 1 }, // Low usage
        ];

        render(<SubscriptionKiller subscriptions={subs} />);

        // Potential savings: Netflix duplicate = 70. 
        // Low usage Spotify = 0.
        // Total = 70.
        expect(screen.getByText('חיסכון אפשרי')).toBeInTheDocument();
        expect(screen.getByText('כפילות אפשרית')).toBeInTheDocument();
        expect(screen.getByText('שימוש נמוך')).toBeInTheDocument();

        // Check amount formatting (₪70)
        expect(screen.getByText(/₪70/)).toBeInTheDocument();
    });

    it('displays all clear when no issues found', () => {
        const subs: any[] = [
            { id: '1', name: 'Netflix', amount: 50, usage_rating: 5 },
            { id: '2', name: 'Spotify', amount: 20, usage_rating: 4 },
        ];

        render(<SubscriptionKiller subscriptions={subs} />);

        expect(screen.getByText('✅ כל המנויים נראים תקינים!')).toBeInTheDocument();
    });
});
