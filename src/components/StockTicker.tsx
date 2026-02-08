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

    // Create a "set" of stocks duplicated enough to cover reasonable screen width
    // 20 duplicates is safe for almost any screen size/stock count combination
    const duplicatedStocks = Array(20).fill(stocks).flat();

    // Slower duration for readability.
    const duration = `${Math.max(60, stocks.length * 30)}s`;

    return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 overflow-hidden py-3 backdrop-blur-sm relative z-20 select-none">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            {/* Scrolling Container - Dual List Technique for seamless loop */}
            <div className="flex w-full overflow-hidden">
                <div
                    className="flex flex-nowrap items-center gap-3 animate-ticker flex-shrink-0 min-w-full"
                    style={{ '--duration': duration } as React.CSSProperties}
                >
                    {duplicatedStocks.map((stock, i) => (
                        <StockItem key={`a-${stock.symbol}-${i}`} stock={stock} />
                    ))}
                </div>

                {/* Second copy follows immediately */}
                <div
                    className="flex flex-nowrap items-center gap-3 animate-ticker flex-shrink-0 min-w-full"
                    style={{ '--duration': duration } as React.CSSProperties}
                >
                    {duplicatedStocks.map((stock, i) => (
                        <StockItem key={`b-${stock.symbol}-${i}`} stock={stock} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const StockItem = ({ stock }: { stock: StockData }) => {
    const isUp = stock.changePercent >= 0;
    return (
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5 shadow-sm whitespace-nowrap">
            <span className="font-bold text-white/90 text-xs tracking-wider">{stock.symbol}</span>
            <span className={`text-xs font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
            <span className="text-white/60 text-xs font-mono">
                ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
};

