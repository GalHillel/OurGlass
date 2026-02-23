"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useAppStore } from "@/stores/appStore";
import { useWealth } from "@/hooks/useWealth";
import { PAYERS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialContext, Goal, Liability, Transaction, Subscription, WishlistItem, WealthSnapshot } from "@/types";
import { isLiabilityActive } from "@/hooks/useWealthData";

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
    if (budgetUsedPct >= 70) return `${firstName}, נשארו לך ₪${remaining.toLocaleString()} — מעקב חכם?`;
    if (budgetUsedPct <= 20 && totalSpent > 0) return `${firstName}, חיסכון מדהים! רק ${budgetUsedPct}% מהתקציב 🎯`;
    if (topCat && topCat[1] > budget * 0.25) return `${firstName}, הוצאת ₪${topCat[1].toLocaleString()} על ${topCat[0]} — ננתח?`;
    if (subscriptions?.length > 5) return `${firstName}, יש לך ${subscriptions.length} מנויים — אפשר לחסוך?`;
    if (remaining > 2000) return `${firstName}, יש ₪${remaining.toLocaleString()} פנויים — מה עושים איתם?`;

    return `${firstName}, רוצה סיכום חכם של החודש? ✨`;
}

export const AIChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<FinancialContext | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
    const [bubbleDismissed, setBubbleDismissed] = useState(false);
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
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', startOfMonth)
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
            const activeDebtObligations = ((liabs as Liability[] | null) || []).filter((liability) => isLiabilityActive(liability));
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

            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysElapsed = Math.max(1, Math.ceil((now.getTime() - new Date(now.getFullYear(), now.getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24)));
            const burnRateDaily = monthlySpent / daysElapsed;

            const assetsSummary = (wealthAssets || []).reduce((acc, asset: Goal) => {
                const valueInIls = toSafeNumber(asset.calculatedValue ?? asset.current_amount);
                if (asset.type === 'stock' || asset.investment_type === 'crypto' || asset.investment_type === 'real_estate') {
                    acc.stocksInvestments += valueInIls;
                } else if (asset.investment_type === 'usd_cash' || asset.type === 'usd_cash') {
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
    }, [supabase, profile, identityName, liveNetWorth, wealthAssets]);

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

    return (
        <>
            <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2">
                {/* Dynamic AI Insight Bubble */}
                <AnimatePresence>
                    {bubbleMessage && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="relative max-w-[220px] cursor-pointer"
                            onClick={handleOpen}
                        >
                            <div className="bg-white/95 backdrop-blur-xl text-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 text-[13px] leading-snug font-medium">
                                {bubbleMessage}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setBubbleMessage(null); setBubbleDismissed(true); }}
                                className="absolute -top-1.5 -right-1.5 bg-slate-100 rounded-full p-0.5 shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sleek FAB */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleOpen}
                    className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 shadow-[0_4px_20px_rgba(124,58,237,0.35)] flex items-center justify-center group transition-shadow hover:shadow-[0_4px_28px_rgba(124,58,237,0.5)] overflow-hidden"
                >
                    {/* Glassmorphism inner glow */}
                    <div className="absolute inset-0.5 rounded-[14px] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    {/* Soft outer ring */}
                    <div className="absolute -inset-[2px] rounded-[18px] bg-gradient-to-br from-violet-400/30 to-cyan-400/30 blur-sm pointer-events-none" />

                    <Sparkles className="w-5 h-5 text-white relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />

                    {/* Subtle pulse ring */}
                    <div className="absolute inset-0 rounded-2xl animate-ping bg-blue-400/20 pointer-events-none" style={{ animationDuration: '3s' }} />
                </motion.button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md h-[85vh] max-h-[700px] p-0 gap-0 bg-[#0c0f1a]/95 backdrop-blur-2xl border-white/[0.06] rounded-[2rem] overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.5)]"
                    aria-describedby={undefined}
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
