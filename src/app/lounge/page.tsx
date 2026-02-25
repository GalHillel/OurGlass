"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart, Zap, Gem, Trophy } from "lucide-react";
import { GuiltFreeRoulette } from "@/components/GuiltFreeRoulette";
import { GoalTinder } from "@/components/GoalTinder";
import { useGlobalCashflow } from "@/hooks/useJointFinance";
import { useDashboardStore } from "@/stores/dashboardStore";
import { cn } from "@/lib/utils";

export default function LoungePage() {
    const { data: cashflow } = useGlobalCashflow();
    const features = useDashboardStore(s => s.features);
    const { loungeShowVibe, loungeShowRoulette, loungeShowTinder } = features;

    // Calculate "Current Vibe" based on financial health
    const budgetUsedPercent = cashflow ? (1 - cashflow.balance / cashflow.budget) * 100 : 0;

    let vibe = {
        label: "מרגישים בנוח",
        icon: Heart,
        color: "text-pink-400",
        bg: "bg-pink-500/10",
        border: "border-pink-500/20",
        description: "הכל תחת שליטה. זמן מושלם לפינוק קטן."
    };

    if (budgetUsedPercent > 95) {
        vibe = {
            label: "מצב חירום",
            icon: Zap,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            description: "חצינו את הקו האדום. חזרה למוד חסכוני מיד."
        };
    } else if (budgetUsedPercent > 75) {
        vibe = {
            label: "זהירות, שורף",
            icon: Zap,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            description: "הוצאנו הרבה החודש. כדאי להוריד הילוך."
        };
    } else if (budgetUsedPercent < 30) {
        vibe = {
            label: "בשיא הכוח",
            icon: Trophy,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            description: "אנחנו בחיסכון מעולה! הפינוק הגדול מחכה."
        };
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white pb-32">
            {/* Header / Vibe Indicator */}
            <div className="pt-8 px-6 mb-8 text-right" dir="rtl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center mb-8"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            הלובי הזוגי
                        </h1>
                        <Sparkles className="w-5 h-5 text-pink-400" />
                    </div>
                    <p className="text-white/40 text-sm max-w-[280px]">
                        כאן הופכים את הכסף למשחק. תהנו מהדרך המשותפת שלכם.
                    </p>
                </motion.div>

                {/* Vibe Card */}
                {loungeShowVibe && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn("p-6 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl relative overflow-hidden", vibe.bg, vibe.border)}
                    >
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-slate-900 border", vibe.border)}>
                                <vibe.icon className={cn("w-7 h-7", vibe.color)} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">האווירה הנוכחית</h3>
                                <div className={cn("text-2xl font-black", vibe.color)}>{vibe.label}</div>
                                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                                    {vibe.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="px-4 space-y-12">
                {/* Section 1: Roulette */}
                {loungeShowRoulette && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-2" dir="rtl">
                            <Gem className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-bold text-white tracking-tight">רולטת ה-Guilt-Free</h2>
                        </div>
                        <GuiltFreeRoulette />
                    </section>
                )}

                {/* Section 2: Tinder for Goals */}
                {loungeShowTinder && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-2" dir="rtl">
                            <Heart className="w-5 h-5 text-pink-400" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Tinder של חלומות</h2>
                        </div>
                        <GoalTinder />
                    </section>
                )}
            </div>

            {/* Background Decorative Blur */}
            <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none -z-10" />
        </div>
    );
}
