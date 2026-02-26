"use client";

import { Home, Sparkles, Settings, CreditCard, Gem, Gift, Rocket, Plus, X, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { useDashboardStore, FeatureKey, NavItemConfig } from "@/stores/dashboardStore";
import { useAppStore } from "@/stores/appStore";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useWealth } from "@/hooks/useWealth";
import { FinancialContext, Goal, Liability, Transaction, Subscription, WishlistItem, WealthSnapshot } from "@/types";
import { isLiabilityActive } from "@/hooks/useWealthData";
import { getBillingPeriodForDate } from "@/lib/billing";
import { PAYERS } from "@/lib/constants";

interface NavItem {
    id: string;
    label: string;
    icon: typeof Home;
    path: string;
    featureKey?: FeatureKey;
}

const navItemsRegistry: NavItem[] = [
    { id: "home", label: "בית", icon: Home, path: "/" },
    { id: "wealth", label: "עושר", icon: Gem, path: "/wealth" },
    { id: "stocks", label: "מניות", icon: Rocket, path: "/stocks", featureKey: "enableStocksPage" },
    { id: "lounge", label: "לובי", icon: Sparkles, path: "/lounge", featureKey: "enableLounge" },
    { id: "subscriptions", label: "קבועות", icon: CreditCard, path: "/subscriptions", featureKey: "enableSubscriptions" },
    { id: "wishlist", label: "משאלות", icon: Gift, path: "/wishlist", featureKey: "enableWishlist" },
    { id: "settings", label: "הגדרות", icon: Settings, path: "/settings" },
];

