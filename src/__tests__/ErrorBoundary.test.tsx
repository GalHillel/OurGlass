import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Safe Content</div>;
};

// Silence console.error for expected errors during tests
beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('renders default error UI when an error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('משהו השתבש')).toBeInTheDocument(); // Something went wrong
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        expect(screen.queryByText('משהו השתבש')).not.toBeInTheDocument();
    });

    it('allows resetting the error state', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('משהו השתבש')).toBeInTheDocument();

        // Rerender with a safe child
        rerender(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        // Click try again
        fireEvent.click(screen.getByRole('button', { name: 'נסו שוב' }));

        expect(screen.queryByText('משהו השתבש')).not.toBeInTheDocument();
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });
});
