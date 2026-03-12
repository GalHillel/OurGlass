"use client";

import { useMemo } from "react";
import { useAppStore } from "@/stores/appStore";
import { getNow } from "@/demo/demo-config";
import { Transaction, Subscription, Liability } from "@/types";
import { motion } from "framer-motion";
import {
    Utensils,
    Bus,
    ShoppingBag,
    Beer,
    Home,
    Heart,
    Briefcase,
    Zap,
    Coffee,
    Fuel,
    Film,
    ShoppingCart,
    CreditCard,
    RefreshCw
} from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";
import { isLiabilityActive } from "@/hooks/useWealthData";
import { CURRENCY_SYMBOL } from "@/lib/constants";

// Combined icon map from various sources for consistency
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "אוכל": Utensils,
    "מסעדה": Utensils,
    "תחבורה": Bus,
    "דלק": Fuel,
    "קניות": ShoppingBag,
    "סופר": ShoppingCart,
    "בילוי": Beer,
    "בידור": Film,
    "חשבונות": Home,
    "בריאות": Heart,
    "עבודה": Briefcase,
    "קפה": Coffee,
    "אחר": Zap,
    "החזרי חובות": CreditCard,
    "מנויים": RefreshCw,
};

function getIconForCategory(categoryName: string) {
    return CATEGORY_ICONS[categoryName] || Zap;
}

interface SpendingBreakdownProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
    viewingDate?: Date;
}

export const SpendingBreakdown = ({ transactions, subscriptions, liabilities, viewingDate = getNow() }: SpendingBreakdownProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const { total, items } = useMemo(() => {
        const grouped = new Map<string, number>();

        // 1. Transactions
        transactions.forEach(tx => {
            const catName = tx.category || "אחר";
            const amount = Number(tx.amount);
            if (!isNaN(amount)) {
                grouped.set(catName, (grouped.get(catName) || 0) + amount);
            }
        });

        // 2. Add Active Subscriptions as a category
        const activeSubscriptionsTotal = (subscriptions || [])
            .filter((s: Subscription) => s.active !== false)
            .reduce((sum: number, s: Subscription) => sum + Number(s.amount), 0);

        if (activeSubscriptionsTotal > 0) {
            grouped.set("מנויים", (grouped.get("מנויים") || 0) + activeSubscriptionsTotal);
        }

        // 3. Add Active Liabilities (Debt Payments) as a category
        const activeDebtPaymentsTotal = (liabilities || [])
            .filter((l: Liability) => isLiabilityActive(l, viewingDate))
            .reduce((sum: number, l: Liability) => sum + Number(l.monthly_payment ?? 0), 0);

        if (activeDebtPaymentsTotal > 0) {
            grouped.set("תשלומי חובות", (grouped.get("תשלומי חובות") || 0) + activeDebtPaymentsTotal);
        }

        const totalSpend = Array.from(grouped.values()).reduce((sum: number, val: number) => sum + val, 0);

        // Convert to array and sort Descending by value
        const sortedItems = Array.from(grouped.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { total: totalSpend, items: sortedItems };
    }, [transactions, subscriptions, liabilities, viewingDate]);

    if (items.length === 0) {
        return (
            <div className="w-full px-6 mt-6 min-h-[100px] flex items-center justify-center border border-white/5 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl">
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">אין נתונים זמינים</p>
            </div>
        );
    }

    return (
        <div className="w-full px-6 mt-8">
            <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-4 px-1">פירוט הוצאות</h3>
            <div className="flex flex-col gap-3">
                {items.map((item, index) => {
                    const Icon = getIconForCategory(item.name);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;

                    return (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 w-full group"
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                <Icon className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            </div>

                            {/* Bar & Text */}
                            <div className="flex-1 flex flex-col justify-center gap-1.5">
                                <div className="flex justify-between items-end w-full">
                                    <span className="text-xs font-black text-white/50 leading-none uppercase tracking-widest">{item.name}</span>
                                    <span className="text-xs font-black text-white leading-none font-mono tabular-nums">{formatAmount(item.value, isStealthMode, CURRENCY_SYMBOL, '***')}</span>
                                </div>

                                {/* Progress Bar Container */}
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, delay: 0.2 + (index * 0.05) }}
                                        className={cn(
                                            "h-full rounded-full",
                                            // Dynamic color based on percentage intensity
                                            percentage > 40 ? "bg-rose-500" :
                                                percentage > 20 ? "bg-amber-500" :
                                                    "bg-blue-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
