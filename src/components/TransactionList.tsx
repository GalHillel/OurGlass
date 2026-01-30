"use client";

import { Transaction } from "@/types";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Trash2, Edit2, ShoppingBag, Coffee, Car, Film, FileText, Utensils, Fuel, ShoppingCart } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { SwipeableRow } from "@/components/SwipeableRow";

interface TransactionListProps {
    transactions: Transaction[];
    onRefresh: () => void;
    onEdit?: (tx: Transaction) => void;
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

import React, { memo } from 'react';

// ... imports ...

import { motion } from "framer-motion";
import { ActivePress } from "@/components/ui/ActivePress";

// ... imports ...

export const TransactionList = memo(({ transactions, onRefresh, onEdit }: TransactionListProps) => {
    const supabase = createClientComponentClient();

    // ... handleDelete ... (keep existing)
    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            toast.success("העסקה נמחקה");
            onRefresh();
        } catch (error: any) {
            toast.error("שגיאה במחיקה", { description: error.message });
        }
    };

    if (transactions.length === 0) {
        return ( // ...
            <div className="text-center text-white/40 py-8">
                אין עסקאות להצגה
            </div>
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
            <h3 className="text-white/80 text-lg font-medium mb-2">פירוט עסקאות</h3>
            {transactions.map((tx) => {
                const [title, note] = (tx.description || "").split('\n');
                const Icon = getIcon(title || tx.description || "");
                return (
                    <motion.div key={tx.id} variants={item}>
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

                                <div className="flex items-center gap-4">
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
