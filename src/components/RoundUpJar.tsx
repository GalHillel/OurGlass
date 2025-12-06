"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";

export const RoundUpJar = () => {
    // Mock State: In real app, this would be computed from transactions
    const [balance, setBalance] = useState(42.80);
    const [coins, setCoins] = useState<{ id: number; x: number }[]>([]);

    useEffect(() => {
        // Simulate a "Round Up" event happening every now and then
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                addCoin();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const addCoin = () => {
        const id = Date.now();
        // Random horizontal entry position
        const x = Math.random() * 60 - 30;
        setCoins(prev => [...prev.slice(-15), { id, x }]); // Keep max 15 coins for performance
        setBalance(prev => prev + 0.90);
    };

    return (
        <div className="relative w-full aspect-square max-w-[120px] mx-auto group cursor-pointer" onClick={addCoin}>
            {/* The Jar */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-full bg-white/5 backdrop-blur-sm overflow-hidden flex items-end justify-center z-10 shadow-[inner_0_0_20px_rgba(255,255,255,0.1)]">
                {/* Liquid Level (Visualizing accumulation) */}
                <motion.div
                    className="w-full bg-gradient-to-t from-yellow-500/20 to-yellow-300/10 absolute bottom-0"
                    animate={{ height: `${Math.min(balance, 100)}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 2 }}
                />
            </div>

            {/* Lid */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[80%] h-3 bg-white/20 rounded-t-lg z-20 border-t border-white/30" />

            {/* Falling Coins */}
            <AnimatePresence>
                {coins.map(coin => (
                    <motion.div
                        key={coin.id}
                        initial={{ y: -50, x: coin.x, opacity: 0, rotate: 0 }}
                        animate={{
                            y: 80,
                            opacity: 1,
                            rotate: Math.random() * 360
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: "easeInOut",
                            type: "spring"
                        }}
                        className="absolute top-0 left-1/2 w-4 h-4 rounded-full bg-yellow-400 border border-yellow-200 shadow-md z-10 flex items-center justify-center text-[8px] text-yellow-700 font-bold"
                        style={{ marginLeft: -8 }} // center offset
                    >
                        ₪
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Label */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <span className="text-[10px] text-white/50 uppercase tracking-widest block">עיגול לטובה</span>
                <span className="text-sm font-bold text-white">₪{balance.toFixed(2)}</span>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 rounded-full transition-colors duration-500 blur-xl -z-10" />
        </div>
    );
};
