"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subscription } from "@/types";

interface SubscriptionFatigueAlertProps {
    subscriptions: Subscription[];
    monthlyBudget: number;
}

export const SubscriptionFatigueAlert = ({ subscriptions, monthlyBudget }: SubscriptionFatigueAlertProps) => {
    const { showAlert, fixedCosts, percentage } = useMemo(() => {
        const totalFixed = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);
        const percentage = monthlyBudget > 0 ? (totalFixed / monthlyBudget) * 100 : 0;
        const showAlert = percentage > 40;

        return {
            showAlert,
            fixedCosts: totalFixed,
            percentage: Math.round(percentage)
        };
    }, [subscriptions, monthlyBudget]);

    if (!showAlert) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="neon-card p-4 rounded-2xl bg-amber-500/10 border-amber-500/30 border-2"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-amber-200 mb-1">זיהוי עלויות קבועות גבוהות</h3>
                        <p className="text-xs text-white/70 mb-2">
                            ההוצאות הקבועות שלך מהוות <span className="font-bold text-amber-300">{percentage}%</span> מהתקציב החודשי.
                        </p>
                        <p className="text-xs text-white/60">
                            סך הוצאות קבועות: <span className="font-medium text-white">₪{fixedCosts.toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
