"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface ReactorCoreProps {
    income: number;
    expenses: number;
    balance: number;
    burnRateStatus?: 'safe' | 'warning' | 'critical';
    cycleStart: Date;
    cycleEnd: Date;
}

export const ReactorCore = ({ income, expenses, balance, burnRateStatus, cycleStart, cycleEnd }: ReactorCoreProps) => {
    const [isPressed, setIsPressed] = useState(false);

    const { percentage, projectedBalance, totalDaysInCycle, daysPassed } = useMemo(() => {
        const totalDays = Math.max(1, Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)));
        const days = Math.max(1, Math.min(totalDays, Math.ceil((new Date().getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))));
        const avg = expenses / days;
        const projected = income - (avg * totalDays);
        const pct = Math.min(Math.max((balance / income) * 100, 0), 100);
        return { percentage: pct, projectedBalance: projected, totalDaysInCycle: totalDays, daysPassed: days };
    }, [balance, income, expenses, cycleStart, cycleEnd]);

    const { color, glowColor, strokeColor, isCrisis, isWarning, isCritical } = useMemo(() => {
        const critical = burnRateStatus === 'critical';
        const crisis = balance < 0;
        const warning = !crisis && percentage < 20;
        return {
            isCritical: critical,
            isCrisis: crisis,
            isWarning: warning,
            color: critical ? "text-red-500" : warning ? "text-amber-500" : "text-cyan-400",
            glowColor: critical ? "shadow-red-500/50" : warning ? "shadow-amber-500/50" : "shadow-cyan-400/50",
            strokeColor: critical ? "#ef4444" : warning ? "#f59e0b" : "#22d3ee"
        };
    }, [burnRateStatus, balance, percentage]);

    const radius = 120;
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            className="relative w-80 h-80 flex items-center justify-center touch-pan-y cursor-pointer"
            onPointerDown={() => { setIsPressed(true); triggerHaptic(); }}
            onPointerUp={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
        >
            {/* Static outer ring - no rotation */}
            <div
                className={cn(
                    "absolute inset-0 rounded-full border border-dashed border-white/5 opacity-30",
                    isCritical && "border-red-500/20"
                )}
            />
            <div className="absolute inset-4 rounded-full border border-dotted border-white/10 opacity-40" />

            {/* Core: static, subtle breathing opacity only - TRANSPARENT to avoid square box */}
            <motion.div
                animate={{ opacity: [0.94, 1, 0.94] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-10 rounded-full bg-transparent border border-white/5 z-10 flex items-center justify-center"
            >

                {/* SVG DATA RINGS - Standard Mode */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-2 transition-opacity duration-300" style={{ opacity: isPressed ? 0.2 : 1 }}>
                    <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    <motion.circle
                        cx="50%" cy="50%" r="90"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circumference * 0.75}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: (2 * Math.PI * 90) - ((percentage / 100) * (2 * Math.PI * 90)) }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="drop-shadow-[0_0_15px_currentColor]"
                    />
                </svg>

                {/* SVG DATA RINGS - GHOST PROJECTION (Forecast) */}
                {isPressed && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 p-2 animate-pulse">
                        {/* Ghost Track - Where we are heading */}
                        <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeDasharray="4 4" />
                        <motion.circle
                            cx="50%" cy="50%" r="90"
                            fill="none"
                            stroke={projectedBalance > 0 ? "#10b981" : "#ef4444"} // Green/Red Logic for forecast
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={circumference * 0.75}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6, strokeDashoffset: (2 * Math.PI * 90) - ((Math.min(Math.max(projectedBalance / income, 0), 1) * 100 / 100) * (2 * Math.PI * 90)) }}
                            className="drop-shadow-[0_0_15px_currentColor]"
                        />
                    </svg>
                )}

                {/* CENTRAL HUD */}
                <div className="relative z-20 text-center flex flex-col items-center">

                    {/* Status Label */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("text-[10px] tracking-[0.2em] font-black uppercase mb-1 transition-colors duration-500", color)}
                    >
                        {isPressed ? "תחזית סוף חודש" : (isCrisis ? "חריגה קריטית" : isWarning ? "שים לב לתקציב" : "מצב יציב")}
                    </motion.div>

                    {/* Main Number */}
                    <div
                        className="flex flex-row items-baseline justify-center gap-1 relative"
                        dir="ltr"
                    >
                        {/* Swap to Ghost Number on Press */}
                        {isPressed ? (
                            <motion.span
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn("text-5xl font-black tracking-tighter drop-shadow-2xl flex items-baseline gap-1", projectedBalance >= 0 ? "text-emerald-400" : "text-red-500")}
                            >
                                {projectedBalance < 0 && <span className="text-3xl">-</span>}
                                <CountUp end={Math.abs(projectedBalance)} duration={0.5} separator="," />
                                <span className="text-xl opacity-50">₪</span>
                            </motion.span>
                        ) : (
                            <>
                                {/* Minus Sign (Left) */}
                                {balance < 0 && (
                                    <span className="text-4xl font-black text-red-400 animate-pulse">-</span>
                                )}

                                {/* Amount (Middle) */}
                                <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                                    <CountUp end={Math.abs(balance)} duration={2} separator="," />
                                </span>

                                {/* Shekel Symbol (Right) */}
                                <span className="text-2xl text-white/30 font-light self-baseline ml-1">₪</span>
                            </>
                        )}

                        {/* Pulse Dot */}
                        {!isPressed && <div className={cn("absolute -right-4 top-2 w-2 h-2 rounded-full animate-pulse", color.replace('text-', 'bg-'))} />}
                    </div>

                    {/* Bottom Data Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-[9px] font-mono text-white/50 border-t border-white/10 pt-2 w-full px-6 transition-all duration-300" style={{ opacity: isPressed ? 0.3 : 1 }}>
                        <div className="flex flex-col text-right">
                            <span className="opacity-50 tracking-wider">הכנסות</span>
                            <span className="text-white">{(income / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="opacity-50 tracking-wider">הוצאות</span>
                            <span className={isCrisis ? "text-red-400" : "text-white"}>{(expenses / 1000).toFixed(1)}K</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 3. DECORATIVE FLOURISH - static */}
            <div className={cn("absolute -inset-4 rounded-full border border-white/5 skew-x-12 opacity-20 pointer-events-none transition-colors duration-1000", isCritical && "border-red-500 opacity-50")} />

        </div>
    );
};
