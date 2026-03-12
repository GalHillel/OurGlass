import { CURRENCY_SYMBOL } from "@/lib/constants";
import { getNow } from "@/demo/demo-config";
/**
 * Wealth Utilities — Money Market Fund & Compound Interest Calculations
 *
 * Primary function: calculateMoneyMarketYield
 * Simulates daily compound interest for Israeli Money Market Funds (קרן כספית)
 * Default rate: 4.5% annual (Bank of Israel prime-linked)
 */


export interface ExitDate {
    date: string;
    amount: number;
}

/**
 * Advanced Financial Math for Ultra-Precise Real-Time Compounding
 * 
 * Logic:
 * 1. Sort exit dates chronologically.
 * 2. Iteratively calculate compound interest between intervals (Start -> Exit 1 -> Exit 2 -> ... -> Current).
 * 3. In each interval:
 *    a. Compound principal: P * (1 + annualRate)^yearFraction
 *    b. Calculate profit: NewValue - PrincipalAtStartOfInterval
 *    c. Apply tax to profit: NetProfit = profit * (1 - taxRate)
 *    d. Principal for next interval = PrincipalAtStartOfInterval + NetProfit - WithdrawalAmount
 */
export function calculateLiveBalance(
    initialAmount: number,
    startDate: string | Date,
    annualRate: number,
    taxRatePercent: number | null,
    exitDates: ExitDate[] | null,
    currentDate: Date | string = getNow()
): number {
    if (!initialAmount || initialAmount <= 0) return 0;

    const initialStart = new Date(startDate);
    const now = new Date(currentDate);
    if (now <= initialStart) return initialAmount;

    // 1. Sort and filter exit dates that happened before now
    const sortedExits = (exitDates || [])
        .map(e => ({ ...e, dateObj: new Date(e.date) }))
        .filter(e => e.dateObj > initialStart && e.dateObj < now)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let currentPrincipal = initialAmount;
    let lastDate = initialStart;
    const annualRateDecimal = annualRate / 100;
    const taxRateDecimal = (taxRatePercent || 0) / 100;
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;

    // 2. Process intervals between exit dates
    for (const exit of sortedExits) {
        const intervalMs = exit.dateObj.getTime() - lastDate.getTime();
        const yearFraction = intervalMs / msPerYear;

        // Compound interest on current principal
        const grossValue = currentPrincipal * Math.pow(1 + annualRateDecimal, yearFraction);
        const profit = grossValue - currentPrincipal;
        const netProfit = profit * (1 - taxRateDecimal);

        // Update principal: current + profit - withdrawal
        currentPrincipal = currentPrincipal + netProfit - exit.amount;
        lastDate = exit.dateObj;

        // Prevent negative balance from over-withdrawal
        if (currentPrincipal < 0) currentPrincipal = 0;
    }

    // 3. Final interval: Last Exit Date (or Start) to Current Date
    const finalIntervalMs = now.getTime() - lastDate.getTime();
    const finalYearFraction = finalIntervalMs / msPerYear;

    const finalGrossValue = currentPrincipal * Math.pow(1 + annualRateDecimal, finalYearFraction);
    const finalProfit = finalGrossValue - currentPrincipal;
    const finalNetProfit = finalProfit * (1 - taxRateDecimal);

    return currentPrincipal + finalNetProfit;
}

/**
 * Format {CURRENCY_SYMBOL} currency with proper locale & decimals
 */
export function formatILS(amount: number, decimals: number = 0): string {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
