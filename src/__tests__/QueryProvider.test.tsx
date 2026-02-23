import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryProvider } from '@/components/QueryProvider';

describe('QueryProvider', () => {
    it('renders children correctly', () => {
        render(
            <QueryProvider>
                <div data-testid="child">Hello Query</div>
            </QueryProvider>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Hello Query')).toBeInTheDocument();
    });
});
