"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function useRealtimeSync() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        // Subscribe to changes in core tables
        // We use a single channel for all relevant tables
        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                (payload) => {
                    console.log("Realtime: Transactions changed", payload);
                    if (payload.eventType === 'INSERT') {
                        queryClient.setQueriesData({ queryKey: ['transactions'] }, (oldData: any) => {
                            if (!oldData) return oldData;
                            if (Array.isArray(oldData)) return [payload.new, ...oldData];
                            return oldData;
                        });
                    }
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subscriptions' },
                () => {
                    console.log("Realtime: Subscriptions changed");
                    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'liabilities' },
                () => {
                    console.log("Realtime: Liabilities changed");
                    queryClient.invalidateQueries({ queryKey: ['liabilities'] });
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'assets' },
                () => {
                    console.log("Realtime: Assets changed");
                    queryClient.invalidateQueries({ queryKey: ['assets'] });
                    queryClient.invalidateQueries({ queryKey: ['wealth'] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wishlist' },
                () => {
                    console.log("Realtime: Wishlist changed");
                    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime sync: Subscribed to all changes');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient, supabase]);
}
