"use client";

import { useState, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Goal } from "@/types";
import { useWealth } from "@/hooks/useWealth";
import { TrendingUp, PieChart, Shield, Rocket, Plus, Edit2, Coins, Building, Trash2, DollarSign } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { toast } from "sonner";
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
import { StockPortfolio } from "@/components/StockPortfolio";

import { getRank } from "@/lib/ranks";

// Phase 3: Wealth & Investment components
import { NetWorthHistory } from "@/components/NetWorthHistory";
import { MonthlyStoryWrap } from "@/components/MonthlyStoryWrap";
import { RebalancingCoach } from "@/components/RebalancingCoach";
import { SP500Benchmark } from "@/components/SP500Benchmark";
import { useLiabilities } from "@/hooks/useWealthData";

export default function WealthPage() {
    // Use the centralized wealth hook
    const {
        netWorth,
        investmentsValue,
        cashValue,
        assets,
        usdToIls,
        loading,
        refetch
    } = useWealth();

    useLiabilities();
    const trueNetWorth = netWorth; // Gross Assets view per user request

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<string>(TABS.ALL);
    const [chartFilter] = useState<string | null>(null);

    const [showStory, setShowStory] = useState(false);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

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
                if (chartFilter === 'usd_cash') return asset.investment_type === 'usd_cash' || asset.type === 'usd_cash';
                if (chartFilter === 'other') return asset.type !== 'stock' && asset.type !== 'cash' && asset.type !== 'usd_cash' && !asset.investment_type;
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
        } catch {
            toast.error("שגיאה במחיקה");
        }
    };

    // Calculate Rank using hook's netWorth
    getRank(trueNetWorth);

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
                        <span>₪</span>
                        <AnimatedCounter value={trueNetWorth} />
                    </div>
                )}

                <AnimatePresence>
                    {showStory && <MonthlyStoryWrap onClose={() => setShowStory(false)} />}
                </AnimatePresence>
            </div>

            {/* Row 2: SIDE BY SIDE Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="neon-card p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />
                    <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-1">השקעות וחסכונות</span>
                    {loading ? (
                        <Skeleton className="h-7 w-24 bg-white/10" />
                    ) : (
                        <div className="text-2xl font-bold text-white flex items-center gap-1">
                            <span>₪</span>
                            <AnimatedCounter value={investmentsValue} />
                        </div>
                    )}
                </div>
                <div className="neon-card p-4 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all" />
                    <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase mb-1">פקדונות ומזומן</span>
                    {loading ? (
                        <Skeleton className="h-7 w-24 bg-white/10" />
                    ) : (
                        <div className="text-2xl font-bold text-white flex items-center gap-1">
                            <span>₪</span>
                            <AnimatedCounter value={cashValue} />
                        </div>
                    )}
                </div>
            </div>

            {/* Row 3: History & Coach */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NetWorthHistory liveNetWorth={trueNetWorth} />
                <RebalancingCoach assets={assets} totalWealth={trueNetWorth} />
            </div>

            {/* Row 4: SP500 & Assets */}
            <SP500Benchmark initialWealth={trueNetWorth} />

            {/* Live Portfolio */}
            {(!chartFilter || chartFilter === 'stock') && (
                <div className="mx-0">
                    <StockPortfolio assets={assets} usdToIls={usdToIls} />
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
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${(asset.type === 'stock' || asset.investment_type === 'crypto') ? 'bg-purple-500/20 text-purple-400'
                                            : (asset.investment_type === 'usd_cash' || asset.type === 'usd_cash') ? 'bg-green-500/20 text-green-400'
                                                : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {asset.investment_type === 'crypto' ? <Coins className="w-6 h-6" /> :
                                                asset.investment_type === 'real_estate' ? <Building className="w-6 h-6" /> :
                                                    (asset.investment_type === 'usd_cash' || asset.type === 'usd_cash') ? <DollarSign className="w-6 h-6" /> :
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
                                                        ₪{Number(asset.calculatedValue || asset.current_amount).toLocaleString()}
                                                    </div>
                                                    {(asset.investment_type === 'usd_cash' || asset.type === 'usd_cash') && (
                                                        <div className="flex justify-end gap-1">
                                                            <span className="text-[10px] bg-green-500/20 text-green-200 px-1.5 py-0.5 rounded border border-green-500/30">${Number(asset.current_amount).toLocaleString()}</span>
                                                        </div>
                                                    )}
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

            {/* Final bottom spacer for edge-to-edge layout accessibility */}
            <div className="h-32 w-full" />
        </div>
    );
}
