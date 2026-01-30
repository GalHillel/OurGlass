import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

const TIPS = [
    "כל שקל שחוסכים היום שווה שניים בעתיד בזכות הריבית.",
    "הוצאה קטנה קבועה היא האויב הגדול ביותר של החיסכון.",
    "לפני קנייה גדולה, חכה 24 שעות. ההתלהבות יורדת.",
    "קנה חוויות, לא דברים. האושר מהן נמשך זמן רב יותר.",
    "הפקד אוטומטית לחיסכון בתחילת החודש, לא בסופו.",
    "תקציב הוא לא כלא, הוא מפה לחופש כלכלי.",
    "בדוק את דמי הניהול בקרן הפנסיה שלך לפחות פעם בשנה.",
    "אל תקנה בתשלומים אם אתה לא חייב. זה מקטין את תזרים המזומנים החודשי.",
    "חיסכון חירום של 3 חודשים הוא רשת הביטחון החשובה ביותר.",
    "השקעה במדדים רחבים מנצחת את רוב מנהלי ההשקעות לאורך זמן."
];

export const FinancialWisdom = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [tip, setTip] = useState("");
    const STORAGE_KEY = 'last_daily_tip_date';

    useEffect(() => {
        // Pick random tip based on day of year to keep it daily
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        setTip(TIPS[dayOfYear % TIPS.length]);

        // Check if seen today
        const today = new Date().toDateString();
        const lastSeen = localStorage.getItem(STORAGE_KEY);

        if (lastSeen !== today) {
            // Show after delay
            const showTimer = setTimeout(() => {
                setIsVisible(true);

                // Mark as seen after 5 seconds of visibility (passive read)
                // This prevents it from popping up again on refresh even if not swiped
                setTimeout(() => {
                    localStorage.setItem(STORAGE_KEY, today);
                }, 5000);
            }, 1500);

            return () => clearTimeout(showTimer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.y < -50) { // Swiped up
            handleDismiss();
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -150, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: -200, bottom: 20 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                    className="fixed top-4 left-4 right-4 z-50"
                >
                    <div className="backdrop-blur-xl bg-slate-900/80 border border-white/10 p-4 rounded-3xl shadow-2xl flex items-start gap-4 ring-1 ring-white/5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 pt-0.5">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-white mb-0.5">טיפ יומי</h4>
                                <span className="text-[10px] text-white/40">עכשיו</span>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-medium">
                                {tip}
                            </p>
                        </div>
                    </div>
                    {/* Handle hint */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
