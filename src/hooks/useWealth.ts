"use client";

import { useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Goal } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface SupabaseError {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    stack?: string;
}

export const useWealth = () => {
    const { user, loading: authLoading } = useAuth();
    const supabaseRef = useRef(createClient());

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['wealthData', user?.id],
        queryFn: async () => {
            if (!user) {
                return {
                    netWorth: 0,
                    investmentsValue: 0,
                    cashValue: 0,
                    assets: []
                };
            }

            const supabase = supabaseRef.current;
            const { data: goals, error } = await supabase
                .from('goals')
                .select('id, name, current_amount, type, brick_color, growth_rate, investment_type, symbol, quantity, interest_rate, last_interest_calc')
                .order('created_at', { ascending: true });

            if (error || !goals) {
                console.error("useWealth fetch error:", error);
                throw error || new Error("No goals found");
            }

            const stockSymbols = goals
                .filter(g => g.type === 'stock' && g.symbol)
                .map(g => g.symbol!.toUpperCase());

            const hasUsdAssets = goals.some(g => g.type === 'stock' || g.type === 'foreign_currency' || g.investment_type === 'foreign_currency');

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

            let totalNetWorth = 0;
            let totalInvestments = 0;
            let totalCash = 0;

            const calculatedAssets = (goals as unknown as Goal[]).map((asset: Goal) => {
                let calculatedValue = 0;

                if (asset.type === 'stock' && asset.symbol) {
                    const priceData = livePrices[asset.symbol];
                    if (priceData && priceData.price) {
                        const quantity = Number(asset.quantity) || 0;
                        const livePriceUSD = priceData.price;
                        calculatedValue = quantity * livePriceUSD * usdToIls;
                    } else {
                        calculatedValue = Number(asset.current_amount) || 0;
                    }
                } else if (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') {
                    const usdAmount = Number(asset.current_amount) || 0;
                    calculatedValue = usdAmount * usdToIls;
                } else {
                    calculatedValue = Number(asset.current_amount) || 0;

                    if (asset.interest_rate && asset.interest_rate > 0 && asset.last_interest_calc) {
                        const lastCalcDate = new Date(asset.last_interest_calc);
                        const today = new Date();
                        const diffMs = today.getTime() - lastCalcDate.getTime();

                        // Continuous Compounding Formula: principal * (1 + annual_rate) ^ (delta_time / year_time)
                        // This ensures that after exactly 365 days, growth is exactly interest_rate.
                        if (diffMs > 0) {
                            const annualRate = Number(asset.interest_rate) / 100;
                            const msPerYear = 365 * 24 * 60 * 60 * 1000;
                            const yearFraction = diffMs / msPerYear;
                            calculatedValue = calculatedValue * Math.pow(1 + annualRate, yearFraction);
                        }
                    }
                }

                const assetValue = Math.max(0, calculatedValue);
                totalNetWorth += assetValue;

                const isInvestment =
                    asset.type === 'stock' ||
                    asset.investment_type === 'real_estate';

                if (isInvestment) {
                    totalInvestments += assetValue;
                } else {
                    totalCash += assetValue;
                }

                return {
                    ...asset,
                    calculatedValue: assetValue,
                    livePriceUSD: asset.type === 'stock' ? livePrices[(asset.symbol || '').toUpperCase()]?.price || 0 : 0,
                    changePercent: asset.type === 'stock' ? livePrices[(asset.symbol || '').toUpperCase()]?.changePercent || 0 : 0
                };
            });

            return {
                netWorth: totalNetWorth,
                investmentsValue: totalInvestments,
                cashValue: totalCash,
                assets: calculatedAssets,
                usdToIls
            };
        },
        enabled: !authLoading && !!user,
        refetchInterval: 60 * 1000, // 1 minute background polling for market data
        staleTime: 30 * 1000, // Slightly more frequent than global default for "live" feel
    });

    const defaultData = useMemo(() => ({
        netWorth: 0,
        investmentsValue: 0,
        cashValue: 0,
        assets: [],
        usdToIls: 3.7
    }), []);

    const wealth = data || defaultData;

    return {
        ...wealth,
        loading: isLoading || authLoading,
        refetch
    };
};

