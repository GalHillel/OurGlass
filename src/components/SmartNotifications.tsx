"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@/types";
import { differenceInDays, subMonths } from "date-fns";
import { Zap, TrendingUp, AlertTriangle, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartNotificationsProps {
    transactions: Transaction[];
    balance: number;
    budget: number;
    daysRemaining: number; // In current billing cycle
}

interface Insight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'critical';
    message: string;
    icon: any;
    color: string;
}

export const SmartNotifications = ({ transactions, balance, budget, daysRemaining }: SmartNotificationsProps) => {
    const [insight, setInsight] = useState<Insight | null>(null);

    useEffect(() => {
        if (!transactions.length || !budget) return;

        // Logic Engine for Insights
        const generateInsight = () => {
            const dailyBudget = daysRemaining > 0 ? balance / daysRemaining : 0;
            const burnRate = (budget - balance) / (budget); // % used

            // 1. Critical Low Funds
            if (balance < 1000 && daysRemaining > 10) {
                return {
                    id: 'critical-low',
                    type: 'critical',
                    message: `שים לב! נשארו רק ₪${balance.toLocaleString()} ל-${daysRemaining} ימים.`,
                    icon: AlertTriangle,
                    color: 'text-red-500 bg-red-500/10 border-red-500/20'
                };
            }

            // 2. High Spending Speed
            // Simple heuristic: if we spent > 50% of budget in first 10 days
            /* 
               We need "days passed in cycle". 
               Assumed cycle length ~30. 
               If daysRemaining < 20 (meaning >10 passed) and balance < 50%
            */
            if (daysRemaining < 25 && balance < budget * 0.5 && balance > 1000) {
                return {
                    id: 'fast-burn',
                    type: 'warning',
                    message: "קצב בזבוז גבוה מהרגיל החודש 🏎️",
                    icon: Zap,
                    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                };
            }

            // 3. Success / Good Pace
            if (daysRemaining < 10 && balance > budget * 0.2) {
                return {
                    id: 'good-pace',
                    type: 'success',
                    message: "סוגרים את החודש בפלוס יפה! 👏",
                    icon: PartyPopper,
                    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                };
            }

            return null;
        };

        const newInsight = generateInsight();
        // Only update if changed prevents flickering, but we want to show it.
        // For now, simpler is better.
        setInsight(newInsight ? { ...newInsight, type: newInsight.type as any } : null);

    }, [transactions, balance, budget, daysRemaining]);

    if (!insight) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className={cn(
                    "mx-6 mt-4 p-3 rounded-2xl flex items-center gap-3 border backdrop-blur-md shadow-lg",
                    insight.color
                )}
            >
                <div className={cn("p-2 rounded-full bg-white/5", insight.color.split(' ')[0])}>
                    <insight.icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-white/90">
                    {insight.message}
                </p>
            </motion.div>
        </AnimatePresence>
    );
};
