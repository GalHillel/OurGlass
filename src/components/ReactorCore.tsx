"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    const { percentage, projectedBalance, totalDaysInCycle, daysPassed, daysRemaining } = useMemo(() => {
        const totalDays = Math.max(1, Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)));
        const days = Math.max(1, Math.min(totalDays, Math.ceil((new Date().getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))));
        const avg = expenses / days;
        const projected = income - (avg * totalDays);
        const pct = Math.min(Math.max((balance / income) * 100, 0), 100);
        return {
            percentage: pct,
            projectedBalance: projected,
            totalDaysInCycle: totalDays,
            daysPassed: days,
            daysRemaining: totalDays - days
        };
    }, [balance, income, expenses, cycleStart, cycleEnd]);

    const { color, gradientFrom, gradientTo, strokeColor, isCrisis, isWarning, isCritical, statusEmoji } = useMemo(() => {
        const critical = burnRateStatus === 'critical';
        const crisis = balance < 0;
        const warning = !crisis && percentage < 20;
        const good = !crisis && !warning && percentage >= 50;

        return {
            isCritical: critical,
            isCrisis: crisis,
            isWarning: warning,
            color: critical ? "text-red-400" : warning ? "text-amber-400" : "text-cyan-400",
            gradientFrom: critical ? "#ef4444" : warning ? "#f59e0b" : "#06b6d4",
            gradientTo: critical ? "#dc2626" : warning ? "#d97706" : "#0891b2",
            strokeColor: critical ? "#ef4444" : warning ? "#f59e0b" : "#22d3ee",
            statusEmoji: critical ? "🔴" : warning ? "⚠️" : good ? "✨" : "💎"
        };
    }, [burnRateStatus, balance, percentage]);

    const radius = 110;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            className="relative w-72 h-72 flex items-center justify-center touch-pan-y cursor-pointer select-none"
            onPointerDown={() => { setIsPressed(true); triggerHaptic(); }}
            onPointerUp={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
        >
            {/* Ambient Glow Layer */}
            <div
                className="absolute inset-0 rounded-full opacity-30 blur-3xl transition-all duration-1000"
                style={{
                    background: `radial-gradient(circle, ${gradientFrom}40 0%, transparent 70%)`,
                    transform: isPressed ? 'scale(1.2)' : 'scale(1)'
                }}
            />

            {/* Outer Decorative Rings */}
            <div className="absolute inset-0 rounded-full border border-white/[0.03]" />
            <div className="absolute inset-2 rounded-full border border-white/[0.05] border-dashed" />
            <div className="absolute inset-4 rounded-full border border-white/[0.03]" />

            {/* Progress Track Container */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
                {/* Background Track */}
                <circle
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={strokeWidth}
                />

                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradientFrom} />
                        <stop offset="100%" stopColor={gradientTo} />
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main Progress Arc */}
                <motion.circle
                    cx="140"
                    cy="140"
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{
                        strokeDashoffset: circumference - (percentage / 100) * circumference,
                        opacity: isPressed ? 0.4 : 1
                    }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    filter="url(#glow)"
                />

                {/* Ghost Projection Arc (on press) */}
                <AnimatePresence>
                    {isPressed && (
                        <motion.circle
                            cx="140"
                            cy="140"
                            r={radius - 15}
                            fill="none"
                            stroke={projectedBalance > 0 ? "#10b981" : "#ef4444"}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * (radius - 15)}
                            initial={{ strokeDashoffset: 2 * Math.PI * (radius - 15), opacity: 0 }}
                            animate={{
                                strokeDashoffset: 2 * Math.PI * (radius - 15) - (Math.min(Math.max(projectedBalance / income, 0), 1)) * 2 * Math.PI * (radius - 15),
                                opacity: 0.8
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            filter="url(#glow)"
                        />
                    )}
                </AnimatePresence>

                {/* Tick Marks */}
                {[...Array(12)].map((_, i) => (
                    <line
                        key={i}
                        x1="140"
                        y1="22"
                        x2="140"
                        y2={i % 3 === 0 ? "28" : "25"}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={i % 3 === 0 ? "2" : "1"}
                        transform={`rotate(${i * 30} 140 140)`}
                    />
                ))}
            </svg>

            {/* Central Content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
                {/* Status Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 backdrop-blur-sm",
                        "bg-white/5 border border-white/10"
                    )}
                >
                    <span className="text-xs">{statusEmoji}</span>
                    <span className={cn("text-[10px] font-semibold tracking-wide uppercase", color)}>
                        {isPressed ? "תחזית" : (isCrisis ? "חריגה" : isWarning ? "שים לב" : "יציב")}
                    </span>
                </motion.div>

                {/* Main Balance Display */}
                <div className="flex flex-row items-baseline justify-center gap-0.5" dir="ltr">
                    <AnimatePresence mode="wait">
                        {isPressed ? (
                            <motion.div
                                key="projected"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="flex items-baseline gap-0.5"
                            >
                                {projectedBalance < 0 && <span className="text-2xl font-bold text-red-400">-</span>}
                                <span className={cn(
                                    "text-4xl font-black tracking-tight",
                                    projectedBalance >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    <CountUp end={Math.abs(projectedBalance)} duration={0.5} separator="," />
                                </span>
                                <span className="text-lg text-white/30 font-light ml-0.5">₪</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="balance"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="flex items-baseline gap-0.5"
                            >
                                {balance < 0 && <span className="text-3xl font-bold text-red-400 animate-pulse">-</span>}
                                <span className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                    <CountUp end={Math.abs(balance)} duration={2} separator="," />
                                </span>
                                <span className="text-xl text-white/25 font-light ml-0.5">₪</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Subtitle */}
                <motion.p
                    className="text-[10px] text-white/40 mt-1 font-medium"
                    animate={{ opacity: isPressed ? 0.3 : 1 }}
                >
                    {isPressed ? "סוף החודש" : `נותרו ${daysRemaining} ימים`}
                </motion.p>

                {/* Stats Row */}
                <motion.div
                    className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10"
                    animate={{ opacity: isPressed ? 0.2 : 1 }}
                >
                    <div className="text-center">
                        <p className="text-[9px] text-white/40 uppercase tracking-wider">תקציב</p>
                        <p className="text-xs font-bold text-white/80">₪{income.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center">
                        <p className="text-[9px] text-white/40 uppercase tracking-wider">הוצאות</p>
                        <p className={cn("text-xs font-bold", isCrisis ? "text-red-400" : "text-white/80")}>
                            ₪{expenses.toLocaleString()}
                        </p>
                    </div>
                </motion.div>

                {/* Percentage Badge */}
                <motion.div
                    className={cn(
                        "absolute -bottom-8 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold",
                        "bg-white/5 border border-white/10 backdrop-blur-sm",
                        color
                    )}
                    animate={{ scale: isPressed ? 0.9 : 1 }}
                >
                    {percentage.toFixed(0)}%
                </motion.div>
            </div>

            {/* Press Hint */}
            <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-white/20 font-medium"
                animate={{ opacity: isPressed ? 0 : 0.5 }}
            >
                לחץ לתחזית
            </motion.div>
        </div>
    );
};
