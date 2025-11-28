import React, { memo } from 'react';
import { Shield, Rocket } from "lucide-react";
import CountUp from "react-countup";
import { Goal } from "@/types";

interface WealthCardsProps {
    cashGoals: Goal[];
    stockGoals: Goal[];
}

export const WealthCards = memo(({ cashGoals, stockGoals }: WealthCardsProps) => {
    return (
        <div className="space-y-6">
            {/* Joint Fortress (Cash) */}
            <div className="glass p-6 rounded-3xl relative overflow-hidden group border border-white/10 shadow-xl shadow-black/5 active:scale-95 transition-transform duration-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">המבצר המשותף</h3>
                </div>

                <div className="space-y-4">
                    {cashGoals.map(goal => (
                        <div key={goal.id}>
                            <div className="text-4xl font-black text-white tracking-tight">
                                ₪<CountUp end={goal.current_amount} separator="," duration={2} />
                            </div>
                            <p className="text-white/40 text-sm mt-1 font-medium">{goal.name}</p>
                        </div>
                    ))}
                    {cashGoals.length === 0 && (
                        <div className="text-white/40 text-sm">אין מזומן במבצר עדיין...</div>
                    )}
                </div>
            </div>

            {/* Growth Engine (Investments) */}
            <div className="glass p-6 rounded-3xl relative overflow-hidden group border border-white/10 shadow-xl shadow-black/5 active:scale-95 transition-transform duration-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">מנוע צמיחה</h3>
                </div>

                <div className="space-y-6">
                    {stockGoals.map(goal => (
                        <div key={goal.id} className="relative z-10">
                            <div className="text-4xl font-black text-white tracking-tight">
                                ₪<CountUp end={goal.current_amount} separator="," duration={2.5} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-white/40 text-sm font-medium">{goal.name}</p>
                                <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded-full font-medium">
                                    {goal.growth_rate}% תשואה
                                </span>
                            </div>

                            {/* Projection */}
                            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xs text-white/40 mb-1">בעוד 10 שנים (ריבית דריבית)</p>
                                <p className="text-lg font-bold text-purple-200">
                                    ₪<CountUp
                                        end={goal.current_amount * Math.pow(1 + (goal.growth_rate || 0) / 100, 10)}
                                        separator=","
                                        duration={3}
                                    />
                                </p>
                            </div>
                        </div>
                    ))}
                    {stockGoals.length === 0 && (
                        <div className="text-white/40 text-sm">הטיל עדיין על כן השיגור...</div>
                    )}
                </div>

                {/* Background Effect */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[50px] rounded-full pointer-events-none" />
            </div>
        </div>
    );
});

WealthCards.displayName = "WealthCards";
