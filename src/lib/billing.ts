
import { addMonths, startOfMonth, endOfMonth, setDate, isAfter, isBefore, differenceInDays } from "date-fns";

export interface BillingPeriod {
    start: Date;
    end: Date;
}

/**
 * Calculates the current billing period (10th to 10th).
 * If today is before the 10th, the period started on the 10th of the previous month.
 * If today is on or after the 10th, the period started on the 10th of this month.
 */
export const getCurrentBillingPeriod = (): BillingPeriod => {
    const today = new Date();
    const currentMonth10th = setDate(today, 10);

    let start: Date;
    let end: Date;

    if (isBefore(today, currentMonth10th)) {
        // We are early in the month (e.g., 5th), so cycle started last month
        start = setDate(addMonths(today, -1), 10);
        end = currentMonth10th;
    } else {
        // We are past the 10th, so cycle started this month
        start = currentMonth10th;
        end = setDate(addMonths(today, 1), 10);
    }

    // Set times to boundary of day
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return { start, end };
};

/**
 * Returns the number of days remaining in the current billing cycle.
 */
export const getDaysRemainingInCycle = (): number => {
    const { end } = getCurrentBillingPeriod();
    return differenceInDays(end, new Date());
};

/**
 * Returns the progress of the current billing cycle as a percentage (0-100).
 */
export const getBillingCycleProgress = (): number => {
    const { start, end } = getCurrentBillingPeriod();
    const today = new Date();
    const totalDays = differenceInDays(end, start);
    const daysPassed = differenceInDays(today, start);

    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
};

/**
 * Filters a list of items (transactions/goals) to only include those strictly within the current billing cycle.
 * Assumes items have a 'created_at' or 'date' property.
 */
export const filterByBillingCycle = <T extends { created_at?: string; date?: string }>(items: T[]): T[] => {
    const { start, end } = getCurrentBillingPeriod();

    return items.filter(item => {
        const itemDate = new Date(item.created_at || item.date || 0);
        return isAfter(itemDate, start) && isBefore(itemDate, end);
    });
};
