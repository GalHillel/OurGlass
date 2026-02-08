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
            { id: 'him', label: 'גל', amount: himTotal, icon: User, color: 'text-blue-400' },
            { id: 'joint', label: 'משותף', amount: jointTotal, icon: Users, color: 'text-purple-400' },
            { id: 'her', label: 'איריס', amount: herTotal, icon: Heart, color: 'text-pink-400' },
        ];
    }, [transactions, subscriptions]);

    const total = stats.reduce((acc, curr) => acc + curr.amount, 0);

    if (total === 0) return null;

    return (
        <div className="w-full mt-4 grid grid-cols-3 gap-3">
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-lg relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                    <div className={cn("p-2 rounded-full mb-2 bg-black/20", stat.color.replace('bg-', 'text-').split(' ')[0])}>
                        <stat.icon className={cn("w-4 h-4", stat.color.match(/text-\w+-\d+/)?.[0])} />
                    </div>
                    <span className="text-[10px] text-white/50 mb-0.5 font-medium">{stat.label}</span>
                    <span className="text-sm font-bold text-white">₪{stat.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </motion.div>
            ))}
        </div>
    );
};
