"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Wallet, Target, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetHealthScoreProps {
    balance: number;           // Current remaining balance (what's left to spend)
    budget: number;            // Monthly budget goal
    monthlyIncome: number;     // Total monthly income
    totalExpenses: number;     // Expenses spent this month
    daysInMonth: number;       // Total days in billing cycle
    daysPassed: number;        // Days elapsed in billing cycle
}

export const BudgetHealthScore = ({
    balance,
    budget,
    monthlyIncome,
    totalExpenses,
    daysInMonth,
    daysPassed
}: BudgetHealthScoreProps) => {
    const { score, status, breakdown, insights } = useMemo(() => {
        // Ensure valid values
        const safeBudget = Math.max(1, budget);
        const safeIncome = Math.max(1, monthlyIncome);
        const safeDaysInMonth = Math.max(1, daysInMonth);
        const safeDaysPassed = Math.max(1, Math.min(daysPassed, safeDaysInMonth));
        const daysRemaining = Math.max(0, safeDaysInMonth - safeDaysPassed);

        // === SIMPLE, CLEAR CALCULATIONS ===

        // 1. Budget Usage Score (40% weight)
        // How much of the budget have you used vs how much time has passed?
        const expectedSpentByNow = (safeDaysPassed / safeDaysInMonth) * safeBudget;
        const actualSpent = totalExpenses;

        // If spent less than expected = good (100), if more = bad (lower)
        let usageScore: number;
        if (actualSpent <= expectedSpentByNow) {
            usageScore = 100; // Under or on budget pace
        } else {
            // Over budget pace - penalize proportionally
            const overSpendRatio = (actualSpent - expectedSpentByNow) / safeBudget;
            usageScore = Math.max(0, 100 - (overSpendRatio * 200));
        }

        // 2. Balance Health Score (35% weight)
        // How much balance do you have vs what you need for remaining days?
        const dailyBudget = safeBudget / safeDaysInMonth;
        const neededForRemainingDays = dailyBudget * daysRemaining;

        let balanceScore: number;
        if (daysRemaining === 0) {
            // End of month - did you stay positive?
            balanceScore = balance >= 0 ? 100 : 0;
        } else if (balance >= neededForRemainingDays) {
            balanceScore = 100; // Enough for the rest of the month
        } else if (balance > 0) {
            // Partial - score based on how much you have vs need
            balanceScore = Math.max(0, (balance / neededForRemainingDays) * 100);
        } else {
            balanceScore = 0; // Negative balance
        }

        // 3. Savings Score (25% weight)
        // Are you on track to save money if income > budget?
        let savingsScore: number;
        if (safeIncome <= safeBudget) {
            // No savings expected, score based on not overspending
            savingsScore = actualSpent <= safeBudget ? 100 : Math.max(0, 100 - ((actualSpent - safeBudget) / safeBudget) * 100);
        } else {
            // Savings expected
            const targetSavings = safeIncome - safeBudget;
            const currentSavings = safeIncome - actualSpent;
            if (currentSavings >= targetSavings) {
                savingsScore = 100;
            } else if (currentSavings > 0) {
                savingsScore = (currentSavings / targetSavings) * 100;
            } else {
                savingsScore = 0;
            }
        }

        // === WEIGHTED FINAL SCORE ===
        const finalScore = Math.round(
            usageScore * 0.40 +
            balanceScore * 0.35 +
            savingsScore * 0.25
        );

        // === STATUS ===
        let status: "excellent" | "good" | "warning" | "critical";
        if (finalScore >= 75) status = "excellent";
        else if (finalScore >= 55) status = "good";
        else if (finalScore >= 35) status = "warning";
        else status = "critical";

        // === INSIGHTS ===
        // Daily safe to spend = what you can actually spend per day
        const safeToSpendDaily = daysRemaining > 0 && balance > 0
            ? Math.floor(balance / daysRemaining)
            : 0;
        const projectedEndBalance = balance - (dailyBudget * daysRemaining);

        return {
            score: Math.max(0, Math.min(100, finalScore)),
            status,
            breakdown: {
                usage: Math.round(Math.max(0, Math.min(100, usageScore))),
                balance: Math.round(Math.max(0, Math.min(100, balanceScore))),
                savings: Math.round(Math.max(0, Math.min(100, savingsScore)))
            },
            insights: {
                safeToSpendDaily, // Actual amount safe to spend per day
                dailyBudget: Math.round(dailyBudget), // Theoretical budget per day
                projectedEndBalance: Math.round(projectedEndBalance),
                daysRemaining,
                balance: Math.round(balance)
            }
        };
    }, [balance, budget, monthlyIncome, totalExpenses, daysInMonth, daysPassed]);

    const getColor = () => {
        switch (status) {
            case "excellent": return "text-emerald-400";
            case "good": return "text-blue-400";
            case "warning": return "text-amber-400";
            case "critical": return "text-red-400";
        }
    };



    const getStatusText = () => {
        switch (status) {
            case "excellent": return "מצוין!";
            case "good": return "טוב";
            case "warning": return "שים לב";
            case "critical": return "בעייתי";
        }
    };

    const getIcon = () => {
        switch (status) {
            case "excellent": return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case "good": return <TrendingUp className="w-5 h-5 text-blue-400" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case "critical": return <TrendingDown className="w-5 h-5 text-red-400" />;
        }
    };

    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4 border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-lg relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <h3 className="text-sm font-bold text-white">בריאות פיננסית</h3>
                </div>
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-full bg-white/10", getColor())}>
                    {getStatusText()}
                </span>
            </div>

            {/* Main Score Display */}
            <div className="flex items-center gap-6 mb-4">
                {/* Circular Progress */}
                <div className="relative w-20 h-20 shrink-0">
                    <svg className="transform -rotate-90 w-20 h-20">
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-white/10"
                        />
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            strokeLinecap="round"
                            className={getColor()}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-2xl font-black", getColor())}>{score}</span>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] text-white/50">מותר להוציא היום</span>
                        </div>
                        <span className={cn("text-sm font-bold", insights.safeToSpendDaily > 0 ? "text-white" : "text-red-400")}>
                            ₪{insights.safeToSpendDaily.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] text-white/50">נותרו ימים</span>
                        </div>
                        <span className="text-sm font-bold text-white">{insights.daysRemaining}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <PiggyBank className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] text-white/50">יתרה נוכחית</span>
                        </div>
                        <span className={cn("text-sm font-bold", insights.balance >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {insights.balance < 0 && "-"}₪{Math.abs(insights.balance).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
                <div>
                    <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-white/50">קצב הוצאות</span>
                        <span className="text-white/70">{breakdown.usage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${breakdown.usage}%` }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-white/50">יתרה זמינה</span>
                        <span className="text-white/70">{breakdown.balance}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${breakdown.balance}%` }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-white/50">פוטנציאל חיסכון</span>
                        <span className="text-white/70">{breakdown.savings}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${breakdown.savings}%` }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
