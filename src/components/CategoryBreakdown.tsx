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
  GraduationCap,
  Sparkles,
  Shield,
} from "lucide-react";
import { Transaction, Subscription } from "@/types";
import { cn } from "@/lib/utils";

// Single unified category icons (same for both transactions and subscriptions)
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'אוכל': Utensils,
  'קפה': Coffee,
  'סופר': ShoppingBag,
  'תחבורה': Bus,
  'דלק': Fuel,
  'רכב': Car,
  'קניות': ShoppingBag,
  'בילוי': Beer,
  'מסעדה': Utensils,
  'חשבונות': Home,
  'בריאות': Heart,
  'ביטוח': Shield,
  'לימודים': GraduationCap,
  'קוסמטיקה': Sparkles,
  'עבודה': Briefcase,
  'אחר': Zap,
};

// Map old English category IDs to Hebrew categories
const CATEGORY_NORMALIZATION: Record<string, string> = {
  // English to Hebrew mapping for old subscriptions data
  'streaming': 'חשבונות',
  'insurance': 'ביטוח',
  'utilities': 'חשבונות',
  'rent': 'חשבונות',
  'internet': 'חשבונות',
  'music': 'בילוי',
  'gym': 'בריאות',
  'news': 'חשבונות',
  'cloud': 'חשבונות',
  'car': 'רכב',
  'health': 'בריאות',
  'education': 'לימודים',
  'phone': 'חשבונות',
  'gaming': 'בילוי',
  'work': 'עבודה',
  'cosmetics': 'קוסמטיקה',
  'other': 'אחר',
  'General': 'אחר',
};

// Export normalizeCategory for use in filtering
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return 'אחר';
  const trimmed = category.trim();
  // Check exact Hebrew match first
  if (CATEGORY_ICONS[trimmed]) return trimmed;
  // Check case-insensitive mapping
  const lower = trimmed.toLowerCase();
  if (CATEGORY_NORMALIZATION[lower]) return CATEGORY_NORMALIZATION[lower];
  // Check if the lowercase version exists in icons (unlikely for Hebrew but good safety)
  if (CATEGORY_ICONS[lower]) return lower;

  return 'אחר';
}

function getIconForCategory(categoryName: string) {
  return CATEGORY_ICONS[categoryName] || Zap;
}

interface CategoryBreakdownProps {
  transactions: Transaction[];
  subscriptions?: Subscription[];
  selectedCategory?: string | null;
  onCategorySelect?: (category: string | null) => void;
}

export const CategoryBreakdown = ({ transactions, subscriptions = [], selectedCategory, onCategorySelect }: CategoryBreakdownProps) => {
  const { total, rows } = useMemo(() => {
    // Track amount and whether category has transactions
    const byCategory = new Map<string, { sum: number; hasTransactions: boolean }>();

    // Process transactions
    transactions.forEach((tx) => {
      if (!tx) return;
      const cat = normalizeCategory(tx.category);
      const amount = Number(tx.amount);
      if (isNaN(amount) || amount <= 0) return;
      const existing = byCategory.get(cat) || { sum: 0, hasTransactions: false };
      byCategory.set(cat, {
        sum: existing.sum + amount,
        hasTransactions: true
      });
    });

    // Process subscriptions - normalize categories to Hebrew
    subscriptions.forEach((sub) => {
      if (!sub) return;
      const cat = normalizeCategory(sub.category);
      const amount = Number(sub.amount);
      if (isNaN(amount) || amount <= 0) return;
      const existing = byCategory.get(cat) || { sum: 0, hasTransactions: false };
      byCategory.set(cat, {
        sum: existing.sum + amount,
        hasTransactions: existing.hasTransactions // Keep existing flag
      });
    });

    const total = Array.from(byCategory.values()).reduce((a, b) => a + b.sum, 0);
    const rows = Array.from(byCategory.entries())
      .map(([name, data]) => ({ name, sum: data.sum, hasTransactions: data.hasTransactions }))
      .sort((a, b) => b.sum - a.sum);
    return { total, rows };
  }, [transactions, subscriptions]);

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
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              onClick={() => onCategorySelect?.(null)}
              className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              הצג הכל
            </button>
          )}
          <span className="text-xs text-white/50">
            סה״כ ₪{total.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map(({ name, sum, hasTransactions }, i) => {
          const pct = total > 0 ? (sum / total) * 100 : 0;
          const Icon = getIconForCategory(name);
          const isSelected = selectedCategory === name;
          const isClickable = hasTransactions;
          return (
            <div
              key={name}
              onClick={() => isClickable && onCategorySelect?.(isSelected ? null : name)}
              className={cn(
                "flex items-center gap-3 rounded-xl p-2 -mx-2 transition-all",
                isClickable ? "cursor-pointer" : "cursor-default opacity-70",
                isSelected
                  ? "bg-blue-500/20 ring-1 ring-blue-500/50"
                  : isClickable ? "hover:bg-white/5" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                isSelected ? "bg-blue-500/30" : "bg-white/5"
              )}>
                <Icon className={cn("w-4 h-4", isSelected ? "text-blue-300" : "text-white/70")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium truncate", isSelected ? "text-blue-200" : "text-white")}>
                      {name}
                    </span>
                    {!hasTransactions && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">
                        קבוע
                      </span>
                    )}
                  </div>
                  <span className={cn("text-sm font-bold shrink-0", isSelected ? "text-blue-200" : "text-white")}>
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
                      isSelected
                        ? "bg-blue-500"
                        : pct > 40 ? "bg-rose-500/70" : pct > 20 ? "bg-amber-500/70" : "bg-blue-500/70"
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
