import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook as rtlRenderHook } from '@testing-library/react';

// Create a custom query client for tests to prevent retry loops
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            gcTime: 0,
            staleTime: 0,
        },
    },
});

interface WrapperProps {
    children: ReactNode;
}

export function createWrapper() {
    const testQueryClient = createTestQueryClient();
    return ({ children }: WrapperProps) => (
        <QueryClientProvider client={testQueryClient}>
            {children}
        </QueryClientProvider>
    );
}

// Ensure unique query clients per hook render
export const renderReactQueryHook = <Result, Props>(
    renderCallback: (props: Props) => Result,
    options?: any
) => {
    return rtlRenderHook(renderCallback, {
        wrapper: createWrapper(),
        ...options,
    });
};
