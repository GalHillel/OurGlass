"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Trophy, TrendingUp } from "lucide-react";

interface MillionRaceProps {
    currentWealth: number;
}

export const MillionRace = ({ currentWealth }: MillionRaceProps) => {
    const GOAL = 1000000;
    const progress = Math.min((currentWealth / GOAL) * 100, 100);
    const remaining = Math.max(GOAL - currentWealth, 0);

    return (
        <div className="w-full neon-card p-6 rounded-3xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-50`} />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        המירוץ למיליון (הראשון)
                    </h3>
                    <span className="text-xs font-mono text-white/50">
                        {progress.toFixed(2)}% הושלמו
                    </span>
                </div>

                {/* Progress Bar Container */}
                <div className="h-6 w-full bg-slate-900/50 rounded-full border border-white/5 relative overflow-hidden">
                    {/* The Bar */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] relative"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-white/20 -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase">נותר להשיג</span>
                        <span className="text-xl font-black text-white/60">
                            ₪<CountUp end={remaining} separator="," duration={2} />
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-yellow-500/80 uppercase mb-1 block">יעד</span>
                        <div className="text-2xl font-black text-yellow-400 neon-text">
                            ₪1,000,000
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Sparkles */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <TrendingUp className="w-40 h-40 text-white" />
            </div>
        </div>
    );
}
