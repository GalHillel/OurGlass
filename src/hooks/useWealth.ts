import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Goal } from "@/types";

interface SupabaseError {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
    stack?: string;
}

export const useWealth = () => {
    const [netWorth, setNetWorth] = useState<number>(0);
    const [investmentsValue, setInvestmentsValue] = useState<number>(0);
    const [cashValue, setCashValue] = useState<number>(0);
    const [assets, setAssets] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClient());
    const { user, loading: authLoading } = useAuth();

    const fetchWealth = useCallback(async () => {
        const supabase = supabaseRef.current;
        // Guard: Don't fetch if no authenticated user
        if (!user) {
            setLoading(false);
            setAssets([]);
            setNetWorth(0);
            setInvestmentsValue(0);
            setCashValue(0);
            return;
        }

        setLoading(true);
        try {
            const { data: goals, error } = await supabase
                .from('goals')
                .select('id, name, current_amount, type, brick_color, growth_rate, investment_type, symbol, quantity, interest_rate, last_interest_calc')
                .order('created_at', { ascending: true });

            if (error || !goals) {
                const errorDetails = {
                    message: error?.message,
                    details: error?.details,
                    hint: error?.hint,
                    code: error?.code,
                    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
                };
                console.error("useWealth fetch error:", errorDetails);
                console.error("useWealth fetch error Raw JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                setLoading(false);
                return;
            }

            const stockSymbols = goals
                .filter(g => g.type === 'stock' && g.symbol)
                .map(g => g.symbol);

            let livePrices: Record<string, { price: number; changePercent: number }> = {};
            let usdToIls = 3.65;

            if (stockSymbols.length > 0) {
                try {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    const apiUrl = `${origin}/api/market-data`;
                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbols: stockSymbols })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        livePrices = data.stocks || {};
                        usdToIls = data.usdToIls || data.exchangeRate || 3.65;
                    }
                } catch {
                    console.warn("Market data fetch failed, using fallback prices.");
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
                } else if (asset.investment_type === 'crypto' && asset.symbol) {
                    const priceData = livePrices[asset.symbol];
                    if (priceData && priceData.price) {
                        const quantity = Number(asset.quantity) || 0;
                        const livePriceUSD = priceData.price;
                        calculatedValue = quantity * livePriceUSD * usdToIls;
                    } else {
                        calculatedValue = Number(asset.current_amount) || 0;
                    }
                } else if (asset.investment_type === 'usd_cash' || asset.type === 'usd_cash') {
                    // USD Cash: current_amount is in USD, convert to ILS
                    const usdAmount = Number(asset.current_amount) || 0;
                    calculatedValue = usdAmount * usdToIls;
                } else {
                    calculatedValue = Number(asset.current_amount) || 0;

                    if (asset.interest_rate && asset.interest_rate > 0 && asset.last_interest_calc) {
                        const lastCalcDate = new Date(asset.last_interest_calc);
                        const today = new Date();
                        const diffTime = today.getTime() - lastCalcDate.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 1) {
                            const dailyRate = (Number(asset.interest_rate) / 100) / 365;
                            calculatedValue = calculatedValue * Math.pow(1 + dailyRate, diffDays);
                        }
                    }
                }

                // Sanitize: Only include positive values in asset totals to avoid double-counting debts
                // which should be tracked in the 'liabilities' table.
                const assetValue = Math.max(0, calculatedValue);
                totalNetWorth += assetValue;

                const isInvestment =
                    asset.type === 'stock' ||
                    asset.investment_type === 'crypto' ||
                    asset.investment_type === 'real_estate';

                if (isInvestment) {
                    totalInvestments += assetValue;
                } else {
                    totalCash += assetValue;
                }

                return { ...asset, calculatedValue };
            });

            setAssets(calculatedAssets);
            setNetWorth(totalNetWorth);
            setInvestmentsValue(totalInvestments);
            setCashValue(totalCash);

        } catch (error: unknown) {
            const err = error as SupabaseError;
            const errorDetails = {
                message: err.message,
                details: err.details,
                hint: err.hint,
                code: err.code,
                stack: err.stack,
                fullError: JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2)
            };
            console.error("useWealth Error:", errorDetails);
            console.error("useWealth Error Raw JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            // Reset to safe defaults on error
            setAssets([]);
            setNetWorth(0);
            setInvestmentsValue(0);
            setCashValue(0);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setLoading(false);
            setAssets([]);
            setNetWorth(0);
            setInvestmentsValue(0);
            setCashValue(0);
            return;
        }

        fetchWealth();
    }, [fetchWealth, authLoading, user]);

    return {
        netWorth,
        investmentsValue,
        cashValue,
        assets,
        loading,
        refetch: fetchWealth
    };
};
