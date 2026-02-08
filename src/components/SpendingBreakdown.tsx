"use client";

import { useMemo } from "react";
import { Transaction } from "@/types";
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
    Car,
    FileText,
    ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

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
};

function getIconForCategory(categoryName: string) {
    return CATEGORY_ICONS[categoryName] || Zap;
}

interface SpendingBreakdownProps {
    transactions: Transaction[];
}

export const SpendingBreakdown = ({ transactions }: SpendingBreakdownProps) => {
    const { total, items } = useMemo(() => {
        const grouped = new Map<string, number>();

        transactions.forEach(tx => {
            // Use the category name directly
            const catName = tx.category || "אחר";
            const amount = Number(tx.amount);
            if (!isNaN(amount)) {
                grouped.set(catName, (grouped.get(catName) || 0) + amount);
            }
        });

        const totalSpend = Array.from(grouped.values()).reduce((sum, val) => sum + val, 0);

        // Convert to array and sort Descending by value
        const sortedItems = Array.from(grouped.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { total: totalSpend, items: sortedItems };
    }, [transactions]);

    if (items.length === 0) {
        return (
            <div className="w-full px-6 mt-6 min-h-[100px] flex items-center justify-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
                <p className="text-white/40 text-sm">אין נתונים להצגה</p>
            </div>
        );
    }

    return (
        <div className="w-full px-6 mt-8">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4 px-1">פירוט הוצאות</h3>
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
                            className="flex items-center gap-3 w-full"
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-white/70" />
                            </div>

                            {/* Bar & Text */}
                            <div className="flex-1 flex flex-col justify-center gap-1.5">
                                <div className="flex justify-between items-end w-full">
                                    <span className="text-sm font-medium text-white/90 leading-none">{item.name}</span>
                                    <span className="text-sm font-bold text-white leading-none">₪{item.value.toLocaleString()}</span>
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
