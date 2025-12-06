"use client";

import { useState, useEffect } from "react";
import { Slider } from "./ui/slider";
import { TrendingUp, Gem, Plane } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";

export const FutureSlider = () => {
    const [monthlySave, setMonthlySave] = useState(500);
    const [years, setYears] = useState(5);
    const INTEREST_RATE = 0.05; // 5% annual return

    const calculateFutureValue = (monthly: number, yrs: number) => {
        const months = yrs * 12;
        const rate = INTEREST_RATE / 12;
        // FV = P * ((1 + r)^n - 1) / r
        // Simplified Future Value of a Series formula
        const futureValue = monthly * ((Math.pow(1 + rate, months) - 1) / rate);
        return futureValue;
    };

    const futureValue = calculateFutureValue(monthlySave, years);
    const totalPrincipal = monthlySave * years * 12;
    const interestEarned = futureValue - totalPrincipal;

    return (
        <div className="glass p-6 rounded-3xl w-full max-w-md mx-auto space-y-6 border border-white/10 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Gem className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">העתיד שלכם</h3>
                    <p className="text-xs text-white/50">תראו מה יקרה אם תחסכו...</p>
                </div>
            </div>

            {/* Main Result */}
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-xl" />
                <p className="text-white/60 text-sm mb-1 relative z-10">בעוד {years} שנים יהיו לכם</p>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200 relative z-10">
                    ₪<CountUp end={Math.round(futureValue)} separator="," duration={1} />
                </div>
                <div className="text-xs text-emerald-300 mt-2 font-medium relative z-10">
                    +₪{Math.round(interestEarned).toLocaleString()} מריבית דריבית! 🚀
                </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">נחסוך בחודש</span>
                        <span className="font-bold text-white">₪{monthlySave}</span>
                    </div>
                    <div dir="ltr">
                        <Slider
                            value={[monthlySave]}
                            onValueChange={(val: number[]) => setMonthlySave(val[0])}
                            max={5000}
                            step={100}
                            className="py-2"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/60">למשך</span>
                        <span className="font-bold text-white">{years} שנים</span>
                    </div>
                    <div dir="ltr">
                        <Slider
                            value={[years]}
                            onValueChange={(val: number[]) => setYears(val[0])}
                            max={20}
                            step={1}
                            min={1}
                            className="py-2"
                        />
                    </div>
                </div>
            </div>

            {/* Visualization (Micro-Graph) */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                <motion.div
                    layout
                    className="h-full bg-blue-500/50"
                    style={{ width: `${((totalPrincipal / futureValue) * 100).toFixed(2)}%` }}
                />
                <motion.div
                    layout
                    className="h-full bg-purple-500"
                    style={{ width: `${((interestEarned / futureValue) * 100).toFixed(2)}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 px-1">
                <span>הכסף שלכם</span>
                <span>הכסף מהריבית</span>
            </div>
        </div>
    );
};
