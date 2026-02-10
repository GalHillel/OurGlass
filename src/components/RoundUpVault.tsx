"use client";

import { useMemo } from "react";
import { Transaction } from "@/types";
import { PiggyBank, ArrowRight, Coins } from "lucide-react";
import { motion } from "framer-motion";

interface RoundUpVaultProps {
    transactions: Transaction[];
}

export const RoundUpVault = ({ transactions }: RoundUpVaultProps) => {
    // Calculate potential round-up savings
    const roundUpPotential = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const amount = Number(tx.amount);
            if (amount <= 0 || amount % 10 === 0) return acc;

            // Round up to nearest 10
            const nextTen = Math.ceil(amount / 10) * 10;
            const change = nextTen - amount;
            return acc + change;
        }, 0);
    }, [transactions]);

    if (roundUpPotential < 10) return null; // Don't show if potential is negligible

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neon-card p-5 rounded-3xl relative overflow-hidden group"
        >
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />

            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                        <PiggyBank className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">כספת האגורות</h3>
                        <p className="text-white/50 text-[10px]">עיגול עסקאות ל-10₪ הקרובים</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-yellow-400">₪{roundUpPotential.toFixed(0)}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-300 max-w-[200px] leading-relaxed">
                    אם היית מפעיל את העיגול החכם, היו לך עוד ₪{roundUpPotential.toFixed(0)} בצד החודש!
                </p>
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-4 h-4 text-white/60" />
                </button>
            </div>

            {/* Visual Coins */}
            <div className="absolute bottom-2 left-2 opacity-10">
                <Coins className="w-16 h-16 text-yellow-200" />
            </div>
        </motion.div>
    );
};
