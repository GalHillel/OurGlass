"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, TrendingUp, TrendingDown, RefreshCcw, Trash2, Rocket, Edit2, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeableRow } from "@/components/SwipeableRow";
import { EmptyState } from "@/components/EmptyState";
import { Goal } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface StockPortfolioProps {
    assets?: Goal[];
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

export const StockPortfolio = ({ assets = [] }: StockPortfolioProps) => {
    const supabaseRef = useRef(createClientComponentClient());
    const supabase = supabaseRef.current;
    const [stocks, setStocks] = useState<StockDisplay[]>([]);
    const [exchangeRate, setExchangeRate] = useState(3.65); // Default fallback
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isCachedData, setIsCachedData] = useState(false);

    // Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<StockDisplay | null>(null);

    // Form State
    // Form State
    const [symbolInput, setSymbolInput] = useState("");
    const [sharesInput, setSharesInput] = useState("");
    // const [costInput, setCostInput] = useState(""); // Removed in favor of auto-calc
    // const [costInput, setCostInput] = useState(""); // Removed in favor of auto-calc

    // Filter relevant assets - memoized to prevent unnecessary recalculations
    const stockAssets = useMemo(() => assets.filter(a => a.type === 'stock' && a.symbol), [assets]);

    const fetchPrices = useCallback(async () => {
        if (stockAssets.length === 0) return;
        setRefreshing(true);
        setFetchError(null);

        try {
            const symbols = stockAssets.map(a => a.symbol);
            const res = await fetch('/api/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols })
            });

            if (!res.ok) throw new Error("Failed to fetch prices");

            const data = await res.json();
            const rate = data.exchangeRate || 3.65;
            setExchangeRate(rate);

            // Track if data is from cache
            setIsCachedData(data.meta?.allCached || false);

            const mapped: StockDisplay[] = stockAssets.map(asset => {
                const sym = asset.symbol!;
                // Try exact match or cleaned symbol (e.g. BTC-USD)
                const liveData = data.stocks[sym] || data.stocks[sym.replace('-USD', '')];

                const priceUSD = liveData?.price || 0;
                const change = liveData?.changePercent || 0;
                const shares = asset.quantity || 0;

                // Math: priceUSD * shares * exchangeRate
                const totalILS = priceUSD * shares * rate;

                return {
                    id: asset.id,
                    symbol: sym,
                    shares: shares,
                    currentPriceUSD: priceUSD,
                    totalValueILS: totalILS,
                    changePercent: change,
                    originalCost: asset.current_amount || 0
                };
            });

            setStocks(mapped);
        } catch (err) {
            const errorMessage = (err as Error)?.message || 'Failed to fetch stock data';
            console.error("StockPortfolio fetchPrices error:", errorMessage);
            setFetchError(errorMessage);
            // Keep existing stock data on error (graceful degradation)
        } finally {
            setRefreshing(false);
        }
    }, [stockAssets]);

    useEffect(() => {
        if (stockAssets.length > 0) {
            fetchPrices();
            const interval = setInterval(fetchPrices, 30000);
            return () => clearInterval(interval);
        } else {
            setStocks([]);
        }
    }, [fetchPrices, stockAssets.length]);

    // Derived Totals
    const portfolioValue = stocks.reduce((sum, s) => sum + s.totalValueILS, 0);

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

            const res = await fetch('/api/stocks', {
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
            fetchPrices();
        } catch (e) {
            console.error("Save Error:", JSON.stringify(e, null, 2));
            toast.error("שגיאה בשמירה: " + ((e as any).message || "Unknown error"));
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
            window.location.reload();
        } catch (e) {
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

                <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-sm font-bold text-white/60 tracking-widest uppercase flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-purple-400" />
                            תיק השקעות חי
                        </h2>
                        {refreshing && <RefreshCcw className="w-4 h-4 text-white/20 animate-spin" />}
                        {isCachedData && !refreshing && (
                            <span className="text-[10px] text-yellow-400/70 bg-yellow-500/10 px-2 py-0.5 rounded-full">מטמון</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg tabular-nums">
                            ₪{portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-white/40 font-mono">
                            שער דולר: ₪{exchangeRate.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Quick Add Button */}
                <div className="absolute bottom-6 left-6 z-20">
                    <Button
                        onClick={openAdd}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/5 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4 ml-1" /> הוסף מניה
                    </Button>
                </div>
            </div>

            {/* 2. Stock Lists */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {stocks.map((stock, i) => {
                        const isPositive = stock.changePercent >= 0;

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
                                        <div className="text-left min-w-[100px]">
                                            <div className={`font-bold text-lg tabular-nums leading-none ${stock.totalValueILS > 0 ? 'text-neon-green drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-white'}`}>
                                                ₪{stock.totalValueILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </div>
                                            <div className="flex justify-end items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-white/40 font-mono">
                                                    ${stock.currentPriceUSD.toFixed(1)}
                                                </span>
                                                <span className={`text-[10px] font-bold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                                                    {Math.abs(stock.changePercent).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableRow>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {(refreshing && stocks.length === 0) ? (
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
                        {stockAssets.length === 0 && !fetchError && (
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

                {fetchError && (
                    <div className="text-center py-8 px-4 rounded-2xl border border-red-500/20 bg-red-500/10">
                        <p className="text-red-300/80 text-sm mb-3">שגיאה בטעינת נתוני המניות</p>
                        <Button
                            onClick={() => fetchPrices()}
                            size="sm"
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-500/30"
                        >
                            <RefreshCcw className="w-4 h-4 ml-1" /> נסה שוב
                        </Button>
                    </div>
                )}
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
