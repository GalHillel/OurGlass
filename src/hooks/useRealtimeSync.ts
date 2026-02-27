"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Transaction } from "@/types";

export function useRealtimeSync(coupleId: string | null) {
    const queryClient = useQueryClient();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!coupleId) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;

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
                        } else if (payload.eventType === 'DELETE') {
                            const oldTx = payload.old as Partial<Transaction>;
                            if (oldTx?.id) {
                                queryClient.setQueriesData({ queryKey: ['transactions', coupleId] }, (oldData: Transaction[] | undefined) => {
                                    if (!oldData) return oldData;
                                    return oldData.filter((tx) => tx.id !== oldTx.id);
                                });
                            } else {
                                queryClient.invalidateQueries({ queryKey: ['transactions', coupleId] });
                            }
                        } else {
                            queryClient.invalidateQueries({ queryKey: ['transactions', coupleId] });
                        }
                        queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                        queryClient.invalidateQueries({ queryKey: ['settle-up', coupleId] });
                        queryClient.invalidateQueries({ queryKey: ['guilt-free', coupleId] });
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
                    // "goals" is the assets table in this codebase
                    { event: '*', schema: 'public', table: 'goals', filter: `couple_id=eq.${coupleId}` },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['wealthData'] });
                        queryClient.invalidateQueries({ queryKey: ['wealth-history', coupleId] });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'wishlist', filter: `couple_id=eq.${coupleId}` },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ['wishlist', coupleId] });
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
                // Catch-up: invalidate only known couple-scoped queries
                queryClient.invalidateQueries({ queryKey: ['transactions', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['liabilities', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['wishlist', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['settle-up', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['guilt-free', coupleId] });
                queryClient.invalidateQueries({ queryKey: ['wealthData'] });
                queryClient.invalidateQueries({ queryKey: ['wealth-history', coupleId] });
            }
            else {
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

