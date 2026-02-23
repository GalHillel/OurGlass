"use client";

import { motion } from "framer-motion";
import { Wallet, User } from "lucide-react";
import { useGuiltFreeWallets } from "@/hooks/useJointFinance";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "react-countup";

export function GuiltFreeWallets({ viewingDate = new Date() }: { viewingDate?: Date }) {
    const { data, isLoading } = useGuiltFreeWallets(viewingDate);

    if (isLoading) {
        return <Skeleton className="h-28 w-full rounded-2xl bg-white/5" />;
    }

    if (!data || (!data.pocketHim && !data.pocketHer)) {
        return null; // No pocket money configured
    }

    return (
        <div className="neon-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white/80">כסף כיס ללא אשמה</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Him */}
                {data.pocketHim > 0 && (
                    <WalletCard
                        label="שלו"
                        remaining={data.himRemaining}
                        total={data.pocketHim}
                        spent={data.himSpent}
                        color="blue"
                    />
                )}

                {/* Her */}
                {data.pocketHer > 0 && (
                    <WalletCard
                        label="שלה"
                        remaining={data.herRemaining}
                        total={data.pocketHer}
                        spent={data.herSpent}
                        color="pink"
                    />
                )}
            </div>
        </div>
    );
}

function WalletCard({
    label,
    remaining,
    total,
    spent,
    color,
}: {
    label: string;
    remaining: number;
    total: number;
    spent: number;
    color: "blue" | "pink";
}) {
    const progress = total > 0 ? (remaining / total) * 100 : 0;
    const isLow = progress < 20;

    const colorMap = {
        blue: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            bar: "from-blue-500 to-cyan-400",
            text: "text-blue-300",
            icon: "text-blue-400",
        },
        pink: {
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
            bar: "from-pink-500 to-rose-400",
            text: "text-pink-300",
            icon: "text-pink-400",
        },
    };

    const c = colorMap[color];

    return (
        <div className={`${c.bg} rounded-xl p-3 border ${c.border} space-y-2`}>
            <div className="flex items-center gap-2">
                <User className={`w-3.5 h-3.5 ${c.icon}`} />
                <span className={`text-[10px] font-bold ${c.text} uppercase tracking-wider`}>{label}</span>
            </div>

            <div className={`text-xl font-black ${isLow ? "text-red-400" : c.text}`}>
                ₪<CountUp end={remaining} separator="," duration={0.8} />
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8 }}
                />
            </div>

            <div className="flex justify-between text-[9px] text-white/30">
                <span>הוצאות: ₪{spent.toLocaleString()}</span>
                <span>מתוך ₪{total.toLocaleString()}</span>
            </div>
        </div>
    );
}
