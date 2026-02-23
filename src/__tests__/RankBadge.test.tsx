import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RankBadge } from '@/components/RankBadge';
import { Trophy } from 'lucide-react';

describe('RankBadge', () => {
    const mockRank = {
        level: 1,
        name: 'Newbie',
        color: 'text-blue-500',
        icon: Trophy,
        minScore: 0
    };

    it('renders correctly without name', () => {
        const { container } = render(<RankBadge rank={mockRank} />);
        expect(container.querySelector('.text-blue-500')).toBeInTheDocument(); // color applied
        expect(screen.queryByText('Newbie')).not.toBeInTheDocument();
    });

    it('renders with name', () => {
        render(<RankBadge rank={mockRank} showName={true} />);
        expect(screen.getByText('Newbie')).toBeInTheDocument();
    });
});
