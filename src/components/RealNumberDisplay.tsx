"use client";

import { motion } from "framer-motion";

interface RealNumberDisplayProps {
    amount: number;
}

export const RealNumberDisplay = ({ amount }: RealNumberDisplayProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass p-8 rounded-full w-64 h-64 flex flex-col items-center justify-center text-center border-2 border-white/30 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <span className="text-sm uppercase tracking-widest text-white/80 mb-2 font-medium">
                    לביזבוזים
                </span>
                <span className="text-5xl font-bold text-white drop-shadow-lg">
                    ₪{amount.toLocaleString()}
                </span>
                <span className="text-xs text-white/60 mt-2">
                    אחרי הוצאות קבועות
                </span>
            </motion.div>
        </div>
    );
};
