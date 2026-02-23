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
 * Formula: P × (1 + r/365)^d
 *   P = initial amount
 *   r = annual rate (decimal)
 *   d = days elapsed since investment
 *
 * @param initialAmount  The original investment amount in ₪
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

    // Calculate exact days elapsed
    const diffMs = now.getTime() - start.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (days === 0) return initialAmount;

    const dailyRate = (annualRate / 100) / 365;
    return initialAmount * Math.pow(1 + dailyRate, days);
}

/**
 * Calculate the daily yield amount for display purposes
 */
export function calculateDailyYield(currentValue: number, annualRate: number = 4.5): number {
    const dailyRate = (annualRate / 100) / 365;
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
 * Format ₪ currency with proper locale
 */
export function formatILS(amount: number, decimals: number = 0): string {
    return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}
