"use client";

import { Goal, Liability } from "@/types";
import { calculateLiveBalance } from "@/lib/wealth-utils";
import { getNow } from "@/demo/demo-config";

/**
 * OURGLASS NET WORTH ENGINE (SINGLE SOURCE OF TRUTH)
 * 
 * Logic:
 * 1. Base Amount: Prefer initial_amount if > 0, else current_amount (Ghost Asset Resilience).
 * 2. Stocks: Use live price * quantity. If quantity or price missing, fallback to baseAmount.
 * 3. Foreign Currency: Apply exchange rates (USD, EUR).
 * 4. Compounding: use calculateLiveBalance for high-yield/savings/money-market.
 * 5. Universal USD: If asset.currency is 'USD', result is converted to NIS.
 */

export interface CalculationResult {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    netWorthBeforeFees: number;
    portfolioValue: number;
    usdToIls: number;
    calculatedAssets: (Goal & { calculatedValue: number })[];
}

/**
 * OURGLASS NET WORTH ENGINE (SINGLE SOURCE OF TRUTH)
 * Implementation by OURGLASS OVERMIND Mandate.
 */
export function netWorthEngine(
    assets: Goal[],
    liabilities: Liability[] = [],
    usdToIls: number = 3.65,
    marketPrices: Record<string, { price: number; changePercent: number }> = {}
): CalculationResult {

    const calculatedAssets = assets.map(asset => {
        // MANDATE: Bulletproof base amount (Number(...) || 0)
        // Prioritize current_amount as it is the most recent "authority" from manual update or daily accrual.
        const baseAmount = Number(asset.current_amount || asset.initial_amount || 0) || 0;

        let val = baseAmount;

        // 1. Stocks
        if (asset.type === 'stock' && asset.symbol) {
            const priceData = marketPrices[asset.symbol.toUpperCase()];
            const qty = Number(asset.quantity || 0) || 0;

            if (priceData && priceData.price && qty > 0) {
                // Market Data Success: Calculate live value (Price is in USD, result in ILS)
                val = qty * priceData.price * usdToIls;
            } else {
                // Stock Fallback: Use base amount (current first). 
                val = baseAmount;
                if (asset.currency === 'USD') {
                    val *= usdToIls;
                }
            }
        }
        // 2. Foreign Currency (Explicit Type)
        else if (asset.investment_type === 'foreign_currency' || asset.type === 'foreign_currency') {
            const currency = asset.currency?.toUpperCase() || 'USD';
            let rate = 1;
            if (currency === 'USD') rate = usdToIls;
            else if (currency === 'EUR') rate = usdToIls * 1.09; // Approx EUR/ILS
            else if (currency === 'ILS') rate = 1;
            else rate = usdToIls; // Default fallback to USD rate for other foreign types

            val = baseAmount * rate;
        }
        // 3. Yielding / Compounding Assets
        else {
            const annualRate = Number(asset.annual_interest_percent ?? asset.interest_rate ?? 0) || 0;
            const isYielding = asset.type === 'money_market' || asset.type === 'savings' || annualRate > 0;

            if (isYielding) {
                // MANDATE: Before Fees & Taxes (taxRate = 0)
                // Use current_amount + last_accrual_timestamp if available, otherwise fallback to initial.
                const principal = Number(asset.current_amount || asset.initial_amount || 0) || 0;
                const refDate = asset.last_accrual_timestamp || asset.start_date || asset.created_at || getNow().toISOString();

                const rate = (annualRate === 0 && (asset.type === 'money_market' || asset.type === 'savings')) ? 4.5 : annualRate;
                const taxRate = 0; // Mandate: Before Deductions

                const liveVal = calculateLiveBalance(principal, refDate, rate, taxRate, asset.exit_dates || []);
                val = (Number.isNaN(liveVal) || liveVal === 0) ? principal : liveVal;

                // USD Compounding Support
                if (asset.currency === 'USD') val *= usdToIls;
            } else {
                // 4. Default / Cash / Real Estate / Other (with USD support)
                val = baseAmount;
                if (asset.currency === 'USD') val *= usdToIls;
            }
        }

        const calculatedValue = Math.max(0, val) || 0;

        return {
            ...asset,
            calculatedValue
        };
    });

    // 5. Final Aggregation
    // MANDATE: totalAssets is gross sum BEFORE fees/taxes.
    // MANDATE: netWorthBeforeFees is totalAssets - totalLiabilities.
    const totalAssets = Math.round(calculatedAssets.reduce((sum, a) => sum + (a.calculatedValue || 0), 0) * 100) / 100;
    const totalLiabilities = Math.round(liabilities.reduce((sum, l) => sum + (Number(l.current_balance || l.remaining_amount || 0) || 0), 0) * 100) / 100;

    return {
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets,
        netWorthBeforeFees: Math.round((totalAssets - totalLiabilities) * 100) / 100,
        portfolioValue: totalAssets,
        usdToIls,
        calculatedAssets
    };
}
