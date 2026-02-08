"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Clock, TrendingUp, DollarSign } from "lucide-react";
import CountUp from "react-countup";
import { calculateFutureWealth } from "@/lib/utils";

interface WealthTimeMachineProps {
    currentNetWorth: number;
    monthlySavings: number; // Assumed or passed
}

export const WealthTimeMachine = ({ currentNetWorth, monthlySavings = 5000 }: WealthTimeMachineProps) => {
    const [years, setYears] = useState(5);
    const [rate, setRate] = useState(7); // Annual return rate %
    const [savings, setSavings] = useState(monthlySavings);
    const [isOpen, setIsOpen] = useState(false);

    const projectedWealth = useMemo(() => {
        return calculateFutureWealth(currentNetWorth, savings, rate / 100, years);
    }, [currentNetWorth, savings, rate, years]);

    const difference = projectedWealth - currentNetWorth;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="neon-card p-4 rounded-2xl flex items-center justify-between cursor-pointer group hover:bg-white/5 transition-colors relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">מכונת הזמן</h3>
                            <p className="text-[10px] text-white/50">ראה את העתיד הכלכלי שלך</p>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Clock className="w-5 h-5 text-blue-400" />
                        סימולטור עושר עתידי
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* Result Display */}
                    <div className="text-center space-y-1">
                        <p className="text-sm text-white/50">בעוד {years} שנים, השווי שלך יהיה:</p>
                        <div className="text-4xl font-black text-blue-200 neon-text tracking-tight">
                            ₪<CountUp end={projectedWealth} separator="," duration={0.8} />
                        </div>
                        <p className="text-xs text-emerald-400 font-bold">
                            (גידול של +₪{difference.toLocaleString()})
                        </p>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-6 bg-white/5 p-4 rounded-2xl border border-white/5">

                        {/* Years Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">טווח זמן</span>
                                <span className="font-mono text-blue-300">{years} שנים</span>
                            </div>
                            <Slider
                                value={[years]}
                                onValueChange={(v) => setYears(v[0])}
                                max={30}
                                min={1}
                                step={1}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Monthly Savings */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">חיסכון חודשי</span>
                                <span className="font-mono text-emerald-300">₪{savings.toLocaleString()}</span>
                            </div>
                            <Slider
                                value={[savings]}
                                onValueChange={(v) => setSavings(v[0])}
                                max={50000}
                                min={0}
                                step={500}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* Return Rate */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">תשואה שנתית משוערת</span>
                                <span className="font-mono text-purple-300">{rate}%</span>
                            </div>
                            <Slider
                                value={[rate]}
                                onValueChange={(v) => setRate(v[0])}
                                max={15}
                                min={0}
                                step={0.5}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-[10px] text-blue-200/80 leading-relaxed text-center">
                        * החישוב מתבסס על ריבית דריבית והתמדה בחיסכון החודשי.
                        העתיד בידיים שלך!
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
