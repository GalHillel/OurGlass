import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Goal } from "@/types";

export const useWealth = () => {
    const [netWorth, setNetWorth] = useState<number>(0);
    const [investmentsValue, setInvestmentsValue] = useState<number>(0);
    const [cashValue, setCashValue] = useState<number>(0);
    const [assets, setAssets] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    const fetchWealth = useCallback(async () => {
        setLoading(true);
        try {
            const { data: goals, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: true });

            if (error || !goals) {
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
                    console.error("Failed to fetch stock prices:", apiError);
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
            console.error("useWealth Error:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchWealth();
    }, [fetchWealth]);

    return {
        netWorth,
        investmentsValue,
        cashValue,
        assets,
        loading,
        refetch: fetchWealth
    };
};
