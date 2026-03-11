"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { TrendingDown, Wallet, PiggyBank, Target, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

interface SavingsTrackerProps {
    monthlyIncome: number;    // Total income this month
    budget: number;           // Budgeted spending limit
    totalSpent: number;       // Actual amount spent
}

export const SavingsTracker = ({ monthlyIncome, budget, totalSpent }: SavingsTrackerProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    // Calculations
    const actualSavings = monthlyIncome - totalSpent;
    const targetSavings = monthlyIncome - budget;
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
        statusMessage = isStealthMode ? `חרגתם אך עדיין חוסכים` : `חרגתם ב-${CURRENCY_SYMBOL}${overBudgetAmount.toLocaleString('en-US')} אך עדיין חוסכים`;
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



    // Progress bar for budget usage
    const budgetUsagePercent = Math.min(100, (totalSpent / budget) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2.5rem] p-8 border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/5 opacity-50" />
            {/* Header with Status */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">קצב חיסכון חודשי</h3>
                </div>
                <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border", getStatusColor().replace('text-', 'border-').replace('400', '400/30') + " " + getStatusColor().replace('text-', 'bg-').replace('400', '400/10'))}>
                    <span className={getStatusColor()}>{savingsRate > 0 ? `${Math.round(savingsRate)}% חיסכון` : "אין חיסכון"}</span>
                </div>
            </div>

            {/* Main Numbers Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                {/* Income */}
                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Wallet className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.1em]">הכנסות</span>
                    </div>
                    <span className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums">{formatAmount(monthlyIncome, isStealthMode, CURRENCY_SYMBOL, '***')}</span>
                </div>

                {/* Budget */}
                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.1em]">תקציב</span>
                    </div>
                    <span className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums">{formatAmount(budget, isStealthMode, CURRENCY_SYMBOL, '***')}</span>
                </div>

                {/* Spent */}
                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                        <TrendingDown className="w-3 h-3 text-orange-400" />
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.1em]">בוזבז</span>
                    </div>
                    <span className={cn("text-2xl font-black font-mono tracking-tighter tabular-nums", isOverBudget ? "text-red-400" : "text-white")}>
                        {formatAmount(totalSpent, isStealthMode, CURRENCY_SYMBOL, '***')}
                    </span>
                </div>

                {/* Savings */}
                <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1">
                        <PiggyBank className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.1em]">חיסכון</span>
                    </div>
                    <span className={cn("text-2xl font-black font-mono tracking-tighter tabular-nums", actualSavings >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {actualSavings < 0 && !isStealthMode && "-"}{formatAmount(Math.abs(actualSavings), isStealthMode, CURRENCY_SYMBOL, '***')}
                    </span>
                </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white/50">ניצול תקציב</span>
                    <span className={cn(isOverBudget ? "text-red-400" : "text-white/70")}>
                        {isStealthMode ? '**%' : `${Math.round(budgetUsagePercent)}%`}
                        {isOverBudget && !isStealthMode && ` (חריגה של ${CURRENCY_SYMBOL}${overBudgetAmount.toLocaleString('en-US')})`}
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
                        <span className="text-white/70">{formatAmount(targetSavings, isStealthMode, CURRENCY_SYMBOL, '***')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                        <span className="text-white/50">חיסכון בפועל:</span>
                        <span className={cn("font-medium", actualSavings >= targetSavings ? "text-emerald-400" : "text-amber-400")}>
                            {formatAmount(actualSavings, isStealthMode, CURRENCY_SYMBOL, '***')}
                            {actualSavings >= targetSavings ? " ✓" : !isStealthMode ? ` (חסרים ${CURRENCY_SYMBOL}${(targetSavings - actualSavings).toLocaleString('en-US')})` : ""}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
