"use client";

import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface StockTickerProps {
    userSymbols?: string[];
}

interface StockData {
    symbol: string;
    price: number;
    changePercent: number;
}

const DEFAULT_INDICES = ["SPY", "QQQ", "BTC-USD", "ETH-USD"];

export const StockTicker = ({ userSymbols = [] }: StockTickerProps) => {
    const [stocks, setStocks] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                // Combine defaults with user symbols, unique only
                const allSymbols = Array.from(new Set([...DEFAULT_INDICES, ...userSymbols])).filter(Boolean);

                if (allSymbols.length === 0) return;

                const res = await fetch('/api/stocks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbols: allSymbols })
                });

                if (!res.ok) throw new Error("Failed");

                const data = await res.json();

                // Transform to array
                const stockList = allSymbols.map(sym => {
                    const info = data.stocks[sym];
                    if (!info) return null;
                    return {
                        symbol: sym.replace('-USD', ''), // Clean up crypto names slightly
                        price: info.price,
                        changePercent: info.changePercent || 0
                    };
                }).filter(Boolean) as StockData[];

                setStocks(stockList);
            } catch (e) {
                console.error("Ticker error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();
    }, [userSymbols]);

    if (loading && stocks.length === 0) return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 py-4 flex justify-center backdrop-blur-sm">
            <Activity className="w-4 h-4 text-white/20 animate-pulse" />
        </div>
    );

    // Quadruple the list to ensure gapless infinite scroll on all screen sizes
    // We display 4 sets. We animate from 0% to -50% (which covers 2 full sets).
    // At -50%, we are visually identical to 0% (start of set 3 vs start of set 1).
    const displayStocks = [...stocks, ...stocks, ...stocks, ...stocks];

    // Slower speed for readability: 20s per full iteration (moving through 2 sets)
    // Adjust based on items? Let's make it dynamic-ish.
    const duration = `${Math.max(20, displayStocks.length * 2)}s`;

    return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 overflow-hidden py-3 backdrop-blur-sm group hover:bg-slate-900/80 transition-colors relative z-20">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10" />

            <div
                className="flex items-center gap-6 animate-marquee w-max group-hover:[animation-play-state:paused]"
                style={{
                    '--duration': duration
                } as React.CSSProperties}
            >
                {displayStocks.map((stock, i) => {
                    const isUp = stock.changePercent >= 0;
                    return (
                        <div
                            key={`${stock.symbol}-${i}`}
                            className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5 shadow-sm whitespace-nowrap transition-transform hover:scale-105 cursor-default"
                        >
                            <span className="font-bold text-white/90 text-xs tracking-wider">{stock.symbol}</span>
                            <span className={`text-xs font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                            <span className="text-white/60 text-xs font-mono">
                                ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
                .animate-marquee {
                    animation: marquee var(--duration) linear infinite;
                    will-change: transform;
                }
            `}</style>
        </div>
    );
};
