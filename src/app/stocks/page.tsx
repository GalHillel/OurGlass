"use client";

import { useWealth } from "@/hooks/useWealth";
import { StockPortfolio } from "@/components/StockPortfolio";
import { DividendForecast } from "@/components/DividendForecast";
import { SP500Benchmark } from "@/components/SP500Benchmark";
import { Skeleton } from "@/components/ui/skeleton";

export default function StocksPage() {
    const { assets = [], usdToIls = 3.65, loading } = useWealth();
    const stableWealth = assets.reduce((sum, asset) => sum + Number(asset.calculatedValue ?? 0), 0);

    if (loading && assets.length === 0) {
        return (
            <div className="w-full space-y-6 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
                <Skeleton className="h-64 rounded-3xl bg-black/40 border border-white/10" />
                <Skeleton className="h-40 rounded-3xl bg-black/40 border border-white/10" />
                <Skeleton className="h-40 rounded-3xl bg-black/40 border border-white/10" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
            <StockPortfolio assets={assets} usdToIls={Number.isFinite(usdToIls) ? usdToIls : 3.65} />
            <DividendForecast assets={assets} />
            <SP500Benchmark initialWealth={Math.max(0, stableWealth)} />
        </div>
    );
}
