import { Transaction } from "@/types";
import { getDaysInMonth, getDate, subMonths, isAfter, isBefore, startOfDay, endOfDay, addMonths, setDate } from "date-fns";

/**
 * Calculates the "Smart Streak" - consecutive days the user has stayed within budget.
 * Incorporates Billing Cycles (starting on the 10th) and Historical Performance.
 * 
 * Logic:
 * 1. Current Cycle: Check cumulative spend day-by-day. Streak = days survived so far.
 *    If broken today/yesterday, return 0 for current cycle.
 * 2. Previous Cycles: If Current Cycle is perfect (so far), check previous month.
 *    If Previous Month Total Spend <= Budget, add daysInMonth to streak.
 *    Repeat backwards until a failed month is found.
 */
export const calculateSmartStreak = (
    transactions: Transaction[],
    monthlyBudget: number,
    fixedExpenses: number,
    billingDay: number = 10
): number => {
    // Safety check
    if (!transactions) return 0;

    const today = new Date();

    // --- Helper: Get Cycle Range ---
    const getCycleRange = (refDate: Date) => {
        let start = new Date(refDate);
        if (getDate(refDate) < billingDay) {
            start = subMonths(start, 1);
        }
        start.setDate(billingDay);
        start = startOfDay(start);

        let end = addMonths(start, 1);
        end.setDate(billingDay);
        end = startOfDay(end);

        return { start, end: new Date(end.getTime() - 1) };
    };

    // --- Helper: Check Single Cycle PASS/FAIL (Full Month) ---
    const checkCycleSuccess = (cycleStart: Date, cycleEnd: Date): boolean => {
        const cycleTxs = transactions.filter(tx => {
            const d = new Date(tx.date);
            return d >= cycleStart && d <= cycleEnd;
        });

        const totalSpend = cycleTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        return totalSpend <= monthlyBudget;
    };

    // --- Helper: Check Current Cycle Status (So Far) ---
    // Returns number of safe days in current cycle if safe, 0 if unsafe.
    const checkCurrentCycleProgress = (cycleStart: Date): number => {
        const disposableIncome = monthlyBudget - fixedExpenses;
        const nextBilling = addMonths(cycleStart, 1);
        const daysInCycle = Math.round((nextBilling.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        const dailyBudget = disposableIncome / daysInCycle;

        // Calculate days passed in this cycle (1-based count for streak)
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysPassed = Math.floor((today.getTime() - cycleStart.getTime()) / msPerDay) + 1; // +1 to include today being "survived" if logic holds?
        // Actually, if I am on Day 1, and I am under budget, streak is 1.

        const allowedSpendToDate = dailyBudget * daysPassed;

        // Sum actual spend in this cycle so far
        const currentSpend = transactions
            .filter(tx => {
                const d = new Date(tx.date);
                return d >= cycleStart && d <= today; // Up to 'now'
            })
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

        // Strict Check: Are we under the proportional budget?
        // Note: We use <= to be permissive.
        if (currentSpend <= allowedSpendToDate) {
            return daysPassed;
        } else {
            return 0; // Currently over budget -> Streak Broken
        }
    };

    // 1. Check Current Cycle
    const { start: currentStart } = getCycleRange(today);
    const currentStreakDays = checkCurrentCycleProgress(currentStart);

    if (currentStreakDays === 0) {
        return 0; // Failed current cycle
    }

    let totalStreak = currentStreakDays;

    // 2. Iterate Backwards (History)
    let lookbackDate = subMonths(currentStart, 1);
    for (let i = 0; i < 24; i++) { // Check last 2 years
        const { start, end } = getCycleRange(lookbackDate);
        if (checkCycleSuccess(start, end)) {
            const daysInCycle = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            totalStreak += daysInCycle;
            lookbackDate = subMonths(start, 1);
        } else {
            break; // Streak broken in history
        }
    }

    return totalStreak;
};
