"use client";

import { motion } from "framer-motion";
import { Flag, Lock, Star, CheckCircle2, Map } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Milestone {
    amount: number;
    title: string;
    description: string;
    icon: any;
    color: string;
}

const MILESTONES: Milestone[] = [
    { amount: 0, title: "ההתחלה", description: "הצעד הראשון לחיפוש כלכלי", icon: Flag, color: "text-white" },
    { amount: 20000, title: "רשת ביטחון", description: "יש לכם אוויר לנשימה", icon: CheckCircle2, color: "text-blue-400" },
    { amount: 100000, title: "100K ראשונים", description: "הכסף מתחיל לעבוד", icon: Star, color: "text-yellow-400" },
    { amount: 500000, title: "חצי מיליון!", description: "אנחנו רציניים לגמרי", icon: Star, color: "text-purple-400" },
    { amount: 1000000, title: "המיליון הראשון", description: "מועדון המיליונרים", icon: Star, color: "text-emerald-400" },
];

interface JourneyMapProps {
    currentNetWorth: number;
}

export const JourneyMap = ({ currentNetWorth }: JourneyMapProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-16 rounded-2xl border-white/10 bg-gradient-to-r from-indigo-900/50 to-blue-900/50 hover:from-indigo-900 hover:to-blue-900 text-white gap-3 group border-2 border-dashed">
                    <Map className="w-6 h-6 text-indigo-300 group-hover:scale-110 transition-transform" />
                    <div className="text-right">
                        <div className="font-bold text-base">מפת המסע שלנו</div>
                        <div className="text-xs text-white/50">לחצו כדי לראות את הדרך למיליון</div>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md h-[80vh] bg-slate-950 border-white/10 text-white overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 bg-slate-900/50 backdrop-blur-md z-10 border-b border-white/5">
                    <DialogTitle className="text-center text-2xl font-black tracking-tight">המסע הפיננס</DialogTitle>
                    <p className="text-center text-white/40 text-sm">אתם כרגע ב-₪{currentNetWorth.toLocaleString()}</p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 relative">
                    {/* Winding Path Background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-white/5 rounded-full" />

                    <div className="space-y-12 pb-12 relative">
                        {MILESTONES.map((step, index) => {
                            const isUnlocked = currentNetWorth >= step.amount;
                            const isNext = !isUnlocked && (index === 0 || currentNetWorth >= MILESTONES[index - 1].amount);

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                                >
                                    {/* Connection Line filler */}
                                    {isUnlocked && index < MILESTONES.length - 1 && (
                                        <div className="absolute top-full left-1/2 w-1 h-12 bg-emerald-500/50 -translate-x-1/2 z-0" />
                                    )}

                                    <div className={`relative z-10 flex flex-col items-center w-1/2 ${index % 2 === 0 ? 'mr-auto items-end text-right px-4' : 'ml-auto items-start text-left px-4'}`}>
                                        <div className={`text-lg font-bold ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                                            {step.title}
                                        </div>
                                        <div className="text-xs text-white/50">{step.description}</div>
                                        <div className="text-xs font-mono mt-1 opacity-50">₪{step.amount.toLocaleString()}</div>
                                    </div>

                                    {/* Node */}
                                    <div className="absolute left-1/2 -translate-x-1/2 z-20">
                                        <div
                                            className={`w-12 h-12 rounded-full border-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500
                                                ${isUnlocked
                                                    ? 'bg-emerald-500 border-emerald-300 shadow-emerald-900/50 scale-110'
                                                    : isNext
                                                        ? 'bg-blue-500 border-blue-400 animate-pulse'
                                                        : 'bg-slate-800 border-slate-700'
                                                }
                                            `}
                                        >
                                            {isUnlocked ? (
                                                <step.icon className="w-6 h-6 text-white" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-white/20" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
