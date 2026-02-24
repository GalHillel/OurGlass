import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestsAndBadges } from '@/components/QuestsAndBadges';
import * as query from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
    };
});

describe('QuestsAndBadges', () => {
    it('renders loading state', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: undefined, isLoading: true } as never);
        render(<QuestsAndBadges transactions={[]} subscriptions={[]} liabilities={[]} balance={100} budget={1000} />);
        expect(screen.getByText('טוען אתגרים...')).toBeInTheDocument();
    });

    it('renders empty quests state', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: [], isLoading: false } as never);
        render(<QuestsAndBadges transactions={[]} subscriptions={[]} liabilities={[]} balance={100} budget={1000} />);
        expect(screen.getByText('אין אתגרים זמינים כרגע.')).toBeInTheDocument();
    });

    it.skip('renders quests and badge progress correctly', () => {
        const mockQuests = [
            { id: '1', title: 'Save Money', description: 'Do not spend today', icon: 'Star', progress: 50, completed: false, xp: 50, color: 'blue' },
            { id: '2', title: 'Budget Master', description: 'Under budget', icon: 'Trophy', progress: 100, completed: true, xp: 150, color: 'emerald' },
        ];

        vi.spyOn(query, 'useQuery').mockReturnValue({ data: mockQuests, isLoading: false } as never);
        render(<QuestsAndBadges transactions={[]} subscriptions={[]} liabilities={[]} balance={100} budget={1000} />);

        // Quests
        expect(screen.getByText('Save Money')).toBeInTheDocument();
        expect(screen.getByText('Budget Master')).toBeInTheDocument();

        // XP logic (150 XP total from completed quests) -> badge Level 2
        expect(screen.getByText('חוסך')).toBeInTheDocument();
        expect(screen.getByText('150 XP')).toBeInTheDocument();
    });
});
