"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

function RealtimeSync() {
    useRealtimeSync();
    return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 60 * 60, // 1 hour (Trust the cache absolutely)
                        gcTime: 1000 * 60 * 60 * 24, // 24 hours garbage collection
                        refetchOnMount: false, // DO NOT refetch when switching pages
                        refetchOnWindowFocus: false, // DO NOT refetch when switching apps/tabs
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <RealtimeSync />
            {children}
        </QueryClientProvider>
    );
}
