"use client";

import { motion } from "framer-motion";
import { User, UserCheck } from "lucide-react";

interface FuelTanksProps {
    himBalance: number;
    herBalance: number;
    maxCapacity?: number;
    himName?: string;
    herName?: string;
}

export const FuelTanks = ({ himBalance, herBalance, maxCapacity = 2000, himName = "שלו", herName = "שלה" }: FuelTanksProps) => {
    const himPercentage = Math.min((himBalance / maxCapacity) * 100, 100);
    const herPercentage = Math.min((herBalance / maxCapacity) * 100, 100);

    // Behavioral Finance Logic: Color Coding
    const getLiquidColor = (pct: number, baseColor: string) => {
        if (pct > 50) return baseColor; // Safe (Original Preference)
        if (pct > 20) return "bg-gradient-to-t from-yellow-600 to-yellow-400"; // Caution
        return "bg-gradient-to-t from-red-600 to-red-500"; // Danger
    };

    const isLowBalance = (pct: number) => pct <= 20;

    return (
        <div className="w-full max-w-md p-4">
            <div className="glass p-6 rounded-3xl flex justify-around items-end h-72 relative border border-white/10 shadow-lg">

                {/* Gal's Tank (Him) */}
                <div className="flex flex-col items-center gap-2 relative z-10 group">
                    <div className="flex items-center gap-1.5 text-blue-200 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 backdrop-blur-md mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold">הכיס של גל</span>
                    </div>

                    <div className={`w-16 h-40 bg-slate-900/50 rounded-full relative overflow-hidden border-2 border-white/10 shadow-inner transition-colors duration-500 ${isLowBalance(himPercentage) ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'group-hover:border-blue-400/30'}`}>
                        {/* Liquid */}
                        <motion.div
                            className={`absolute bottom-0 left-0 w-full ${getLiquidColor(himPercentage, "bg-gradient-to-t from-blue-600 to-cyan-400")}`}
                            initial={{ height: 0 }}
                            animate={{
                                height: `${himPercentage}%`,
                                filter: isLowBalance(himPercentage) ? "drop-shadow(0 0 8px rgba(220,38,38,0.5))" : "none"
                            }}
                            transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-white/30 animate-pulse" />
                        </motion.div>
                        {/* Bubbles / shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>

                    <div className={`text-white font-bold text-xl tracking-tight transition-all duration-500 drop-shadow-md relative ${isLowBalance(himPercentage) ? 'text-red-400 scale-110' : ''}`}>
                        ₪{himBalance.toLocaleString()}
                    </div>
                </div>

                {/* Iris's Tank (Her) */}
                <div className="flex flex-col items-center gap-2 relative z-10 group">
                    <div className="flex items-center gap-1.5 text-pink-200 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 backdrop-blur-md mb-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold">הכיס של איריס</span>
                    </div>

                    <div className={`w-16 h-40 bg-slate-900/50 rounded-full relative overflow-hidden border-2 border-white/10 shadow-inner transition-colors duration-500 ${isLowBalance(herPercentage) ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'group-hover:border-pink-400/30'}`}>
                        {/* Liquid */}
                        <motion.div
                            className={`absolute bottom-0 left-0 w-full ${getLiquidColor(herPercentage, "bg-gradient-to-t from-pink-600 to-purple-400")}`}
                            initial={{ height: 0 }}
                            animate={{
                                height: `${herPercentage}%`,
                                filter: isLowBalance(herPercentage) ? "drop-shadow(0 0 8px rgba(220,38,38,0.5))" : "none"
                            }}
                            transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-white/30 animate-pulse" />
                        </motion.div>
                        {/* Bubbles / shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>

                    <div className={`text-white font-bold text-xl tracking-tight transition-all duration-500 drop-shadow-md relative ${isLowBalance(herPercentage) ? 'text-red-400 scale-110' : ''}`}>
                        ₪{herBalance.toLocaleString()}
                    </div>
                </div>

            </div>
        </div>
    );
};
