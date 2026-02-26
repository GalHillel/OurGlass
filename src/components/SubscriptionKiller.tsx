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

import { useDashboardStore } from "@/stores/dashboardStore";

interface DuplicateGroup {
    name: string;
    items: Subscription[];
    potentialSaving: number;
}

interface SubscriptionKillerProps {
    subscriptions: Subscription[];
    onDelete?: (id: string) => void;
    onUpdateStatus?: (id: string, status: Subscription['status']) => void;
}

export function SubscriptionKiller({ subscriptions, onDelete, onUpdateStatus }: SubscriptionKillerProps) {
    const isStealthMode = useAppStore(s => s.isStealthMode);

    const savedThisMonth = useMemo(() => {
        return subscriptions
            .filter(s => s.status === 'saved' || s.active === false)
            .reduce((sum, s) => sum + s.amount, 0);
    }, [subscriptions]);

    const analysis = useMemo(() => {
        // ... (existing analysis logic)
        const nameMap = new Map<string, Subscription[]>();
        subscriptions.filter(s => s.active !== false && s.status !== 'saved').forEach((sub) => {
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

        const lowUsage = subscriptions.filter(
            (s) => s.active !== false && s.status !== 'saved' && s.usage_rating !== null && s.usage_rating !== undefined && s.usage_rating <= 2
        );

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

    return (
        <div className="space-y-4">
            {/* Premium Savings Header */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border-emerald-500/20">
                <div className="absolute inset-0 bg-emerald-500/5 blur-3xl" />
                <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-1">כסף שנחסך מביטולים החודש</p>
                    <div className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                        {CURRENCY_SYMBOL}<CountUp end={savedThisMonth} separator="," duration={1} />
                    </div>
                    {analysis.totalSaving > 0 && (
                        <div className="mt-3 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                            <p className="text-[10px] font-bold text-orange-400">
                                פוטנציאל לחיסכון נוסף: {CURRENCY_SYMBOL}{analysis.totalSaving.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Action Plan Section */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest px-1">תוכנית פעולה לביטול</h3>

                {analysis.lowUsage.length === 0 && analysis.duplicates.length === 0 && (
                    <div className="glass-panel p-6 text-center opacity-40">
                        <p className="text-sm">אין מנויים לביטול כרגע ✨</p>
                    </div>
                )}

                {analysis.duplicates.map((group, i) => (
                    <motion.div
                        key={`dup-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-4 border-orange-500/20"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Copy className="w-4 h-4 text-orange-400" />
                            <span className="text-xs font-bold text-orange-300">כפילות אפשרית</span>
                        </div>
                        <div className="space-y-2">
                            {group.items.map((sub) => (
                                <SubscriptionActionItem
                                    key={sub.id}
                                    subscription={sub}
                                    onUpdateStatus={onUpdateStatus}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}

                {analysis.lowUsage.map((sub) => (
                    <SubscriptionActionItem
                        key={sub.id}
                        subscription={sub}
                        onUpdateStatus={onUpdateStatus}
                        onDelete={onDelete}
                        isLowUsage
                    />
                ))}
            </div>
        </div>
    );
}

function SubscriptionActionItem({
    subscription: sub,
    onUpdateStatus,
    onDelete,
    isLowUsage
}: {
    subscription: Subscription;
    onUpdateStatus?: (id: string, status: Subscription['status']) => void;
    onDelete?: (id: string) => void;
    isLowUsage?: boolean;
}) {
    return (
        <div className="glass-card-inner p-3 flex items-center justify-between group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {isLowUsage ? <StarOff className="w-5 h-5 text-red-400" /> : <Copy className="w-5 h-5 text-orange-400" />}
                </div>
                <div>
                    <p className="text-sm font-bold text-white">{sub.name}</p>
                    <p className="text-[10px] text-white/40">{CURRENCY_SYMBOL}{sub.amount}/חודש</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={sub.status || 'active'}
                    onChange={(e) => onUpdateStatus?.(sub.id, e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg text-[10px] px-2 py-1 outline-none text-white/60 focus:border-blue-500 transition-colors"
                >
                    <option value="active">פעיל</option>
                    <option value="to_cancel">לביטול</option>
                    <option value="processing">בתהליך</option>
                    <option value="saved">בוטל/נחסך!</option>
                </select>
                {onDelete && (
                    <button
                        onClick={() => onDelete(sub.id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
