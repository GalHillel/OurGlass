"use client";

import React, { useState } from 'react';
import { Gift, TrendingUp, Info } from 'lucide-react';
import { Goal } from '@/types';
import { formatILS } from '@/lib/wealth-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DividendForecastProps {
    assets: Goal[];
}

export const DividendForecast: React.FC<DividendForecastProps> = ({ assets }) => {
    const [showTotal, setShowTotal] = useState(false);

    // Mock logic for dividend estimation based on common stock names & types
    const stockAssets = (assets || []).filter(a => a.type === 'stock');

    const dividendData = stockAssets.map(asset => {
        const name = (asset.name || '').toLowerCase();
        let yield_rate = 0.015; // default 1.5% annual

        if (name.includes('apple') || name.includes('aapl')) yield_rate = 0.005;
        if (name.includes('microsoft') || name.includes('msft')) yield_rate = 0.008;
        if (name.includes('reit') || name.includes('o')) yield_rate = 0.05;
        if (name.includes('etf') || name.includes('s&p') || name.includes('spy')) yield_rate = 0.013;

        const quarterlyYield = yield_rate / 4;
        const forecast = (asset.calculatedValue || Number(asset.current_amount) || 0) * quarterlyYield;

        return {
            ...asset,
            forecast,
            yield_rate
        };
    }).filter(d => d.forecast > 0);

    const totalQuarterly = dividendData.reduce((sum, d) => sum + d.forecast, 0);

    return (
        <div className="neon-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Gift className="w-24 h-24 text-blue-400" />
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold tracking-widest uppercase text-blue-300">צפי דיבידנדים</h3>
                </div>
                <button
                    onClick={() => setShowTotal(!showTotal)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/10"
                    role="button"
                >
                    <Info className="w-4 h-4 text-white/40" />
                </button>
            </div>

            <div className="space-y-4">
                {dividendData.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-sm text-white/70">{item.name}</span>
                        <span className="text-sm font-bold text-emerald-400">+{formatILS(item.forecast)}</span>
                    </div>
                ))}

                {dividendData.length === 0 && (
                    <p className="text-xs text-white/40 italic">אין דיבידנדים צפויים ברבעון הקרוב</p>
                )}
            </div>

            <AnimatePresence>
                {showTotal && dividendData.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-4 border-t border-white/10"
                    >
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-[10px] text-white/40 font-bold uppercase block mb-1 font-inter">סה״כ רבעוני</span>
                                <div className="text-2xl font-black text-white neon-text">
                                    {formatILS(totalQuarterly)}
                                </div>
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">
                                +{((totalQuarterly * 4 / (assets.reduce((s, a) => s + (a.calculatedValue || Number(a.current_amount) || 0), 0) || 1)) * 100).toFixed(2)}% תשואה
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
