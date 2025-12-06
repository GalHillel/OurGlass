"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface RealNumberDisplayProps {
    amount: number;
}

export const RealNumberDisplay = ({ amount }: RealNumberDisplayProps) => {

    // Dynamic Color Logic
    let ringColor = "border-white/10";
    let glowColor = "shadow-white/5";
    let textColor = "text-white";

    if (amount > 0) {
        ringColor = "border-emerald-500/30";
        glowColor = "shadow-emerald-500/20";
        textColor = "text-emerald-400";
    } else if (amount < 0) {
        ringColor = "border-red-500/30";
        glowColor = "shadow-red-500/20";
        textColor = "text-red-400";
    } else {
        ringColor = "border-yellow-500/30";
        glowColor = "shadow-yellow-500/20";
        textColor = "text-yellow-400";
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 relative z-20">
            {/* Power Ring (The Orb) */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`glass w-56 h-56 rounded-full flex items-center justify-center relative backdrop-blur-xl border-2 ${ringColor} shadow-[0_0_80px_rgba(255,255,255,0.08)] ${glowColor}`}
            >
                {/* Inner Content */}
                <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium block mb-1">
                        לביזבוזים
                    </span>
                    <span
                        dir="ltr"
                        className={`text-3xl md:text-4xl font-black ${textColor} tracking-tight drop-shadow-2xl break-all`}
                    >
                        ₪{amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/30 font-medium block mt-1">
                        אחרי הוצאות
                    </span>
                </div>
            </motion.div>
        </div>
    );
};
