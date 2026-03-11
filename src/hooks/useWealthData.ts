"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Liability, WealthSnapshot } from "@/types";

const supabase = createClient();

export const isLiabilityActive = (liability: Liability, asOf = new Date()) => {
    const remainingAmount = Number(liability.remaining_amount ?? liability.amount ?? liability.current_balance ?? 0);
    if (remainingAmount <= 0) return false;

    if (!liability.end_date) return true;
    const payoffDate = new Date(liability.end_date);
    if (Number.isNaN(payoffDate.getTime())) return true;

    return payoffDate >= asOf;
};

// ── Wealth History (Read-only — populated by pg_cron) ──
import { useMemo } from "react";

export function useWealthHistory(days = 90, liveNetWorth?: number) {
    const { profile } = useAuth();
    const coupleId = profile?.couple_id;

    const query = useQuery<WealthSnapshot[]>({
        queryKey: ["wealth-history", coupleId, days],
        queryFn: async () => {
            if (!coupleId) return [];

            const { data, error } = await supabase
                .from("wealth_history")
                .select("*")
                .eq("couple_id", coupleId)
                .order("snapshot_date", { ascending: true });

            if (error) throw error;

            // Apply manual filter for speed/flexibility if not "ALL"
            if (days !== -1) {
                const since = new Date();
                since.setDate(since.getDate() - days);
                const sinceIso = since.toISOString().split("T")[0];
                return (data ?? []).filter(s => s.snapshot_date >= sinceIso) as WealthSnapshot[];
            }

            return (data ?? []) as WealthSnapshot[];
        },
        enabled: !!coupleId,
        staleTime: 5 * 60 * 1000,
    });

    const dataWithLive = useMemo(() => {
        if (!query.data || query.data.length === 0) return { snapshots: [], dbValue: 0 };

        const rawSnapshots = [...query.data];
        const lastDbPoint = rawSnapshots[rawSnapshots.length - 1];
        const dbValue = lastDbPoint.net_worth;
        const snapshots = [...rawSnapshots];

        if (liveNetWorth !== undefined && liveNetWorth > 0) {
            const today = new Date().toISOString().split("T")[0];
            const lastSnapshot = snapshots[snapshots.length - 1];

            if (!lastSnapshot || lastSnapshot.snapshot_date !== today) {
                snapshots.push({
                    id: 'live-now',
                    couple_id: coupleId || '',
                    snapshot_date: today,
                    net_worth: liveNetWorth,
                    cash_value: 0,
                    investments_value: 0,
                    liabilities_value: 0,
                    created_at: new Date().toISOString()
                });
            } else {
                snapshots[snapshots.length - 1] = {
                    ...lastSnapshot,
                    net_worth: liveNetWorth
                };
            }
        }
        return { snapshots, dbValue };
    }, [query.data, liveNetWorth, coupleId]);

    return { ...query, data: dataWithLive.snapshots, dbValue: dataWithLive.dbValue };
}

export function useSP500History(days = 365) {
    return useQuery<Array<{ date: string; price: number }>>({
        queryKey: ["sp500-history", days],
        queryFn: async () => {
            const res = await fetch("/api/market-data/history");
            if (!res.ok) throw new Error("Failed to fetch SP500 history");
            return res.json();
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
}

// ── Liabilities CRUD ──

import { calculateDynamicBalance, estimatePayoffDate } from "@/lib/debt-utils";

export function useLiabilities(asOf: Date = new Date()) {
    const { profile } = useAuth();
    const coupleId = profile?.couple_id;

    return useQuery<Liability[]>({
        queryKey: ["liabilities", coupleId],
        queryFn: async () => {
            if (!coupleId) return [];

            const { data, error } = await supabase
                .from("liabilities")
                .select("*")
                .eq("couple_id", coupleId)
                .order("remaining_amount", { ascending: false });

            if (error) throw error;

            // Map to dynamic balance
            const mapped = (data ?? []).map((l) => {
                let currentBalance = l.remaining_amount;

                if (l.start_date && l.total_amount && l.monthly_payment) {
                    currentBalance = calculateDynamicBalance(
                        Number(l.total_amount),
                        Number(l.monthly_payment),
                        Number(l.interest_rate || 0),
                        l.start_date,
                        asOf
                    );
                }

                const estimatedEndDate = estimatePayoffDate(
                    currentBalance,
                    Number(l.monthly_payment),
                    Number(l.interest_rate || 0)
                );

                return {
                    ...l,
                    current_balance: currentBalance,
                    remaining_amount: currentBalance, // Sync for older UI
                    estimated_end_date: estimatedEndDate?.toISOString() || l.end_date,
                } as Liability;
            });

            // Filter out closed liabilities (balance <= 0)
            return mapped.filter(l => (l.current_balance || 0) > 0);
        },
        enabled: true,
    });
}

export function useAddLiability() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async (liability: Omit<Liability, "id" | "created_at"> & { couple_id?: string }) => {
            if (!profile?.couple_id) throw new Error("No couple_id");

            const normalizedPayload = {
                ...liability,
                total_amount: Number(liability.total_amount ?? liability.current_balance ?? 0),
                remaining_amount: Number(liability.remaining_amount ?? liability.current_balance ?? 0),
                monthly_payment: Number(liability.monthly_payment ?? 0),
                interest_rate: Number(liability.interest_rate ?? 0),
            };

            const {
                ...dbPayload
            } = { ...normalizedPayload, couple_id: liability.couple_id ?? profile.couple_id };

            const { data, error } = await supabase
                .from("liabilities")
                .insert(dbPayload)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
        },
    });
}

export function useUpdateLiability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Liability> & { id: string }) => {
            const {
                ...dbUpdates
            } = updates;

            const { data, error } = await supabase
                .from("liabilities")
                .update(dbUpdates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
        },
    });
}

export function useDeleteLiability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("liabilities")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["liabilities"] });
        },
    });
}

// ── Derived: Total Liabilities ──
export function useTotalLiabilities(asOf: Date = new Date()) {
    const { data: liabilities = [] } = useLiabilities(asOf);

    const activeLiabilities = liabilities; // Already filtered in hook

    const total = liabilities.reduce((sum, l) => sum + (l.current_balance ?? l.remaining_amount ?? 0), 0);
    const monthlyPayments = activeLiabilities.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0);

    // Enhanced Debt Spread Logic
    const liabilitiesWithEstimation = activeLiabilities.map(l => {
        const remaining = l.current_balance ?? l.remaining_amount ?? 0;
        const payment = Number(l.monthly_payment ?? 0);
        let estimatedMonths = 0;

        if (l.estimated_end_date) {
            const end = new Date(l.estimated_end_date);
            const now = new Date();
            estimatedMonths = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        } else if (payment > 0) {
            estimatedMonths = Math.ceil(remaining / payment);
        }

        return {
            ...l,
            estimated_months_to_payoff: Math.max(0, estimatedMonths)
        };
    });

    return {
        total,
        monthlyPayments,
        count: liabilities.length,
        activeLiabilities: liabilitiesWithEstimation
    };
}