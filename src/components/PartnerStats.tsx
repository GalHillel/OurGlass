"use client";

import { useMemo } from "react";
import { Transaction, Subscription, Liability } from "@/types";
import { motion } from "framer-motion";
import { User, Users, Heart } from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";
import { isLiabilityActive } from "@/hooks/useWealthData";
import { PAYERS, CURRENCY_SYMBOL } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

interface PartnerStatsProps {
    transactions: Transaction[];
    subscriptions?: Subscription[];
    liabilities?: Liability[];
    monthlyBudget?: number;
    viewingDate?: Date;
}

export const PartnerStats = ({ transactions, subscriptions = [], liabilities = [], viewingDate = new Date() }: PartnerStatsProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);

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

            const debtSum = liabilities
                .filter(l => (l.owner || 'joint') === payer)
                .filter(l => isLiabilityActive(l, viewingDate))
                .reduce((sum, l) => sum + Number(l.monthly_payment || 0), 0);

            return txSum + subSum + debtSum;
        };

        const himTotal = calculateTotal('him');
        const herTotal = calculateTotal('her');
        const jointTotal = calculateTotal('joint');

        return [
            { id: 'him', label: PAYERS.HIM, amount: himTotal, icon: User, color: 'text-blue-400' },
            { id: 'joint', label: 'משותף', amount: jointTotal, icon: Users, color: 'text-purple-400' },
            { id: 'her', label: PAYERS.HER, amount: herTotal, icon: Heart, color: 'text-pink-400' },
        ];
    }, [transactions, subscriptions, liabilities, viewingDate]);

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
                    className="flex flex-col items-center justify-center p-3 glass-card-inner shadow-lg relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                    <div className={cn("p-2 rounded-full mb-2 bg-black/20", stat.color.replace('bg-', 'text-').split(' ')[0])}>
                        <stat.icon className={cn("w-4 h-4", stat.color.match(/text-\w+-\d+/)?.[0])} />
                    </div>
                    <span className="text-[10px] text-white/50 mb-0.5 font-medium">{stat.label}</span>
                    <span className="text-sm font-bold text-white">
                        {formatAmount(stat.amount, isStealthMode, CURRENCY_SYMBOL)}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};
