"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Goal } from "@/types";
import { TrendingUp, PieChart, Shield, Rocket, Plus, Edit2, Coins, Building, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { AddAssetDialog } from "@/components/AddAssetDialog";
import { MillionRace } from "@/components/MillionRace";
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
import { TABS, ASSET_TYPES } from "@/lib/constants";

export default function WealthPage() {
    const [stats, setStats] = useState<{
        netWorth: number;
        stocksValue: number;
        cashValue: number;
    } | null>(null);
    const [assets, setAssets] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<string>(TABS.ALL);

    const supabase = createClientComponentClient();

    const loadData = async () => {
        try {
            // 1. Fetch Goals (Assets)
            const { data: goals, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            // 1.5. Calculate Compound Interest & Update DB
            // We do this BEFORE displaying so the user sees the latest value.
            const updates = [];
            const now = new Date();

            for (const goal of goals || []) {
                if (goal.interest_rate && goal.interest_rate > 0) {
                    const lastCalc = goal.last_interest_calc ? new Date(goal.last_interest_calc) : new Date(goal.created_at);
                    const daysDiff = differenceInDays(now, lastCalc);

                    if (daysDiff >= 1) {
                        // Compound Formula: A = P(1 + r/100)^(t/365)
                        const rate = goal.interest_rate / 100;
                        const t = daysDiff / 365.25;
                        const newAmount = goal.current_amount * Math.pow((1 + rate), t);

                        updates.push({
                            id: goal.id,
                            current_amount: parseFloat(newAmount.toFixed(2)),
                            last_interest_calc: now.toISOString()
                        });

                        // Update local object for immediate display
                        goal.current_amount = parseFloat(newAmount.toFixed(2));
                    }
                }
            }

            if (updates.length > 0) {
                await supabase.from('goals').upsert(updates);
                toast.success(`עודכנה ריבית עבור ${updates.length} נכסים`);
            }

            // 2. Fetch Live Prices
            const symbols = goals
                ?.filter(g => (g.type === 'stock' || g.investment_type === 'crypto') && g.symbol)
                .map(g => g.symbol);

            let livePrices: Record<string, any> = {};
            let usdToIls = 3.8;

            try {
                if (symbols && symbols.length > 0) {
                    const res = await fetch('/api/stocks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbols })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        livePrices = data.stocks || {};
                        usdToIls = data.usdToIls || 3.8;
                    }
                }
            } catch (apiError) {
                console.error("API Error", apiError);
            }

            // 3. Calculate Values
            let totalNetWorth = 0;
            let totalStocks = 0;
            let totalCash = 0;

            const processedAssets = goals?.map(asset => {
                let value = Number(asset.current_amount);

                // Live Update for Stocks/Crypto
                if ((asset.type === 'stock' || asset.investment_type === 'crypto') && asset.symbol) {
                    const priceInfo = livePrices[asset.symbol];
                    if (priceInfo) {
                        const currentPrice = priceInfo.price;
                        const quantity = asset.quantity || 0;
                        const priceInIls = asset.currency === 'USD' || !asset.currency ? currentPrice * usdToIls : currentPrice;
                        value = priceInIls * quantity;
                    }
                    totalStocks += value;
                } else {
                    totalCash += value;
                }

                totalNetWorth += value;
                return { ...asset, calculatedValue: value };
            }) || [];

            setAssets(processedAssets);
            setStats({
                netWorth: totalNetWorth,
                stocksValue: totalStocks,
                cashValue: totalCash,
            });

        } catch (error) {
            console.error("Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (activeTab === TABS.ALL) return true;

        const isInvestment = asset.type === 'stock' ||
            asset.investment_type === 'crypto' ||
            asset.investment_type === 'real_estate';

        if (activeTab === TABS.INVESTMENTS) return isInvestment;
        if (activeTab === TABS.LIQUID) return !isInvestment; // Cash/Savings
        return true;
    });

    useEffect(() => {
        loadData();
    }, [supabase]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            toast.success("הנכס הוסר");
            loadData();
        } catch (error) {
            toast.error("שגיאה במחיקה");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-blue-400 font-mono text-sm animate-pulse">טוען נתונים...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 p-4 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-black tracking-tight neon-text flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-400" />
                    הון <span className="text-blue-500">עצמי</span>
                </h1>
                <div className="text-xs font-mono text-slate-500">
                    {format(new Date(), "HH:mm dd.MM.yyyy")}
                </div>
            </header>

            {/* Race to First Million */}
            <MillionRace currentWealth={stats?.netWorth || 0} />

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="neon-card p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-32 h-32 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <span className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-1 block">שווי נקי כולל</span>
                        <div className="text-4xl font-black text-white neon-text">
                            ₪<CountUp end={stats?.netWorth || 0} separator="," decimals={0} duration={1} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="neon-card p-4 rounded-2xl flex flex-col justify-center">
                        <span className="text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-1">השקעות (חי)</span>
                        <div className="text-xl font-bold text-white">
                            ₪<CountUp end={stats?.stocksValue || 0} separator="," prefix="" duration={1} />
                        </div>
                    </div>
                    <div className="neon-card p-4 rounded-2xl flex flex-col justify-center">
                        <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase mb-1">נזיל / חסכונות</span>
                        <div className="text-xl font-bold text-white">
                            ₪<CountUp end={stats?.cashValue || 0} separator="," prefix="" duration={1} />
                        </div>
                    </div>
                </div>
            </div>

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

            {/* Assets List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> תיק הנכסים שלך
                    </h2>
                    <Button
                        size="sm"
                        onClick={() => { setEditingAsset(null); setIsDialogOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold"
                    >
                        <Plus className="w-4 h-4 ml-1" /> הוסף נכס
                    </Button>
                </div>

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

                {assets.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-sm bg-white/5 rounded-3xl border border-white/5 border-dashed">
                        אין נכסים עדיין. זה הזמן להתחיל!
                    </div>
                )}
            </div>

            <AddAssetDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={loadData}
                initialData={editingAsset}
            />
        </div>
    );
}
