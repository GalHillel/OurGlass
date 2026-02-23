import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmartInsights } from '@/components/SmartInsights';
import * as query from '@tanstack/react-query';

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(),
    };
});

describe('SmartInsights', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null if no transactions', () => {
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: undefined, isLoading: false, isError: false } as any);
        const { container } = render(<SmartInsights transactions={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('displays insight after delay', async () => {
        const mockInsight = { type: 'tip', text: 'Consider saving more.', action: 'Save now' };
        vi.spyOn(query, 'useQuery').mockReturnValue({ data: mockInsight, isLoading: false, isError: false } as any);

        render(<SmartInsights transactions={[{ amount: 100 } as any]} />);

        // Initially not visible (due to 2.5s delay inside component)
        expect(screen.queryByText('Consider saving more.')).not.toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.getByText('Consider saving more.')).toBeInTheDocument();
        expect(screen.getByText('Save now')).toBeInTheDocument();
    });
});
