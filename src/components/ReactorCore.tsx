"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface ReactorCoreProps {
    income: number;
    budget: number;
    expenses: number;
    balance: number;
    burnRateStatus?: 'safe' | 'warning' | 'critical';
    cycleStart: Date;
    cycleEnd: Date;
}

export const ReactorCore = ({ income, budget, expenses, balance, burnRateStatus, cycleStart, cycleEnd }: ReactorCoreProps) => {
    const [isPressed, setIsPressed] = useState(false);

    const { percentage, projectedBalance, totalDaysInCycle, daysPassed, daysRemaining } = useMemo(() => {
        const totalDays = Math.max(1, Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)));
        const days = Math.max(1, Math.min(totalDays, Math.ceil((new Date().getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))));
        const avg = expenses / days;
        const projected = income - (avg * totalDays);
        const pct = Math.min(Math.max((balance / (budget || income || 1)) * 100, 0), 100);
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
            className="relative w-full py-12 flex flex-col items-center justify-center touch-pan-y cursor-pointer select-none overflow-hidden"
            onPointerDown={() => { setIsPressed(true); triggerHaptic(); }}
            onPointerUp={() => setIsPressed(false)}
            onPointerLeave={() => setIsPressed(false)}
        >
            {/* Tech Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-20"
                style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)', backgroundSize: '100% 4px' }}
            />

            {/* Status Indicator - Tech Badge */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-sm mb-8 relative z-10 backdrop-blur-md",
                    "bg-slate-900/60 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                )}
            >
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", color.replace('text-', 'text-'))} style={{ backgroundColor: 'currentColor' }} />

                <span className={cn("text-[10px] font-bold tracking-widest uppercase font-mono", color)}>
                    {isPressed ? "מצב תחזית >>" : (isCrisis ? "!! חריגה !!" : isWarning ? "שים לב" : "מערכת תקינה")}
                </span>
            </motion.div>

            {/* Main Digital Display with Brackets */}
            <div className="relative z-10 w-full flex flex-col items-center justify-center">

                {/* Decorative Brackets */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-64 h-full pointer-events-none opacity-30">
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-white/50" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-white/50" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white/50" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white/50" />
                </div>

                <AnimatePresence mode="wait">
                    {isPressed ? (
                        <motion.div
                            key="projected"
                            initial={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            exit={{ scale: 1.05, opacity: 0, filter: "blur(8px)" }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-2 py-4"
                        >
                            <span className="text-[10px] font-mono text-emerald-400/80 tracking-widest uppercase bg-emerald-950/30 px-2 py-0.5 rounded text-shadow-sm">
                                צפי לסיום החודש
                            </span>

                            {/* LTR Container for Correct [Minus] [Number] [Shekel] Ordering */}
                            <div className="flex items-baseline justify-center gap-1" dir="ltr">
                                {projectedBalance < 0 && (
                                    <span className="text-4xl font-bold text-red-500 mr-1 self-center">-</span>
                                )}
                                <span className={cn(
                                    "text-6xl sm:text-7xl font-sans font-black tracking-tighter tabular-nums",
                                    projectedBalance >= 0 ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.5)]" : "text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                                )}>
                                    <CountUp
                                        end={Math.abs(projectedBalance)}
                                        duration={0.4}
                                        separator=","
                                        decimals={0}
                                    />
                                </span>
                                <span className="text-3xl text-emerald-400/40 font-light ml-2">₪</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="balance"
                            initial={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            exit={{ scale: 1.05, opacity: 0, filter: "blur(8px)" }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-2 py-4"
                        >
                            <span className="text-[10px] font-mono text-blue-400/60 tracking-widest uppercase bg-blue-950/20 px-2 py-0.5 rounded text-shadow-sm">
                                יתרה לשימוש
                            </span>

                            {/* LTR Container for Correct [Minus] [Number] [Shekel] Ordering */}
                            <div className="flex items-baseline justify-center gap-2" dir="ltr">
                                {balance < 0 && (
                                    <span className="text-4xl font-bold text-red-500 mr-1 self-center animate-pulse">-</span>
                                )}
                                <span className={cn(
                                    "text-6xl sm:text-7xl font-sans font-black tracking-tighter tabular-nums",
                                    balance >= 0
                                        ? "text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.2)]"
                                        : "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.4)]"
                                )}>
                                    <CountUp
                                        end={Math.abs(balance)}
                                        duration={1.5}
                                        separator=","
                                        decimals={0}
                                    />
                                </span>
                                <span className="text-3xl text-white/30 font-light ml-2">₪</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tech Specs */}
                <div className="flex items-center justify-between w-64 mt-8 px-4 opacity-80">
                    <div className="flex flex-col items-center border-r border-white/10 pr-6">
                        <span className="text-[9px] font-mono text-blue-300/60 uppercase tracking-widest mb-1">תקציב</span>
                        <span className="text-lg font-mono font-bold text-blue-100 tabular-nums">
                            {budget.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex flex-col items-center pl-6">
                        <span className="text-[9px] font-mono text-purple-300/60 uppercase tracking-widest mb-1">הוצאות</span>
                        <span className={cn(
                            "text-lg font-mono font-bold tabular-nums",
                            isCrisis ? "text-red-400 text-shadow-glow" : "text-purple-100"
                        )}>
                            {expenses.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Bottom Detail */}
                <motion.p
                    className="text-[10px] font-mono text-white/30 mt-6 tracking-widest uppercase"
                    animate={{ opacity: isPressed ? 0.5 : 0.3 }}
                >
                    {isPressed ? ">> חישוב תחזית סיום <<" : `[ ${daysRemaining} ימים למחזור ]`}
                </motion.p>
            </div>
        </div>
    );
};
