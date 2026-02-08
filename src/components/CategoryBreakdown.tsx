"use client";

import { useMemo } from "react";
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
  PieChart,
  Coffee,
  Fuel,
  Car,
} from "lucide-react";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";

// Match categories from AddTransactionDrawer
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'אוכל': Utensils,
  'קפה': Coffee,
  'סופר': ShoppingBag,
  'תחבורה': Bus,
  'דלק': Fuel,
  'קניות': ShoppingBag,
  'בילוי': Beer,
  'מסעדה': Utensils,
  'חשבונות': Home,
  'בריאות': Heart,
  'עבודה': Briefcase,
  'אחר': Zap,
  'General': Zap, // Default from DB
};

function getIconForCategory(categoryName: string) {
  return CATEGORY_ICONS[categoryName] || Zap;
}

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

export const CategoryBreakdown = ({ transactions }: CategoryBreakdownProps) => {
  const { total, rows } = useMemo(() => {
    const byCategory = new Map<string, number>();

    transactions.forEach((tx) => {
      // Skip invalid transactions
      if (!tx) return;

      // Handle category - default to "אחר" for null/undefined/empty
      const cat = tx.category?.trim() || "אחר";

      // Defensive number coercion with validation
      const amount = Number(tx.amount);

      // Skip invalid amounts (NaN, negative, undefined, zero)
      if (isNaN(amount) || amount <= 0) return;

      byCategory.set(cat, (byCategory.get(cat) || 0) + amount);
    });

    const total = Array.from(byCategory.values()).reduce((a, b) => a + b, 0);
    const rows = Array.from(byCategory.entries())
      .map(([name, sum]) => ({ name, sum }))
      .sort((a, b) => b.sum - a.sum);
    return { total, rows };
  }, [transactions]);

  if (rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="neon-card p-4 rounded-2xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">הוצאות לפי קטגוריה</h3>
        </div>
        <p className="text-xs text-white/50">אין עדיין הוצאות החודש</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="neon-card p-4 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">הוצאות לפי קטגוריה</h3>
        </div>
        <span className="text-xs text-white/50">
          סה״כ ₪{total.toLocaleString()}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map(({ name, sum }, i) => {
          const pct = total > 0 ? (sum / total) * 100 : 0;
          const Icon = getIconForCategory(name);
          return (
            <div key={name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">
                    {name}
                  </span>
                  <span className="text-sm font-bold text-white shrink-0">
                    ₪{Math.round(sum).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className={cn(
                      "h-full rounded-full",
                      pct > 40 ? "bg-rose-500/70" : pct > 20 ? "bg-amber-500/70" : "bg-blue-500/70"
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
