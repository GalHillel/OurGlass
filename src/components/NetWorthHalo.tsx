"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";

interface NetWorthHaloProps {
    totalNetWorth: number;
}

export const NetWorthHalo = ({ totalNetWorth }: NetWorthHaloProps) => {
    return (
        <div className="relative flex items-center justify-center w-64 h-64 mx-auto my-8">
            {/* Outer Glow */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-emerald-500/20 blur-3xl"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Rotating Ring */}
            <motion.div
                className="absolute inset-0 rounded-full border border-white/10 border-t-white/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Orb */}
            <div className="relative z-10 flex flex-col items-center justify-center w-48 h-48 rounded-full glass backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                <span className="text-white/50 text-sm font-medium mb-1">שווי נקי כולל</span>
                <div className="text-4xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                    ₪<CountUp end={totalNetWorth} separator="," duration={2.5} />
                </div>
            </div>
        </div>
    );
};
