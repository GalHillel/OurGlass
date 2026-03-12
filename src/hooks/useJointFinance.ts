"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Transaction, Subscription, Liability } from "@/types";
import { getBillingPeriodForDate } from "@/lib/billing";
import { useTotalLiabilities } from "@/hooks/useWealthData";

import { DEMO_MODE, getNow } from "@/demo/demo-config";
import { mockDB } from "@/demo/mock-db";
import { MOCK_COUPLE_ID } from "@/demo/mock-data";

/**
 * MANDATE 1: CENTRALIZED CASHFLOW ENGINE
 * Unifies Transactions, Subscriptions, and Debt Payments into a single source of truth.
 */
export function useGlobalCashflow(viewingDate: Date = getNow()) {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;
    const { monthlyPayments: debtMonthlyPayments } = useTotalLiabilities(viewingDate);

    const { start, end } = getBillingPeriodForDate(viewingDate);

    return useQuery({
        queryKey: ["global-cashflow", coupleId, viewingDate.toISOString().slice(0, 7), debtMonthlyPayments],
        queryFn: async () => {
            if (DEMO_MODE) {
                const txs = mockDB.getTransactions().filter(t => t.date >= start.toISOString() && t.date < end.toISOString());
                const subs = mockDB.getSubscriptions();

                const totalExpenseTransactions = txs.reduce((sum, tx) => {
                    if (tx.type === 'income' || tx.type === 'transfer') return sum;
                    return sum + Number(tx.amount);
                }, 0);
                const totalIncomeTransactions = txs.reduce((sum, tx) => {
                    if (tx.type !== 'income') return sum;
                    return sum + Number(tx.amount);
                }, 0);

                const activeSubscriptions = subs.filter((s) => s.active !== false);
                const totalSubscriptions = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
                const totalFixed = totalSubscriptions + (debtMonthlyPayments || 0);
                const totalSpent = totalExpenseTransactions + totalFixed;
                const budget = profile?.budget || 20000;
                const balance = Math.round((budget - totalSpent + totalIncomeTransactions) * 100) / 100;

                return {
                    totalTransactions: totalExpenseTransactions,
                    totalFixed,
                    totalSpent,
                    balance,
                    totalSubscriptions,
                    totalIncome: totalIncomeTransactions,
                    debtMonthlyPayments,
                    budget
                };
            }

            if (!coupleId) return {
                totalTransactions: 0,
                totalFixed: 0,
                totalSpent: 0,
                balance: 0,
                totalSubscriptions: 0,
                debtMonthlyPayments: 0,
                budget: profile?.budget || 20000
            };

            try {
                // Fetch everything in parallel for the billing period
                const [txsResult, subsResult] = await Promise.all([
                    supabase
                        .from("transactions")
                        .select("*")
                        .eq("couple_id", coupleId)
                        .gte("date", start.toISOString())
                        .lt("date", end.toISOString()),
                    supabase
                        .from("subscriptions")
                        .select("*")
                        .eq("couple_id", coupleId)
                ]);

                if (txsResult.error) throw txsResult.error;
                if (subsResult.error) throw subsResult.error;

                const txs = (txsResult.data ?? []) as Array<{ amount: number | string; type?: string | null }>;
                const totalExpenseTransactions = txs.reduce((sum: number, tx) => {
                    const t = tx.type || 'expense';
                    if (t === 'income' || t === 'transfer') return sum;
                    return sum + Number(tx.amount);
                }, 0);
                const totalIncomeTransactions = txs.reduce((sum: number, tx) => {
                    const t = tx.type || 'expense';
                    if (t !== 'income') return sum;
                    return sum + Number(tx.amount);
                }, 0);

                const activeSubscriptions = (subsResult.data ?? []).filter((s) => s.active !== false);
                const totalSubscriptions = activeSubscriptions.reduce((sum: number, s) => sum + Number(s.amount), 0);

                // THE HOLY GRAIL: Subscriptions + Debt
                const totalFixed = totalSubscriptions + (debtMonthlyPayments || 0);
                const totalSpent = totalExpenseTransactions + totalFixed;

                const budget = profile?.budget || 20000;
                const balance = Math.round((budget - totalSpent + totalIncomeTransactions) * 100) / 100;

                return {
                    totalTransactions: totalExpenseTransactions,
                    totalFixed,
                    totalSpent,
                    balance,
                    totalSubscriptions,
                    totalIncome: totalIncomeTransactions,
                    debtMonthlyPayments,
                    budget
                };
            } catch (e) {
                console.error("[useGlobalCashflow] Critical query failure, falling back to zeros:", e);
                return {
                    totalTransactions: 0,
                    totalFixed: 0,
                    totalSpent: 0,
                    balance: 0,
                    totalSubscriptions: 0,
                    totalIncome: 0,
                    debtMonthlyPayments: 0,
                    budget: profile?.budget || 20000
                };
            }
        },
        enabled: true,
        staleTime: 2 * 60 * 1000,
    });
}

export function useTransactions(viewingDate: Date = getNow()) {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;
    const { start, end } = getBillingPeriodForDate(viewingDate);

    return useQuery<Transaction[]>({
        queryKey: ["transactions", coupleId, viewingDate.toISOString().slice(0, 7)],
        queryFn: async () => {
            if (DEMO_MODE) {
                return mockDB.getTransactions()
                    .filter(t => t.date >= start.toISOString() && t.date < end.toISOString())
                    .sort((a, b) => b.date.localeCompare(a.date));
            }
            if (!coupleId) return [];
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('couple_id', coupleId)
                .gte('date', start.toISOString())
                .lt('date', end.toISOString())
                .order('date', { ascending: false });

            if (error) throw error;
            return data as Transaction[];
        },
        enabled: true,
    });
}

