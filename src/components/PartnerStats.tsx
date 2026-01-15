"use client";

import { useMemo } from "react";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import { PAYERS } from "@/lib/constants";

interface PartnerStatsProps {
    transactions: Transaction[];
}

export const PartnerStats = ({ transactions }: PartnerStatsProps) => {
    // Calculate totals safely
    const stats = useMemo(() => {
        const himTotal = transactions
            .filter(t => t.payer === "him")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const herTotal = transactions
            .filter(t => t.payer === "her")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const jointTotal = transactions
            .filter(t => t.payer === "joint")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const total = himTotal + herTotal + jointTotal;

        // Percentages
        const himPct = total > 0 ? (himTotal / total) * 100 : 0;
        const herPct = total > 0 ? (herTotal / total) * 100 : 0;
        const jointPct = total > 0 ? (jointTotal / total) * 100 : 0;

        return { himTotal, herTotal, jointTotal, himPct, herPct, jointPct, total };
    }, [transactions]);

    if (transactions.length === 0) return null;

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

                {/* 3-Segment Neon Progress Bar */}
                <div className="relative h-5 bg-slate-900 rounded-full overflow-hidden border border-white/10 shadow-inner flex">
                    {/* Background Grid for Texture */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[length:10px_100%] z-0 pointer-events-none" />

                    {/* HIM Segment */}
                    {stats.himPct > 0 && (
                        <motion.div
                            className="bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] h-full relative z-10 first:rounded-l-full last:rounded-r-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.himPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    )}

                    {/* JOINT Segment */}
                    {stats.jointPct > 0 && (
                        <motion.div
                            className="bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)] h-full relative z-10 first:rounded-l-full last:rounded-r-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.jointPct}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        />
                    )}

                    {/* HER Segment */}
                    {stats.herPct > 0 && (
                        <motion.div
                            className="bg-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.5)] h-full relative z-10 first:rounded-l-full last:rounded-r-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.herPct}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                        />
                    )}
                </div>

                {/* Visual Legend / Breakdown Text */}
                <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest px-1">
                    <span className="text-blue-300/50">{Math.round(stats.himPct)}%</span>
                    <span className="text-purple-300/50">{Math.round(stats.jointPct)}%</span>
                    <span className="text-pink-300/50">{Math.round(stats.herPct)}%</span>
                </div>
            </div>
        </div>
    );
};
