"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Goal } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface StockPortfolioProps {
    assets?: Goal[];
}

interface StockDisplay {
    id: string;
    symbol: string;
    shares: number;
    // avgPrice removed, calculated from costBasis / shares if needed
    costBasis: number;
    currentPrice: number; // Live per share
    currency: string;
}

export const StockPortfolio = ({ assets = [] }: StockPortfolioProps) => {
    const supabase = createClientComponentClient();
    const [stocks, setStocks] = useState<StockDisplay[]>([]);
    const [usdToIls, setUsdToIls] = useState(3.7);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newSymbol, setNewSymbol] = useState("");
    const [newShares, setNewShares] = useState("");
    const [newCost, setNewCost] = useState("");
    const [loading, setLoading] = useState(false);

    // Filter only stock assets that have a symbol
    const stockAssets = assets.filter(a => a.type === 'stock' && a.symbol);

    const fetchPrices = async () => {
        if (stockAssets.length === 0) return;
        setLoading(true);

        try {
            const symbols = stockAssets.map(a => a.symbol);
            const res = await fetch('/api/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols })
            });

            if (!res.ok) throw new Error("Failed to fetch prices");
            const data = await res.json();

            setUsdToIls(data.usdToIls || 3.75);

            // Merge DB data with Live Data
            const mapped: StockDisplay[] = stockAssets.map(asset => {
                const liveData = data.stocks.find((s: any) => s.symbol === asset.symbol);
                const currentPrice = liveData?.price || 0;

                return {
                    id: asset.id,
                    symbol: asset.symbol!,
                    shares: asset.quantity || 1,
                    costBasis: asset.current_amount, // DB holds Cost Basis
                    currentPrice: currentPrice,
                    currency: liveData?.currency || 'USD'
                };
            });

            setStocks(mapped);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (stockAssets.length > 0) {
            fetchPrices();
            // Poll every 30 seconds
            const interval = setInterval(fetchPrices, 30000);
            return () => clearInterval(interval);
        } else {
            setStocks([]);
        }
    }, [assets]); // Re-run when assets change (e.g. added new stock)

    const totalValueILS = stocks.reduce((sum, s) => {
        const val = s.shares * s.currentPrice;
        return sum + (s.currency === 'USD' ? val * usdToIls : val);
    }, 0);

    const totalCostILS = stocks.reduce((sum, s) => sum + s.costBasis, 0); // Assuming stored is ILS
    const totalGain = totalValueILS - totalCostILS;
    const gainPercent = totalCostILS > 0 ? (totalGain / totalCostILS) * 100 : 0;

    const handleAdd = async () => {
        if (!newSymbol || !newShares || !newCost) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('goals').insert({
                name: `Stock ${newSymbol}`,
                target_amount: 0, // Not relevant for stock wrapper
                current_amount: Number(newCost), // Store Cost Basis
                type: 'stock',
                symbol: newSymbol.toUpperCase(),
                quantity: Number(newShares),
                growth_rate: 0, // Will be calculated dynamically
                brick_color: '#A855F7'
            });

            if (error) throw error;
            setIsAddOpen(false);
            setNewSymbol("");
            setNewShares("");
            setNewCost("");
            // Parent component (WealthPage) needs to refresh?
            // Ideally we call a callback prop `onRefresh`, but for now we rely on Supabase subscription or manual refresh.
            // Since we don't have real-time subscription set up in WealthPage, we might need to Trigger reload.
            window.location.reload(); // Brute force refresh to verify
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Header / Summary */}
            <div className="glass p-6 rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-slate-900 to-purple-900/20 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-white/60 text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-400" />
                            תיק מניות בזמן אמת
                        </h2>
                        <div className="mt-2 text-4xl font-black text-white tracking-tight">
                            ₪{totalValueILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-sm font-bold ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs">
                                {gainPercent.toFixed(2)}%
                            </span>
                        </div>
                        <div className="text-xs text-white/30 mt-1">שער דולר: ₪{usdToIls.toFixed(2)}</div>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50">
                                <Plus className="w-6 h-6" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>הוספת מניה לתיק</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input
                                    placeholder="סימול (למשל AAPL)"
                                    value={newSymbol}
                                    onChange={e => setNewSymbol(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Input
                                    placeholder="כמות יחידות"
                                    type="number"
                                    value={newShares}
                                    onChange={e => setNewShares(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Input
                                    placeholder="עלות כוללת (בשקלים)"
                                    type="number"
                                    value={newCost}
                                    onChange={e => setNewCost(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Button onClick={handleAdd} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 font-bold">
                                    {loading ? "מוסיף..." : "הוסף לתיק ההרפתקאות"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stock List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {stocks.map((stock) => {
                            const val = stock.shares * stock.currentPrice * (stock.currency === 'USD' ? usdToIls : 1);
                            const gain = val - stock.costBasis;
                            const isPositive = gain >= 0;

                            return (
                                <motion.div
                                    key={stock.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs">
                                            {stock.symbol}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white leading-none">{stock.shares} יח'</div>
                                            <div className="text-xs text-white/40 mt-1">${stock.currentPrice.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <div className="font-bold text-white">
                                            ₪{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                        <div className={`text-xs font-medium flex justify-end items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {stock.costBasis > 0 ? (Math.abs(gain / stock.costBasis) * 100).toFixed(1) : 0}%
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                    {stockAssets.length === 0 && (
                        <div className="text-center text-white/40 text-sm py-4">
                            התיק ריק... זמן להתחיל להשקיע? 🚀
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
