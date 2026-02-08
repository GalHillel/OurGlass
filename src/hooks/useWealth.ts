import { useState, useEffect, useCallback, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/AuthProvider";
import { Goal } from "@/types";

export const useWealth = () => {
    const [netWorth, setNetWorth] = useState<number>(0);
    const [investmentsValue, setInvestmentsValue] = useState<number>(0);
    const [cashValue, setCashValue] = useState<number>(0);
    const [assets, setAssets] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClientComponentClient());
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
                .select('id, name, current_amount, type, brick_color, growth_rate, investment_type, symbol, quantity')
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
                    const res = await fetch('/api/stocks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbols: stockSymbols })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        livePrices = data.stocks || {};
                        usdToIls = data.usdToIls || data.exchangeRate || 3.65;
                    }
                } catch (apiError) {
                    const errorDetails = {
                      message: (apiError as any)?.message,
                      stack: (apiError as any)?.stack,
                      fullError: JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2)
                    };
                    console.error("Failed to fetch stock prices:", errorDetails);
                    console.error("Failed to fetch stock prices Raw JSON:", JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2));
                }
            }

            let totalNetWorth = 0;
            let totalInvestments = 0;
            let totalCash = 0;

            const calculatedAssets = goals.map((asset: any) => {
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
                } else {
                    calculatedValue = Number(asset.current_amount) || 0;
                }

                totalNetWorth += calculatedValue;

                const isInvestment =
                    asset.type === 'stock' ||
                    asset.investment_type === 'crypto' ||
                    asset.investment_type === 'real_estate';

                if (isInvestment) {
                    totalInvestments += calculatedValue;
                } else {
                    totalCash += calculatedValue;
                }

                return { ...asset, calculatedValue };
            });

            setAssets(calculatedAssets);
            setNetWorth(totalNetWorth);
            setInvestmentsValue(totalInvestments);
            setCashValue(totalCash);

        } catch (error) {
            const errorDetails = {
              message: (error as any)?.message,
              details: (error as any)?.details,
              hint: (error as any)?.hint,
              code: (error as any)?.code,
              stack: (error as any)?.stack,
              fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
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