export const BottomNav = () => {
    const pathname = usePathname();
    const { navItems, features, _hasHydrated } = useDashboardStore(useShallow((s) => ({
        navItems: s.navItems,
        features: s.features,
        _hasHydrated: s._hasHydrated
    })));

    // AI Chat State & Logic
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [context, setContext] = useState<FinancialContext | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const { profile, user } = useAuth();
    const { appIdentity } = useAppStore();
    const { netWorth: liveNetWorth, assets: wealthAssets } = useWealth();

    const fetchContext = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const now = new Date();
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

            const identityName = appIdentity === 'him' ? PAYERS.HIM : appIdentity === 'her' ? PAYERS.HER : '';
            const activeSubscriptions = ((subs as Subscription[] | null) || []).filter((sub) => sub.active !== false);
            const subTotal = activeSubscriptions.reduce((acc: number, curr) => acc + Number(curr.amount), 0);
            const activeDebtObligations = ((liabs as Liability[] | null) || []).filter((liability) => isLiabilityActive(liability, now));
            const liabTotal = activeDebtObligations.reduce((acc: number, curr) => acc + Number(curr.monthly_payment), 0);
            const monthlySpent = enrichedTransactions.reduce((acc: number, curr) => acc + Number(curr.amount), 0);

            const profileBudget = Number(profileData?.budget ?? profile?.budget ?? 0);
            const profileIncome = Number(profileData?.monthly_income ?? profile?.monthly_income ?? 0);

            const daysElapsed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const daysInMonth = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const burnRateDaily = (monthlySpent + subTotal + liabTotal) / daysElapsed;

            const assetsSummary = (wealthAssets || []).reduce((acc, asset: Goal) => {
                const valueInIls = Number(asset.calculatedValue ?? asset.current_amount ?? 0);
                if (asset.type === 'stock' || asset.investment_type === 'real_estate') acc.stocksInvestments += valueInIls;
                else if (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') {
                    acc.usdCash.usdAmount += Number(asset.current_amount || 0);
                    acc.usdCash.ilsValue += valueInIls;
                } else if (asset.type === 'money_market') acc.moneyMarketKaspit += valueInIls;
                else acc.bankCash += valueInIls;
                return acc;
            }, { bankCash: 0, stocksInvestments: 0, moneyMarketKaspit: 0, usdCash: { usdAmount: 0, ilsValue: 0 } });

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
                assets: { ...assetsSummary, totalTrackedAssets: liveNetWorth, raw: wealthAssets || [] },
                wishlist: (wishlist as WishlistItem[]) || [],
                wealthSnapshot: (wealth?.[0] as WealthSnapshot) || null,
                fixedExpenses: subTotal + liabTotal,
                budget: profileBudget || monthlySpent || 20000,
                income: profileIncome,
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
    }, [supabase, profile, appIdentity, liveNetWorth, wealthAssets, pathname]);

    const handleAIOpen = async () => {
        triggerHaptic();
        setIsAIChatOpen(true);
        if (!context) await fetchContext();
    };

    const visibleItems = useMemo(() => {
        if (!_hasHydrated) return [];
        return [...navItems]
            .filter(item => item.enabled)
            .sort((a, b) => a.order - b.order)
            .map(item => {
                const baseItem = navItemsRegistry.find(n => n.id === item.id);
                return baseItem ? { ...baseItem, ...item } : null;
            })
            .filter((n): n is NavItem & NavItemConfig => n !== null && (!n.featureKey || (features as any)[n.featureKey]));
    }, [navItems, features, _hasHydrated]);

    const renderNavItem = (item: NavItem & NavItemConfig) => {
        const isActive = pathname === item.path;
        return (
            <Link
                key={item.id}
                href={item.path}
                prefetch={true}
                onClick={() => triggerHaptic()}
                className="relative flex flex-col items-center justify-center flex-1 py-2.5 group"
            >
                {isActive && (
                    <motion.div
                        layoutId="nav-glow"
                        className="absolute inset-1 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <item.icon className={cn(
                    "w-5 h-5 relative z-10 mb-0.5 transition-all duration-200",
                    isActive
                        ? "text-blue-300 neon-text drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        : "text-slate-500 group-hover:text-white/60"
                )} />
                <span className={cn(
                    "relative z-10 text-[9px] font-medium transition-colors duration-200",
                    isActive ? "text-blue-200" : "text-slate-500 group-hover:text-white/60"
                )}>
                    {item.label}
                </span>
            </Link>
        );
    };

    if (pathname === "/login" || !_hasHydrated) return null;

    const midPoint = Math.ceil(visibleItems.length / 2);
    const leftItems = visibleItems.slice(0, midPoint);
    const rightItems = visibleItems.slice(midPoint);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 px-4 pb-[env(safe-area-inset-bottom)] pt-3 z-50 pointer-events-none">
                <nav className="rounded-full flex justify-between items-center px-4 p-2 backdrop-blur-xl bg-[#0c0f1a]/70 border border-white/[0.08] pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-lg mx-auto relative">
                    <div className="flex-1 flex justify-around">
                        {leftItems.map(renderNavItem)}
                    </div>

                    {/* Center Button: AI Chat */}
                    <button
                        onClick={handleAIOpen}
                        className="mx-2 flex flex-col items-center justify-center group relative -mt-10"
                    >
                        <div className="w-14 h-14 rounded-full glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden border-4 border-[#020617] group-hover:scale-110 active:scale-90 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 0.9, 1.1, 1], opacity: [0.3, 0.6, 0.2, 0.5, 0.3] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-violet-500/30 blur-xl"
                            />
                            <Sparkles className="w-7 h-7 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                        </div>
                    </button>

                    <div className="flex-1 flex justify-around">
                        {rightItems.map(renderNavItem)}
                    </div>
                </nav>
            </div>

            <Dialog open={isAIChatOpen} onOpenChange={setIsAIChatOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-md h-[85vh] max-h-[700px] p-0 gap-0 bg-[#0c0f1a]/95 backdrop-blur-2xl border-white/[0.06] rounded-[2rem] overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.5)]"
                    aria-describedby={undefined}
                    dir="rtl"
                >
                    <DialogTitle className="sr-only">AI Chat Helper</DialogTitle>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                                <Sparkles className="w-8 h-8 text-violet-400" />
                            </motion.div>
                            <p className="text-sm text-white/60">מכין את ההקשר הפיננסי...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-4 p-6 text-center">
                            <p className="text-sm text-white/70">לא הצלחתי לטעון את הנתונים</p>
                            <button onClick={fetchContext} className="text-violet-400 text-sm font-bold flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> נסה שוב
                            </button>
                        </div>
                    ) : (
                        context && <ChatInterface context={context} onClose={() => setIsAIChatOpen(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

