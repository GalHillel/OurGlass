"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Goal, WealthSnapshot } from "@/types";
import { useWealth } from "@/hooks/useWealth";
import { useTotalLiabilities } from "@/hooks/useWealthData";
import { useLiveTotalWealth } from "@/hooks/useLiveTotalWealth";
import { TrendingUp, PieChart, Shield, Rocket, Plus, Edit2, Building, Trash2, DollarSign } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddAssetDialog } from "@/components/AddAssetDialog";
import { LiveAssetTicker } from "@/components/LiveAssetTicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TABS, CURRENCY_SYMBOL, isAssetInvestment } from "@/lib/constants";

// Phase 3: Wealth & Investment components
import { NetWorthHistory } from "@/components/NetWorthHistory";
import { MonthlyStoryWrap } from "@/components/MonthlyStoryWrap";
import { RebalancingCoach } from "@/components/RebalancingCoach";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { SP500Benchmark } from "@/components/SP500Benchmark";
import { useDashboardStore } from "@/stores/dashboardStore";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

export default function WealthPage() {
    // const isStealthMode = useAppStore(s => s.isStealthMode);
    const { profile, loading: authLoading } = useAuth();

    // 1. Authoritative Data Fetch
    const {
        investmentsValue,
        cashValue,
        assets = [],
        usdToIls,
        marketPrices = {},
        loading: wealthLoading,
        refetch
    } = useWealth();

    const { total: totalLiabilitiesVal } = useTotalLiabilities();
    const loading = wealthLoading || authLoading;

    // 2. Dashboard Features
    const features = useDashboardStore((s) => s.features);
    const {
        showSP500Benchmark,
        showPortfolioAllocation,
        showRebalancingCoach,
        wealthShowHistory,
        wealthShowInsights,
        wealthShowAssets,
        wealthShowPortfolio,
        wealthShowSummaryCards
    } = features;

    // Derive isMinimalMode locally
    const isMinimalMode = !showSP500Benchmark && !showPortfolioAllocation && !showRebalancingCoach &&
        !wealthShowHistory && !wealthShowInsights && !wealthShowAssets &&
        !wealthShowPortfolio && !wealthShowSummaryCards;

    // 3. Authority Real-Time Counter
    const liveNetWorth = useLiveTotalWealth(assets || [], [], usdToIls, marketPrices);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<string>(TABS.ALL);
    const [chartFilter] = useState<string | null>(null);

    const [showStory, setShowStory] = useState(false);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const filteredAssets = useMemo(() => {
        return (assets || []).filter((asset: Goal) => {
            if (asset.type === 'stock' && asset.symbol) return false;

            if (chartFilter) {
                if (chartFilter === 'real_estate') return asset.investment_type === 'real_estate';
                if (chartFilter === 'stock') return asset.type === 'stock';
                if (chartFilter === 'cash') return asset.type === 'cash';
                if (chartFilter === 'foreign_currency') return asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency';
                if (chartFilter === 'other') return asset.type !== 'stock' && asset.type !== 'cash' && asset.type !== 'foreign_currency' && !asset.investment_type;
                return true;
            }

            if (activeTab === TABS.ALL) return true;

            if (activeTab === TABS.CASH) return asset.investment_type === 'cash' || (asset.type === 'cash' && !asset.investment_type && !asset.interest_rate);
            if (activeTab === TABS.SAVINGS) return asset.investment_type === 'savings' || (asset.type === 'cash' && (asset.interest_rate || 0) > 0);
            if (activeTab === TABS.FOREIGN_CURRENCY) return asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency';
            if (activeTab === TABS.REAL_ESTATE) return asset.investment_type === 'real_estate';
            if (activeTab === TABS.INVESTMENTS) return asset.type === 'stock' || asset.investment_type === 'real_estate' || asset.type === 'money_market' || asset.investment_type === 'money_market';

            return true;
        });
    }, [assets, activeTab, chartFilter]);

    const visibleTabs = useMemo(() => {
        const hasData = (tab: string) => {
            if (tab === TABS.ALL) return true;
            return (assets || []).some((asset: Goal) => {
                if (asset.type === 'stock' && asset.symbol) return false;
                if (tab === TABS.CASH) return asset.investment_type === 'cash' || (asset.type === 'cash' && !asset.investment_type && !asset.interest_rate);
                if (tab === TABS.SAVINGS) return asset.investment_type === 'savings' || (asset.type === 'cash' && (asset.interest_rate || 0) > 0);
                if (tab === TABS.FOREIGN_CURRENCY) return asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency';
                if (tab === TABS.REAL_ESTATE) return asset.investment_type === 'real_estate';
                if (tab === TABS.INVESTMENTS) return asset.type === 'stock' || asset.investment_type === 'real_estate' || asset.type === 'money_market' || asset.investment_type === 'money_market';
                return false;
            });
        };
        return Object.values(TABS).filter(hasData);
    }, [assets]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            toast.success("הנכס הוסר");
            refetch();
        } catch {
            toast.error("שגיאה במחיקה");
        }
    };

    const liveNetWorthRef = useRef(liveNetWorth);
    useEffect(() => { liveNetWorthRef.current = liveNetWorth; }, [liveNetWorth]);

    useEffect(() => {
        if (!loading && (assets?.length || 0) > 0 && liveNetWorthRef.current > 0 && profile?.couple_id) {
            const syncSnapshot = async () => {
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                const { count, error: countError } = await supabase
                    .from('wealth_history')
                    .select('*', { count: 'exact', head: true })
                    .eq('couple_id', profile.couple_id);

                const needsBackfill = !countError && count !== null && count < 2;
                const currentNetWorth = liveNetWorthRef.current;

                let snapshotCash = 0;
                let snapshotInvest = 0;
                assets.forEach((asset) => {
                    const val = (asset as Goal & { calculatedValue?: number }).calculatedValue || Number(asset.current_amount) || 0;
                    if (isAssetInvestment(asset)) {
                        snapshotInvest += val;
                    } else {
                        snapshotCash += val;
                    }
                });

                if (needsBackfill) {
                    const backfillData: Omit<WealthSnapshot, "id" | "created_at">[] = [];
                    for (let i = 7; i >= 1; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        backfillData.push({
                            couple_id: profile.couple_id!,
                            snapshot_date: d.toISOString().split('T')[0],
                            net_worth: currentNetWorth,
                            cash_value: snapshotCash,
                            investments_value: snapshotInvest,
                            liabilities_value: totalLiabilitiesVal
                        });
                    }
                    await supabase.from('wealth_history').upsert(backfillData);
                }

                await supabase.from('wealth_history').upsert({
                    couple_id: profile.couple_id,
                    snapshot_date: todayStr,
                    net_worth: currentNetWorth,
                    cash_value: snapshotCash,
                    investments_value: snapshotInvest,
                    liabilities_value: totalLiabilitiesVal,
                }, {
                    onConflict: 'couple_id,snapshot_date'
                });
            };

            const timer = setTimeout(syncSnapshot, 3000);
            return () => clearTimeout(timer);
        }
    }, [assets, loading, profile?.couple_id, totalLiabilitiesVal, supabase]);


    return (
        <div className="min-h-screen bg-slate-950 text-white px-4 space-y-6 pt-6">
            <div className="mx-2 p-4 neon-card rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group min-h-[160px]">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-32 h-32 text-blue-500" />
                </div>
                <span className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-2 block relative z-10">שווי נקי כולל</span>
                {loading ? (
                    <Skeleton className="h-12 w-48 bg-white/10" />
                ) : (
                    <div className="text-5xl font-black text-white neon-text relative z-10 flex items-center gap-1">
                        <AnimatedCounter value={liveNetWorth} currencySymbol={CURRENCY_SYMBOL} />
                    </div>
                )}

                <AnimatePresence>
                    {showStory && <MonthlyStoryWrap onClose={() => setShowStory(false)} />}
                </AnimatePresence>
            </div>

            {/* Row 2: Summary Cards */}
            {wealthShowSummaryCards && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="neon-card p-4 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />
                        <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-1">השקעות וחסכונות</span>
                        {loading ? (
                            <Skeleton className="h-7 w-24 bg-white/10" />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-center gap-1">
                                <AnimatedCounter value={investmentsValue} currencySymbol={CURRENCY_SYMBOL} />
                            </div>
                        )}
                    </div>
                    <div className="neon-card p-4 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all" />
                        <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase mb-1">פקדונות ומזומן</span>
                        {loading ? (
                            <Skeleton className="h-7 w-24 bg-white/10" />
                        ) : (
                            <div className="text-2xl font-bold text-white flex items-center gap-1">
                                <AnimatedCounter value={cashValue} currencySymbol={CURRENCY_SYMBOL} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Row 3: History & Coach */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wealthShowHistory && <NetWorthHistory liveNetWorth={liveNetWorth} />}
                <AnimatePresence>
                    {showRebalancingCoach && wealthShowInsights && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <RebalancingCoach assets={assets} totalWealth={liveNetWorth} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Row 4: S&P 500 & Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showSP500Benchmark && <SP500Benchmark initialWealth={liveNetWorth} />}
                {showPortfolioAllocation && <PortfolioAllocation assets={assets} />}
            </div>

            {/* Minimal Mode Fallback */}
            {isMinimalMode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-2 p-8 border-2 border-dashed border-white/10 rounded-[2rem] text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="w-8 h-8 text-white/20" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">מצב מינימליסטי</h3>
                        <p className="text-slate-500 text-xs mt-1">כל הפיצ׳רים המתקדמים כבויים. ניתן להפעילם בהגדרות.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = '/settings'}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                        עבור להגדרות
                    </Button>
                </motion.div>
            )}

            {/* Filter Tabs */}
            <div className="mx-2 mb-2 p-1.5 bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-white/5 flex gap-1 items-center justify-center">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            triggerHaptic();
                        }}
                        className={cn(
                            "flex-1 min-w-[70px] py-3 text-xs font-bold rounded-[1.5rem] transition-all duration-300 relative",
                            activeTab === tab
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105"
                                : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTabGlow"
                                className="absolute inset-0 bg-blue-400/5 blur-xl pointer-events-none rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Assets List (Non-Stock) */}
            {wealthShowAssets && (
                <div className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <PieChart className="w-4 h-4" /> נכסים אחרים
                        </h2>
                        <Button
                            size="sm"
                            onClick={() => { setEditingAsset(null); setIsDialogOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold"
                        >
                            <Plus className="w-4 h-4 ml-1" /> הוסף נכס
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {loading && assets.length === 0 ? (
                            <>
                                <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
                                <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
                            </>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredAssets.map((asset, i) => (
                                    <motion.div
                                        key={asset.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="neon-card p-4 rounded-2xl flex items-center justify-between group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 relative z-10 w-full">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${asset.type === 'stock' ? 'bg-purple-500/20 text-purple-400'
                                                : (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {asset.investment_type === 'real_estate' ? <Building className="w-6 h-6" /> :
                                                    (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') ? <DollarSign className="w-6 h-6" /> :
                                                        asset.type === 'stock' ? <Rocket className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg">{asset.name}</h3>
                                                        {(asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') && (
                                                            <div className="flex flex-col gap-0.5 mt-0.5">
                                                                <span className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-full inline-block self-start">
                                                                    ${Number(asset.current_amount).toLocaleString()}
                                                                </span>
                                                                <span className="text-[9px] text-white/30 font-mono pr-1">שער: ₪{(usdToIls || 3.7).toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {asset.type === 'stock' && asset.symbol && (
                                                            <span className="text-xs text-slate-400 font-mono tracking-wider">{asset.symbol} • {asset.quantity} יח׳</span>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-black text-xl tracking-tight neon-text">
                                                            <LiveAssetTicker asset={asset} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-2 justify-end">
                                                    <button
                                                        onClick={() => { setEditingAsset(asset); setIsDialogOpen(true); }}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>למחוק נכס זה?</AlertDialogTitle>
                                                                <AlertDialogDescription>פעולה זו אינה הפיכה.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white">ביטול</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(asset.id)} className="bg-red-600">מחק</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}

                        {!loading && filteredAssets.length === 0 && (
                            <div className="text-center py-10 text-slate-500 text-sm bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                אין נכסים עדיין. זה הזמן להתחיל!
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AddAssetDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={refetch}
                initialData={editingAsset}
                usdToIls={usdToIls}
            />

            <div className="h-32 w-full" />
        </div>
    );
}