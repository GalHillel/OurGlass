"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useAppStore } from "@/stores/appStore";
import { useWealth } from "@/hooks/useWealth";
import { PAYERS, CURRENCY_SYMBOL } from "@/lib/constants";
import { motion } from "framer-motion";
import { FinancialContext, Goal, Liability, Transaction, Subscription, WishlistItem, WealthSnapshot } from "@/types";
import { isLiabilityActive } from "@/hooks/useWealthData";
import { getBillingPeriodForDate } from "@/lib/billing";

const toSafeNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

// Generates a dynamic one-liner insight from real financial data
function generateDynamicInsight(context: FinancialContext | null, firstName: string): string | null {
    if (!context) return null;

    const transactions = context.transactions || context.recentTransactions || [];
    const { budget, subscriptions } = context;

    const totalSpent = transactions?.reduce((s: number, t: Transaction) => s + Number(t.amount), 0) || 0;
    const budgetUsedPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
    const remaining = Math.max(0, budget - totalSpent);

    // Category breakdown
    const cats: Record<string, number> = {};
    transactions?.forEach((t: Transaction) => {
        const cat = t.category || 'אחר';
        cats[cat] = (cats[cat] || 0) + Number(t.amount);
    });
    const topCat = Object.entries(cats).sort(([, a], [, b]) => b - a)[0];

    // Pick the most relevant insight
    if (budgetUsedPct >= 90) return `${firstName}, ניצלת ${budgetUsedPct}% מהתקציב — בוא נראה איפה לחסוך`;
    if (budgetUsedPct >= 70) return `${firstName}, נשארו לך $${CURRENCY_SYMBOL}${remaining.toLocaleString()} — מעקב חכם?`;
    if (budgetUsedPct <= 20 && totalSpent > 0) return `${firstName}, חיסכון מדהים! רק ${budgetUsedPct}% מהתקציב 🎯`;
    if (topCat && topCat[1] > budget * 0.25) return `${firstName}, הוצאת $${CURRENCY_SYMBOL}${topCat[1].toLocaleString()} על ${topCat[0]} — ננתח?`;
    if (subscriptions?.length > 5) return `${firstName}, יש לך ${subscriptions.length} מנויים — אפשר לחסוך?`;
    if (remaining > 2000) return `${firstName}, יש $${CURRENCY_SYMBOL}${remaining.toLocaleString()} פנויים — מה עושים איתם?`;

    return `${firstName}, רוצה סיכום חכם של החודש? ✨`;
}

