"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ReactorCoreProps {
    income: number;
    expenses: number;
    balance: number;
}

export const ReactorCore = ({ income, expenses, balance }: ReactorCoreProps) => {
    // Safe ratio: How much of income is left?
    const safeRatio = Math.max(0, Math.min(balance / income, 1));
    const burnRatio = Math.min(expenses / income, 1);

    // Dynamic color based on health
    const coreColor = safeRatio > 0.2 ? "#10b981" : safeRatio > 0.0 ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* 1. Outer Ring (Income Limit) */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                {/* Spinner */}
                <motion.div
                    className="absolute inset-0 rounded-full border-t-2 border-blue-400/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-2 rounded-full border-b-2 border-blue-600/30"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* 2. The Core (Liquid Level) */}
            <div className="absolute inset-6 rounded-full overflow-hidden bg-slate-950 border border-white/10 shadow-inner">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                {/* Liquid */}
                <motion.div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-900/50 to-blue-500/20 backdrop-blur-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${safeRatio * 100}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 2 }}
                >
                    <div className="absolute top-0 w-full h-1 bg-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                </motion.div>

                {/* The Burn (Expenses) */}
                <motion.div
                    className="absolute top-0 w-full bg-gradient-to-b from-red-900/40 to-transparent pointer-events-none"
                    animate={{ height: `${burnRatio * 100}%` }}
                />
            </div>

            {/* 3. Central Data Display (Floating) */}
            <div className="relative z-20 text-center flex flex-col items-center">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs uppercase tracking-[0.3em] text-blue-200/50 font-bold mb-1"
                >
                    Safe to Spend
                </motion.span>

                <motion.div
                    key={balance}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                    ₪{balance.toLocaleString()}
                </motion.div>

                <div className="mt-2 flex gap-4 text-[10px] font-mono text-blue-200/40">
                    <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        IN: {((income / 1000).toFixed(1))}k
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        OUT: {((expenses / 1000).toFixed(1))}k
                    </span>
                </div>
            </div>

            {/* 4. Particle Glow Behind */}
            <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

        </div>
    );
};
