import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Goal } from "@/types";

interface WealthChartProps {
    assets: Goal[];
    selectedType?: string | null;
    onSelect?: (type: string | null) => void;
}

export const WealthChart = ({ assets, selectedType, onSelect }: WealthChartProps) => {

    const { data, totalValue } = useMemo(() => {
        let stocks = 0;
        let cash = 0;
        let crypto = 0;
        let realEstate = 0;
        let other = 0;

        // Map internal types to IDs we can filter by in the parent
        // Parent uses: 'stock', 'cash', 'crypto', 'real_estate'
        // But chart groups them. Let's use simple keys.

        assets.forEach((asset: any) => {
            const val = Number(asset.calculatedValue || asset.current_amount || 0);

            if (asset.investment_type === 'crypto') crypto += val;
            else if (asset.investment_type === 'real_estate') realEstate += val;
            else if (asset.type === 'stock') stocks += val;
            else if (asset.type === 'cash') cash += val;
            else other += val;
        });

        const result = [
            { name: "מניות", value: stocks, color: "#8b5cf6", type: 'stock' }, // Purple
            { name: "מזומן", value: cash, color: "#10b981", type: 'cash' }, // Emerald
            { name: "נדל״ן", value: realEstate, color: "#3b82f6", type: 'real_estate' }, // Blue
            { name: "קריפטו", value: crypto, color: "#f472b6", type: 'crypto' }, // Pink
        ].filter(item => item.value > 0);

        if (other > 0) result.push({ name: "אחר", value: other, color: "#9ca3af", type: 'other' });

        const total = stocks + cash + crypto + realEstate + other;

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
                        formatter={(value: any) => `₪${Number(value).toLocaleString()}`}
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
                    {totalValue >= 1000000
                        ? `₪${(totalValue / 1000000).toFixed(2)}M`
                        : `₪${(totalValue / 1000).toFixed(0)}k`}
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
