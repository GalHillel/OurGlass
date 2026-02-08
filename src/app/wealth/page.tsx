"use client";

import { useState, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Goal } from "@/types";
import { useWealth } from "@/hooks/useWealth";
import { TrendingUp, PieChart, Shield, Rocket, Plus, Edit2, Coins, Building, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AddAssetDialog } from "@/components/AddAssetDialog";
import { Skeleton } from "@/components/ui/skeleton";
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
import { TABS } from "@/lib/constants";
import { StockTicker } from "@/components/StockTicker";
import { StockPortfolio } from "@/components/StockPortfolio";
import { WealthChart } from "@/components/WealthChart";
import { RiskAnalysisCard } from "@/components/RiskAnalysisCard";
import { DividendForecast } from "@/components/DividendForecast";

import { getRank } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";
import { cn } from "@/lib/utils";

export default function WealthPage() {
    // Use the centralized wealth hook
    const {
        netWorth,
        investmentsValue,
        cashValue,
        assets,
        loading,
        refetch
    } = useWealth();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<string>(TABS.ALL);
    const [chartFilter, setChartFilter] = useState<string | null>(null);

    const supabase = createClientComponentClient();

    // Note: Compound interest calculation has been moved to a separate function
    // since it needs to write to DB, but it will trigger a refetch after completion

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            // Filter out Stocks from generic list (since they are in StockPortfolio)
            // We only filter out "Smart Stocks" (with symbol). Manual stocks stay.
            if (asset.type === 'stock' && asset.symbol) return false;

            // 1. Chart Filter (High Priority)
            if (chartFilter) {
                if (chartFilter === 'crypto') return asset.investment_type === 'crypto';
                if (chartFilter === 'real_estate') return asset.investment_type === 'real_estate';
                if (chartFilter === 'stock') return asset.type === 'stock' && asset.investment_type !== 'crypto'; // Ensure distinction
                if (chartFilter === 'cash') return asset.type === 'cash';
                if (chartFilter === 'other') return asset.type !== 'stock' && asset.type !== 'cash' && !asset.investment_type;
                // Fallback
                return true;
            }

            // 2. Tab Filter (Standard)
            if (activeTab === TABS.ALL) return true;

            const isInvestment = asset.type === 'stock' ||
                asset.investment_type === 'crypto' ||
                asset.investment_type === 'real_estate';

            if (activeTab === TABS.INVESTMENTS) return isInvestment;
            if (activeTab === TABS.LIQUID) return !isInvestment;
            return true;
        });
    }, [assets, activeTab, chartFilter]);



    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            toast.success("הנכס הוסר");
            refetch(); // Refetch from hook
        } catch (error) {
            toast.error("שגיאה במחיקה");
        }
    };

    // Calculate Rank using hook's netWorth
    const { currentRank, nextRank, progress, remaining } = getRank(netWorth);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 px-4 space-y-6">
            <AppHeader
                title="הון"
                subtitle="עצמי"
                icon={Shield}
                iconColor="text-blue-400"
                titleColor="text-blue-500"
            />
            {/* Spacing for fixed header */}
            <div className="h-16" />

            <StockTicker userSymbols={assets
                .filter(a => (a.type === 'stock' || a.investment_type === 'crypto') && a.symbol)
                .map(a => a.symbol!)
            } />

            {/* Milestone Tracker (Next 100k) */}
            <div className="mx-2 p-4 neon-card rounded-2xl flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-900/10 z-0" />

                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 relative z-10">
                    <Rocket className="w-6 h-6 text-blue-400" />
                </div>

                <div className="flex-1 relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">היעד הבא</span>
                        <span className="text-xs font-mono text-white/60">
                            {format(new Date(), "MMM yyyy")}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-slate-900/50 rounded-full overflow-hidden mb-2 border border-white/5 relative">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex justify-between px-2">
                            <div className="w-px h-full bg-white/5" />
                            <div className="w-px h-full bg-white/5" />
                            <div className="w-px h-full bg-white/5" />
                        </div>
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, (netWorth % 100000) / 1000)}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/50 blur-[2px]" />
                        </motion.div>
                    </div>

                    <div className="flex justify-between text-xs font-mono">
                        <span className="text-white font-bold">₪{netWorth.toLocaleString()}</span>
                        <span className="text-white/40">₪{(Math.floor(netWorth / 100000) + 1) * 100000}</span>
                    </div>
                    <p className="text-[10px] text-blue-300/80 mt-1 text-right">
                        נותרו ₪{(100000 - (netWorth % 100000)).toLocaleString()} ל-100k הבאים
                    </p>
                </div>
            </div>



            {/* Risk Analysis (Wide) */}
            <RiskAnalysisCard investments={assets.filter(a => a.type === 'stock' || a.investment_type === 'crypto')} totalWealth={netWorth} cash={cashValue} />

            {/* Main Stats Grid - Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Col: Rankings / Status (To be expanded or used for more stats) */}
                <div className="flex flex-col gap-4">
                    {/* Net Worth Big Card */}
                    <div className="neon-card p-6 rounded-2xl flex flex-col justify-center flex-1 relative overflow-hidden min-h-[160px]">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-32 h-32 text-blue-500" />
                        </div>
                        <span className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-2 block relative z-10">שווי נקי כולל</span>
                        {loading ? (
                            <Skeleton className="h-12 w-48 bg-white/10" />
                        ) : (
                            <div className="text-5xl font-black text-white neon-text relative z-10">
                                ₪<CountUp end={netWorth} separator="," decimals={0} duration={1} />
                            </div>
                        )}
                        <div className="mt-4 flex gap-3 relative z-10">
                            < RankBadge rank={currentRank} />
                        </div>
                    </div>
                </div>

                {/* Right Col: Liquid vs Invested */}
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <div className="neon-card p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />
                            <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-1">השקעות (חי)</span>
                            {loading ? (
                                <Skeleton className="h-7 w-24 bg-white/10" />
                            ) : (
                                <div className="text-2xl font-bold text-white">
                                    ₪<CountUp end={investmentsValue} separator="," prefix="" duration={1} />
                                </div>
                            )}
                        </div>
                        <div className="neon-card p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all" />
                            <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase mb-1">נזיל / חסכונות</span>
                            {loading ? (
                                <Skeleton className="h-7 w-24 bg-white/10" />
                            ) : (
                                <div className="text-2xl font-bold text-white">
                                    ₪<CountUp end={cashValue} separator="," prefix="" duration={1} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="neon-card p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">ניהול סיכונים</p>
                                <p className="text-sm font-bold text-white">תיק המניות שלך מגוון</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Portfolio */}
            {(!chartFilter || chartFilter === 'stock') && (
                <div className="mx-0">
                    <StockPortfolio assets={assets} />
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mx-2">
                {Object.values(TABS).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all duration-300 ${activeTab === tab
                            ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Assets List (Non-Stock) */}
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
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${(asset.type === 'stock' || asset.investment_type === 'crypto') ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {asset.investment_type === 'crypto' ? <Coins className="w-6 h-6" /> :
                                                asset.investment_type === 'real_estate' ? <Building className="w-6 h-6" /> :
                                                    asset.type === 'stock' ? <Rocket className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{asset.name}</h3>
                                                    {(asset.type === 'stock' || asset.investment_type === 'crypto') && asset.symbol && (
                                                        <span className="text-xs text-slate-400 font-mono tracking-wider">{asset.symbol} • {asset.quantity} יח׳</span>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-black text-xl tracking-tight neon-text">
                                                        ₪{Number((asset as any).calculatedValue || asset.current_amount).toLocaleString()}
                                                    </div>
                                                    {(asset.type === 'stock' || asset.investment_type === 'crypto') && (
                                                        <div className="flex justify-end">
                                                            <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/30">חי</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons (Always Visible) */}
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

            <AddAssetDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={refetch}
                initialData={editingAsset}
            />
        </div>
    );
}
