"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Transaction } from "@/types";

export function useRealtimeSync(coupleId: string | null) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        if (!coupleId) return;

        // Subscribe to changes in core tables
        const channel = supabase.channel(`realtime-${coupleId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions', filter: `couple_id=eq.${coupleId}` },
                (payload) => {
                    console.log("Realtime: Transactions changed", payload);

                    if (payload.eventType === 'INSERT') {
                        const newTx = payload.new as Transaction;
                        queryClient.setQueriesData({ queryKey: ['transactions', coupleId] }, (oldData: Transaction[] | undefined) => {
                            if (!oldData) return [newTx];
                            return [newTx, ...oldData];
                        });
                    } else {
                        queryClient.invalidateQueries({ queryKey: ['transactions', coupleId] });
                    }
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subscriptions', filter: `couple_id=eq.${coupleId}` },
                () => {
                    console.log("Realtime: Subscriptions changed");
                    queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'liabilities', filter: `couple_id=eq.${coupleId}` },
                () => {
                    console.log("Realtime: Liabilities changed");
                    queryClient.invalidateQueries({ queryKey: ['liabilities', coupleId] });
                    queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'assets', filter: `couple_id=eq.${coupleId}` },
                () => {
                    console.log("Realtime: Assets changed");
                    queryClient.invalidateQueries({ queryKey: ['assets', coupleId] });
                    queryClient.invalidateQueries({ queryKey: ['wealth', coupleId] });
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wishlist' }, // wishlist might not have couple_id yet or different structure
                () => {
                    console.log("Realtime: Wishlist changed");
                    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient, supabase, coupleId]);
}
