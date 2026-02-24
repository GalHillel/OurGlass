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
                () => {
                    console.log("Realtime: Transactions changed");
                    queryClient.invalidateQueries();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subscriptions' },
                () => {
                    console.log("Realtime: Subscriptions changed");
                    queryClient.invalidateQueries();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'liabilities' },
                () => {
                    console.log("Realtime: Liabilities changed");
                    queryClient.invalidateQueries();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'assets' },
                () => {
                    console.log("Realtime: Assets changed");
                    queryClient.invalidateQueries();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wishlist' },
                () => {
                    console.log("Realtime: Wishlist changed");
                    queryClient.invalidateQueries();
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
