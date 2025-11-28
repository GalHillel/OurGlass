"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface RealNumberDisplayProps {
    amount: number;
}

export const RealNumberDisplay = ({ amount }: RealNumberDisplayProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-8 relative z-20">
            {/* App Name Label */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-center"
            >
                <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60 drop-shadow-sm">
                    OurGlass
                </h1>
            </motion.div>

            {/* Power Ring */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass p-1 rounded-full w-72 h-72 flex items-center justify-center relative shadow-[0_0_60px_rgba(255,255,255,0.05)]"
            >
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full border border-white/10 shadow-inner" />
                <div className="absolute -inset-4 rounded-full border border-white/5 opacity-50 animate-pulse" />

                {/* Inner Content Container */}
                <div className="w-full h-full rounded-full bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-sm">

                    {/* Budget Streak Badge */}
                    <div className="absolute top-10 flex items-center gap-1.5 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                        <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-orange-200 tracking-wide">3 ימים</span>
                    </div>

                    <div className="mt-4 space-y-1">
                        <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium block mb-2">
                            לביזבוזים
                        </span>
                        <div className="relative">
                            <span className="text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                                ₪{amount.toLocaleString()}
                            </span>
                            {/* Shine effect on text */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -skew-x-12 translate-x-[-100%] animate-shimmer" />
                        </div>
                        <span className="text-xs text-white/40 font-medium block mt-2">
                            אחרי הוצאות קבועות
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
