"use client";

import { TrendingUp, Rocket, Calendar } from "lucide-react";
import { useWealth } from "@/hooks/useWealth";
import { StockPortfolio } from "@/components/StockPortfolio";
import { DividendForecast } from "@/components/DividendForecast";
import { SP500Benchmark } from "@/components/SP500Benchmark";
import { useAppStore } from "@/stores/appStore";

export default function StocksPage() {
    const { assets, usdToIls, loading } = useWealth();
    const isStealthMode = useAppStore(s => s.isStealthMode);

    return (
        <div className="min-h-screen bg-slate-950 text-white px-4 space-y-6 pt-6">

            {/* 1. Live Portfolio (TOP) */}
            <div className="mx-0">
                <StockPortfolio assets={assets} usdToIls={usdToIls} />
            </div>

            {/* 2. Dividend Forecast */}
            <div className="mx-0">
                <DividendForecast assets={assets} />
            </div>

            {/* 3. S&P 500 Benchmark (BOTTOM) */}
            <div className="mx-0">
                <SP500Benchmark initialWealth={assets.reduce((sum, a) => sum + (a.calculatedValue || 0), 0)} />
            </div>

            {/* Final bottom spacer */}
            <div className="h-32 w-full" />
        </div>
    );
}
