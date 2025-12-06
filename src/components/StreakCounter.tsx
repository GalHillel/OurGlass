"use client";

import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export const StreakCounter = () => {
    // Mock Logic for now - fetch actual transactions later
    const streakDays = 4;

    return (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.2)]">
            <div className="relative">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-[pulse_3s_ease-in-out_infinite]" />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-orange-400 rounded-full blur-md"
                />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[10px] text-orange-200/60 font-medium">רצף חסכוני</span>
                <span className="text-sm font-bold text-orange-100">{streakDays} ימים</span>
            </div>
        </div>
    );
};
