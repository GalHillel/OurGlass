"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useWealthHistory, useSP500History } from "@/hooks/useWealthData";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";


interface BenchmarkProps {
    initialWealth: number;
}

export function SP500Benchmark({ initialWealth }: BenchmarkProps) {
    const { data: snapshots = [], isLoading: isLoadingHistory } = useWealthHistory(365);
    const { data: sp500History = [], isLoading: isLoadingMarket } = useSP500History(365);
    const [isExpanded, setIsExpanded] = useState(false);

    const chartData = useMemo(() => {
        if (!initialWealth || snapshots.length === 0 || sp500History.length === 0) return [];

        // 1. Reconcile snapshots with live data
        // If the last snapshot is significantly different from initialWealth, 
        // we assume history was missing some assets (as per user feedback).
        const lastSnapshot = snapshots[snapshots.length - 1];
        const lastValue = lastSnapshot.net_worth;
        const delta = Math.abs(initialWealth - lastValue) > 1000 ? initialWealth - lastValue : 0;

        // 2. Map snapshots to chart points and apply correction offset
        const reconciledPoints = snapshots.map(s => ({
            date: s.snapshot_date,
            yours: Math.round(s.net_worth + delta), // Adjusted reality
            label: format(parseISO(s.snapshot_date), "dd MMM", { locale: he })
        }));

        // 3. Add "Now" point if last snapshot isn't today
        const todayStr = new Date().toISOString().split('T')[0];
        if (reconciledPoints[reconciledPoints.length - 1].date !== todayStr) {
            reconciledPoints.push({
                date: todayStr,
                yours: initialWealth,
                label: "היום"
            });
        }

        // 4. Calculate S&P 500 performance relative to starting wealth
        const firstPoint = reconciledPoints[0];
        const firstDateStr = firstPoint.date;

        const firstSP500 = sp500History.find(d => d.date >= firstDateStr) || sp500History[0];
        const startSP500Price = firstSP500.price;

        return reconciledPoints.map(p => {
            const currentSP500 = sp500History.find(d => d.date >= p.date) || sp500History[sp500History.length - 1];
            const marketReturn = (currentSP500.price / startSP500Price);

            return {
                ...p,
                sp500: Math.round(firstPoint.yours * marketReturn)
            };
        });
    }, [snapshots, sp500History, initialWealth]);

    const performance = useMemo(() => {
        if (chartData.length < 2) return null;

        const first = chartData[0];
        const last = chartData[chartData.length - 1];

        const yoursReturn = ((last.yours - first.yours) / first.yours) * 100;
        const sp500Return = ((last.sp500 - first.sp500) / first.sp500) * 100;

        return {
            yoursReturn: Math.round(yoursReturn * 10) / 10,
            sp500Return: Math.round(sp500Return * 10) / 10,
            alpha: Math.round((yoursReturn - sp500Return) * 10) / 10,
            beating: yoursReturn > sp500Return,
            deltaValue: last.yours - last.sp500
        };
    }, [chartData]);

    const isLoading = isLoadingHistory || isLoadingMarket;

    if (isLoading) {
        return <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />;
    }

    if (chartData.length < 2) {
        return null; // Not enough data for comparison
    }

    return (
        <div className="neon-card rounded-2xl overflow-hidden transition-all duration-300 border-white/[0.08]">
            {/* Header / Summary State */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex justify-between items-center group active:bg-white/5"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${performance?.beating ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-bold text-white tracking-tight">ביצועים מול השוק (S&P 500)</h3>
                        {performance && (
                            <p className="text-[10px] text-white/40 font-medium">
                                {performance.beating ? "אתם מנצחים את השוק! 🎉" : "S&P 500 מוביל כרגע"}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {performance && (
                        <div className="flex flex-col items-end">
                            <span className={`text-sm font-black flex items-center gap-1 ${performance.beating ? 'text-emerald-400' : 'text-blue-400'}`}>
                                {performance.beating ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {performance.yoursReturn}%
                            </span>
                            <span className="text-[9px] text-white/20 uppercase tracking-tighter">VS {performance.sp500Return}%</span>
                        </div>
                    )}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                    >
                        <ChevronDown className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                    </motion.div>
                </div>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 relative overflow-hidden">
                                    <div className="absolute -right-2 -bottom-2 opacity-5">
                                        <TrendingUp className="w-12 h-12 text-white" />
                                    </div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">התיק שלכם</p>
                                    <p className={`text-xl font-black ${performance?.yoursReturn && performance.yoursReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {performance?.yoursReturn && performance.yoursReturn >= 0 ? "+" : ""}{performance?.yoursReturn}%
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-between">
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">פער (Alpha)</p>
                                    <p className={`text-xl font-black ${performance?.beating ? "text-emerald-400" : "text-blue-400"}`}>
                                        {performance?.alpha && performance.alpha >= 0 ? "+" : ""}{performance?.alpha}%
                                    </p>
                                    <p className="text-[9px] text-white/40 font-mono">
                                        ₪{Math.abs(performance?.deltaValue || 0).toLocaleString()} {performance?.beating ? "מעל" : "מתחת"} לשוק
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-48 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
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
                                            tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
                                            width={40}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(12, 15, 26, 0.95)",
                                                borderColor: "rgba(255,255,255,0.1)",
                                                borderRadius: "16px",
                                                color: "#fff",
                                                fontSize: "12px",
                                                backdropFilter: "blur(10px)",
                                                boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
                                            }}
                                            formatter={(value: unknown, name: string | undefined) => [
                                                `₪${Number(value).toLocaleString()}`,
                                                name === "yours" ? "אתם" : "S&P 500",
                                            ]}
                                        />
                                        <Line type="monotone" dataKey="yours" stroke="#10b981" strokeWidth={3} dot={false} strokeLinecap="round" />
                                        <Line type="monotone" dataKey="sp500" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="6 6" opacity={0.5} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <p className="text-[9px] text-white/15 text-center leading-relaxed">
                                * ההשוואה מבוססת על נתוני שוק אמיתיים (S&P 500) ומסונכרנת עם השווי הנקי הנוכחי שלכם.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
