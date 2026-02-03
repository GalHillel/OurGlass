"use client";

import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeableRow } from "@/components/SwipeableRow";
import { Asset } from "@/types";
import { toast } from "sonner";
import { USD_TO_ILS } from "@/lib/demoData";

interface StockPortfolioProps {
    assets?: Asset[];
}

interface StockDisplay {
    id: string;
    symbol: string;
    shares: number;
    currentPriceUSD: number;
    totalValueILS: number;
    changePercent: number;
}

export const StockPortfolio = ({ assets = [] }: StockPortfolioProps) => {
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Map assets to display format
    const stocks: StockDisplay[] = useMemo(() => {
        return assets
            .filter(a => a.type === 'stock')
            .map(asset => ({
                id: asset.id,
                symbol: asset.symbol || '',
                shares: asset.quantity || 0,
                currentPriceUSD: asset.currentPrice || 0,
                // Use calculatedValue if available, otherwise calculate it
                totalValueILS: asset.calculatedValue || ((asset.quantity || 0) * (asset.currentPrice || 0) * 3.65),
                changePercent: asset.changePercent || 0,
            }));
    }, [assets]);

    const portfolioValue = stocks.reduce((sum, s) => sum + s.totalValueILS, 0);

    const handleAddClick = () => {
        toast.info("מצב דמו: לא ניתן להוסיף מניות", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleEdit = () => {
        toast.info("מצב דמו: לא ניתן לערוך מניות", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleDelete = () => {
        toast.info("מצב דמו: לא ניתן למחוק מניות", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/5" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />

                <div className="p-6 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-sm font-bold text-white/60 tracking-widest uppercase flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-purple-400" />
                            תיק השקעות
                        </h2>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="text-4xl font-black text-white tracking-tight drop-shadow-lg tabular-nums">
                            ₪{portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-white/40 font-mono">
                            שער דולר: ₪{USD_TO_ILS.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Quick Add Button */}
                <div className="absolute bottom-6 left-6 z-20">
                    <Button
                        onClick={handleAddClick}
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/5 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4 ml-1" /> הוסף מניה
                    </Button>
                </div>
            </div>

            {/* Stock Lists */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {stocks.map((stock) => {
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
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
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

                {stocks.length === 0 && (
                    <div className="text-center py-12 px-4 rounded-3xl border border-white/5 border-dashed bg-white/5">
                        <Rocket className="w-8 h-8 text-white/20 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">התיק ריק... זה הזמן להתחיל!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
