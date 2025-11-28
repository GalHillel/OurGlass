"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface BrickWallProps {
    savedAmount: number;
    goalAmount: number;
}

export const BrickWall = ({ savedAmount, goalAmount }: BrickWallProps) => {
    const brickValue = 1000;
    const totalBricks = Math.ceil(goalAmount / brickValue);
    const filledBricks = Math.floor(savedAmount / brickValue);

    return (
        <div className="w-full p-4 max-w-md">
            <h3 className="text-white/80 text-lg mb-4 font-medium px-2">קיר החסכונות</h3>
            <div className="grid grid-cols-5 gap-1.5 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
                {Array.from({ length: totalBricks }).map((_, index) => {
                    const isFilled = index < filledBricks;
                    return (
                        <Brick key={index} isFilled={isFilled} index={index} />
                    );
                })}
            </div>
            <div className="mt-3 text-center text-white/60 text-sm font-mono">
                {savedAmount.toLocaleString()} / {goalAmount.toLocaleString()} ₪
            </div>
        </div>
    );
};

const Brick = ({ isFilled, index }: { isFilled: boolean; index: number }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        if (isFilled) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    return (
        <motion.div
            onClick={handleClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: 1,
                scale: isAnimating ? [1, 1.2, 1] : 1,
                backgroundColor: isFilled ? "rgba(52, 211, 153, 0.8)" : "rgba(255, 255, 255, 0.05)"
            }}
            transition={{ delay: index * 0.02 }}
            className={`h-8 rounded-md cursor-pointer transition-all duration-500 border border-white/5 ${isFilled ? "shadow-[0_0_15px_rgba(52,211,153,0.4)] border-emerald-400/30" : ""}`}
        />
    );
};
