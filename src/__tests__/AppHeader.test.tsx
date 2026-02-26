import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppHeader } from '@/components/AppHeader';
import { Home } from 'lucide-react';
import * as hooks from '@/hooks/useJointFinance';

vi.mock('@/hooks/useJointFinance');

describe('AppHeader', () => {
    beforeEach(() => {
        document.body.className = '';
        vi.spyOn(hooks, 'useGlobalCashflow').mockReturnValue({
            data: {
                budget: 10000,
                totalSpent: 5000,
                balance: 5000,
                daysRemaining: 15,
                dailyBudget: 333,
                actualDailySpend: 333,
                status: 'safe'
            },
            isLoading: false
        } as unknown as ReturnType<typeof hooks.useGlobalCashflow>);
    });

    it('renders title and icon', () => {
        render(<AppHeader title="Dashboard" icon={Home} />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        // Since it's an SVG, we check for button wrapping it
        expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
    });

    it('renders subtitle if provided', () => {
        render(<AppHeader title="Dashboard" subtitle="Test Sub" icon={Home} />);

        expect(screen.getByText('Test Sub')).toBeInTheDocument();
    });

    it('toggles zen mode on body class', () => {
        render(<AppHeader title="Dashboard" icon={Home} />);
        const zenButton = screen.getByRole('button', { name: 'Zen Mode' });

        expect(document.body.classList.contains('zen-mode')).toBe(false);
        fireEvent.click(zenButton);
        expect(document.body.classList.contains('zen-mode')).toBe(true);

        fireEvent.click(zenButton);
        expect(document.body.classList.contains('zen-mode')).toBe(false);
    });

    it('calls onIconClick when left icon is clicked', () => {
        const onClick = vi.fn();
        render(<AppHeader title="Clickable" icon={Home} onIconClick={onClick} />);

        // The first button in the component is the icon button
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
