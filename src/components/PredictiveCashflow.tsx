"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { Transaction, Subscription, Liability } from "@/types";
import { getBillingPeriodForDate, getDaysRemainingInCycle } from "@/lib/billing";
import { differenceInDays, addDays, format, isSameDay } from "date-fns";
import { he } from "date-fns/locale";

interface PredictiveCashflowProps {
    balance: number;
    budget: number;
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
}

/**
 * Predictive Cashflow Chart
 *
 * Projects remaining balance through the end of the billing cycle
 * based on average daily spending rate.
 */
export function PredictiveCashflow({ balance, budget, transactions, subscriptions, liabilities }: PredictiveCashflowProps) {
    const chartData = useMemo(() => {
        const { start, end } = getBillingPeriodForDate(new Date());
        const today = new Date();
        const daysIntoCycle = Math.max(1, differenceInDays(today, start));
        const remaining = differenceInDays(end, today);

        // 1 & 2. Clean Daily Burn Rate (Variable only)
        const fixedAmounts = new Set([
            ...subscriptions.map((s) => Number(s.amount)),
            ...liabilities.map((l) => Number(l.monthly_payment))
        ]);
        const variableTransactions = transactions.filter((tx) => {
            const amount = Number(tx.amount);
            // Exclude if it perfectly matches a subscription/debt and > 100
            if (fixedAmounts.has(amount) && amount > 100) return false;
            return true;
        });

        const totalVariableSpent = variableTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const cleanDailyBurnRate = totalVariableSpent / daysIntoCycle;

        // Calculate total spent so far (all transactions)
        const totalSpentSoFar = transactions.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

        // 3. Pending Subscriptions & Debt Payments
        const upcomingFixed = subscriptions
            .filter((s) => {
                if (!s.billing_day || !s.active) return false;
                const day = s.billing_day;
                return day > today.getDate() && day <= end.getDate();
            })
            .reduce((sum: number, s: Subscription) => sum + Number(s.amount), 0);

        // MANDATE 2: Include Debt Payments in projection
        const activeDebtPaymentsTotal = liabilities
            .filter((l: Liability) => {
                const remaining = Number(l.remaining_amount ?? l.amount ?? 0);
                if (remaining <= 0) return false;
                // For projection, we assume monthly payment happens if not paid yet this cycle.
                // Simplified: if end_date hasn't passed, it's an obligation.
                return !l.end_date || new Date(l.end_date) >= today;
            })
            .reduce((sum: number, l: Liability) => sum + Number(l.monthly_payment ?? 0), 0);

        // 4. Predicted End Balance computation base
        const monthlyIncome = budget; // Using budget as monthly income
        let projectedBalanceForChart = balance;
        const finalProjectedBalance = monthlyIncome - totalSpentSoFar - upcomingFixed - activeDebtPaymentsTotal - (cleanDailyBurnRate * remaining);

        // Build projection data
        const data = [];

        // Past data points (actual)
        for (let i = Math.max(0, daysIntoCycle - 7); i <= daysIntoCycle; i++) {
            const date = addDays(start, i);
            const dayTransactions = transactions.filter((tx) => {
                const txDate = new Date(tx.date);
                return isSameDay(txDate, date);
            });
            const daySpend = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);

            data.push({
                day: format(date, "dd/MM"),
                actual: Math.round(balance + daySpend * (daysIntoCycle - i)), // Approximate actual past balance
                projected: null as number | null,
                isPast: true,
            });
        }

        // Future projections
        for (let i = 1; i <= remaining; i++) {
            const date = addDays(today, i);
            projectedBalanceForChart -= cleanDailyBurnRate;

            // Subtract pending subscription on its exact billing day
            const daySub = subscriptions.filter(s => s.active && s.billing_day === date.getDate()).reduce((sum, s) => sum + Number(s.amount), 0);
            if (daySub > 0) {
                projectedBalanceForChart -= daySub;
            }

            data.push({
                day: format(date, "dd/MM"),
                actual: null as number | null,
                projected: Math.round(projectedBalanceForChart),
                isPast: false,
            });
        }

        const daysUntilZero = cleanDailyBurnRate > 0 ? Math.ceil(balance / cleanDailyBurnRate) : Infinity;
        const zeroDate = daysUntilZero < remaining ? addDays(today, daysUntilZero) : null;

        return {
            data,
            avgDailySpend: Math.round(cleanDailyBurnRate),
            projectedEndBalance: Math.round(finalProjectedBalance),
            zeroDate,
            willRunOut: finalProjectedBalance < 0,
            daysUntilZero,
        };
    }, [balance, budget, transactions, subscriptions]);

    const status = chartData.willRunOut ? "danger" : chartData.projectedEndBalance < budget * 0.1 ? "warning" : "safe";

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">תחזית תזרים</h3>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === "danger"
                    ? "bg-red-500/10 text-red-400"
                    : status === "warning"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                    {status === "danger" ? "⚠️ חריגה צפויה" : status === "warning" ? "שימו לב" : "מסלול תקין"}
                </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-white/40">הוצאה יומית</p>
                    <p className="text-sm font-bold text-white">₪{chartData.avgDailySpend}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-white/40">צפי סוף חודש</p>
                    <p className={`text-sm font-bold ${chartData.projectedEndBalance > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        ₪{chartData.projectedEndBalance.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-white/40">ימים נותרו</p>
                    <p className="text-sm font-bold text-blue-300">{getDaysRemainingInCycle()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.data}>
                        <defs>
                            <linearGradient id="cashflowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={status === "danger" ? "#ef4444" : "#3b82f6"} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={status === "danger" ? "#ef4444" : "#3b82f6"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="day"
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
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                borderColor: "rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: "11px",
                            }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [`₪${Number(value).toLocaleString()}`, ""]}
                        />
                        <ReferenceLine y={0} stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3" />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fill="url(#cashflowGrad)" dot={false} />
                        <Area type="monotone" dataKey="projected" stroke={status === "danger" ? "#ef4444" : "#60a5fa"} strokeWidth={1.5} strokeDasharray="5 5" fill="url(#cashflowGrad)" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Warning */}
            {chartData.willRunOut && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200">
                        בקצב הנוכחי, התקציב ייגמר בעוד {chartData.daysUntilZero} ימים
                        {chartData.zeroDate && ` (${format(chartData.zeroDate, "d.M", { locale: he })})`}
                    </p>
                </div>
            )}
        </div>
    );
}
