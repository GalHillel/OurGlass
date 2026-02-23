"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Transaction } from "@/types";
import { getBillingPeriodForDate } from "@/lib/billing";

const supabase = createClient();

interface SettleUpData {
    himTotal: number;
    herTotal: number;
    jointTotal: number;
    splitRatio: number; // 0-1, how much "him" should pay of joint
    himOwes: number; // positive = him owes her, negative = she owes him
    transactions: { him: Transaction[]; her: Transaction[]; joint: Transaction[] };
}

/**
 * Calculate the Settle Up for a given billing period.
 *
 * Logic:
 * 1. Sum all transactions by payer (him/her/joint)
 * 2. Joint expenses split by income_split_ratio
 * 3. Each partner's "fair share" = their own expenses + their ratio of joint
 * 4. Diff = who owes whom
 */
export function useSettleUp(viewingDate: Date = new Date()) {
    const { profile } = useAuth();
    const coupleId = profile?.couple_id;
    const splitRatio = profile?.income_split_ratio ?? 0.5;

    return useQuery<SettleUpData>({
        queryKey: ["settle-up", coupleId, viewingDate.toISOString().slice(0, 7)],
        queryFn: async () => {
            if (!coupleId) {
                return {
                    himTotal: 0, herTotal: 0, jointTotal: 0,
                    splitRatio, himOwes: 0,
                    transactions: { him: [], her: [], joint: [] },
                };
            }

            const { start, end } = getBillingPeriodForDate(viewingDate);

            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("couple_id", coupleId)
                .gte("date", start.toISOString())
                .lt("date", end.toISOString())
                .order("date", { ascending: false });

            if (error) throw error;

            const txs = (data ?? []) as Transaction[];

            const him = txs.filter((t) => t.payer === "him");
            const her = txs.filter((t) => t.payer === "her");
            const joint = txs.filter((t) => t.payer === "joint" || !t.payer);

            const himTotal = him.reduce((s, t) => s + t.amount, 0);
            const herTotal = her.reduce((s, t) => s + t.amount, 0);
            const jointTotal = joint.reduce((s, t) => s + t.amount, 0);

            // Joint split: him pays `splitRatio` share, her pays `1 - splitRatio`
            const himShareOfJoint = jointTotal * splitRatio;
            const herShareOfJoint = jointTotal * (1 - splitRatio);

            // Total each should have paid
            const himFairShare = himTotal + himShareOfJoint;
            const herFairShare = herTotal + herShareOfJoint;

            // Who actually paid the joint expenses? We assume joint was evenly paid in practice,
            // so the settlement is: him owes = his fair share - what he actually paid (ignoring joint for now)
            // Simpler: total pool, each should pay their fair share
            const totalAll = himTotal + herTotal + jointTotal;
            const himShouldPay = himTotal + himShareOfJoint;
            const herShouldPay = herTotal + herShareOfJoint;

            // If him paid himTotal but should have paid himShouldPay:
            // himOwes positive = him underpaid (owes her), negative = him overpaid (she owes him)
            // Since personal expenses are already "paid", the settlement is only about joint:
            const himPaidOfJoint = jointTotal / 2; // assumption: joint was split 50/50 in practice
            const himOwes = Math.round((himShareOfJoint - himPaidOfJoint) * 100) / 100;

            return {
                himTotal,
                herTotal,
                jointTotal,
                splitRatio,
                himOwes,
                transactions: { him, her, joint },
            };
        },
        enabled: !!coupleId,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Guilt-Free Wallets: Calculate remaining pocket money for each partner
 */
export function useGuiltFreeWallets(viewingDate: Date = new Date()) {
    const { profile } = useAuth();
    const coupleId = profile?.couple_id;
    const pocketHim = profile?.pocket_him ?? 0;
    const pocketHer = profile?.pocket_her ?? 0;

    return useQuery({
        queryKey: ["guilt-free", coupleId, viewingDate.toISOString().slice(0, 7)],
        queryFn: async () => {
            if (!coupleId) {
                return { himRemaining: pocketHim, herRemaining: pocketHer, himSpent: 0, herSpent: 0 };
            }

            const { start, end } = getBillingPeriodForDate(viewingDate);

            const { data, error } = await supabase
                .from("transactions")
                .select("amount, payer")
                .eq("couple_id", coupleId)
                .gte("date", start.toISOString())
                .lt("date", end.toISOString())
                .in("payer", ["him", "her"]);

            if (error) throw error;

            const txs = data ?? [];
            const himSpent = txs.filter((t: any) => t.payer === "him").reduce((s: number, t: any) => s + Number(t.amount), 0);
            const herSpent = txs.filter((t: any) => t.payer === "her").reduce((s: number, t: any) => s + Number(t.amount), 0);

            return {
                himRemaining: Math.max(0, pocketHim - himSpent),
                herRemaining: Math.max(0, pocketHer - herSpent),
                himSpent,
                herSpent,
                pocketHim,
                pocketHer,
            };
        },
        enabled: !!coupleId,
        staleTime: 2 * 60 * 1000,
    });
}
