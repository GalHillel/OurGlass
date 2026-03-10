"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Goal } from "@/types";
import { formatAmount } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import { PieChart as PieChartIcon, ArrowUpRight } from "lucide-react";

interface PortfolioAllocationProps {
    assets: Goal[];
}

export function PortfolioAllocation({ assets }: PortfolioAllocationProps) {
    const isStealthMode = useAppStore(s => s.isStealthMode);

    const { data, totalValue } = useMemo(() => {
        const categories: Record<string, { name: string; value: number; color: string }> = {
            stock: { name: "מניות", value: 0, color: "#8b5cf6" }, // Purple
            cash: { name: "מזומן", value: 0, color: "#10b981" }, // Emerald
            money_market: { name: "קרן כספית", value: 0, color: "#3b82f6" }, // Blue
            real_estate: { name: "נדל״ן", value: 0, color: "#f59e0b" }, // Amber
            foreign_currency: { name: "מט״ח", value: 0, color: "#22c55e" }, // Green
            other: { name: "אחר", value: 0, color: "#64748b" }, // Slate
        };

        assets.forEach((asset) => {
            const val = Number(asset.calculatedValue || asset.current_amount || 0);
            const type = asset.type || 'other';
            const investmentType = asset.investment_type;

            if (investmentType === 'real_estate') categories.real_estate.value += val;
            else if (type === 'money_market' || investmentType === 'money_market') categories.money_market.value += val;
            else if (type === 'stock') categories.stock.value += val;
            else if (type === 'foreign_currency' || investmentType === 'foreign_currency') categories.foreign_currency.value += val;
            else if (type === 'cash') categories.cash.value += val;
            else categories.other.value += val;
        });

        const result = Object.values(categories).filter(c => c.value > 0);
        const total = result.reduce((sum, c) => sum + c.value, 0);

        return { data: result, totalValue: total };
    }, [assets]);

    if (totalValue === 0) return null;

    return (
        <div className="neon-card p-4 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                        <PieChartIcon className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">הקצאת נכסים</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    MTD
                </div>
            </div>

            <div className="h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                borderColor: "rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: "10px",
                            }}
                            formatter={(value: number | undefined) => [
                                formatAmount(value || 0, isStealthMode, CURRENCY_SYMBOL),
                                "" as any
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">סה״כ</span>
                    <span className="text-sm font-black text-white">
                        {formatAmount(totalValue, isStealthMode, CURRENCY_SYMBOL)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {data.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-white/40 font-bold truncate">{entry.name}</p>
                            <p className="text-[10px] text-white font-bold">
                                {((entry.value / totalValue) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
