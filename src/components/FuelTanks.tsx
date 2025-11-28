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

    return (
        <div className="w-full max-w-md p-4">
            <h3 className="text-white/80 text-lg mb-4 font-medium px-2">מיכלי דלק (כיס)</h3>
            <div className="glass p-6 rounded-3xl flex justify-around items-end h-64 relative">

                {/* Him Tank */}
                <div className="flex flex-col items-center gap-2 w-24 relative z-10">
                    <div className="text-white font-bold text-lg">₪{himBalance}</div>
                    <div className="w-16 h-40 bg-white/5 rounded-full relative overflow-hidden border border-white/10">
                        <motion.div
                            className="absolute bottom-0 left-0 w-full bg-blue-500/80"
                            initial={{ height: 0 }}
                            animate={{ height: `${himPercentage}%` }}
                            transition={{ duration: 1, type: "spring" }}
                        />
                        {/* Liquid effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="flex items-center gap-1 text-blue-200">
                        <User className="w-4 h-4" />
                        <span className="text-sm">{himName}</span>
                    </div>
                </div>

                {/* Her Tank */}
                <div className="flex flex-col items-center gap-2 w-24 relative z-10">
                    <div className="text-white font-bold text-lg">₪{himBalance}</div>
                    <div className="w-16 h-40 bg-white/5 rounded-full relative overflow-hidden border border-white/10">
                        <motion.div
                            className="absolute bottom-0 left-0 w-full bg-pink-500/80"
                            initial={{ height: 0 }}
                            animate={{ height: `${herPercentage}%` }}
                            transition={{ duration: 1, type: "spring" }}
                        />
                        {/* Liquid effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="flex items-center gap-1 text-pink-200">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-sm">{herName}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
