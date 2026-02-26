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
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 relative overflow-hidden group flex flex-col transition-all duration-300">
            {/* Header - Always Visible & Clickable */}
            <button
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    triggerHaptic();
                }}
                className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                        <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-bold text-white leading-tight">צפי דיבידנדים</h3>
                        {totalForecast > 0 && !isExpanded && (
                            <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-0.5 font-mono">
                                {formatAmount(totalForecast, isStealthMode, '$', '***')} EST.
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
                                        <div key={idx} className="flex justify-between items-center p-3.5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group/item">
                                            <div className="flex flex-col text-right">
                                                <span className="text-xs font-bold text-white/90 group-hover/item:text-purple-300 transition-colors uppercase tracking-tight">{div?.name}</span>
                                                <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.1em] mt-0.5">EST. DATE: {div?.date}</span>
                                            </div>
                                            <div className="text-left font-mono">
                                                <span className="text-xs font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                                                    +{formatAmount(div?.amount || 0, isStealthMode, '$', '***')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center text-center opacity-30">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-medium">אין דיבידנדים צפויים ברבעון הקרוב</p>
                                </div>
                            )}

                            {totalForecast > 0 && (
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between px-1">
                                    <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">סה״כ רבעוני</span>
                                    <span className="text-lg font-black text-purple-400 tabular-nums font-mono drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                        {formatAmount(totalForecast, isStealthMode, '$', '***')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
