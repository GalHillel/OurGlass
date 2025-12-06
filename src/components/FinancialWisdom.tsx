"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
    "כל שקל שחוסכים היום שווה שניים בעתיד בזכות הריבית.",
    "הוצאה קטנה קבועה היא האויב הגדול ביותר של החיסכון.",
    "לפני קנייה גדולה, חכה 24 שעות. ההתלהבות יורדת.",
    "קנה חוויות, לא דברים. האושר מהן נמשך זמן רב יותר.",
    "הפקד אוטומטית לחיסכון בתחילת החודש, לא בסופו.",
    "תקציב הוא לא כלא, הוא מפה לחופש כלכלי."
];

export const FinancialWisdom = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [tip, setTip] = useState("");

    useEffect(() => {
        // Pick random tip based on day of year to keep it daily
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setTip(TIPS[dayOfYear % TIPS.length]);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full px-6 mt-4"
            >
                <div className="glass p-4 rounded-2xl border border-blue-500/20 bg-blue-900/10 flex gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                        <Lightbulb className="w-5 h-5 text-blue-300" />
                    </div>

                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">טיפ יומי</h4>
                        <p className="text-sm text-white/90 leading-tight">
                            {tip}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
