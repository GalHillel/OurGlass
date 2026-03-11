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
        if (isRefreshing) return;
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
        if (loading) return;

        if (!symbolInput || !sharesInput) {
            toast.error("נא למלא את כל השדות");
            return;
        }

        const quantity = parseFloat(sharesInput);
        if (!Number.isFinite(quantity) || quantity <= 0) {
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
                initialValueILS = Number.isFinite(price * quantity * rate) ? (price * quantity * rate) : 0;
            }

            const payload = {
                user_id: user.id,
                couple_id: profile?.couple_id,
                type: 'stock',
                symbol: symbolInput.toUpperCase(),
                quantity: quantity,
                currency: 'USD',
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
            {/* 1. Header Card - Compact & Powerful (Refined & Centered) */}
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl group touch-pan-y">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/5 opacity-30" />

                <div className="p-8 relative z-10 flex flex-col items-center text-center">
                    {/* Icon & Floating Buttons */}
                    <div className="relative mb-6">
                        <div className="p-3.5 bg-purple-500/20 rounded-[2rem] border border-purple-500/30">
                            <Rocket className="w-6 h-6 text-purple-400" />
                        </div>

                        {/* Top-Right: Refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="absolute -top-4 -right-24 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90 disabled:opacity-50 border border-white/10"
                        >
                            <RefreshCcw className={cn("w-4 h-4", isRefreshing && "animate-spin text-purple-400")} />
                        </button>

                        {/* Top-Left: Add */}
                        <button
                            onClick={openAdd}
                            className="absolute -top-4 -left-24 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90 border border-white/10"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-1 mb-6">
                        <h2 className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">
                            תיק השקעות חי
                        </h2>
                        <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                            {formatAmount(portfolioValue, isStealthMode, CURRENCY_SYMBOL, '***')}
                        </div>
                    </div>

                    {/* Daily Performance Pill - Centered */}
                    <div className={cn(
                        "inline-flex items-center gap-2.5 px-5 py-2 rounded-full backdrop-blur-md border mb-8",
                        isTotalPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]" :
                            isTotalNegative ? "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(251,113,133,0.1)]" :
                                "text-white/40 bg-white/5 border-white/10"
                    )}>
                        {isTotalPositive ? <TrendingUp className="w-4 h-4" /> : isTotalNegative ? <TrendingDown className="w-4 h-4" /> : null}
                        <span className="font-black text-xs tabular-nums uppercase tracking-wide">
                            יומי: {totalPortfolioPercent.toFixed(2)}%
                            <span className="mx-2 opacity-30">|</span>
                            {isTotalPositive ? '+' : ''}{formatAmount(totalDailyChangeILS, isStealthMode, CURRENCY_SYMBOL, '***')}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="text-[10px] text-white/30 font-mono font-black uppercase tracking-[0.2em]">
                            שער חליפין: {CURRENCY_SYMBOL}{(Number.isFinite(usdToIls) ? usdToIls : 3.65).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stock Rows Header - Dense Labeling (Fixed Grid) */}
            <div className="px-4 py-2 grid grid-cols-12 gap-1 text-[10px] font-black text-white/20 uppercase tracking-[0.1em]" dir="rtl">
                <div className="col-span-2 text-right">נייר</div>
                <div className="col-span-2 text-center">כמות</div>
                <div className="col-span-2 text-center">מחיר</div>
                <div className="col-span-2 text-center">שינוי</div>
                <div className="col-span-4 text-left">שווי (₪)</div>
            </div>

            <div className="space-y-2 pb-10 touch-pan-y">
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
                                className="group relative overflow-hidden rounded-[1.5rem] bg-black/40 border border-white/5 hover:border-white/20 transition-all"
                            >
                                {/* Sparkline Background Effect */}
                                <div className={cn(
                                    "absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.08]",
                                    isPositive ? "bg-gradient-to-t from-emerald-500 via-transparent to-transparent" : "bg-gradient-to-t from-rose-500 via-transparent to-transparent"
                                )} />

                                <SwipeableRow
                                    onEdit={() => openEdit(stock)}
                                    onDelete={() => handleDelete(stock.id, stock.symbol)}
                                    className="bg-transparent"
                                >
                                    <div className="grid grid-cols-12 gap-1 items-center p-4 relative z-10 w-full h-16" dir="rtl">
                                        {/* Ticker - ICON ONLY */}
                                        <div className="col-span-2 flex items-center gap-2 overflow-hidden">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-[10px] border shadow-inner transition-all group-hover:scale-110",
                                                isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                            )}>
                                                {stock.symbol.substring(0, 4)}
                                            </div>
                                        </div>

                                        {/* Qty */}
                                        <div className="col-span-2 text-center tabular-nums font-mono text-[11px] text-white/60">
                                            {stock.shares}
                                        </div>

                                        {/* Price USD */}
                                        <div className="col-span-2 text-center tabular-nums font-mono text-[11px] text-white/80" dir="ltr">
                                            ${stock.currentPriceUSD.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                        </div>

                                        {/* Change % */}
                                        <div className="col-span-2 text-center" dir="ltr">
                                            <div className={cn(
                                                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black",
                                                isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                            )}>
                                                {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
                                            </div>
                                        </div>

                                        {/* Value ILS */}
                                        <div className="col-span-4 text-left font-mono font-black text-[14px] tabular-nums text-white truncate leading-none">
                                            {formatAmount(stock.totalValueILS, isStealthMode, CURRENCY_SYMBOL, '***')}
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
                <DialogContent className="bg-black/60 backdrop-blur-xl border border-white/10 text-white max-w-sm rounded-3xl">
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
                                className="bg-black/50 border-white/10 text-white font-mono uppercase text-lg tracking-widest"
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
                                className="bg-black/50 border-white/10 text-white text-lg"
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
