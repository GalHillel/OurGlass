import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, TrendingUp, AlertTriangle, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const SmartInsights = () => {
    const [insight, setInsight] = useState<{
        type: 'tip' | 'warning' | 'opportunity';
        text: string;
        action?: string;
    } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'last_smart_insight_date';

    useEffect(() => {
        const checkAndGenerate = async () => {
            const today = new Date().toDateString();
            const lastSeen = localStorage.getItem(STORAGE_KEY);

            if (lastSeen === today) return;

            // Generate Insight logic
            const hour = new Date().getHours();
            let newInsight = null;

            if (hour < 10) {
                newInsight = {
                    type: 'tip',
                    text: 'בוקר טוב! טיפ להיום: נסה לוותר על הקפה בחוץ, זה חוסך כ-300₪ בחודש.',
                    action: 'חסוך 20₪'
                } as const;
            } else if (Math.random() > 0.5) {
                newInsight = {
                    type: 'opportunity',
                    text: 'שמתי לב שנשארו לך 500₪ עודפים מהתקציב השבועי. רוצה להעביר לחיסכון?',
                    action: 'העבר לחיסכון'
                } as const;
            } else {
                newInsight = {
                    type: 'warning',
                    text: 'הוצאות המזון שלך גבוהות ב-15% מהרגיל החודש. כדאי לשים לב.',
                } as const;
            }

            setInsight(newInsight);
            setTimeout(() => setIsVisible(true), 2000); // Slightly later than daily tip
        };

        checkAndGenerate();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    };

    if (!insight || !isVisible) return null;

    const colors = {
        tip: "bg-blue-500/10 border-blue-500/20 text-blue-100",
        warning: "bg-red-500/10 border-red-500/20 text-red-100",
        opportunity: "bg-purple-500/10 border-purple-500/20 text-purple-100"
    };

    const icons = {
        tip: Lightbulb,
        warning: AlertTriangle,
        opportunity: PiggyBank
    };

    const Icon = icons[insight.type];

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
                    className="fixed top-20 left-4 right-4 z-40"
                >
                    <div className={cn(
                        "rounded-3xl p-4 border flex items-start gap-4 relative overflow-hidden backdrop-blur-xl shadow-2xl ring-1 ring-white/5",
                        "bg-slate-900/90", // Dark base
                        colors[insight.type].replace('bg-', 'border-l-4 ') // Minimal coloring
                    )}>
                        <div className={cn("p-2 rounded-2xl shrink-0 bg-white/5")}>
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 pt-1">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase tracking-wider opacity-50 mb-1">
                                    {insight.type === 'warning' ? 'שים לב' : insight.type === 'opportunity' ? 'הזדמנות' : 'תובנה'}
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
