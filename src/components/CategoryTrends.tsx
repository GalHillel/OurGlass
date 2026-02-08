"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types";
import { subMonths, differenceInDays, addDays } from "date-fns";
import { getBillingPeriodForDate } from "@/lib/billing";

interface CategoryTrendsProps {
    transactions: Transaction[];
    viewingDate: Date;
}

export const CategoryTrends = ({ transactions, viewingDate }: CategoryTrendsProps) => {
    const trend = useMemo(() => {
        const { start, end } = getBillingPeriodForDate(viewingDate);
        const now = new Date();
        const limitDate = viewingDate.getMonth() === now.getMonth() && viewingDate.getFullYear() === now.getFullYear() ? now : end;
        const daysIntoPeriod = differenceInDays(limitDate, start);
        const prevStart = subMonths(start, 1);
        const prevLimit = addDays(prevStart, daysIntoPeriod);

        // Current period category totals
        const currentCategoryMap = new Map<string, number>();
        transactions
            .filter(tx => new Date(tx.date) <= limitDate)
            .forEach(tx => {
                const cat = tx.category || "אחר";
                currentCategoryMap.set(cat, (currentCategoryMap.get(cat) || 0) + Number(tx.amount));
            });

        // Previous period category totals (mock - would need to fetch from DB)
        // For now, we'll estimate based on current spending patterns
        const prevCategoryMap = new Map<string, number>();
        const avgDailyPerCategory = new Map<string, number>();
        
        currentCategoryMap.forEach((total, cat) => {
            const avgDaily = daysIntoPeriod > 0 ? total / daysIntoPeriod : 0;
            avgDailyPerCategory.set(cat, avgDaily);
            // Estimate previous period (same daily average * same days)
            prevCategoryMap.set(cat, avgDaily * daysIntoPeriod);
        });

        // Find category with biggest change
        let maxChange = 0;
        let maxChangeCategory = "";
        let maxChangePercent = 0;

        currentCategoryMap.forEach((currentTotal, cat) => {
            const prevTotal = prevCategoryMap.get(cat) || 0;
            if (prevTotal === 0 && currentTotal > 0) {
                // New spending category
                const change = currentTotal;
                if (change > maxChange) {
                    maxChange = change;
                    maxChangeCategory = cat;
                    maxChangePercent = Infinity;
                }
            } else if (prevTotal > 0) {
                const change = currentTotal - prevTotal;
                const percentChange = (change / prevTotal) * 100;
                if (Math.abs(percentChange) > Math.abs(maxChangePercent)) {
                    maxChange = change;
                    maxChangeCategory = cat;
                    maxChangePercent = percentChange;
                }
            }
        });

        if (!maxChangeCategory) {
            return null;
        }

        const isIncrease = maxChange > 0;
        const absPercent = Math.abs(maxChangePercent);

        return {
            category: maxChangeCategory,
            change: maxChange,
            percentChange: maxChangePercent,
            isIncrease,
            absPercent: isFinite(absPercent) ? absPercent : 100
        };
    }, [transactions, viewingDate]);

    if (!trend) {
        return null;
    }

    const { category, change, percentChange, isIncrease, absPercent } = trend;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="neon-card p-4 rounded-2xl"
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">מגמות קטגוריות</h3>
                {isIncrease ? (
                    <TrendingUp className="w-4 h-4 text-red-400" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                )}
            </div>
            <div className="space-y-1">
                <p className="text-sm text-white/90 font-medium">{category}</p>
                <p className={cn(
                    "text-lg font-black",
                    isIncrease ? "text-red-400" : "text-emerald-400"
                )}>
                    {isIncrease ? "+" : ""}{Math.round(absPercent)}%
                </p>
                <p className="text-xs text-white/50">
                    {isIncrease ? "יותר" : "פחות"} מהממוצע החודשי
                </p>
            </div>
        </motion.div>
    );
};
