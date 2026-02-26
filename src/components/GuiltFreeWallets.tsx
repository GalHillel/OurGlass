"use client";

import { motion } from "framer-motion";
import { Wallet, User } from "lucide-react";
import { useGuiltFreeWallets } from "@/hooks/useJointFinance";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "react-countup";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

export function GuiltFreeWallets({ viewingDate = new Date() }: { viewingDate?: Date }) {
    const { data, isLoading } = useGuiltFreeWallets(viewingDate);

    if (isLoading) {
        return <Skeleton className="h-28 w-full rounded-[1.5rem] bg-white/5" />;
    }

    if (!data || (!data.pocketHim && !data.pocketHer)) {
        return null; // No pocket money configured
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">תקציב לביזבוזים</h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Him */}
                {data.pocketHim > 0 && (
                    <WalletCard
                        label={PAYERS.HIM}
                        remaining={data.himRemaining}
                        total={data.pocketHim}
                        spent={data.himSpent}
                        color="blue"
                    />
                )}

                {/* Her */}
                {data.pocketHer > 0 && (
                    <WalletCard
                        label={PAYERS.HER}
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
            bar: "from-blue-500/80 to-cyan-400/80",
            text: "text-blue-300",
            icon: "text-blue-400",
        },
        pink: {
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
            bar: "from-pink-500/80 to-rose-400/80",
            text: "text-pink-300",
            icon: "text-pink-400",
        },
    };

    const c = colorMap[color];

    return (
        <div className={`${c.bg} rounded-[1.5rem] p-4 border ${c.border} space-y-3 relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 relative z-10" dir="rtl">
                <User className={`w-3.5 h-3.5 ${c.icon}`} />
                <span className={`text-[10px] font-black ${c.text} uppercase tracking-[0.1em]`}>{label}</span>
            </div>

            <div className={`text-2xl font-black tabular-nums font-mono relative z-10 ${isLow ? "text-red-400" : "text-white"}`}>
                {CURRENCY_SYMBOL}<CountUp end={remaining} separator="," duration={1} />
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative z-10 border border-white/5">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${c.bar} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </div>

            <div className="flex justify-between text-[9px] text-white/30 font-black uppercase tracking-[0.1em] relative z-10">
                <span>בוזבז: {CURRENCY_SYMBOL}{spent.toLocaleString()}</span>
                <span>מתוך {CURRENCY_SYMBOL}{total.toLocaleString()}</span>
            </div>
        </div>
    );
}