export function useSubscriptions() {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;

    return useQuery<Subscription[]>({
        queryKey: ["subscriptions", coupleId],
        queryFn: async () => {
            if (DEMO_MODE) {
                return mockDB.getSubscriptions();
            }
            if (!coupleId) return [];
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('couple_id', coupleId);

            if (error) throw error;
            return data as Subscription[];
        },
        enabled: true,
    });
}

export function useLiabilities() {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;

    return useQuery<Liability[]>({
        queryKey: ["liabilities", coupleId],
        queryFn: async () => {
            if (DEMO_MODE) {
                return mockDB.getLiabilities();
            }
            if (!coupleId) return [];
            const { data, error } = await supabase
                .from('liabilities')
                .select('*')
                .eq('couple_id', coupleId);

            if (error) throw error;
            return data as Liability[];
        },
        enabled: true,
    });
}

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
 */
export function useSettleUp(viewingDate: Date = getNow()) {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;
    const splitRatio = profile?.income_split_ratio ?? 0.5;

    return useQuery<SettleUpData>({
        queryKey: ["settle-up", coupleId, viewingDate.toISOString().slice(0, 7)],
        queryFn: async () => {
            const { start, end } = getBillingPeriodForDate(viewingDate);

            let txsAll: Transaction[] = [];

            if (DEMO_MODE) {
                txsAll = mockDB.getTransactions().filter(t => t.date >= start.toISOString() && t.date < end.toISOString());
            } else {
                if (!coupleId) return {
                    himTotal: 0, herTotal: 0, jointTotal: 0,
                    splitRatio, himOwes: 0,
                    transactions: { him: [], her: [], joint: [] },
                };

                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("couple_id", coupleId)
                    .gte("date", start.toISOString())
                    .lt("date", end.toISOString())
                    .order("date", { ascending: false });

                if (error) throw error;
                txsAll = (data ?? []) as Transaction[];
            }

            const txs = txsAll.filter((t) => (t.type ?? 'expense') === 'expense');

            const him = txs.filter((t) => t.payer === "him");
            const her = txs.filter((t) => t.payer === "her");
            const joint = txs.filter((t) => t.payer === "joint" || !t.payer);

            const himTotal = him.reduce((s, t) => s + t.amount, 0);
            const herTotal = her.reduce((s, t) => s + t.amount, 0);
            const jointTotal = joint.reduce((s, t) => s + t.amount, 0);

            const himShareOfJoint = jointTotal * splitRatio;
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
        enabled: true,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Guilt-Free Wallets: Calculate remaining pocket money for each partner
 */
export function useGuiltFreeWallets(viewingDate: Date = getNow()) {
    const supabase = createClient();
    const { profile } = useAuth();
    const coupleId = DEMO_MODE ? MOCK_COUPLE_ID : profile?.couple_id;
    const pocketHim = profile?.pocket_him ?? 1500;
    const pocketHer = profile?.pocket_her ?? 1500;

    const { activeLiabilities = [] } = useTotalLiabilities(viewingDate);

    return useQuery({
        queryKey: ["guilt-free", coupleId, viewingDate.toISOString().slice(0, 7), activeLiabilities.length],
        queryFn: async () => {
            const { start, end } = getBillingPeriodForDate(viewingDate);
            let txs: Array<{ amount: number | string; payer?: string | null; type?: string | null }> = [];

            if (DEMO_MODE) {
                txs = mockDB.getTransactions()
                    .filter(t => t.date >= start.toISOString() && t.date < end.toISOString() && (t.payer === 'him' || t.payer === 'her'));
            } else {
                if (!coupleId) return { himRemaining: pocketHim, herRemaining: pocketHer, himSpent: 0, herSpent: 0 };

                const { data, error } = await supabase
                    .from("transactions")
                    .select("amount, payer, type")
                    .eq("couple_id", coupleId)
                    .gte("date", start.toISOString())
                    .lt("date", end.toISOString())
                    .in("payer", ["him", "her"]);

                if (error) throw error;
                txs = (data ?? []) as unknown as Array<{ amount: number | string; payer?: string | null; type?: string | null }>;
            }

            const expenses = txs.filter((t) => (t.type ?? 'expense') === 'expense');
            const himSpentTransactions = expenses.filter((t) => t.payer === "him").reduce((s, t) => s + Number(t.amount), 0);
            const herSpentTransactions = expenses.filter((t) => t.payer === "her").reduce((s, t) => s + Number(t.amount), 0);

            // Deduct personal debt payments
            const himDebtPayments = activeLiabilities
                .filter((l: Liability) => l.owner === 'him')
                .reduce((sum: number, l: Liability) => sum + Number(l.monthly_payment || 0), 0);

            const herDebtPayments = activeLiabilities
                .filter((l: Liability) => l.owner === 'her')
                .reduce((sum: number, l: Liability) => sum + Number(l.monthly_payment || 0), 0);

            const totalHimSpent = himSpentTransactions + himDebtPayments;
            const totalHerSpent = herSpentTransactions + herDebtPayments;

            return {
                himRemaining: Math.max(0, pocketHim - totalHimSpent),
                herRemaining: Math.max(0, pocketHer - totalHerSpent),
                himSpent: totalHimSpent,
                herSpent: totalHerSpent,
                pocketHim,
                pocketHer,
                himDebtPayments,
                herDebtPayments
            };
        },
        enabled: true,
        staleTime: 2 * 60 * 1000,
    });
}
