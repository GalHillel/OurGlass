import { Flame, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Transaction } from "@/types";
import { calculateSmartStreak } from "@/lib/smartStreak";

interface StreakCounterProps {
    transactions: Transaction[];
    monthlyBudget?: number;
    fixedExpenses?: number;
}

export const StreakCounter = ({ transactions, monthlyBudget = 20000, fixedExpenses = 0 }: StreakCounterProps) => {
    const streakDays = calculateSmartStreak(transactions || [], monthlyBudget, fixedExpenses);

    return (
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.15)] backdrop-blur-md">
            <div className="relative">
                <Flame className={`w-5 h-5 text-orange-500 fill-orange-500 ${streakDays > 3 ? 'animate-bounce' : 'animate-pulse'}`} />
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-orange-400 rounded-full blur-md"
                />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[10px] text-orange-200/60 font-medium">רצף חסכוני</span>
                <span className="text-base font-black text-orange-100">{streakDays} ימים</span>
            </div>
            {streakDays > 5 && (
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="mr-2 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30"
                >
                    <span className="text-[10px] text-yellow-200 font-bold">מטורף! 🔥</span>
                </motion.div>
            )}
        </div>
    );
};
