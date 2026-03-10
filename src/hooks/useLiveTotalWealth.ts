"use client";

import { useState, useEffect, useRef } from "react";
import { Goal, Liability } from "@/types";
import { netWorthEngine } from "@/lib/networth-engine";

/**
 * useLiveTotalWealth - Real-Time 'Ghost-Resilient' Ticker
 * 
 * Logic:
 * 1. Uses the authoritative netWorthEngine engine every 1 second.
 * 2. This ensures the 1s counter matches the main dashboard perfectly.
 * 3. Incorporates 'Ghost Asset' fallbacks (initial_amount) and USD parity.
 */
export function useLiveTotalWealth(
    assets: Goal[],
    liabilities: Liability[] = [],
    usdToIls: number = 3.65,
    marketPrices: Record<string, { price: number; changePercent: number }> = {}
) {
    const [total, setTotal] = useState<number>(0);
    const lastComputedRef = useRef<number>(0);

    useEffect(() => {
        const update = () => {
            // AUTHORITATIVE CALCULATION
            const { totalAssets } = netWorthEngine(assets, liabilities, usdToIls, marketPrices);

            // Only update state if the value has changed significantly (avoid micro-rerenders)
            if (Math.abs(totalAssets - lastComputedRef.current) > 0.001) {
                setTotal(totalAssets);
                lastComputedRef.current = totalAssets;
            }
        };

        // Initial update
        update();

        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [assets, liabilities, usdToIls, marketPrices]);

    return total;
}
