import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import ErrorPage from '@/app/error';

beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    vi.restoreAllMocks();
});

describe('App Error Page', () => {
    it('renders error message and reset button', () => {
        const mockError = new Error('Fatal crash');
        const mockReset = vi.fn();

        render(<ErrorPage error={mockError} reset={mockReset} />);

        expect(screen.getByText('אופס! משהו השתבש')).toBeInTheDocument();
        expect(screen.getByText('נסה שוב')).toBeInTheDocument();
    });

    it('calls reset function when button is clicked', () => {
        const mockError = new Error('Fatal crash');
        const mockReset = vi.fn();

        render(<ErrorPage error={mockError} reset={mockReset} />);

        fireEvent.click(screen.getByRole('button', { name: 'נסה שוב' }));
        expect(mockReset).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(mockError);
    });
});
