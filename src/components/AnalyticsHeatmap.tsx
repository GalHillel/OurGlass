"use client";

import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from "date-fns";
import { Transaction } from "@/types";

interface AnalyticsHeatmapProps {
    transactions: Transaction[];
    onDateSelect: (date: Date | null) => void;
    selectedDate: Date | null;
}

export const AnalyticsHeatmap = ({ transactions, onDateSelect, selectedDate }: AnalyticsHeatmapProps) => {
    const [days, setDays] = useState<{ date: Date; intensity: number }[]>([]);

    useEffect(() => {
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);

        const daysInMonth = eachDayOfInterval({ start, end });

        const heatmapData = daysInMonth.map(day => {
            const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
            const totalSpent = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

            let intensity = 0; // 0 = Green (No spend)
            if (totalSpent > 0) intensity = 1; // Yellow (Low)
            if (totalSpent > 500) intensity = 2; // Orange (Medium)
            if (totalSpent > 1000) intensity = 3; // Red (High)

            return { date: day, intensity };
        });

        setDays(heatmapData);
    }, [transactions]);

    const getColor = (intensity: number, isSelected: boolean) => {
        if (isSelected) return "ring-2 ring-white bg-white/20";
        switch (intensity) {
            case 0: return "bg-emerald-500/20 border-emerald-500/30";
            case 1: return "bg-yellow-500/20 border-yellow-500/30";
            case 2: return "bg-orange-500/20 border-orange-500/30";
            case 3: return "bg-red-500/20 border-red-500/30";
            default: return "bg-white/5";
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <h3 className="text-white/80 text-lg mb-4 font-medium px-2">מפת הוצאות</h3>
            <div className="glass p-4 rounded-3xl">
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map(d => (
                        <span key={d} className="text-xs text-white/40">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, i) => {
                        const isSelected = selectedDate ? isSameDay(day.date, selectedDate) : false;
                        return (
                            <button
                                key={i}
                                onClick={() => onDateSelect(isSelected ? null : day.date)}
                                className={`aspect-square rounded-lg border flex items-center justify-center text-xs text-white/80 transition-all ${getColor(day.intensity, isSelected)}`}
                            >
                                {format(day.date, "d")}
                            </button>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-4 text-xs text-white/40 px-2">
                    <span>בזבזני</span>
                    <span>חסכוני</span>
                </div>
            </div>
        </div>
    );
};
