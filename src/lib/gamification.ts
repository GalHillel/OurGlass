import { differenceInDays, isSameDay, subDays } from "date-fns";
import { Transaction } from "@/types";

export const calculateStreak = (transactions: Transaction[], dailyLimit: number = 500): number => {
    // Sort transactions by date descending
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let checkDate = new Date();

    // Check up to 30 days back
    for (let i = 0; i < 30; i++) {
        const currentDate = subDays(new Date(), i);

        // Sum spending for this day
        const dailySpend = sorted
            .filter(t => isSameDay(new Date(t.date), currentDate))
            .reduce((sum, t) => sum + Number(t.amount), 0);

        if (dailySpend < dailyLimit) {
            streak++;
        } else {
            // Streak broken
            break;
        }
    }

    return streak;
};
