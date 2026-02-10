"use client";

import { Transaction, Subscription } from "@/types";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Trash2, Edit2, ShoppingBag, Coffee, Car, Film, FileText, Utensils, Fuel, ShoppingCart, Calendar } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { SwipeableRow } from "@/components/SwipeableRow";
import { EmptyState } from "@/components/EmptyState";

interface TransactionListProps {
    transactions: Transaction[];
    subscriptions?: Subscription[]; // Add prop
    onRefresh: () => void;
    onEdit?: (tx: Transaction) => void;
    activeFilter?: string | null; // Category filter active
    activeDateFilter?: Date | null; // Date filter active
}

const getIcon = (description: string | null) => {
    if (!description) return ShoppingBag;
    if (description.includes("קפה")) return Coffee;
    if (description.includes("סופר")) return ShoppingCart;
    if (description.includes("דלק")) return Fuel;
    if (description.includes("מסעדה")) return Utensils;
    if (description.includes("בילוי")) return Film;
    if (description.includes("תחבורה")) return Car;
    if (description.includes("חשבונות")) return FileText;
    return ShoppingBag;
};

import React, { memo, useRef, useMemo } from 'react';

// ... imports ...

import { motion } from "framer-motion";
import { ActivePress } from "@/components/ui/ActivePress";

// ... imports ...

