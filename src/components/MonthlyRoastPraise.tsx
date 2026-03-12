"use client";

import { motion } from "framer-motion";
import { Sparkles, PartyPopper } from "lucide-react";
import { Transaction, Subscription, Liability } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_MODE, getNow } from "@/demo/demo-config";

interface MonthlyRoastProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
    balance: number;
    budget: number;
    monthlyIncome: number;
}

interface Insight {
    type: "roast" | "praise";
    text: string;
    emoji: string;
}

/**
 * AI Monthly Roast/Praise
 *
 * Generates witty Hebrew summaries based on spending patterns using REAL Google AI insights.
 */
export function MonthlyRoastPraise({ transactions, subscriptions, liabilities, balance, budget, monthlyIncome }: MonthlyRoastProps) {

    const STORAGE_KEY = 'last_ai_insights';
    const { data: insights, isLoading, isError } = useQuery<Insight[]>({
        queryKey: ['ai-insights', transactions.length, balance, budget, monthlyIncome],
        queryFn: async () => {
            const todayString = getNow().toDateString();
            const lastSeenDate = localStorage.getItem(STORAGE_KEY + '_date');
            const cachedData = localStorage.getItem(STORAGE_KEY + '_data');

            // Cache hit from today?
            if (lastSeenDate === todayString && cachedData && !isError) {
                try {
                    return JSON.parse(cachedData);
                } catch (e) {
                    console.error("Failed to parse cached insights", e);
                }
            }

            if (transactions.length === 0) return [];

            if (DEMO_MODE) {
                return [
                    { type: "praise", text: "צמצמתם את ההוצאות על וולט ב-30% השבוע. הארנק שלכם (והגוף שלכם) מודה לכם! 🥗", emoji: "🥗" },
                    { type: "roast", text: "נראה שסטארבקס הוא המשקיע העיקרי בכם החודש. אולי כדאי לקנות מכונת קפה? ☕", emoji: "☕" },
                    { type: "praise", text: "החזרתם את ההלוואה לפני הזמן! אתם בדרך לחופש כלכלי אמיתי. 🚀", emoji: "🚀" }
                ];
            }

            const res = await fetch('/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions, subscriptions, liabilities, balance, budget, monthlyIncome })
            });

            if (!res.ok) throw new Error("Failed to fetch insights");
            const data = await res.json();
            const result = data.insights || [];

            // Cache it
            if (result.length > 0) {
                localStorage.setItem(STORAGE_KEY + '_date', todayString);
                localStorage.setItem(STORAGE_KEY + '_data', JSON.stringify(result));
            }

            return result;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 1
    });

    // Add InsightData interface check if missing
    // In fact, it was named Insight in the original file, I should use that or rename.
    // Let's use Insight to match the file.

    if (transactions.length === 0) {
        return (
            <div className="neon-card rounded-3xl p-6 text-center border border-white/5 opacity-70">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-white/50">הוסף הוצאה כדי לקבל ניתוח AI</h3>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="neon-card rounded-3xl p-5 space-y-4 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">ה-AI מנתח את ההוצאות שלך...</h3>
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                </div>
            </div>
        );
    }

    if (isError || !insights || insights.length === 0) {
        // Fallback or empty state if API fails
        return (
            <div className="neon-card rounded-3xl p-5 border border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)] text-center relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
                <Sparkles className="w-6 h-6 text-red-400/50 mx-auto mb-2 relative z-10" />
                <h3 className="text-sm font-bold text-white/80 relative z-10">ה-AI לא זמין כרגע</h3>
                <p className="text-xs text-white/50 mt-1 relative z-10">ייתכן שמכסת השימוש הסתיימה או שיש עומס בשרתי Google.</p>
            </div>
        );
    }

    const roasts = insights.filter((i) => i.type === "roast");
    const praises = insights.filter((i) => i.type === "praise");
    const overallGood = praises.length >= roasts.length;

    return (
        <div className="neon-card rounded-3xl p-5 space-y-4 border border-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />

            {/* Header */}
            <div className="flex items-center gap-2 relative z-10">
                {overallGood ? (
                    <PartyPopper className="w-5 h-5 text-emerald-400" />
                ) : (
                    <Sparkles className="w-5 h-5 text-purple-400" />
                )}
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">סיכום AI חודשי</h3>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold mr-auto tracking-wider ${overallGood
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    }`}>
                    {overallGood ? "מצוין!" : "דורש שיפור"}
                </span>
            </div>

            {/* Insights */}
            <div className="space-y-2.5 relative z-10">
                {insights.map((insight, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                        className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md ${insight.type === "praise"
                            ? "bg-emerald-500/5 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                            : "bg-orange-500/5 border-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                            }`}
                    >
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl shadow-lg border ${insight.type === "praise" ? "bg-emerald-500/20 border-emerald-500/30" : "bg-orange-500/20 border-orange-500/30"}`}>
                            {insight.emoji}
                        </div>
                        <p className={`text-sm leading-relaxed font-medium mt-0.5 ${insight.type === "praise" ? "text-emerald-50" : "text-orange-50"
                            }`}>
                            {insight.text}
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
