"use client";

import { motion } from "framer-motion";
import { Gauge, Flame, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetGaugesProps {
    balance: number;
    budget: number;
    daysRemaining: number;
}

export const BudgetGauges = ({ balance, budget, daysRemaining }: BudgetGaugesProps) => {
    // 1. Daily Safe Spend
    // If we have balance, divide by days. If negative, 0.
    const safeDaily = balance > 0 ? balance / Math.max(1, daysRemaining) : 0;

    // 2. Burn Rate (Visual only for now, based on % used)
    const encodedBurn = Math.min(100, Math.max(0, ((budget - balance) / budget) * 100));

    // Colors
    const isSafe = balance > 0;

    return (
        <div className="grid grid-cols-2 gap-3 w-full px-6">

            {/* DAILY GAUGE */}
            <div className="neon-card p-3 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-50 transition-opacity">
                    <Target className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">מותר להיום</span>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    <span className="text-sm text-white/30">₪</span>
                    {Math.round(safeDaily).toLocaleString()}
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (safeDaily / (budget / 30)) * 100)}%` }}
                        className={cn("h-full rounded-full", isSafe ? "bg-blue-500" : "bg-red-500")}
                    />
                </div>
            </div>

            {/* BURN RATE GAUGE */}
            <div className="neon-card p-3 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-50 transition-opacity">
                    <Flame className={cn("w-4 h-4", encodedBurn > 80 ? "text-red-500" : "text-white")} />
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">קצב שריפה</span>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    {Math.round(encodedBurn)}%
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${encodedBurn}%` }}
                        className={cn("h-full rounded-full", encodedBurn > 90 ? "bg-red-500" : encodedBurn > 75 ? "bg-orange-500" : "bg-emerald-500")}
                    />
                </div>
            </div>

        </div>
    );
};
