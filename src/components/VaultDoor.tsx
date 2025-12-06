"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState, useEffect } from "react";
import CountUp from "react-countup";

export const VaultDoor = ({ netWorth }: { netWorth: number }) => {
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setUnlocked(true);
        }, 1500); // Animation delay
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full h-64 flex items-center justify-center overflow-hidden mb-8">
            {/* The Door Mechanism */}
            <motion.div
                className="absolute w-64 h-64 rounded-full border-[20px] border-slate-800 bg-slate-900 flex items-center justify-center shadow-2xl z-20"
                initial={{ rotate: 0 }}
                animate={{ rotate: unlocked ? 360 : 0, scale: unlocked ? 0 : 1, opacity: unlocked ? 0 : 1 }}
                transition={{ duration: 1.5, ease: "circInOut" }}
            >
                <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-600 flex items-center justify-center">
                    <Lock className="w-16 h-16 text-slate-500" />
                </div>
                {/* Bolts */}
                <div className="absolute top-2 w-4 h-8 bg-slate-700 rounded-full" />
                <div className="absolute bottom-2 w-4 h-8 bg-slate-700 rounded-full" />
                <div className="absolute left-2 w-8 h-4 bg-slate-700 rounded-full" />
                <div className="absolute right-2 w-8 h-4 bg-slate-700 rounded-full" />
            </motion.div>

            {/* The Treasure (Revealed) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: unlocked ? 1 : 0, scale: unlocked ? 1 : 0.5, y: unlocked ? 0 : 20 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="text-center z-10"
            >
                <div className="text-sm font-medium text-yellow-500/80 mb-2 uppercase tracking-widest">שווי נקי כולל</div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    ₪<CountUp end={netWorth} separator="," duration={2.5} />
                </div>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mt-4" />
            </motion.div>

            {/* Atmosphere */}
            <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] pointer-events-none" />
        </div>
    );
};
