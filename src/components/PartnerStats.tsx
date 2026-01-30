"use client";

import { useMemo } from "react";
import { Transaction, Subscription } from "@/types";
import { motion } from "framer-motion";
import { PAYERS } from "@/lib/constants";

interface PartnerStatsProps {
    transactions: Transaction[];
    subscriptions?: Subscription[];
    monthlyBudget?: number;
}

export const PartnerStats = ({ transactions, subscriptions = [], monthlyBudget = 0 }: PartnerStatsProps) => {
    // Calculate totals safely
    const stats = useMemo(() => {
        const himTotal = transactions
            .filter(t => t.payer === "him")
            .reduce((sum, t) => sum + Number(t.amount), 0) +
            subscriptions
                .filter(s => s.owner === 'him')
                .reduce((sum, s) => sum + Number(s.amount), 0);

        const herTotal = transactions
            .filter(t => t.payer === "her")
            .reduce((sum, t) => sum + Number(t.amount), 0) +
            subscriptions
                .filter(s => s.owner === 'her')
                .reduce((sum, s) => sum + Number(s.amount), 0);

        const jointTotal = transactions
            .filter(t => t.payer === "joint")
            .reduce((sum, t) => sum + Number(t.amount), 0) +
            subscriptions
                .filter(s => !s.owner || s.owner === 'joint')
                .reduce((sum, s) => sum + Number(s.amount), 0);

        const total = himTotal + herTotal + jointTotal;

        // Percentages
        const himPct = total > 0 ? (himTotal / total) * 100 : 0;
        const herPct = total > 0 ? (herTotal / total) * 100 : 0;
        const jointPct = total > 0 ? (jointTotal / total) * 100 : 0;

        return { himTotal, herTotal, jointTotal, himPct, herPct, jointPct, total };
    }, [transactions, subscriptions]);

    if (transactions.length === 0 && subscriptions.length === 0) return null;

    return (
        <div className="w-full px-6 mt-4">
            <div className="neon-card p-5 rounded-3xl flex flex-col gap-4">
                {/* Stats Row */}
                <div className="flex justify-between items-end">
                    {/* HIM */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1">{PAYERS.HIM}</span>
                        <span className="text-xl font-black text-blue-100 neon-text">₪{stats.himTotal.toLocaleString()}</span>
                    </div>

                    {/* JOINT */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-1">{PAYERS.JOINT}</span>
                        <span className="text-xl font-black text-purple-100 neon-text">₪{stats.jointTotal.toLocaleString()}</span>
                    </div>

                    {/* HER */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider mb-1">{PAYERS.HER}</span>
                        <span className="text-xl font-black text-pink-100 neon-text">₪{stats.herTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* 3-Segment Single Flex Bar */}
                <div className="relative h-4 w-full bg-slate-800/50 rounded-full overflow-hidden flex">
                    {/* HIM Segment */}
                    {stats.himPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.himPct}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 h-full"
                        />
                    )}

                    {/* JOINT Segment */}
                    {stats.jointPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.jointPct}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            className="bg-gradient-to-r from-purple-600 to-purple-500 h-full"
                        />
                    )}

                    {/* HER Segment */}
                    {stats.herPct > 0 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.herPct}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                            className="bg-gradient-to-r from-pink-600 to-pink-500 h-full"
                        />
                    )}
                </div>

                {/* Legend Dots */}
                <div className="flex justify-between text-[10px] text-white/40 font-mono pt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span>{Math.round(stats.himPct)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        <span>{Math.round(stats.jointPct)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                        <span>{Math.round(stats.herPct)}%</span>
                    </div>
                </div>
            </div>

            {/* Subscription Fatigue Alert */}
            {(() => {
                if (subscriptions.length === 0 || !monthlyBudget) return null;
                const totalSubs = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
                const ratio = totalSubs / monthlyBudget;

                if (ratio > 0.4) {
                    return (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3"
                        >
                            <div className="p-1.5 bg-red-500/20 rounded-full shrink-0 animate-pulse">
                                <span className="text-xs">⚠️</span>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-red-300 mb-0.5">עייפות מנויים מזוהה</h4>
                                <p className="text-[10px] text-red-200/70 leading-tight">
                                    ההוצאות הקבועות שלך מהוות {Math.round(ratio * 100)}% מההכנסה הפנויה. זה גבוה מהמומלץ (30%).
                                </p>
                            </div>
                        </motion.div>
                    );
                }
                return null;
            })()}
        </div>
    );
};
