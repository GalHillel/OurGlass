import { differenceInMonths, addMonths } from "date-fns";
import { getNow } from "@/demo/demo-config";

/**
 * Calculates the current remaining balance of a loan based on its initial terms and time passed.
 * Uses standard monthly compounding interest.
 */
export function calculateDynamicBalance(
    totalAmount: number,
    monthlyPayment: number,
    interestRateYearly: number,
    startDate: string | Date,
    targetDate: Date = getNow()
): number {
    const start = new Date(startDate);
    const now = targetDate;

    if (isNaN(start.getTime())) return totalAmount;

    // Fixed interest rate check
    if (interestRateYearly < 0) interestRateYearly = 0;

    // Calculate months passed since start
    const monthsPassed = differenceInMonths(now, start);

    if (monthsPassed <= 0) return totalAmount;

    const monthlyRate = (interestRateYearly / 100) / 12;

    let balance = totalAmount;

    // Optimization: If no interest, it's a simple subtraction
    if (monthlyRate === 0) {
        balance = totalAmount - (monthsPassed * monthlyPayment);
    } else {
        // Amortization simulation up to now
        for (let i = 0; i < monthsPassed; i++) {
            const interest = balance * monthlyRate;
            balance = balance + interest - monthlyPayment;
            if (balance <= 0) return 0;
        }
    }

    return Math.max(0, balance);
}

/**
 * Estimates the payoff date based on current balance and payment terms.
 */
export function estimatePayoffDate(
    currentBalance: number,
    monthlyPayment: number,
    interestRateYearly: number
): Date | null {
    if (monthlyPayment <= 0 || currentBalance <= 0) return null;

    const monthlyRate = (interestRateYearly / 100) / 12;

    // Check if interest exceeds payment (loan grows indefinitely)
    if (monthlyRate > 0 && (currentBalance * monthlyRate) >= monthlyPayment) {
        return null;
    }

    let balance = currentBalance;
    let months = 0;

    // Simple simulation (more robust than formula for varied rates/payments if needed later)
    while (balance > 0 && months < 600) { // Cap at 50 years
        const interest = balance * monthlyRate;
        balance = balance + interest - monthlyPayment;
        months++;
    }

    return addMonths(getNow(), months);
}
