"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Liability, WealthSnapshot } from "@/types";

const supabase = createClient();

export const isLiabilityActive = (liability: Liability, asOf = new Date()) => {
    const remainingAmount = Number(liability.remaining_amount ?? liability.current_balance ?? 0);
    if (remainingAmount <= 0) return false;

    if (!liability.end_date) return true;
    const payoffDate = new Date(liability.end_date);
    if (Number.isNaN(payoffDate.getTime())) return true;

    return payoffDate >= asOf;
};

// ── Wealth History (Read-only — populated by pg_cron) ──

export function useWealthHistory(days = 90) {
    const { profile } = useAuth();
    const coupleId = profile?.couple_id;

    return useQuery<WealthSnapshot[]>({
        queryKey: ["wealth-history", coupleId, days],
        queryFn: async () => {
            if (!coupleId) return [];

            const since = new Date();
            since.setDate(since.getDate() - days);

            const { data, error } = await supabase
                .from("wealth_history")
                .select("*")
                .eq("couple_id", coupleId)
                .gte("snapshot_date", since.toISOString().split("T")[0])
                .order("snapshot_date", { ascending: true });

            if (error) throw error;
            return (data ?? []) as WealthSnapshot[];
        },
        enabled: !!coupleId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ── Liabilities CRUD ──

export function useLiabilities() {
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
            return (data ?? []) as Liability[];
        },
        enabled: !!coupleId,
    });
}

export function useAddLiability() {
    const queryClient = useQueryClient();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: async (liability: Omit<Liability, "id" | "couple_id" | "created_at">) => {
            if (!profile?.couple_id) throw new Error("No couple_id");

            const { data, error } = await supabase
                .from("liabilities")
                .insert({ ...liability, couple_id: profile.couple_id })
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
            const { data, error } = await supabase
                .from("liabilities")
                .update(updates)
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

export function useTotalLiabilities() {
    const { data: liabilities = [] } = useLiabilities();

    const activeLiabilities = liabilities.filter((liability) => isLiabilityActive(liability));

    const total = liabilities.reduce((sum, l) => sum + Number(l.remaining_amount ?? l.current_balance ?? 0), 0);
    const monthlyPayments = activeLiabilities.reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0);

    return { total, monthlyPayments, count: liabilities.length };
}
