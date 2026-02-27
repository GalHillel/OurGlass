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
            try {
                await fetch("/api/yield/accrue", { method: "POST" });
            } catch {
                // ignore accrual failures; continue with last stored amounts
            }
            const { data: goals, error } = await supabase
                .from('goals')
                .select('id, name, current_amount, type, brick_color, growth_rate, investment_type, symbol, quantity, interest_rate, last_interest_calc')
                .order('created_at', { ascending: true });

            if (error) {
                console.error("useWealth goals fetch error:", JSON.stringify(error, null, 2));
                return {


                    netWorth: 0,
                    investmentsValue: 0,
                    cashValue: 0,
                    assets: [],
                    usdToIls: 3.65
                };
            }

            const stockSymbols = (goals ?? [])
                .filter(g => g.type === 'stock' && g.symbol)
                .map(g => g.symbol!.toUpperCase());

            const hasUsdAssets = (goals ?? []).some(g => g.type === 'stock' || g.type === 'foreign_currency' || g.investment_type === 'foreign_currency');

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

            let totalNetWorth = 0;
            let totalInvestments = 0;
            let totalCash = 0;

            const calculatedAssets = safeGoals.map((asset: Goal) => {
                let calculatedValue = 0;

                if (asset.type === 'stock' && asset.symbol) {
                    const priceData = livePrices[asset.symbol.toUpperCase()];
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
        enabled: true,
        refetchInterval: 60 * 1000,
        staleTime: 30 * 1000,
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

