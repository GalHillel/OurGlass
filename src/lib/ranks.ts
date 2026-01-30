import { Sprout, PiggyBank, TrendingUp, Building2, Gem, Crown, LucideIcon } from "lucide-react";

export interface Rank {
    id: string;
    name: string;
    minWealth: number;
    icon: LucideIcon;
    color: string;
    description: string;
}

export const RANKS: Rank[] = [
    {
        id: 'apprentice',
        name: 'מתחיל/ה',
        minWealth: 0,
        icon: Sprout,
        color: "text-emerald-400",
        description: "הצעד הראשון לעושר"
    },
    {
        id: 'saver',
        name: 'חוסך/ת',
        minWealth: 10000,
        icon: PiggyBank,
        color: "text-blue-400",
        description: "הכסף מתחיל לעבוד"
    },
    {
        id: 'investor',
        name: 'משקיע/ה',
        minWealth: 50000,
        icon: TrendingUp,
        color: "text-purple-400",
        description: "צמיחה משמעותית בתיק"
    },
    {
        id: 'builder',
        name: 'בונ/ה עושר',
        minWealth: 100000,
        icon: Building2,
        color: "text-orange-400",
        description: "בסיס כלכלי איתן"
    },
    {
        id: 'tycoon',
        name: 'טייקון',
        minWealth: 500000,
        icon: Gem,
        color: "text-pink-400",
        description: "העצמאות הכלכלית בידיים שלך"
    },
    {
        id: 'unicorn',
        name: 'יוניקורן',
        minWealth: 1000000,
        icon: Crown,
        color: "text-yellow-400",
        description: "מועדון המיליון! 🦄"
    }
];

export const getRank = (netWorth: number) => {
    let currentRank = RANKS[0];
    let nextRank = RANKS[1];

    for (let i = 0; i < RANKS.length; i++) {
        if (netWorth >= RANKS[i].minWealth) {
            currentRank = RANKS[i];
            nextRank = RANKS[i + 1] || null;
        } else {
            break;
        }
    }

    if (!nextRank) {
        return { currentRank, nextRank: null, progress: 100, remaining: 0 };
    }

    const prevThreshold = currentRank.minWealth;
    const nextThreshold = nextRank.minWealth;
    const range = nextThreshold - prevThreshold;
    const progress = Math.min(100, Math.max(0, ((netWorth - prevThreshold) / range) * 100));
    const remaining = nextThreshold - netWorth;

    return { currentRank, nextRank, progress, remaining };
};
