import { useMemo } from "react";
import { useAppStore } from "@/stores/appStore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Goal } from "@/types";
import { cn, formatAmount } from "@/lib/utils";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

interface WealthChartProps {
    assets: Goal[];
    selectedType?: string | null;
    onSelect?: (type: string | null) => void;
}

export const WealthChart = ({ assets, selectedType, onSelect }: WealthChartProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);

    const { data, totalValue } = useMemo(() => {
        let stocks = 0;
        let cash = 0;
        let foreignCurrency = 0;
        let realEstate = 0;
        let other = 0;

        // Map internal types to IDs we can filter by in the parent
        // Parent uses: 'stock', 'cash', 'crypto', 'real_estate'
        // But chart groups them. Let's use simple keys.

        assets.forEach((asset: Goal) => {
            const val = Number(asset.calculatedValue || asset.current_amount || 0);

            if (asset.investment_type === 'real_estate') realEstate += val;
            else if (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') foreignCurrency += val;
            else if (asset.type === 'stock') stocks += val;
            else if (asset.type === 'cash') cash += val;
            else other += val;
        });

        const result = [
            { name: "מניות", value: stocks, color: "#8b5cf6", type: 'stock' },
            { name: "מזומן", value: cash, color: "#10b981", type: 'cash' },
            { name: "נדל״ן", value: realEstate, color: "#3b82f6", type: 'real_estate' },
            { name: "מט״ח", value: foreignCurrency, color: "#22c55e", type: 'foreign_currency' },
        ].filter(item => item.value > 0);

        if (other > 0) result.push({ name: "אחר", value: other, color: "#9ca3af", type: 'other' });

        const total = stocks + cash + foreignCurrency + realEstate + other;

        return { data: result, totalValue: total };

    }, [assets]);

    if (totalValue === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-white/30">
                <p className="text-xs">אין נתונים להצגה</p>
            </div>
        );
    }

    return (
        <div className="w-full h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        onClick={(entry) => onSelect && onSelect(entry.type === selectedType ? null : entry.type)}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{
                                    opacity: selectedType && selectedType !== entry.type ? 0.3 : 1,
                                    stroke: selectedType === entry.type ? '#fff' : 'none',
                                    strokeWidth: selectedType === entry.type ? 2 : 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | string | undefined) =>
                            formatAmount(Number(value || 0), isStealthMode, CURRENCY_SYMBOL)
                        }
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-white/40 text-[10px] uppercase tracking-widest">שווי נקי</span>
                <span className="text-xl font-black text-white">
                    {isStealthMode ? '***' : (totalValue >= 1000000
                        ? `${CURRENCY_SYMBOL}${(totalValue / 1000000).toFixed(2)}M`
                        : `${CURRENCY_SYMBOL}${(totalValue / 1000).toFixed(0)}k`)}
                </span>
            </div>

            {/* Legend (Custom) */}
            {/* <div className="flex gap-2 justify-center flex-wrap mt-2">
                {data.map(d => (
                    <div key={d.name} className="flex items-center gap-1 text-[10px] text-white/60">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                         <span>{d.name}</span>
                    </div>
                ))}
            </div> */}
        </div>
    );
};
