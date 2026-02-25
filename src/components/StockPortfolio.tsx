"use client";

import { useMemo, useRef, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { Plus, TrendingUp, TrendingDown, RefreshCcw, Rocket, Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeableRow } from "@/components/SwipeableRow";
import { EmptyState } from "@/components/EmptyState";
import { Goal } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/AuthProvider";
import { triggerHaptic } from "@/utils/haptics";
import { cn, formatAmount } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface StockPortfolioProps {
    assets?: Goal[];
    usdToIls?: number;
}

interface StockDisplay {
    id: string;
    symbol: string;
    shares: number;
    currentPriceUSD: number;
    totalValueILS: number;
    changePercent: number;
    originalCost: number;
}

export const StockPortfolio = ({ assets = [], usdToIls = 3.65 }: StockPortfolioProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<StockDisplay | null>(null);

    // Form State
    const [symbolInput, setSymbolInput] = useState("");
    const [sharesInput, setSharesInput] = useState("");

    // Filter and Map stocks from assets prop (which comes from useQuery via useWealth)
    // Filter and Map stocks from assets prop (which comes from useQuery via useWealth)
    const stocks = useMemo(() => {
        const stockAssets = assets.filter(a => a.type === 'stock' && a.symbol);
        return stockAssets.map(asset => {
            const sym = asset.symbol!;
            const shares = asset.quantity || 0;

            // Use values directly from the enhanced asset object
            return {
                id: asset.id,
                symbol: sym,
                shares: shares,
                currentPriceUSD: (asset as Goal & { livePriceUSD?: number }).livePriceUSD || 0,
                totalValueILS: asset.calculatedValue || 0,
                changePercent: (asset as Goal & { changePercent?: number }).changePercent || 0,
                originalCost: asset.current_amount || 0
            };
        });
    }, [assets]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        triggerHaptic();
        await queryClient.invalidateQueries({ queryKey: ['wealthData'] });
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Derived Daily Change
    const portfolioValue = stocks.reduce((sum, s) => sum + s.totalValueILS, 0);

    // Total Portfolio Daily Change Calculation
    const totalDailyChangeILS = stocks.reduce((sum, s) => {
        const prevValueILS = s.totalValueILS / (1 + s.changePercent / 100);
        return sum + (s.totalValueILS - prevValueILS);
    }, 0);

    const totalPortfolioPercent = portfolioValue > 0
        ? (totalDailyChangeILS / (portfolioValue - totalDailyChangeILS)) * 100
        : 0;

    const isTotalPositive = totalDailyChangeILS > 0;
    const isTotalNegative = totalDailyChangeILS < 0;

    // CRUD Operations
    // CRUD Operations
    const handleSave = async () => {
        if (!symbolInput || !sharesInput) {
            toast.error("נא למלא את כל השדות");
            return;
        }

        const quantity = parseFloat(sharesInput);
        if (isNaN(quantity) || quantity <= 0) {
            toast.error("כמות לא תקינה");
            return;
        }

        setLoading(true);
        try {
            // 1. Fetch User
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("User not found");

            // 2. Fetch Live Price for Auto-Calculation
            let initialValueILS = 0;

            // Only fetch if adding new or if we want to overwrite cost (user didn't specify behavior, but "Auto-Price" implies we calculate it now)
            // For now, let's always calculate it based on current market price as the "Cost Basis" if it's a new add. 
            // If editing, we might want to keep original... but the prompt says "Refactor... Remove Manual Input... Implement handleAdd Logic".
            // So for new adds: Calculate. For edits: If we removed input, we might lose original cost if we don't be careful. 
            // However, the prompt is focused on "Add Stock" crash mostly. Let's assume for Edit we keep existing if not changing?
            // Actually, for simplicity and following the "Auto-Price" instruction strictly:

            const res = await fetch('/api/market-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: [symbolInput.toUpperCase()] })
            });

            if (res.ok) {
                const data = await res.json();
                const stockData = data.stocks[symbolInput.toUpperCase()];
                const rate = data.usdToIls || 3.65;
                const price = stockData?.price || 0;
                initialValueILS = price * quantity * rate;
            }

            const payload = {
                user_id: user.id,
                couple_id: profile?.couple_id,
                type: 'stock',
                symbol: symbolInput.toUpperCase(),
                quantity: quantity,
                name: `Stock ${symbolInput.toUpperCase()}`,
                target_amount: 0, // <--- CRITICAL FIX: Satisfy NOT NULL constraint
                brick_color: '#8B5CF6'
            };

            if (editingStock) {
                // Should we recalculate cost on edit? Use case ambiguous. 
                // Let's UPDATE quantities but maybe keep cost? 
                // Or if we removed the input, how does user edit cost? They can't.
                // Let's assume for EDIT we just update quantity/symbol. 
                // The prompt was about "Fix Save Error" which is usually INSERT.
                const { error } = await supabase
                    .from('goals')
                    .update(payload) // updating all fields
                    .eq('id', editingStock.id);
                if (error) throw error;
                toast.success("עודכן בהצלחה");
            } else {
                // Insert with calculated cost
                const insertPayload = {
                    ...payload,
                    current_amount: initialValueILS // <--- CALCULATED AUTOMATICALLY
                };

                const { error } = await supabase
                    .from('goals')
                    .insert([insertPayload]);
                if (error) throw error;
                toast.success("נוסף לתיק בהצלחה");
            }

            closeModals();
            await queryClient.invalidateQueries({ queryKey: ['wealthData'] });
        } catch (e: unknown) {
            console.error("Save Error:", JSON.stringify(e, null, 2));
            const err = e as { message?: string };
            toast.error("שגיאה בשמירה: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, symbol: string) => {
        if (!confirm(`למחוק את ${symbol} מהתיק?`)) return;

        try {
            const { error } = await supabase.from('goals').delete().eq('id', id);
            if (error) throw error;
            toast.success("נמחק בהצלחה");
            await queryClient.invalidateQueries({ queryKey: ['wealthData'] });
        } catch {
            toast.error("שגיאה במחיקה");
        }
    };

    const openAdd = () => {
        setEditingStock(null);
        setSymbolInput("");
        setSharesInput("");
        // setCostInput(""); 
        setIsAddOpen(true);
    };

    const openEdit = (stock: StockDisplay) => {
        setEditingStock(stock);
        setSymbolInput(stock.symbol);
        setSharesInput(stock.shares.toString());
        // setCostInput(stock.originalCost.toString());
        setIsAddOpen(true);
    };

    const closeModals = () => {
        setIsAddOpen(false);
        setEditingStock(null);
    };

    return (
        <div className="w-full space-y-6">
            {/* 1. Header Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl group touch-pan-y">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/5" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-50" />

                <div className="p-6 relative z-10 flex flex-col h-full min-h-[160px]">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-sm font-bold text-white/60 tracking-widest uppercase flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-purple-400" />
                            תיק השקעות חי
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90 disabled:opacity-50"
                                title="רענן נתונים"
                            >
                                <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin text-purple-400")} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-6">
                        <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg tabular-nums">
                            {formatAmount(portfolioValue, isStealthMode, CURRENCY_SYMBOL, '***')}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "text-sm font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-md border",
                                isTotalPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]" :
                                    isTotalNegative ? "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(251,113,133,0.1)]" :
                                        "text-white/40 bg-white/5 border-white/10"
                            )}>
                                {isTotalPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isTotalNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                                <span className="tabular-nums">
                                    {isTotalPositive ? '+' : ''}{formatAmount(totalDailyChangeILS, isStealthMode, CURRENCY_SYMBOL, '***')}
                                    <span className="mx-1 opacity-40">|</span>
                                    יומי: {totalPortfolioPercent.toFixed(2)}%
                                </span>
                            </div>
                            <div className="text-[10px] text-white/30 font-mono uppercase tracking-wider ml-auto">
                                שער דולר: {CURRENCY_SYMBOL}{usdToIls.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <Button
                            onClick={openAdd}
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/5 backdrop-blur-md transition-all hover:scale-105 active:scale-95 px-5"
                        >
                            <Plus className="w-4 h-4 ml-1.5" /> הוסף מניה
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Stock Lists */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {stocks.map((stock) => {
                        const isPositive = stock.changePercent >= 0;
                        const prevValueILS = stock.totalValueILS / (1 + stock.changePercent / 100);
                        const dailyProfitILS = stock.totalValueILS - prevValueILS;
                        const isProfitPositive = dailyProfitILS > 0;

                        return (
                            <motion.div
                                key={stock.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                            >
                                <SwipeableRow
                                    onEdit={() => openEdit(stock)}
                                    onDelete={() => handleDelete(stock.id, stock.symbol)}
                                    className="bg-transparent"
                                >
                                    <div className="flex items-center justify-between p-4 relative z-10 w-full">
                                        {/* LEFT: Ticker + Qty */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center font-black text-xs text-white border border-white/10 shadow-inner">
                                                {stock.symbol}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white leading-none">
                                                    {stock.symbol}
                                                </div>
                                                <div className="text-xs text-white/50 mt-1">
                                                    {stock.shares} יח׳
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT: Value + Price/Change */}
                                        <div className="text-left min-w-[120px]">
                                            <div className={`font-bold text-lg tabular-nums leading-none ${isProfitPositive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : dailyProfitILS < 0 ? 'text-rose-400' : 'text-white'}`}>
                                                {formatAmount(stock.totalValueILS, isStealthMode, CURRENCY_SYMBOL, '***')}
                                            </div>
                                            <div className="flex flex-col items-end mt-1.5">
                                                <div className={`text-[10px] font-bold flex items-center leading-none ${isProfitPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isProfitPositive ? '+' : ''}{formatAmount(dailyProfitILS, isStealthMode, CURRENCY_SYMBOL, '***')}
                                                    <span className="mx-1 text-white/20">|</span>
                                                    {isProfitPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                                                    {Math.abs(stock.changePercent).toFixed(1)}%
                                                </div>
                                                <div className="text-[9px] text-white/20 font-mono mt-0.5">
                                                    ${isStealthMode ? '***' : stock.currentPriceUSD.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableRow>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {(isRefreshing && stocks.length === 0) ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-12 bg-white/10" />
                                        <Skeleton className="h-3 w-16 bg-white/5" />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col items-end">
                                    <Skeleton className="h-5 w-20 bg-white/10" />
                                    <Skeleton className="h-3 w-12 bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {stocks.length === 0 && (
                            <EmptyState
                                icon={Sparkles}
                                title="אין עדיין מניות?"
                                description="הוסף את המניה הראשונה שלך והתחל לעקוב!"
                                actionLabel="הוסף מניה"
                                onAction={openAdd}
                            />
                        )}
                    </>
                )}

                {/* Error handling moved to useWealth hook level */}
            </div>

            {/* Dialog for Add/Edit */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>{editingStock ? 'עריכת החזקה' : 'הוספת מניה לתיק'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs text-white/50">סימול (Ticker)</label>
                            <Input
                                placeholder="AAPL, NVDA..."
                                value={symbolInput}
                                onChange={e => setSymbolInput(e.target.value.toUpperCase())}
                                className="bg-white/5 border-white/10 text-white font-mono uppercase text-lg tracking-widest"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-white/50">כמות מניות</label>
                            <Input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={sharesInput}
                                onChange={e => setSharesInput(e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-lg"
                            />
                        </div>
                        {/* Cost input removed for auto-calculation */}

                        <div className="pt-2 flex gap-2">
                            <Button variant="ghost" className="flex-1" onClick={closeModals}>ביטול</Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-purple-900/40"
                            >
                                {loading ? <><Loader2 className="w-4 h-4 ml-1 animate-spin" /> שומר ומתמחר...</> : "שמור בתיק"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
