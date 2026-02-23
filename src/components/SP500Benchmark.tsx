"use client";

import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { useWealthHistory } from "@/hooks/useWealthData";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";

// Historical S&P 500 average annual return ≈ 10.5%
const SP500_ANNUAL_RETURN = 0.105;

interface BenchmarkProps {
    initialWealth: number;
}

export function SP500Benchmark({ initialWealth }: BenchmarkProps) {
    const { data: snapshots = [], isLoading } = useWealthHistory(365);

    const chartData = useMemo(() => {
        if (snapshots.length < 2 || !initialWealth) return [];

        const firstSnapshot = snapshots[0];
        const startNetWorth = firstSnapshot.net_worth || initialWealth;
        const startDate = parseISO(firstSnapshot.snapshot_date);

        return snapshots.map((s) => {
            const snapshotDate = parseISO(s.snapshot_date);
            const daysDiff = (snapshotDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
            const yearsElapsed = daysDiff / 365;

            // S&P 500 benchmark: compound the average annual return
            const sp500Value = startNetWorth * Math.pow(1 + SP500_ANNUAL_RETURN, yearsElapsed);

            return {
                date: s.snapshot_date,
                label: format(snapshotDate, "dd MMM", { locale: he }),
                yours: s.net_worth,
                sp500: Math.round(sp500Value),
            };
        });
    }, [snapshots, initialWealth]);

    const performance = useMemo(() => {
        if (chartData.length < 2) return null;

        const first = chartData[0];
        const last = chartData[chartData.length - 1];

        const yoursReturn = first.yours > 0
            ? ((last.yours - first.yours) / first.yours) * 100
            : 0;
        const sp500Return = first.sp500 > 0
            ? ((last.sp500 - first.sp500) / first.sp500) * 100
            : 0;

        return {
            yoursReturn: Math.round(yoursReturn * 10) / 10,
            sp500Return: Math.round(sp500Return * 10) / 10,
            beating: yoursReturn > sp500Return,
        };
    }, [chartData]);

    if (isLoading) {
        return <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />;
    }

    if (chartData.length < 2) {
        return null; // Not enough data for comparison
    }

    return (
        <div className="neon-card rounded-2xl p-4 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white/80">בנצ׳מרק S&P 500</h3>
                </div>
                {performance && (
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${performance.beating
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-orange-500/10 text-orange-400"
                        }`}>
                        {performance.beating ? "מנצח את השוק! 🎉" : "מפגר אחרי השוק"}
                    </div>
                )}
            </div>

            {/* Stats */}
            {performance && (
                <div className="flex gap-4 text-center">
                    <div className="flex-1 bg-white/5 rounded-xl p-2">
                        <p className="text-[10px] text-white/40">אתם</p>
                        <p className={`text-sm font-bold ${performance.yoursReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {performance.yoursReturn >= 0 ? "+" : ""}{performance.yoursReturn}%
                        </p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl p-2">
                        <p className="text-[10px] text-white/40">S&P 500</p>
                        <p className="text-sm font-bold text-blue-400">+{performance.sp500Return}%</p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
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
                            formatter={(value: any, name: any) => [
                                `₪${Number(value).toLocaleString()}`,
                                name === "yours" ? "אתם" : "S&P 500",
                            ]}
                        />
                        <Line type="monotone" dataKey="yours" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="sp500" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[9px] text-white/20 text-center">
                * ההשוואה מבוססת על תשואה שנתית ממוצעת של S&P 500 ({(SP500_ANNUAL_RETURN * 100).toFixed(1)}%)
            </p>
        </div>
    );
}
