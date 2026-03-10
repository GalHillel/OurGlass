"use client";

import { useState, useEffect, useRef } from "react";
import { Goal } from "@/types";
import { calculateLiveBalance } from "@/lib/wealth-utils";

/**
 * useLiveAssetBalance - High-Performance Live UI Ticker
 * 
 * Logic:
 * 1. Uses a 1-second interval to update the balance state.
 * 2. Derives the "Live" value using the advanced calculateLiveBalance utility.
 * 3. Does NOT trigger DB updates.
 */
export function useLiveAssetBalance(asset: Goal) {
    const [balance, setBalance] = useState<number>(() => {
        // MANDATE: Before Fees & Taxes (taxRate = 0)
        const baseAmount = Number(asset.initial_amount || asset.current_amount || 0);
        return calculateLiveBalance(
            baseAmount,
            asset.last_accrual_timestamp || asset.start_date || asset.created_at || new Date().toISOString(),
            asset.annual_interest_percent || asset.interest_rate || 0,
            0, // Mandate: Before Taxes or Fees
            asset.exit_dates || []
        );
    });

    const lastComputedRef = useRef<number>(balance);

    useEffect(() => {
        // Skip for static assets
        if (asset.type === 'cash' && !asset.annual_interest_percent) return;

        const updateBalance = () => {
            const baseAmount = Number(asset.initial_amount || asset.current_amount || 0);
            const nextBalance = calculateLiveBalance(
                baseAmount,
                asset.last_accrual_timestamp || asset.start_date || asset.created_at || new Date().toISOString(),
                asset.annual_interest_percent || asset.interest_rate || 0,
                0, // Mandate: Before Taxes or Fees
                asset.exit_dates || []
            );

            // Only update state if the value has changed significantly (avoid micro-rerenders)
            if (Math.abs(nextBalance - lastComputedRef.current) > 0.0001) {
                setBalance(nextBalance);
                lastComputedRef.current = nextBalance;
            }
        };

        const interval = setInterval(updateBalance, 1000);
        return () => clearInterval(interval);
    }, [asset]);

    return balance;
}
