"use client";

import { useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Goal } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { calculateLiveBalance } from "@/lib/wealth-utils";
import { isAssetInvestment } from "@/lib/constants";
import { netWorthEngine } from "@/lib/networth-engine";

interface SupabaseError {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    stack?: string;
}

export const useWealth = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const supabaseRef = useRef(createClient());

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['wealthData', user?.id, profile?.couple_id],
        queryFn: async () => {
            if (!user || !profile?.couple_id) {
                return {
                    netWorth: 0,
                    investmentsValue: 0,
                    cashValue: 0,
                    assets: [],
                    usdToIls: 3.65
                };
            }

            const supabase = supabaseRef.current;
            const coupleId = profile.couple_id;
            try {
                await fetch("/api/yield/accrue", { method: "POST" });
            } catch {
                // ignore accrual failures
            }

            // Use select('*') to be resilient to missing columns if migration hasn't run yet
            const { data: goals, error } = await supabase
                .from('goals')
                .select('*')
                .eq('couple_id', coupleId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const stockSymbols = (goals ?? [])
                .filter(g => g.type === 'stock' && g.symbol)
                .map(g => g.symbol!.toUpperCase());

            const hasUsdAssets = (goals ?? []).some(g =>
                g.type === 'stock' ||
                g.type === 'foreign_currency' ||
                g.investment_type === 'foreign_currency' ||
                g.currency === 'USD'
            );

            let livePrices: Record<string, { price: number; changePercent: number }> = {};
            let usdToIls = 3.65; // fallback

            if (hasUsdAssets) {
                try {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const apiUrl = `${origin}/api/market-data`;
                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbols: stockSymbols }),
                        cache: 'no-store'
                    });

                    if (res.ok) {
                        const data = await res.json();
                        livePrices = data.stocks || {};
                        usdToIls = data.usdToIls || data.exchangeRate || 3.65;
                    }
                } catch (e) {
                    console.warn("Market data fetch failed, using fallback rate.", e);
                }
            }

            const safeGoals = (goals ?? []) as unknown as Goal[];

            // AUTHORITATIVE ENGINE CALCULATION
            const { totalAssets, netWorthBeforeFees, calculatedAssets, usdToIls: engineUsdRate } = netWorthEngine(
                safeGoals,
                [], // useWealth only handles assets; page.tsx combines them with liabilities
                usdToIls,
                livePrices
            );

            // Separate totalInvestments and totalCash for UI tiles
            let totalInvestments = 0;
            let totalCash = 0;

            const finalAssets = calculatedAssets.map((asset: Goal & { calculatedValue: number }) => {
                if (isAssetInvestment(asset)) {
                    totalInvestments += asset.calculatedValue;
                } else {
                    totalCash += asset.calculatedValue;
                }

                return {
                    ...asset,
                    livePriceUSD: asset.type === 'stock' ? livePrices[(asset.symbol || '').toUpperCase()]?.price || 0 : 0,
                    changePercent: asset.type === 'stock' ? livePrices[(asset.symbol || '').toUpperCase()]?.changePercent || 0 : 0
                };
            });

            return {
                netWorth: totalAssets,
                netWorthBeforeFees: netWorthBeforeFees,
                investmentsValue: totalInvestments,
                cashValue: totalCash,
                assets: finalAssets,
                usdToIls: engineUsdRate,
                marketPrices: livePrices // Expose for the live ticker
            };
        },
        enabled: !!profile?.couple_id,
        refetchInterval: 60 * 1000,
        staleTime: 30 * 1000,
    });


    const defaultData = useMemo(() => ({
        netWorth: 0,
        netWorthBeforeFees: 0,
        investmentsValue: 0,
        cashValue: 0,
        assets: [],
        usdToIls: 3.7,
        marketPrices: {}
    }), []);

    const wealth = data || defaultData;

    return {
        ...wealth,
        loading: isLoading || authLoading,
        refetch
    };
};