export const TransactionList = memo(({ transactions, subscriptions = [], onRefresh, onEdit, activeFilter, activeDateFilter }: TransactionListProps) => {
    const supabaseRef = useRef(createClientComponentClient());
    const supabase = supabaseRef.current;
    const [detectedSub, setDetectedSub] = React.useState<{ name: string, amount: number } | null>(null);

    // === IMPROVED RECURRING CHARGE DETECTION (Optimized with useMemo) ===
    const recurringCandidate = useMemo(() => {
        if (!transactions.length) return null;

        // Detects charges by: similar amounts (10% margin), similar dates (±5 days), same merchant
        interface RecurringCandidate {
            merchantName: string;
            amount: number;
            occurrences: number;
            daysOfMonth: number[];
        }

        const candidates = new Map<string, RecurringCandidate>();
        const AMOUNT_TOLERANCE = 0.10; // 10% margin
        const DAY_TOLERANCE = 5; // ±5 days considered "same day of month"

        // Helper functions defined inside useMemo to avoid dependency chain issues
        const normalizeName = (name: string | null): string => {
            if (!name) return 'unknown';
            return name.toLowerCase().trim()
                .replace(/[0-9]/g, '')
                .replace(/[^\u05d0-\u05eaa-z\s]/g, '')
                .trim();
        };

        const amountsSimilar = (a: number, b: number): boolean => {
            if (a === 0 || b === 0) return false;
            const diff = Math.abs(a - b) / Math.max(a, b);
            return diff <= AMOUNT_TOLERANCE;
        };

        transactions.forEach(tx => {
            const amt = Number(tx.amount);
            if (amt <= 0) return;

            const key = normalizeName(tx.description);
            if (key === 'unknown' || key.length < 2) return;

            const existing = candidates.get(key);
            const dayOfMonth = new Date(tx.date).getDate();

            if (existing) {
                if (amountsSimilar(amt, existing.amount)) {
                    existing.occurrences++;
                    existing.daysOfMonth.push(dayOfMonth);
                }
            } else {
                candidates.set(key, {
                    merchantName: tx.description || 'unknown',
                    amount: amt,
                    occurrences: 1,
                    daysOfMonth: [dayOfMonth]
                });
            }
        });

        return Array.from(candidates.values()).find(c => {
            if (c.occurrences < 2) return false;
            if (c.daysOfMonth.length >= 2) {
                const avgDay = c.daysOfMonth.reduce((a, b) => a + b, 0) / c.daysOfMonth.length;
                const allClose = c.daysOfMonth.every(d => Math.abs(d - avgDay) <= DAY_TOLERANCE);
                if (!allClose) return false;
            }
            return !subscriptions.some(s =>
                amountsSimilar(Number(s.amount), c.amount) ||
                normalizeName(s.name) === normalizeName(c.merchantName)
            );
        });
    }, [transactions, subscriptions]);

    React.useEffect(() => {
        if (recurringCandidate) {
            const key = `dismiss_sub_${Math.round(recurringCandidate.amount)}`;
            if (!localStorage.getItem(key)) {
                setDetectedSub({
                    amount: Math.round(recurringCandidate.amount),
                    name: recurringCandidate.merchantName
                });
            }
        }
    }, [recurringCandidate]);

    const handleDismissSub = () => {
        if (detectedSub) {
            localStorage.setItem(`dismiss_sub_${detectedSub.amount}`, 'true');
            setDetectedSub(null);
        }
    };

    const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());

    // ... handleDelete ... (keep existing)
    const handleDelete = async (id: string) => {
        // Optimistic Update
        setDeletedIds(prev => new Set(prev).add(id));

        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            toast.success("העסקה נמחקה");
            onRefresh();
        } catch (error: any) {
            // Rollback
            setDeletedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            toast.error("שגיאה במחיקה", { description: error.message });
        }
    };

    const visibleTransactions = React.useMemo(() =>
        transactions.filter(tx => !deletedIds.has(tx.id)),
        [transactions, deletedIds]);

    if (visibleTransactions.length === 0) {
        // Show different message if filter is active vs no transactions at all
        if (activeDateFilter) {
            return (
                <EmptyState
                    icon={Calendar}
                    title={`אין עסקאות ב-${format(activeDateFilter, "d.M", { locale: he })}`}
                    description="נסה לבחור תאריך אחר או להוסיף הוצאה"
                />
            );
        }
        if (activeFilter) {
            return (
                <EmptyState
                    icon={ShoppingBag}
                    title={`אין עסקאות בקטגוריה "${activeFilter}"`}
                    description="ייתכן שיש רק הוצאות קבועות בקטגוריה זו"
                    className="border-blue-500/20 bg-blue-500/5 text-blue-100"
                />
            );
        }
        return (
            <EmptyState
                icon={ShoppingBag}
                title="אין עסקאות עדיין"
                description="הוסף הוצאה ראשונה עם הלחצנים המהירים למעלה"
            />
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            className="w-full max-w-md space-y-3 px-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {detectedSub && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between relative group"
                >
                    <button
                        onClick={handleDismissSub}
                        className="absolute top-2 left-2 p-1 text-blue-300/50 hover:text-blue-300 rounded-full hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                            <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-200">זיהינו חיוב קבוע</p>
                            <p className="text-sm font-bold text-white">{detectedSub.name} (₪{detectedSub.amount})</p>
                        </div>
                    </div>
                    <button className="text-xs bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 px-3 py-1.5 rounded-lg transition-colors ml-6">
                        הוסף
                    </button>
                </motion.div>
            )}

            <h3 className="text-white/80 text-lg font-medium mb-2">פירוט עסקאות</h3>
            {visibleTransactions.map((tx) => {
                const installmentMatch = (tx.description || "").match(/\(תשלום (\d+\/\d+)\)/);
                const installmentLabel = installmentMatch ? installmentMatch[1] : null;
                const cleanDescription = (tx.description || "").replace(/\s*\(תשלום \d+\/\d+\)/, "");

                const [title, note] = cleanDescription.split('\n');
                const Icon = getIcon(title || cleanDescription || "");
                return (
                    <motion.div key={tx.id} variants={item} layoutId={tx.id}>
                        <SwipeableRow
                            className="mb-3 rounded-2xl overflow-hidden"
                            onEdit={() => onEdit && onEdit(tx)}
                            onDelete={() => handleDelete(tx.id)}
                            deleteMessage="פעולה זו תמחק את העסקה לצמיתות."
                        >
                            <ActivePress className="neon-card p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 shrink-0">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white line-clamp-1 md:line-clamp-2 break-words text-right">{title || "ללא תיאור"}</h4>
                                        {note && (
                                            <p className="text-sm text-white/70 break-words line-clamp-2 text-right">{note}</p>
                                        )}
                                        <p className="text-xs text-white/50 mt-0.5 text-right">
                                            {format(new Date(tx.date), "d בMMMM, HH:mm", { locale: he })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {installmentLabel && (
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 border border-white/5">
                                            {installmentLabel}
                                        </span>
                                    )}
                                    <span className="font-bold text-white">₪{tx.amount}</span>
                                </div>
                            </ActivePress>
                        </SwipeableRow>
                    </motion.div>
                );
            })}
        </motion.div>
    );
});

TransactionList.displayName = "TransactionList";
