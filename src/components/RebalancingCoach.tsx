"use client";

import { useMemo } from "react";
import { Goal } from "@/types";
import { PieChart as PieIcon, AlertTriangle, Check, ArrowRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface RebalancingCoachProps {
    assets: Goal[];
    totalWealth: number;
}

interface Allocation {
    name: string;
    current: number;
    target: number;
    diff: number;
    color: string;
}

const TARGET_ALLOCATIONS: Record<string, { target: number; color: string; label: string }> = {
    stocks: { target: 40, color: "#8b5cf6", label: "מניות" },
    cash: { target: 25, color: "#10b981", label: "מזומן / חסכון" },
    real_estate: { target: 20, color: "#3b82f6", label: "נדל\"ן" },
    crypto: { target: 10, color: "#f472b6", label: "קריפטו" },
    other: { target: 5, color: "#9ca3af", label: "אחר" },
};

export function RebalancingCoach({ assets, totalWealth }: RebalancingCoachProps) {
    const allocations = useMemo((): Allocation[] => {
        if (totalWealth === 0) return [];

        const buckets: Record<string, number> = {
            stocks: 0,
            cash: 0,
            real_estate: 0,
            crypto: 0,
            other: 0,
        };

        assets.forEach((asset) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const val = Number((asset as any).calculatedValue || asset.current_amount || 0);

            if (asset.investment_type === "crypto") buckets.crypto += val;
            else if (asset.investment_type === "real_estate") buckets.real_estate += val;
            else if (asset.type === "stock") buckets.stocks += val;
            else if (asset.type === "cash") buckets.cash += val;
            else buckets.other += val;
        });

        return Object.entries(TARGET_ALLOCATIONS).map(([key, config]) => {
            const current = totalWealth > 0 ? (buckets[key] / totalWealth) * 100 : 0;
            return {
                name: config.label,
                current: Math.round(current * 10) / 10,
                target: config.target,
                diff: Math.round((current - config.target) * 10) / 10,
                color: config.color,
            };
        });
    }, [assets, totalWealth]);

    const [isOpen, setIsOpen] = useState(false);

    const needsRebalancing = allocations.some((a) => Math.abs(a.diff) > 10);
    const maxDeviation = allocations.reduce((max, a) => Math.max(max, Math.abs(a.diff)), 0);

    if (totalWealth === 0 || allocations.length === 0) return null;

    return (
        <div className="neon-card rounded-2xl p-4 space-y-0">
            {/* Header (Clickable) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-right outline-none group"
            >
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${needsRebalancing ? "bg-orange-500/20" : "bg-emerald-500/20"
                        }`}>
                        {needsRebalancing ? (
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                        ) : (
                            <Check className="w-4 h-4 text-emerald-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">מנטור איזון תיק</h3>
                        <p className="text-[10px] text-white/40">
                            {needsRebalancing
                                ? `סטייה מקסימלית: ${maxDeviation.toFixed(0)}%`
                                : "התיק מאוזן היטב!"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${needsRebalancing
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-emerald-500/10 text-emerald-400"
                            }`}
                    >
                        {needsRebalancing ? "דורש תשומת לב" : "מצוין"}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="p-1 rounded-full bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden space-y-3"
                    >
                        {allocations
                            .filter((a) => a.current > 0 || a.target > 5)
                            .map((alloc) => (
                                <div key={alloc.name} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/70">{alloc.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-white/50">{alloc.current}%</span>
                                            <ArrowRight className="w-3 h-3 text-white/20" />
                                            <span className="font-mono text-white/80">{alloc.target}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                        {/* Target marker */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
                                            style={{ left: `${alloc.target}%` }}
                                        />
                                        {/* Current */}
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: alloc.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(alloc.current, 100)}%` }}
                                            transition={{ duration: 0.8, delay: 0.1 }}
                                        />
                                    </div>
                                    {Math.abs(alloc.diff) > 5 && (
                                        <p className="text-[10px] text-orange-300/60">
                                            {alloc.diff > 0
                                                ? `עודף של ${alloc.diff}% — שקול להעביר לסוגים אחרים`
                                                : `חוסר של ${Math.abs(alloc.diff)}% — שקול להגדיל`}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
