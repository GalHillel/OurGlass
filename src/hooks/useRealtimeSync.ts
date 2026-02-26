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

        let channel: any = null;

        const setupSubscription = () => {
            if (channel) return;

            // Subscribe to changes in core tables
            channel = supabase.channel(`realtime-${coupleId}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions', filter: `couple_id=eq.${coupleId}` },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            const newTx = payload.new as Transaction;
                            queryClient.setQueriesData({ queryKey: ['transactions', coupleId] }, (oldData: Transaction[] | undefined) => {
                                if (!oldData) return [newTx];
                                // Deduplication: check if ID already exists (from optimistic UI)
                                if (oldData.some(tx => tx.id === newTx.id)) return oldData;
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
                        queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
                        queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'liabilities', filter: `couple_id=eq.${coupleId}` },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['liabilities', coupleId] });
                        queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'assets', filter: `couple_id=eq.${coupleId}` },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['assets', coupleId] });
                        queryClient.invalidateQueries({ queryKey: ['wealth', coupleId] });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'wishlist' },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['wishlist'] });
                    }
                )
                .subscribe();
        };

        const tearDownSubscription = () => {
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
        };

        // Initial setup
        if (document.visibilityState === 'visible') {
            setupSubscription();
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setupSubscription();
            } else {
                tearDownSubscription();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            tearDownSubscription();
        };
    }, [queryClient, supabase, coupleId]);
}