export const AIChatButton = ({ viewingDate = new Date() }: { viewingDate?: Date }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<FinancialContext | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
    const [bubbleDismissed] = useState(false);
    const pathname = usePathname();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const { profile } = useAuth();
    const { appIdentity } = useAppStore();
    const { netWorth: liveNetWorth, assets: wealthAssets } = useWealth();

    // Mapping device identity to display name
    const identityName = appIdentity === 'him' ? PAYERS.HIM : appIdentity === 'her' ? PAYERS.HER : '';
    const firstName = identityName || profile?.name?.split(' ')[0] || '';

    const fetchContext = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const now = viewingDate;
            const { start, end } = getBillingPeriodForDate(now);
            const startOfMonth = start.toISOString();
            const endOfMonth = end.toISOString();

            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', startOfMonth)
                .lt('date', endOfMonth)
                .order('date', { ascending: false });

            if (txError) throw txError;

            const [
                { data: subs },
                { data: liabs },
                { data: profileData },
                { data: categories },
                { data: wishlist },
                { data: wealth }
            ] = await Promise.all([
                supabase.from('subscriptions').select('*'),
                supabase.from('liabilities').select('*'),
                supabase.from('profiles').select('budget, monthly_income').eq('id', profile?.id || '').single(),
                supabase.from('categories').select('id, name'),
                supabase.from('wishlist').select('*'),
                supabase.from('wealth_history').select('*').order('snapshot_date', { ascending: false }).limit(1)
            ]);

            const categoryMap = new Map<string, string>(
                ((categories as Array<{ id: string; name: string }> | null) || []).map((category) => [category.id, category.name])
            );
            const enrichedTransactions = ((txs as Transaction[]) || []).map((transaction) => ({
                ...transaction,
                category: transaction.category || (transaction.category_id ? categoryMap.get(transaction.category_id) : undefined) || 'Other',
            }));

            const activeSubscriptions = ((subs as Subscription[] | null) || []).filter((sub) => sub.active !== false);
            const subTotal = activeSubscriptions.reduce((acc: number, curr) => acc + Number(curr.amount), 0);
            const activeDebtObligations = ((liabs as Liability[] | null) || []).filter((liability) => isLiabilityActive(liability, now));
            const liabTotal = activeDebtObligations.reduce((acc: number, curr) => acc + Number(curr.monthly_payment), 0);
            const monthlySpent = enrichedTransactions.reduce((acc: number, curr) => acc + Number(curr.amount), 0);
            const profileBudget = toSafeNumber(profileData?.budget ?? profile?.budget);
            const profileIncome = toSafeNumber(profileData?.monthly_income ?? profile?.monthly_income);
            const resolvedBudget = Number.isFinite(profileBudget) && profileBudget > 0
                ? profileBudget
                : Number.isFinite(profileIncome) && profileIncome > 0
                    ? Math.max(profileIncome, monthlySpent)
                    : monthlySpent > 0
                        ? monthlySpent
                        : subTotal + liabTotal;
            const resolvedIncome = profileIncome;

            const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const daysInMonth = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const totalFixed = subTotal + liabTotal;
            const burnRateDaily = (monthlySpent + totalFixed) / daysElapsed;

            const assetsSummary = (wealthAssets || []).reduce((acc, asset: Goal) => {
                const valueInIls = toSafeNumber(asset.calculatedValue ?? asset.current_amount);
                if (asset.type === 'stock' || asset.investment_type === 'real_estate') {
                    acc.stocksInvestments += valueInIls;
                } else if (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') {
                    acc.usdCash.usdAmount += toSafeNumber(asset.current_amount);
                    acc.usdCash.ilsValue += valueInIls;
                } else if (asset.type === 'money_market') {
                    acc.moneyMarketKaspit += valueInIls;
                } else {
                    acc.bankCash += valueInIls;
                }

                return acc;
            }, {
                bankCash: 0,
                stocksInvestments: 0,
                moneyMarketKaspit: 0,
                usdCash: {
                    usdAmount: 0,
                    ilsValue: 0,
                },
            });
            const totalTrackedAssets =
                assetsSummary.bankCash +
                assetsSummary.stocksInvestments +
                assetsSummary.moneyMarketKaspit +
                assetsSummary.usdCash.ilsValue;

            const ctx: FinancialContext = {
                transactions: enrichedTransactions,
                recentTransactions: enrichedTransactions,
                burnRate: {
                    daily: burnRateDaily,
                    weekly: burnRateDaily * 7,
                    monthlySpend: monthlySpent,
                    monthProgressPct: Math.min(100, Math.round((daysElapsed / daysInMonth) * 100)),
                },
                subscriptions: activeSubscriptions,
                liabilities: (liabs as Liability[]) || [],
                debtObligations: activeDebtObligations,
                assets: {
                    ...assetsSummary,
                    totalTrackedAssets,
                    raw: wealthAssets || [],
                },
                wishlist: (wishlist as WishlistItem[]) || [],
                wealthSnapshot: (wealth?.[0] as WealthSnapshot) || null,
                fixedExpenses: subTotal + liabTotal,
                budget: resolvedBudget,
                income: resolvedIncome,
                identityName,
                liveNetWorth,
                currentRoute: pathname,
            };

            setContext(ctx);
            return ctx;
        } catch (err) {
            console.error("Failed to fetch context for AI", err);
            setError(true);
            return null;
        } finally {
            setLoading(false);
        }
    }, [supabase, profile, identityName, liveNetWorth, wealthAssets, viewingDate]);

    // Dynamic proactive bubble — fetch data, then generate insight
    useEffect(() => {
        if (bubbleDismissed || isOpen) return;

        const timer = setTimeout(async () => {
            const ctx = await fetchContext();
            if (ctx) {
                const msg = generateDynamicInsight(ctx, firstName);
                if (msg) setBubbleMessage(msg);
            }
        }, 4000);

        return () => clearTimeout(timer);
    }, [bubbleDismissed, isOpen, firstName, fetchContext]);

    // Auto-hide bubble after 10 seconds
    useEffect(() => {
        if (!bubbleMessage) return;
        const t = setTimeout(() => setBubbleMessage(null), 10000);
        return () => clearTimeout(t);
    }, [bubbleMessage]);

    // Open handler
    const handleOpen = async () => {
        setIsOpen(true);
        setBubbleMessage(null);
        if (!context) await fetchContext();
    };

    if (pathname === '/settings') return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-[70px] z-40 mx-4 mt-4 mb-6"
                dir="rtl"
            >
                <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600/20 via-blue-500/20 to-cyan-400/20 rounded-[2.2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0c0f1a]/80 backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 ring-1 ring-white/5 active:ring-violet-500/30"
                >
                    {/* Siri-style Animated Multi-Gradient Glow */}
                    <motion.div
                        animate={{
                            opacity: [0.15, 0.35, 0.15],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-blue-500/20 to-cyan-400/20 pointer-events-none filter blur-2xl"
                    />

                    {/* Sophisticated inner border light */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                    <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_2px_12px_rgba(124,58,237,0.4)] ring-1 ring-white/20">
                        <Sparkles className="w-4 h-4 text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.4)]" />
                    </div>

                    <span className="text-white/60 text-[13px] font-semibold flex-1 text-right tracking-tight">
                        {bubbleMessage || "שאל את רועי, היועץ הפיננסי שלך..."}
                    </span>

                    <div className="hidden sm:flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <kbd className="px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-[10px] text-white/40 font-mono shadow-inner">⌘</kbd>
                        <kbd className="px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-[10px] text-white/40 font-mono shadow-inner">K</kbd>
                    </div>
                </motion.button>
            </motion.div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md h-[85vh] max-h-[700px] p-0 gap-0 bg-[#0c0f1a]/95 backdrop-blur-2xl border-white/[0.06] rounded-[2rem] overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.5)]"
                    aria-describedby={undefined}
                    dir="rtl"
                >
                    <DialogTitle className="sr-only">AI Chat Helper</DialogTitle>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-3">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            >
                                <Sparkles className="w-8 h-8 text-violet-400" />
                            </motion.div>
                            <p className="text-sm text-white/60">מכין את ההקשר הפיננסי...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-4 p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                <X className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-sm text-white/70">לא הצלחתי לטעון את הנתונים</p>
                            <Button onClick={fetchContext} variant="outline" size="sm" className="gap-2 border-white/10 text-white/70 hover:text-white">
                                <RefreshCw className="w-3.5 h-3.5" />
                                נסה שוב
                            </Button>
                        </div>
                    ) : (
                        context && <ChatInterface context={context} onClose={() => setIsOpen(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
