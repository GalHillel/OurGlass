"use client";

import { useMemo } from "react";
import { Transaction, Subscription } from "@/types";
import { motion } from "framer-motion";
import { User, Users, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerStatsProps {
    transactions: Transaction[];
    subscriptions?: Subscription[];
    monthlyBudget?: number;
}

export const PartnerStats = ({ transactions, subscriptions = [] }: PartnerStatsProps) => {
    const stats = useMemo(() => {
        // Logic: My Spend (Him), Her Spend, Joint Spend
        // Assuming 'him' is the current user for "My Spend" label, or use generic names

        const calculateTotal = (payer: 'him' | 'her' | 'joint') => {
            const txSum = transactions
                .filter(t => t.payer === payer)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const subSum = subscriptions
                .filter(s => s.owner === payer)
                .reduce((sum, s) => sum + Number(s.amount), 0);

            return txSum + subSum;
        };

        const himTotal = calculateTotal('him');
        const herTotal = calculateTotal('her');
        const jointTotal = calculateTotal('joint');

        // For 'joint', we might also want to include subscriptions without explicit owner if that was the old logic, 
        // but the prompt says "Sum of transactions where payer === 'joint'". keeping it strict for now.

        return [
            { id: 'him', label: 'גל', amount: himTotal, icon: User, color: 'bg-blue-500/20 text-blue-200 border-blue-500/10' },
            { id: 'joint', label: 'משותף', amount: jointTotal, icon: Users, color: 'bg-purple-500/20 text-purple-200 border-purple-500/10' },
            { id: 'her', label: 'איריס', amount: herTotal, icon: Heart, color: 'bg-pink-500/20 text-pink-200 border-pink-500/10' },
        ];
    }, [transactions, subscriptions]);

    const total = stats.reduce((acc, curr) => acc + curr.amount, 0);

    if (total === 0) return null;

    return (
        <div className="w-full px-6 mt-8">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4 px-1">חלוקה מגדרית</h3>
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "flex flex-col items-center p-3 rounded-2xl border backdrop-blur-md",
                            stat.color,
                            "border-white/5" // Override border color for cleaner look
                        )}
                    >
                        <div className={cn("p-2 rounded-full mb-2 bg-black/20")}>
                            <stat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] text-white/60 mb-1 font-medium">{stat.label}</span>
                        <span className="text-sm font-bold text-white">₪{stat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
