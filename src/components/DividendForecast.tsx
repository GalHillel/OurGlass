"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { Goal } from "@/types";

interface DividendForecastProps {
    assets?: Goal[];
}

export const DividendForecast = ({ assets = [] }: DividendForecastProps) => {
    // Generate dividends based on actual assets
    const upcomingDividends = assets
        .filter(a => a.type === 'stock')
        .map(asset => {
            // Mock dividend logic based on name/randomness for demo
            // In real app, this would come from API
            const isDividendPayer = asset.name.toLowerCase().includes('apple') ||
                asset.name.toLowerCase().includes('microsoft') ||
                asset.name.toLowerCase().includes('etf') ||
                asset.name.toLowerCase().includes('s&p');

            if (!isDividendPayer && Math.random() > 0.3) return null; // Randomly assign dividends to others

            return {
                name: asset.name,
                amount: Math.round(Number(asset.current_amount) * 0.005), // ~0.5% quarterly
                date: "15/05" // Next quarter mock
            };
        })
        .filter(Boolean)
        .slice(0, 3); // Take top 3

    const totalForecast = upcomingDividends.reduce((sum, item) => sum + (item?.amount || 0), 0);

    return (
        <div className="neon-card p-4 rounded-2xl relative overflow-hidden group min-h-[160px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white">צפי דיבידנדים</h3>
            </div>

            {upcomingDividends.length > 0 ? (
                <div className="space-y-3 flex-1">
                    {upcomingDividends.map((div, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white/80">{div?.name}</span>
                                <span className="text-[10px] text-white/40">צפוי ב-{div?.date}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-300">+${div?.amount}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <TrendingUp className="w-8 h-8 mb-2" />
                    <p className="text-xs">אין דיבידנדים צפויים בקרוב</p>
                </div>
            )}

            {totalForecast > 0 && (
                <div className="mt-auto pt-3 border-t border-white/10 text-center">
                    <p className="text-[10px] text-purple-300/60">סה״כ צפוי ברבעון: ${totalForecast}</p>
                </div>
            )}
        </div>
    );
};
