"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react";
import { useWealthHistory } from "@/hooks/useWealthData";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const PERIODS = [
    { label: "30 יום", days: 30 },
    { label: "90 יום", days: 90 },
    { label: "שנה", days: 365 },
] as const;

interface NetWorthHistoryProps {
    liveNetWorth?: number;
}

export function NetWorthHistory({ liveNetWorth }: NetWorthHistoryProps) {
    const [period, setPeriod] = useState(90);
    const [isExpanded, setIsExpanded] = useState(false);
    const { data: snapshots = [], isLoading } = useWealthHistory(period);

    const chartData = useMemo(() => {
        const historical = snapshots.map((s) => ({
            date: s.snapshot_date,
            netWorth: s.net_worth,
            cash: s.cash_value,
            investments: s.investments_value,
            liabilities: s.liabilities_value,
            label: format(parseISO(s.snapshot_date), "dd MMM", { locale: he }),
        }));

        // Append live net worth as today's data point to sync chart with actual value
        if (liveNetWorth !== undefined && liveNetWorth > 0) {
            const today = new Date().toISOString().split("T")[0];
            const lastDate = historical.length > 0 ? historical[historical.length - 1].date : null;

            // Only append if today's date differs from the last snapshot OR if value differs significantly
            if (!lastDate || lastDate !== today) {
                historical.push({
                    date: today,
                    netWorth: liveNetWorth,
                    cash: 0,
                    investments: 0,
                    liabilities: 0,
                    label: format(new Date(), "dd MMM", { locale: he }),
                });
            } else {
                // Replace the last point with the live value (it's today, use the accurate one)
                historical[historical.length - 1] = {
                    ...historical[historical.length - 1],
                    netWorth: liveNetWorth,
                };
            }
        }

        return historical;
    }, [snapshots, liveNetWorth]);

    const trend = useMemo(() => {
        if (chartData.length < 2) return null;

        const first = chartData[0].netWorth;
        const last = chartData[chartData.length - 1].netWorth;
        const change = last - first;
        const percent = first > 0 ? (change / first) * 100 : 0;

        return { change, percent, up: change >= 0 };
    }, [chartData]);

    // Current display value — prefer live, fallback to last snapshot
    const displayNetWorth = liveNetWorth ?? (chartData.length > 0 ? chartData[chartData.length - 1].netWorth : 0);

    if (isLoading) {
        return <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />;
    }

    return (
        <div className="neon-card rounded-2xl overflow-hidden">
            {/* Collapsed Header — always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">היסטוריית שווי</h3>
                        <div className="text-2xl font-black text-white mt-0.5 tabular-nums">
                            ₪{displayNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend.up
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                            }`}>
                            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend.percent >= 0 ? "+" : ""}{trend.percent.toFixed(1)}%
                        </div>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-5 h-5 text-white/30" />
                    </motion.div>
                </div>
            </button>

            {/* Expanded Chart — revealed on tap */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3">
                            {/* Period tabs */}
                            <div className="flex justify-end">
                                <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                                    {PERIODS.map((p) => (
                                        <button
                                            key={p.days}
                                            onClick={(e) => { e.stopPropagation(); setPeriod(p.days); }}
                                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${period === p.days
                                                ? "bg-blue-600 text-white"
                                                : "text-white/40 hover:text-white/60"
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {chartData.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="w-8 h-8 text-white/20 mx-auto mb-3" />
                                    <p className="text-sm text-white/50">נתוני היסטוריה ייאספו בקרוב</p>
                                    <p className="text-xs text-white/30 mt-1">תמונות מצב נאספות מדי יום</p>
                                </div>
                            ) : (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                                                axisLine={false}
                                                tickLine={false}
                                                interval="preserveStartEnd"
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
                                                width={50}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                                                    borderColor: "rgba(255,255,255,0.1)",
                                                    borderRadius: "12px",
                                                    color: "#fff",
                                                    fontSize: "12px",
                                                }}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(value: any) => [`₪${Number(value).toLocaleString()}`, "שווי נקי"]}
                                                labelFormatter={(label) => String(label)}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="netWorth"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="url(#netWorthGrad)"
                                                dot={false}
                                                animationDuration={1000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
