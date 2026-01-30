"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";

interface ReactorCoreProps {
    income: number;
    expenses: number;
    balance: number;
}

export const ReactorCore = ({ income, expenses, balance }: ReactorCoreProps) => {
    const [isFlipped, setIsFlipped] = useState(false);

    // Core Logic
    const safeRatio = Math.max(0, Math.min(balance / income, 1));
    const isCrisis = balance < 0;
    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const fillAmount = isCrisis ? 1 : safeRatio;
    const strokeDashoffset = circumference - (fillAmount * circumference);

    // Days Remaining Logic (for Back Face)
    const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const safeDaily = balance > 0 ? (balance / Math.max(1, daysRemaining)) : 0;

    // Animations
    const breathing = {
        boxShadow: isCrisis
            ? ["0 0 20px rgba(239,68,68,0.2)", "0 0 50px rgba(239,68,68,0.5)", "0 0 20px rgba(239,68,68,0.2)"]
            : ["0 0 20px rgba(59,130,246,0.2)", "0 0 50px rgba(59,130,246,0.5)", "0 0 20px rgba(59,130,246,0.2)"],
        scale: [1, 1.05, 1], // Increased from 1.02 to 1.05 for "Alive" feel
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
    };

    return (
        <div className="relative w-80 h-80 perspective-1000">
            <motion.div
                className="w-full h-full relative preserve-3d cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ transformStyle: "preserve-3d" }}
                whileTap={{ scale: 0.96 }}
            >
                {/* --- FRONT FACE (Main Balance) --- */}
                <div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: "hidden" }}>
                    <motion.div
                        className="w-full h-full rounded-full relative flex items-center justify-center bg-slate-950/50 backdrop-blur-sm"
                        animate={breathing}
                    >
                        {/* 1. Static Rings */}
                        <div className="absolute inset-2 border border-white/5 rounded-full" />
                        <div className="absolute inset-0 border border-white/5 rounded-full opacity-50" />

                        {/* 2. Rotating Rings */}
                        <motion.div
                            className="absolute inset-6 rounded-full border border-dashed border-white/20"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className="absolute inset-8 rounded-full border border-dotted border-white/10"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                        />

                        {/* 3. Energy SVG */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 p-4">
                            <defs>
                                <linearGradient id="safeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#60a5fa" />
                                </linearGradient>
                                <linearGradient id="crisisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="100%" stopColor="#f87171" />
                                </linearGradient>
                            </defs>
                            <circle cx="50%" cy="50%" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" strokeLinecap="round" />
                            <motion.circle
                                cx="50%" cy="50%" r={radius} fill="none"
                                stroke={isCrisis ? "url(#crisisGradient)" : "url(#safeGradient)"}
                                strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className={isCrisis ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"}
                            />
                        </svg>

                        {/* 4. Data Content */}
                        <div className="relative z-20 flex flex-col items-center justify-center text-center">
                            <div className={`mb-1 text-[10px] uppercase tracking-[0.3em] font-medium ${isCrisis ? "text-red-400 animate-pulse" : "text-blue-300"}`}>
                                {isCrisis ? "חריגה" : "פנוי לשימוש"}
                            </div>
                            <div className="flex flex-row items-baseline justify-center gap-1 sensitive" dir="ltr">
                                <span className={`${balance < 0 ? "opacity-100 text-red-400" : "opacity-0 w-0"} transition-all duration-300 text-4xl font-light`}>-</span>
                                <span className="text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                    <CountUp end={Math.abs(balance)} duration={2} separator="," />
                                </span>
                                <span className="text-3xl text-white/40 font-light ml-2">₪</span>
                            </div>
                            <div className="mt-4 flex items-center gap-6 text-[10px] font-mono text-white/40 tracking-wider">
                                <span className="group">
                                    <span className="block text-emerald-500/50 text-[9px]">הכנסות</span>
                                    <span className="sensitive">{(income / 1000).toFixed(1)}k</span>
                                </span>
                                <span className="w-px h-6 bg-white/10" />
                                <span className="group">
                                    <span className="block text-red-500/50 text-[9px]">הוצאות</span>
                                    <span className="sensitive">{(expenses / 1000).toFixed(1)}k</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* --- BACK FACE (Daily Budget) --- */}
                <div
                    className="absolute inset-0 w-full h-full rounded-full backface-hidden bg-slate-900/90 border border-white/10 flex items-center justify-center text-center shadow-2xl"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <div className="text-2xl">📅</div>
                        </div>
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">תקציב יומי</h3>
                        <div className="text-5xl font-black text-white sensitive">
                            <CountUp end={safeDaily} prefix="₪" separator="," duration={1} />
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            נותרו {daysRemaining} ימים לחודש
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
