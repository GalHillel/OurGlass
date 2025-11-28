"use client";

import { Rocket, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StockRocketProps {
    currentAmount: number;
    growthRate: number; // Annual return in %
    name: string;
}

export const StockRocket = ({ currentAmount, growthRate, name }: StockRocketProps) => {
    // Simple projection: Value in 10 years = P * (1 + r)^10
    const projectedValue = currentAmount * Math.pow(1 + growthRate / 100, 10);
    const profit = projectedValue - currentAmount;

    return (
        <div className="w-full max-w-md p-4">
            <h3 className="text-white/80 text-lg mb-4 font-medium px-2 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-400" />
                {name}
            </h3>
            <div className="glass p-6 rounded-3xl relative overflow-hidden group">
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-50" />

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-white/60 text-sm mb-1">שווי נוכחי</p>
                        <h4 className="text-3xl font-bold text-white">₪{currentAmount.toLocaleString()}</h4>

                        <div className="mt-4 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-bold">+{growthRate}% שנתי</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-white/40 text-xs mb-1">בעוד 10 שנים</p>
                        <p className="text-xl font-bold text-purple-200">₪{projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-emerald-400/80">
                            (+₪{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                        </p>
                    </div>
                </div>

                {/* Rocket Animation */}
                <motion.div
                    className="absolute right-4 top-4 opacity-20 group-hover:opacity-40 transition-opacity"
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Rocket className="w-24 h-24 text-purple-500" />
                </motion.div>
            </div>
        </div>
    );
};
