"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Stock {
    symbol: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
}

export const StockPortfolio = () => {
    // Mock Data - In real app, fetch from DB
    const [stocks, setStocks] = useState<Stock[]>([
        { symbol: "AAPL", shares: 10, avgPrice: 180, currentPrice: 220 },
        { symbol: "NVDA", shares: 5, avgPrice: 900, currentPrice: 1200 },
    ]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newSymbol, setNewSymbol] = useState("");
    const [newShares, setNewShares] = useState("");

    // Mock Real-Time Updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStocks(prev => prev.map(stock => ({
                ...stock,
                currentPrice: stock.currentPrice * (1 + (Math.random() * 0.02 - 0.01)) // Random +/- 1%
            })));
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const totalValueUSD = stocks.reduce((sum, s) => sum + (s.shares * s.currentPrice), 0);
    const totalCostUSD = stocks.reduce((sum, s) => sum + (s.shares * s.avgPrice), 0);
    const totalGain = totalValueUSD - totalCostUSD;
    const gainPercent = (totalGain / totalCostUSD) * 100;

    const EXCHANGE_RATE = 3.75; // USD to ILS

    const handleAdd = () => {
        if (!newSymbol || !newShares) return;
        setStocks(prev => [...prev, {
            symbol: newSymbol.toUpperCase(),
            shares: Number(newShares),
            avgPrice: Math.random() * 1000, // Mock price
            currentPrice: Math.random() * 1000
        }]);
        setNewSymbol("");
        setNewShares("");
        setIsAddOpen(false);
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
                            ₪{(totalValueUSD * EXCHANGE_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-sm font-bold ${totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalGain >= 0 ? '+' : ''}{(totalGain * EXCHANGE_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })} ₪
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs">
                                {gainPercent.toFixed(2)}%
                            </span>
                        </div>
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
                                <Button onClick={handleAdd} className="w-full bg-purple-600 hover:bg-purple-500 font-bold">
                                    הוסף לתיק ההרפתקאות
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stock List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {stocks.map((stock) => {
                            const stockGain = (stock.currentPrice - stock.avgPrice) * stock.shares;
                            const isPositive = stockGain >= 0;

                            return (
                                <motion.div
                                    key={stock.symbol}
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
                                            ₪{(stock.currentPrice * stock.shares * EXCHANGE_RATE).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                        <div className={`text-xs font-medium flex justify-end items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs((stockGain / (stock.avgPrice * stock.shares)) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
