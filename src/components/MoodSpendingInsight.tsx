"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Smile, Heart, Laugh, Meh, Frown } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Transaction, Subscription, Liability } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface MoodInsight {
    type: "info" | "warning" | "success";
    text: string;
}

const MOOD_CONFIG = [
    { rating: 1, label: "😞 עצוב", emoji: "😞", color: "#ef4444", icon: Frown },
    { rating: 2, label: "😕 לא טוב", emoji: "😕", color: "#f97316", icon: Frown },
    { rating: 3, label: "😐 רגיל", emoji: "😐", color: "#eab308", icon: Meh },
    { rating: 4, label: "🙂 טוב", emoji: "🙂", color: "#22c55e", icon: Smile },
    { rating: 5, label: "😄 מעולה", emoji: "😄", color: "#10b981", icon: Laugh },
];

interface MoodSpendingProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
}

/**
 * Mood vs. Spending Analysis
 *
 * Uses the `mood_rating` field on transactions to show the correlation
 * between mood and spending behavior. Typical insight: People spend more
 * when sad (emotional spending) or very happy (celebratory spending).
 */
export function MoodSpendingInsight({ transactions, subscriptions, liabilities }: MoodSpendingProps) {
    const chartData = useMemo(() => {
        const moodBuckets: Record<number, { total: number; count: number }> = {};

        transactions.forEach((tx) => {
            if (tx.mood_rating && tx.mood_rating >= 1 && tx.mood_rating <= 5) {
                if (!moodBuckets[tx.mood_rating]) {
                    moodBuckets[tx.mood_rating] = { total: 0, count: 0 };
                }
                moodBuckets[tx.mood_rating].total += tx.amount;
                moodBuckets[tx.mood_rating].count += 1;
            }
        });

        return MOOD_CONFIG.map((mood) => {
            const bucket = moodBuckets[mood.rating];
            return {
                mood: mood.emoji,
                label: mood.label,
                rating: mood.rating,
                avgSpend: bucket ? Math.round(bucket.total / bucket.count) : 0,
                totalSpend: bucket ? Math.round(bucket.total) : 0,
                count: bucket ? bucket.count : 0,
                color: mood.color,
            };
        }).filter((d) => d.count > 0);
    }, [transactions]);

    const { data: insight, isLoading } = useQuery<MoodInsight | null>({
        queryKey: ['mood-insight', chartData, subscriptions, liabilities],
        queryFn: async () => {
            if (chartData.length < 2) return null;
            const res = await fetch('/api/mood-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chartData, transactions, subscriptions, liabilities })
            });
            if (!res.ok) throw new Error("API Error");
            return res.json();
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours caching
        enabled: chartData.length >= 2,
    });

    // Need at least some mood data
    const hasMoodData = chartData.some((d) => d.count > 0);

    if (!hasMoodData) {
        return (
            <div className="neon-card rounded-2xl p-4 text-center space-y-2">
                <Heart className="w-6 h-6 text-white/20 mx-auto" />
                <p className="text-sm text-white/40">אין עדיין נתוני מצב רוח</p>
                <p className="text-[10px] text-white/25">
                    הוסיפו דירוג מצב רוח בכל הוצאה כדי לגלות תובנות
                </p>
            </div>
        );
    }

    return (
        <div className="neon-card rounded-2xl p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-white/80">מצב רוח vs. הוצאות</h3>
            </div>

            {/* Chart */}
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                        <XAxis
                            dataKey="mood"
                            tick={{ fontSize: 16 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `₪${v} `}
                            width={40}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                borderColor: "rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: "11px",
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`₪${Number(value).toLocaleString()} `, "ממוצע להוצאה"]}
                            labelFormatter={() => ""}
                        />
                        <Bar dataKey="avgSpend" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Insight */}
            {isLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-900/50 border-white/5">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse shrink-0" />
                    <Skeleton className="h-4 w-full bg-white/10 rounded-full" />
                </div>
            ) : insight ? (
                <div
                    className={cn(
                        "text-xs p-3 rounded-xl border flex items-center gap-2",
                        insight.type === "warning" && "bg-orange-500/10 border-orange-500/20 text-orange-200",
                        insight.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-200",
                        insight.type === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                    )}
                >
                    <Sparkles className="w-4 h-4 opacity-70 shrink-0" />
                    {insight.text}
                </div>
            ) : null}

            {/* Stats row */}
            <div className="flex gap-2 overflow-x-auto">
                {chartData.map((d) => (
                    <div key={d.rating} className="text-center shrink-0 bg-white/5 rounded-lg px-2 py-1.5">
                        <p className="text-sm">{d.mood}</p>
                        <p className="text-[9px] text-white/40">{d.count} הוצאות</p>
                        <p className="text-[10px] font-bold text-white/70">₪{d.avgSpend}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function cn(...classes: (string | false | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
