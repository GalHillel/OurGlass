"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { triggerHaptic } from "@/utils/haptics";

interface WeeklyMoneyDateProps {
    isOpen: boolean;
    onClose: () => void;
    win: { category: string, amount: number, diff: number };
    drift: { category: string, amount: number, diff: number };
}

export function WeeklyMoneyDate({ isOpen, onClose, win, drift }: WeeklyMoneyDateProps) {
    const handleNextWeek = async () => {
        triggerHaptic();
        const confetti = (await import("canvas-confetti")).default;
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-md w-[90vw] p-0 overflow-hidden bg-slate-950/95 backdrop-blur-3xl border-white/10 rounded-[2.5rem] outline-none">
                <DialogTitle className="sr-only">דייט כסף שבועי</DialogTitle>

                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Header Sparkle */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20"
                    >
                        <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>

                    <h2 className="text-3xl font-black text-white mb-2">דייט כסף שבועי</h2>
                    <p className="text-white/40 text-sm mb-8">סיכום הריטואל הזוגי שלכם</p>

                    <div className="w-full space-y-4">
                        {/* Weekly Win */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="glass-panel p-5 border-emerald-500/20 text-right"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">הניצחון של השבוע</span>
                            </div>
                            <h4 className="text-xl font-bold text-white">{win.category}</h4>
                            <p className="text-sm text-white/60">חסכתם {CURRENCY_SYMBOL}{win.diff.toLocaleString('en-US')} לעומת שבוע שעבר</p>
                        </motion.div>

                        {/* Weekly Drift */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="glass-panel p-5 border-rose-500/20 text-right"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-2 bg-rose-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-rose-400" />
                                </div>
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">איפה קצת נסחפנו</span>
                            </div>
                            <h4 className="text-xl font-bold text-white">{drift.category}</h4>
                            <p className="text-sm text-white/60">חריגה של {CURRENCY_SYMBOL}{drift.diff.toLocaleString('en-US')} מעל הממוצע</p>
                        </motion.div>
                    </div>

                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={handleNextWeek}
                        className="w-full mt-10 h-16 bg-white text-slate-950 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        מוכנים לשבוע הבא?
                    </motion.button>

                    <button
                        onClick={onClose}
                        className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-white/20 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
