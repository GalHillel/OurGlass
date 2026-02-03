"use client";

import { Activity } from "lucide-react";
import { DEMO_TICKER_DATA } from "@/lib/demoData";

interface StockTickerProps {
    userSymbols?: string[];
}

export const StockTicker = ({ userSymbols = [] }: StockTickerProps) => {
    // Static data only - no loading state needed
    const stocks = DEMO_TICKER_DATA;

    // Quadruple the list to ensure gapless infinite scroll
    const displayStocks = [...stocks, ...stocks, ...stocks, ...stocks];
    const duration = "40s";

    return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 overflow-hidden py-3 backdrop-blur-sm group hover:bg-slate-900/80 transition-colors relative z-20">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10" />

            <div
                className="flex items-center gap-6 animate-marquee w-max group-hover:[animation-play-state:paused]"
                style={{ '--duration': duration } as React.CSSProperties}
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
                                {isUp ? '+' : ''}{stock.changePercent}%
                            </span>
                            <span className="text-white/60 text-xs font-mono">
                                ${stock.price.toLocaleString()}
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
                }
            `}</style>
        </div>
    );
};
