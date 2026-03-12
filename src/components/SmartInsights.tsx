import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, AlertTriangle, PiggyBank, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction, Subscription } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { DEMO_MODE, getNow } from '@/demo/demo-config';

interface SmartInsightsProps {
    transactions?: Transaction[];
    subscriptions?: Subscription[];
    liabilities?: unknown[];
    monthlyIncome?: number;
    hourlyWage?: number;
    isInline?: boolean;
}

interface InsightData {
    type: 'tip' | 'warning' | 'opportunity' | 'info';
    text: string;
    action?: string;
}

export const SmartInsights = ({ transactions = [], subscriptions = [], liabilities = [], monthlyIncome = 0, hourlyWage = 0, isInline = false }: SmartInsightsProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'last_smart_insight_date';

    // Fetch the insight using React Query
    const { data: insight, isLoading, isError } = useQuery<InsightData | null>({
        queryKey: ['smart-insight', transactions.length, monthlyIncome, subscriptions.length, liabilities.length],
        queryFn: async () => {
            const todayString = getNow().toDateString();
            const lastSeenDate = localStorage.getItem(STORAGE_KEY + '_date');
            const cachedInsight = localStorage.getItem(STORAGE_KEY + '_data');

            // Hard check: If we have a cached insight from today, return it immediately
            if (lastSeenDate === todayString && cachedInsight && !isError) {
                try {
                    return JSON.parse(cachedInsight);
                } catch (e) {
                    console.error("Failed to parse cached insight", e);
                }
            }

            if (transactions.length === 0) return null;

            if (DEMO_MODE) {
                const mockInsights: InsightData[] = [
                    { type: 'tip', text: 'שמנו לב שאתם מוציאים הרבה על משלוחי אוכל. בישול בבית יכול לחסוך לכם כ-800₪ החודש.', action: 'צפו במתכונים חסכוניים' },
                    { type: 'opportunity', text: 'יש לכם יתרה של 2,500₪ בעו״ש. כדאי להעביר אותם לקרן הכספית כדי לצבור ריבית.', action: 'העבר לחיסכון' },
                    { type: 'warning', text: 'חרגתם מתקציב ה״בילויים״ ב-15%. כדאי לצמצם הוצאות לא חיוניות השבוע.', action: 'ערוך תקציב' },
                    { type: 'info', text: 'החודש חסכתם 12% יותר מחודש שעבר! כל הכבוד על ההתמדה.', action: 'ראה פירוט' }
                ];
                return mockInsights[Math.floor(Math.random() * mockInsights.length)];
            }

            const res = await fetch('/api/smart-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions, monthlyIncome, hourlyWage, subscriptions, liabilities })
            });

            if (!res.ok) return null;
            const data = await res.json();

            // Cache it
            if (data) {
                localStorage.setItem(STORAGE_KEY + '_date', todayString);
                localStorage.setItem(STORAGE_KEY + '_data', JSON.stringify(data));
            }

            return data;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 1
    });

    useEffect(() => {
        const todayString = getNow().toDateString();
        const dismissedDate = localStorage.getItem(STORAGE_KEY + '_dismissed');

        if (insight && !isLoading && dismissedDate !== todayString) {
            const delay = isInline ? 0 : 2500;
            const timer = window.setTimeout(() => setIsVisible(true), delay);
            return () => window.clearTimeout(timer);
        }
    }, [insight, isLoading, isInline]);

    const handleDismiss = () => {
        setIsVisible(false);
        // We don't clear the data, just hide it for today
        localStorage.setItem(STORAGE_KEY + '_dismissed', getNow().toDateString());
    };

    if (isError || transactions.length === 0) return null;
    if (isInline && (!insight || isError)) return null; // Don't show skeleton or errors inline for now

    // Loading State
    if (isLoading && !isInline) {
        return (
            <div className="fixed top-24 left-4 right-4 z-40 md:w-96 md:left-1/2 md:-translate-x-1/2 rounded-3xl p-4 border flex items-start gap-4 bg-slate-900/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/5 opacity-80 scale-95 transition-all">
                <div className="p-2 rounded-2xl shrink-0 bg-white/5">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div className="flex-1 pt-1 space-y-2">
                    <Skeleton className="h-3 w-16 bg-white/20 rounded" />
                    <Skeleton className="h-4 w-[90%] bg-white/10 rounded mt-2" />
                    <Skeleton className="h-4 w-[70%] bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    if (!insight || (!isVisible && !isInline)) return null;


    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
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
                    initial={isInline ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={isInline ? { opacity: 0, scale: 0.95 } : { opacity: 0, y: 100, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className={cn(
                        isInline
                            ? "w-full"
                            : "fixed bottom-24 left-4 right-4 z-50 md:w-96 md:left-1/2 md:-translate-x-1/2"
                    )}
                >
                    <div className={cn(
                        "rounded-full p-1 border flex items-center gap-3 relative overflow-hidden backdrop-blur-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/10",
                        "bg-slate-900/40 border-white/5",
                        insight.type === 'warning' ? "border-r-red-500/50" : insight.type === 'opportunity' ? "border-r-emerald-500/50" : "border-r-blue-500/50"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10",
                            insight.type === 'warning' ? "bg-red-500/20" : insight.type === 'opportunity' ? "bg-emerald-500/20" : "bg-blue-500/20"
                        )}>
                            <Icon className={cn("w-5 h-5", insight.type === 'warning' ? "text-red-400" : insight.type === 'opportunity' ? "text-emerald-400" : "text-blue-400")} />
                        </div>

                        <div className="flex-1 py-1 pr-1 overflow-hidden">
                            <p className="text-[11px] font-bold text-white/90 truncate pl-4">
                                {insight.text}
                            </p>
                        </div>

                        {insight.action && (
                            <button className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-all active:scale-95 ml-1 mr-1">
                                {insight.action}
                            </button>
                        )}
                        
                        {!isInline && (
                             <button
                                onClick={handleDismiss}
                                className="p-2 text-white/20 hover:text-white rounded-full transition-colors mr-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
