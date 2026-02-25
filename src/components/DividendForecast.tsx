"use client";

import { Calendar, TrendingUp, ChevronDown } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { Goal } from "@/types";
import { useMemo, useState } from "react";
import { formatAmount, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";

interface DividendForecastProps {
    assets?: Goal[];
}

const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
    }
    return (Math.abs(hash) % 100) / 100;
};

export const DividendForecast = ({ assets = [] }: DividendForecastProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const [isExpanded, setIsExpanded] = useState(false);

    // Generate dividends based on actual assets
    const upcomingDividends = useMemo(() => assets
        .filter(a => a.type === 'stock')
        .map(asset => {
            const isDividendPayer = asset.name.toLowerCase().includes('apple') ||
                asset.name.toLowerCase().includes('microsoft') ||
                asset.name.toLowerCase().includes('etf') ||
                asset.name.toLowerCase().includes('s&p');

            if (!isDividendPayer && seededRandom(asset.name) > 0.3) return null;

            return {
                name: asset.name,
                amount: Math.round(Number(asset.current_amount) * 0.005), // ~0.5% quarterly
                date: "15/05" // Next quarter mock
            };
        })
        .filter((div): div is { name: string; amount: number; date: string } => div !== null)
        .slice(0, 3), [assets]);

    const totalForecast = upcomingDividends.reduce((sum, item) => sum + (item?.amount || 0), 0);

    return (
        <div className="neon-card rounded-2xl relative overflow-hidden group flex flex-col transition-all duration-300">
            {/* Header - Always Visible & Clickable */}
            <button
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    triggerHaptic();
                }}
                className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-bold text-white leading-tight">צפי דיבידנדים</h3>
                        {totalForecast > 0 && !isExpanded && (
                            <p className="text-[10px] text-purple-300/60 mt-0.5">
                                סה״כ צפוי: {isStealthMode ? '$***' : `$${totalForecast}`}
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-white/20 transition-transform duration-300",
                    isExpanded && "rotate-180 text-purple-400"
                )} />
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4 pt-2">
                            {upcomingDividends.length > 0 ? (
                                <div className="space-y-3">
                                    {upcomingDividends.map((div, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-white/80">{div?.name}</span>
                                                <span className="text-[10px] text-white/40">צפוי ב-{div?.date}</span>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-emerald-300">
                                                +{isStealthMode ? '$***' : `$${div?.amount}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center opacity-50">
                                    <TrendingUp className="w-8 h-8 mb-2" />
                                    <p className="text-xs">אין דיבידנדים צפויים בקרוב</p>
                                </div>
                            )}

                            {totalForecast > 0 && (
                                <div className="pt-3 border-t border-white/10 text-center">
                                    <p className="text-xs font-bold text-purple-300">
                                        סה״כ צפוי ברבעון: {isStealthMode ? '$***' : `$${totalForecast}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
