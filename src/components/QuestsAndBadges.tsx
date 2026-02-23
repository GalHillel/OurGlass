"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Shield, Zap, TrendingDown, Target, Gift, Lock, CheckCircle2, ShieldCheck, Coins, Flame } from "lucide-react";
import { Transaction, Subscription, Liability } from "@/types";
import { useQuery } from "@tanstack/react-query";

const ICON_MAP = {
    Trophy, Star, Shield, Zap, TrendingDown, Target, Gift, Lock, ShieldCheck, Coins, Flame
};

interface QuestsProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
    balance: number;
    budget: number;
    streak?: number;
}

interface Quest {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof ICON_MAP;
    progress: number; // 0-100
    completed: boolean;
    xp: number;
    color: string;
}

const BADGE_THRESHOLDS = [
    { level: 1, xp: 0, title: "מתחיל", emoji: "🌱" },
    { level: 2, xp: 100, title: "חוסך", emoji: "💰" },
    { level: 3, xp: 300, title: "שולט בתקציב", emoji: "🎯" },
    { level: 4, xp: 600, title: "מאסטר פיננסי", emoji: "🏆" },
    { level: 5, xp: 1000, title: "גורו פיננסי", emoji: "👑" },
];

export function QuestsAndBadges({ transactions, subscriptions, liabilities, balance, budget, streak = 0 }: QuestsProps) {

    // 1. Calculate XP parameters based on local data
    const xpData = useMemo(() => {
        const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
        const daysWithTransactions = new Set(transactions.map((t) => t.date.slice(0, 10))).size;
        const hasAllCategories = new Set(transactions.map((t) => t.category)).size >= 5;
        const under80 = totalSpent < budget * 0.8;
        const under50 = totalSpent < budget * 0.5;

        return {
            totalSpent,
            daysWithTransactions,
            hasAllCategories,
            under80,
            under50,
            streak,
        };
    }, [transactions, budget, streak]);

    // 2. Fetch AI Quests (Dynamic challenges based on spending)
    const { data: quests = [], isLoading: isLoadingQuests } = useQuery<Quest[]>({
        queryKey: ['ai-quests', transactions.length, balance, subscriptions.length, liabilities.length, xpData],
        queryFn: async () => {
            const res = await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions, subscriptions, liabilities, balance, budget, xpParams: xpData })
            });
            if (!res.ok) throw new Error("API Error");
            const data = await res.json();
            return data.quests || [];
        },
        // Keep data fresh for dynamic quests
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const totalXP = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xp, 0);
    const currentBadge = [...BADGE_THRESHOLDS].reverse().find((b) => totalXP >= b.xp) || BADGE_THRESHOLDS[0];
    const nextBadge = BADGE_THRESHOLDS.find((b) => b.xp > totalXP);

    return (
        <div className="space-y-4">
            {/* Level badge card */}
            <div className="neon-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-2xl border border-yellow-500/20">
                            {currentBadge.emoji}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{currentBadge.title}</h3>
                            <p className="text-[10px] text-white/40">
                                {totalXP} XP
                                {nextBadge && ` • עוד ${nextBadge.xp - totalXP} XP לרמה הבאה`}
                            </p>
                        </div>
                    </div>
                    <Trophy className="w-5 h-5 text-yellow-400/40" />
                </div>

                {/* XP Progress to next level */}
                {nextBadge && (
                    <div className="mt-3">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${((totalXP - currentBadge.xp) / (nextBadge.xp - currentBadge.xp)) * 100}%`,
                                }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-white/20">{currentBadge.emoji} {currentBadge.title}</span>
                            <span className="text-[9px] text-white/20">{nextBadge.emoji} {nextBadge.title}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quests list */}
            <div className="space-y-2">
                {isLoadingQuests && (
                    <div className="text-center text-white/50 text-sm p-4">טוען משימות...</div>
                )}
                {!isLoadingQuests && quests.length === 0 && (
                    <div className="text-center text-white/50 text-sm p-4">אין משימות זמינות כרגע.</div>
                )}
                <AnimatePresence>
                    {quests.map((quest, i) => {
                        const Icon = ICON_MAP[quest.icon] || Trophy;
                        return (
                            <motion.div
                                key={quest.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: i * 0.08 }}
                                className={`neon-card rounded-xl p-3 flex items-center gap-3 ${quest.completed ? "border-emerald-500/20" : ""
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${quest.completed
                                    ? "bg-emerald-500/20"
                                    : `bg-${quest.color}-500/10`
                                    }`}>
                                    {quest.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Icon className={`w-4 h-4 text-${quest.color}-400`} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-white">{quest.title}</h4>
                                        <span className="text-[9px] text-yellow-400/60 font-bold">+{quest.xp} XP</span>
                                    </div>
                                    <p className="text-[10px] text-white/35 truncate">{quest.description}</p>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${quest.completed
                                                ? "bg-emerald-400"
                                                : "bg-gradient-to-r from-blue-500 to-purple-500"
                                                }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${quest.progress}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
