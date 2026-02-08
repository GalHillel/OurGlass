import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, TrendingUp, AlertTriangle, PiggyBank, Calendar } from 'lucide-react';
import { cn, detectSpendingAnomaly } from '@/lib/utils';
import { Transaction } from '@/types';

interface SmartInsightsProps {
    transactions?: Transaction[];
    monthlyIncome?: number;
    hourlyWage?: number;
}

export const SmartInsights = ({ transactions = [], monthlyIncome = 0, hourlyWage = 0 }: SmartInsightsProps) => {
    const [insight, setInsight] = useState<{
        type: 'tip' | 'warning' | 'opportunity' | 'info';
        text: string;
        action?: string;
    } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'last_smart_insight_date';

    useEffect(() => {
        const checkAndGenerate = async () => {
            const today = new Date();
            const todayString = today.toDateString();
            const lastSeen = localStorage.getItem(STORAGE_KEY);

            if (lastSeen === todayString) return;

            // Context Logic
            const dayOfMonth = today.getDate();
            const dayOfWeek = today.getDay(); // 5 = Friday, 6 = Saturday
            let newInsight = null;

            // 1. Anomaly Detection (High Priority)
            if (transactions.length > 5) {
                // Simple avg calc for 'Food' or 'Restaurants' - Mocking the category ID check for now or text string
                // In real app, group by category.
                // Let's just do a mock check on last transaction if it was huge
                const lastTx = transactions[0]; // Ordered by date desc
                if (lastTx && Number(lastTx.amount) > 1000) {
                    newInsight = {
                        type: 'warning',
                        text: `הוצאה חריגה זוהתה: ${Number(lastTx.amount).toLocaleString()}₪ ב-${lastTx.description || 'קטגוריה לא ידועה'}. זה משפיע משמעותית על התחזית החודשית.`,
                        action: 'בדוק תקציב'
                    } as const;
                }
            }

            // 2. 50/30/20 Rule Check (If Income Exists)
            if (!newInsight && monthlyIncome > 0) {
                // Approximate 50/30/20: Needs > 50%, Wants > 30%, Savings < 20%
                // For simplicity in this "Smart" feature, we just check if total spend > 80% of income early in month
                const totalSpend = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
                const spendRatio = totalSpend / monthlyIncome;

                if (dayOfMonth < 15 && spendRatio > 0.6) {
                    newInsight = {
                        type: 'warning',
                        text: `זהירות! כבר הוצאת ${Math.round(spendRatio * 100)}% מההכנסה החודשית שלך, ואנחנו רק באמצע החודש.`,
                        action: 'האט קצב'
                    } as const;
                } else if (dayOfMonth > 25 && spendRatio < 0.7) {
                    newInsight = {
                        type: 'opportunity',
                        text: `כל הכבוד! נשארת עם יתרה משמעותית החודש (${monthlyIncome - totalSpend}₪). זה הזמן להגדיל את החיסכון.`,
                        action: 'חסוך עכשיו'
                    } as const;
                }
            }

            // 3. Wasted Work Hours (Context: Cost of Living)
            if (monthlyIncome > 0 && hourlyWage > 0) {
                // Check Dining/Takeout specific
                const diningTx = transactions.filter(t => t.description?.includes('מסעדה') || t.description?.includes('וולט') || t.description?.includes('תלוש'));
                const diningSum = diningTx.reduce((sum, t) => sum + Number(t.amount), 0);

                if (diningSum > 500) {
                    const hoursWasted = (diningSum / hourlyWage).toFixed(1);
                    newInsight = {
                        type: 'warning',
                        text: `החודש "שרפת" ${hoursWasted} שעות עבודה על מסעדות (${diningSum.toLocaleString()}₪). שווה את המאמץ?`,
                        action: 'צפה בפירוט'
                    } as const;
                }
            }

            // 4. Date Context (If no revenue insight)
            if (!newInsight) {
                if (dayOfMonth === 1 || dayOfMonth === 10) {
                    newInsight = {
                        type: 'opportunity',
                        text: 'יום המשכורת הגיע! 💰 זה הזמן המושלם לשלם לעצמך ראשון ולהעביר כסף לחיסכון.',
                        action: 'הפקד לחיסכון'
                    } as const;
                } else if (dayOfMonth <= 5) {
                    newInsight = {
                        type: 'opportunity',
                        text: 'תחילת חודש! זה הזמן המושלם להעביר את הוראות הקבע לחיסכון לפני שמתחילים לבזבז.',
                        action: 'בצע העברות'
                    } as const;
                } else if (dayOfMonth >= 25) {
                    newInsight = {
                        type: 'info',
                        text: 'סוף החודש מתקרב. בדוק אם נשאר לך עודף בתקציב שניתן לסגור לחיסכון.',
                        action: 'בדוק יתרה'
                    } as const;
                } else if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // Thursday, Friday, Saturday
                    newInsight = {
                        type: 'tip',
                        text: 'סופ"ש כאן! 🍻 בממוצע אתם מוציאים 800₪ בסופ"ש. נסו לאתגר את עצמכם עם 600₪ השבוע.',
                    } as const;
                } else {
                    // Default / Random
                    const strategies = [
                        { type: 'tip', text: 'טיפ: ויתור על קפה אחד בחוץ שווה לחיסכון של כ-300₪ בשנה.' },
                        { type: 'opportunity', text: 'נראה שיש לך יתרה פנויה טובה החודש. שוקל להשקיע ב-S&P 500?' },
                        { type: 'info', text: 'הידעת? ריבית דריבית היא הפלא השמיני של העולם (איינשטיין).' }
                    ] as const;
                    newInsight = strategies[Math.floor(Math.random() * strategies.length)];
                }
            }

            setInsight(newInsight);
            setTimeout(() => setIsVisible(true), 2500);
        };

        checkAndGenerate();
    }, [transactions, monthlyIncome, hourlyWage]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    };

    if (!insight || !isVisible) return null;

    const colors = {
        tip: "bg-blue-500/10 border-blue-500/20 text-blue-100",
        warning: "bg-red-500/10 border-red-500/20 text-red-100",
        opportunity: "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
        info: "bg-purple-500/10 border-purple-500/20 text-purple-100"
    };

    const icons = {
        tip: Lightbulb,
        warning: AlertTriangle,
        opportunity: PiggyBank,
        info: Calendar
    };

    const Icon = icons[insight.type] || Lightbulb;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(e, i) => { if (i.offset.y < -50) handleDismiss() }}
                    className="fixed top-24 left-4 right-4 z-40 md:w-96 md:left-1/2 md:-translate-x-1/2"
                >
                    <div className={cn(
                        "rounded-3xl p-4 border flex items-start gap-4 relative overflow-hidden backdrop-blur-xl shadow-2xl ring-1 ring-white/5 touch-pan-y",
                        "bg-slate-900/60", // Glass base
                        colors[insight.type]?.replace('bg-', 'border-l-4 ') // Minimal coloring
                    )}>
                        <div className={cn("p-2 rounded-2xl shrink-0 bg-white/5")}>
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 pt-1">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                                    {insight.type === 'warning' ? 'שים לב' : insight.type === 'opportunity' ? 'הזדמנות' : insight.type === 'info' ? 'עדכון' : 'תובנה'}
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-slate-200">
                                {insight.text}
                            </p>
                            {insight.action && (
                                <button className="mt-3 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
                                    {insight.action}
                                </button>
                            )}
                        </div>

                        {/* Dismiss hint */}
                        <div className="absolute top-2 right-2 flex flex-col items-center">
                            <button
                                onClick={handleDismiss}
                                className="p-2 text-white/20 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
