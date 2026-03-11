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
import { motion, AnimatePresence } from "framer-motion";
import { FinancialContext, Goal, Liability, Transaction, Subscription, WishlistItem, WealthSnapshot } from "@/types";
import { isLiabilityActive } from "@/hooks/useWealthData";
import { getBillingPeriodForDate } from "@/lib/billing";
import { triggerHaptic } from "@/utils/haptics";

const toSafeNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

// Generates a dynamic one-liner insight from real financial data
function generateDynamicInsight(context: FinancialContext | null, firstName: string): string | null {
    if (!context) return null;

    const transactions = context.transactions || context.recentTransactions || [];
    const { budget, subscriptions } = context;

    const totalSpent = transactions?.reduce((s: number, t: Transaction) => {
        if ((t.type ?? 'expense') !== 'expense') return s;
        return s + Number(t.amount);
    }, 0) || 0;
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
    const [bubbleDismissed, setBubbleDismissed] = useState(false);
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
            const coupleId = profile?.couple_id;
            if (!coupleId) {
                setContext(null);
                return null;
            }

            const now = viewingDate;
            const { start, end } = getBillingPeriodForDate(now);
            const startOfMonth = start.toISOString();
            const endOfMonth = end.toISOString();

            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('couple_id', coupleId)
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
                supabase.from('subscriptions').select('*').eq('couple_id', coupleId),
                supabase.from('liabilities').select('*').eq('couple_id', coupleId),
                supabase.from('profiles').select('budget, monthly_income').eq('id', profile?.id || '').single(),
                supabase.from('categories').select('id, name'),
                supabase.from('wishlist').select('*').eq('couple_id', coupleId),
                supabase.from('wealth_history').select('*').eq('couple_id', coupleId).order('snapshot_date', { ascending: false }).limit(1)
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
            const monthlySpent = enrichedTransactions.reduce((acc: number, curr) => {
                if ((curr.type ?? 'expense') !== 'expense') return acc;
                return acc + Number(curr.amount);
            }, 0);
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
    }, [supabase, profile, identityName, liveNetWorth, wealthAssets, viewingDate, pathname]);

    // Dynamic proactive bubble — fetch data, then generate insight
    useEffect(() => {
        if (bubbleDismissed || isOpen) return;

        const timer = setTimeout(async () => {
            const ctx = await fetchContext();
            if (ctx) {
                const msg = generateDynamicInsight(ctx, firstName);
                if (msg) setBubbleMessage(msg);
            }
        }, 10000); // 10s instead of 4s to be less intrusive

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
        setBubbleDismissed(true);
        if (!context) await fetchContext();
    };

    if (pathname === '/settings') return null;

    return (
        <>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-28 left-6 z-50"
                dir="rtl"
            >
                {/* Notification Bubble - Premium Redesign */}
                <AnimatePresence>
                    {bubbleMessage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
                            className="absolute bottom-full left-0 mb-6 w-56 p-4 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/bubble"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBubbleMessage(null);
                                    setBubbleDismissed(true);
                                    triggerHaptic();
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all shadow-lg z-20 active:scale-90"
                            >
                                <X className="w-3 h-3" />
                            </button>

                            <div className="flex flex-col gap-2 text-right">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-3 h-3 text-violet-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">תובנה חכמה</span>
                                </div>
                                <p className="text-[12px] font-bold text-white/90 leading-relaxed">
                                    {bubbleMessage}
                                </p>
                            </div>

                            {/* Decorative Glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleOpen}
                    className="relative w-14 h-14 rounded-full glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden group"
                >
                    {/* Quantum Orb Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950" />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 0.9, 1.1, 1],
                            opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-violet-500/30 blur-2xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.3, 0.8, 1.2],
                            opacity: [0.2, 0.4, 0.1, 0.3, 0.2],
                        }}
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-cyan-500/20 blur-2xl translate-x-1"
                    />
                    <Sparkles className="w-6 h-6 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </button>
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
