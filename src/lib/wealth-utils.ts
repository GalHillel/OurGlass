import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
/**
 * Wealth Utilities — Money Market Fund & Compound Interest Calculations
 *
 * Primary function: calculateMoneyMarketYield
 * Simulates daily compound interest for Israeli Money Market Funds (קרן כספית)
 * Default rate: 4.5% annual (Bank of Israel prime-linked)
 */

/**
 * Calculate the current value of a money market / interest-bearing asset
 * using daily compound interest.
 *
 * Annual compounding base with daily-equivalent growth:
 * \( P \\times (1 + r)^{\\Delta t / 365} \\)
 * where \(r\) is the annual rate (decimal) and \(\Delta t\) is elapsed days (can be fractional).
 *
 * Daily-equivalent rate:
 * daily_rate = (1 + annual_rate)^(1/365) - 1
 *   P = initial amount
 *   r = annual rate (decimal)
 *   \(\Delta t\) = elapsed days since investment (fractional-safe)
 *
 * @param initialAmount  The original investment amount in {CURRENCY_SYMBOL}
 * @param investmentDate The date the investment was made (ISO string or Date)
 * @param annualRate     Annual interest rate in percent (default 4.5%)
 * @returns              Current calculated value
 */
export function calculateMoneyMarketYield(
    initialAmount: number,
    investmentDate: string | Date,
    annualRate: number = 4.5
): number {
    if (!initialAmount || initialAmount <= 0) return 0;
    if (!investmentDate) return initialAmount;

    const start = new Date(investmentDate);
    const now = new Date();

    const diffMs = now.getTime() - start.getTime();
    if (!(diffMs > 0)) return initialAmount;

    const annualRateDecimal = annualRate / 100;
    const msPerYear = 365 * 24 * 60 * 60 * 1000;
    const yearFraction = diffMs / msPerYear;
    return initialAmount * Math.pow(1 + annualRateDecimal, yearFraction);
}

/**
 * Calculate the daily yield amount for display purposes
 */
export function calculateDailyYield(currentValue: number, annualRate: number = 4.5): number {
    const annualRateDecimal = annualRate / 100;
    const dailyRate = Math.pow(1 + annualRateDecimal, 1 / 365) - 1;
    return currentValue * dailyRate;
}

/**
 * Calculate total profit since investment
 */
export function calculateTotalProfit(
    initialAmount: number,
    investmentDate: string | Date,
    annualRate: number = 4.5
): number {
    const currentValue = calculateMoneyMarketYield(initialAmount, investmentDate, annualRate);
    return currentValue - initialAmount;
}

/**
 * Format {CURRENCY_SYMBOL} currency with proper locale
 */
export function formatILS(amount: number, decimals: number = 0): string {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
