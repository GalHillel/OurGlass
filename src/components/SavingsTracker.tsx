"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsTrackerProps {
    monthlyIncome: number;    // Total income this month
    budget: number;           // Budgeted spending limit
    totalSpent: number;       // Actual amount spent
}

export const SavingsTracker = ({ monthlyIncome, budget, totalSpent }: SavingsTrackerProps) => {
    // Calculations
    const actualSavings = monthlyIncome - totalSpent;
    const targetSavings = monthlyIncome - budget;
    const budgetRemaining = budget - totalSpent;
    const isOverBudget = totalSpent > budget;
    const overBudgetAmount = isOverBudget ? totalSpent - budget : 0;

    // Status determination
    const savingsRate = monthlyIncome > 0 ? (actualSavings / monthlyIncome) * 100 : 0;

    let status: "excellent" | "good" | "warning" | "overspent";
    let statusMessage: string;
    let statusIcon: React.ReactNode;

    if (actualSavings >= targetSavings && !isOverBudget) {
        status = "excellent";
        statusMessage = "מצוין! עומדים ביעד החיסכון";
        statusIcon = <Sparkles className="w-4 h-4" />;
    } else if (actualSavings > 0 && !isOverBudget) {
        status = "good";
        statusMessage = "במסלול לחיסכון";
        statusIcon = <CheckCircle className="w-4 h-4" />;
    } else if (actualSavings > 0 && isOverBudget) {
        status = "warning";
        statusMessage = `חרגתם ב-₪${overBudgetAmount.toLocaleString()} אך עדיין חוסכים`;
        statusIcon = <AlertTriangle className="w-4 h-4" />;
    } else {
        status = "overspent";
        statusMessage = "הוצאות גבוהות מההכנסות!";
        statusIcon = <TrendingDown className="w-4 h-4" />;
    }

    const getStatusColor = () => {
        switch (status) {
            case "excellent": return "text-emerald-400";
            case "good": return "text-blue-400";
            case "warning": return "text-amber-400";
            case "overspent": return "text-red-400";
        }
    };

    const getStatusBg = () => {
        switch (status) {
            case "excellent": return "from-emerald-500/20 to-emerald-500/5";
            case "good": return "from-blue-500/20 to-blue-500/5";
            case "warning": return "from-amber-500/20 to-amber-500/5";
            case "overspent": return "from-red-500/20 to-red-500/5";
        }
    };

    // Progress bar for budget usage
    const budgetUsagePercent = Math.min(100, (totalSpent / budget) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("rounded-2xl p-4 border border-white/10 bg-gradient-to-br", getStatusBg())}
        >
            {/* Header with Status */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-white/60" />
                    <h3 className="text-sm font-bold text-white">מעקב חיסכון</h3>
                </div>
                <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-white/10", getStatusColor())}>
                    {statusIcon}
                    <span className="hidden sm:inline">{savingsRate > 0 ? `${Math.round(savingsRate)}% חיסכון` : "אין חיסכון"}</span>
                </div>
            </div>

            {/* Main Numbers Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Income */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-white/50">הכנסות</span>
                    </div>
                    <span className="text-lg font-bold text-white">₪{monthlyIncome.toLocaleString()}</span>
                </div>

                {/* Budget */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] text-white/50">תקציב</span>
                    </div>
                    <span className="text-lg font-bold text-white">₪{budget.toLocaleString()}</span>
                </div>

                {/* Spent */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] text-white/50">הוצאות</span>
                    </div>
                    <span className={cn("text-lg font-bold", isOverBudget ? "text-red-400" : "text-white")}>
                        ₪{totalSpent.toLocaleString()}
                    </span>
                </div>

                {/* Savings */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <PiggyBank className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] text-white/50">חיסכון</span>
                    </div>
                    <span className={cn("text-lg font-bold", actualSavings >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {actualSavings < 0 && "-"}₪{Math.abs(actualSavings).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white/50">ניצול תקציב</span>
                    <span className={cn(isOverBudget ? "text-red-400" : "text-white/70")}>
                        {Math.round(budgetUsagePercent)}%
                        {isOverBudget && ` (חריגה של ₪${overBudgetAmount.toLocaleString()})`}
                    </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                        transition={{ duration: 0.8 }}
                        className={cn(
                            "h-full rounded-full",
                            budgetUsagePercent > 100 ? "bg-red-500" :
                                budgetUsagePercent > 80 ? "bg-amber-500" :
                                    "bg-emerald-500"
                        )}
                    />
                </div>
            </div>

            {/* Status Message */}
            <div className={cn("flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5", getStatusColor())}>
                {statusIcon}
                <span>{statusMessage}</span>
            </div>

            {/* Target vs Actual Savings Comparison */}
            {targetSavings > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-white/50">יעד חיסכון:</span>
                        <span className="text-white/70">₪{targetSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-white/50">חיסכון בפועל:</span>
                        <span className={cn("font-medium", actualSavings >= targetSavings ? "text-emerald-400" : "text-amber-400")}>
                            ₪{actualSavings.toLocaleString()}
                            {actualSavings >= targetSavings ? " ✓" : ` (חסרים ₪${(targetSavings - actualSavings).toLocaleString()})`}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
