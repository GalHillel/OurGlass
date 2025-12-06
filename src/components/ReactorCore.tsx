"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

interface ReactorCoreProps {
    income: number;
    expenses: number;
    balance: number;
}

export const ReactorCore = ({ income, expenses, balance }: ReactorCoreProps) => {
    // Safe ratio calculation
    const safeRatio = Math.max(0, Math.min(balance / income, 1));
    const isCrisis = balance < 0;

    return (
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">

            {/* 1. Outer Chassis (Glass Ring) */}
            <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_60px_rgba(255,255,255,0.05)]" />

            {/* 2. Dynamic Status Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 p-2">
                {/* Background Track */}
                <circle
                    cx="50%" cy="50%" r="48%"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4"
                />
                {/* Progress Indicator */}
                <motion.circle
                    cx="50%" cy="50%" r="48%"
                    fill="none"
                    stroke={isCrisis ? "#ef4444" : "#3b82f6"} // Red or Blue
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="300%"
                    initial={{ strokeDashoffset: "300%" }}
                    animate={{ strokeDashoffset: `${300 - (safeRatio * 300)}%` }} // Approximate circumference logic
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="drop-shadow-[0_0_10px_currentColor]"
                />
            </svg>

            {/* 3. Spinning HUD Elements (Subtle) */}
            <motion.div
                className="absolute inset-4 rounded-full border border-dashed border-white/20 opacity-30"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute inset-8 rounded-full border-t border-white/20 opacity-20"
                animate={{ rotate: -180 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />

            {/* 4. The Core Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mb-2"
                >
                    <div className={`w-2 h-2 rounded-full ${isCrisis ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
                        {isCrisis ? "חריגה" : "פנוי לשימוש"}
                    </span>
                </motion.div>

                <div className="relative">
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter drop-shadow-2xl">
                        ₪<CountUp end={balance} separator="," duration={2.5} />
                    </h1>
                    {/* Gloss Effect on text */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none mix-blend-overlay" />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 flex items-center gap-6 text-[11px] font-mono text-white/30"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-emerald-400/80">IN</span>
                        <span>₪{(income / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-red-400/80">OUT</span>
                        <span>₪{(expenses / 1000).toFixed(1)}k</span>
                    </div>
                </motion.div>
            </div>

            {/* 5. Ambient Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 ${isCrisis ? "bg-red-500/20" : "bg-blue-500/10"} blur-[100px] rounded-full -z-10 transition-colors duration-1000`} />
        </div>
    );
};
