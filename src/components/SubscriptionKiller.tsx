"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Scissors, Star, StarOff, Trash2, Copy, AlertTriangle, Zap } from "lucide-react";
import { Subscription } from "@/types";
import { EmptyState } from "@/components/EmptyState";
import CountUp from "react-countup";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import { cn, formatAmount } from "@/lib/utils";

interface SubscriptionKillerProps {
    subscriptions: Subscription[];
    onDelete?: (id: string) => void;
}

interface DuplicateGroup {
    name: string;
    items: Subscription[];
    potentialSaving: number;
}

/**
 * Subscription Killer
 *
 * Analyzes subscriptions to find:
 * 1. Duplicates (similar names / amounts)
 * 2. Low-usage subscriptions (usage_rating <= 2)
 * 3. Total potential savings
 */
export function SubscriptionKiller({ subscriptions, onDelete }: SubscriptionKillerProps) {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const analysis = useMemo(() => {
        // 1. Find duplicates by similar name
        const nameMap = new Map<string, Subscription[]>();
        subscriptions.forEach((sub) => {
            const key = sub.name.toLowerCase().replace(/[^a-zא-ת0-9]/g, "").slice(0, 10);
            if (!nameMap.has(key)) nameMap.set(key, []);
            nameMap.get(key)!.push(sub);
        });

        const duplicates: DuplicateGroup[] = [];
        nameMap.forEach((items, name) => {
            if (items.length > 1) {
                const cheapest = Math.min(...items.map((i) => i.amount));
                const saving = items.reduce((sum, i) => sum + i.amount, 0) - cheapest;
                duplicates.push({ name, items, potentialSaving: saving });
            }
        });

        // 2. Find similar amounts (possible duplicates user missed)
        const amountMap = new Map<number, Subscription[]>();
        subscriptions.forEach((sub) => {
            const roundedAmount = Math.round(sub.amount);
            if (!amountMap.has(roundedAmount)) amountMap.set(roundedAmount, []);
            amountMap.get(roundedAmount)!.push(sub);
        });

        amountMap.forEach((items, amount) => {
            if (items.length > 1) {
                const alreadyFound = duplicates.some((d) =>
                    d.items.some((i) => items.includes(i))
                );
                if (!alreadyFound) {
                    const saving = items.slice(1).reduce((sum, i) => sum + i.amount, 0);
                    duplicates.push({
                        name: `$${CURRENCY_SYMBOL}${amount} (סכום זהה)`,
                        items,
                        potentialSaving: saving,
                    });
                }
            }
        });

        // 3. Low usage
        const lowUsage = subscriptions.filter(
            (s) => s.usage_rating !== null && s.usage_rating !== undefined && s.usage_rating <= 2
        );

        // 4. Total potential savings
        const totalSaving =
            duplicates.reduce((sum, d) => sum + d.potentialSaving, 0) +
            lowUsage.reduce((sum, s) => sum + s.amount, 0);

        return { duplicates, lowUsage, totalSaving };
    }, [subscriptions]);

    if (subscriptions.length === 0) {
        return (
            <EmptyState
                icon={Scissors}
                title="אין מנויים"
                description="הוסיפו מנויים כדי לזהות כפילויות ולחסוך"
            />
        );
    }

    const hasIssues = analysis.duplicates.length > 0 || analysis.lowUsage.length > 0;

    return (
        <div className="space-y-4">
            {/* Header with savings */}
            <div className="neon-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasIssues ? "bg-orange-500/20" : "bg-emerald-500/20"
                            }`}>
                            <Scissors className={`w-5 h-5 ${hasIssues ? "text-orange-400" : "text-emerald-400"}`} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">קוצץ מנויים</h3>
                            <p className="text-[10px] text-white/40">
                                {subscriptions.length} מנויים • {CURRENCY_SYMBOL}{subscriptions.reduce((s, sub) => s + sub.amount, 0).toLocaleString()}/חודש
                            </p>
                        </div>
                    </div>
                    {analysis.totalSaving > 0 && (
                        <div className="text-left">
                            <p className="text-[9px] text-orange-300/60 uppercase tracking-wider">חיסכון אפשרי</p>
                            <p className="text-lg font-black text-orange-400">
                                {CURRENCY_SYMBOL}<CountUp end={analysis.totalSaving} separator="," duration={0.8} />/חודש
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Insights Section */}
            {(analysis.duplicates.length > 0 || analysis.lowUsage.length > 0) && (
                <div className="space-y-3" dir="rtl">
                    {analysis.duplicates.length > 0 && (
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div className="text-right">
                                <p className="font-bold text-orange-200 text-sm">זיהוי מנויים כפולים</p>
                                <p className="text-[11px] text-orange-200/60 leading-tight">
                                    מצאנו {analysis.duplicates.length} מנויים שנראים דומים מאוד. כדאי לוודא שאתם לא משלמים פעמיים.
                                </p>
                            </div>
                        </div>
                    )}

                    {analysis.lowUsage.length > 0 && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                            <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-right">
                                <p className="font-bold text-emerald-200 text-sm">פוטנציאל חיסכון משמעותי</p>
                                <p className="text-[11px] text-emerald-200/60 leading-tight">
                                    יש לכם {analysis.lowUsage.length} מנויים עם דירוג שימוש נמוך. ביטולם יחסוך לכם {formatAmount(analysis.lowUsage.reduce((s, x) => s + x.amount, 0), isStealthMode, CURRENCY_SYMBOL)} בחודש.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Duplicates Details */}
            {analysis.duplicates.map((group, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="neon-card rounded-2xl p-4 border-orange-500/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Copy className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-300">כפילות אפשרית</span>
                        <span className="text-[10px] text-white/30 mr-auto">
                            חיסכון: {CURRENCY_SYMBOL}{group.potentialSaving.toLocaleString()}/חודש
                        </span>
                    </div>
                    <div className="space-y-2">
                        {group.items.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between bg-white/5 rounded-xl p-2">
                                <span className="text-sm text-white/80">{sub.name}</span>
                                <span className="text-sm font-bold text-white/60">${CURRENCY_SYMBOL}{sub.amount}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ))}

            {/* Low usage */}
            {analysis.lowUsage.length > 0 && (
                <div className="neon-card rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <StarOff className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-red-300">שימוש נמוך</span>
                    </div>
                    <div className="space-y-2">
                        {analysis.lowUsage.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                                <div>
                                    <p className="text-sm text-white/80">{sub.name}</p>
                                    <div className="flex gap-0.5 mt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-3 h-3 ${star <= (sub.usage_rating ?? 0)
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-white/10"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-red-400">{CURRENCY_SYMBOL}{sub.amount}/חודש</span>
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(sub.id)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All clear */}
            {!hasIssues && (
                <div className="text-center py-6 neon-card rounded-2xl">
                    <p className="text-emerald-400 font-bold text-sm">✅ כל המנויים נראים תקינים!</p>
                    <p className="text-[10px] text-white/30 mt-1">לא נמצאו כפילויות או שימוש נמוך</p>
                </div>
            )}
        </div>
    );
}
