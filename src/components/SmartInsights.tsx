import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, TrendingUp, AlertTriangle, PiggyBank, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface SmartInsightsProps {
    transactions?: Transaction[];
    monthlyIncome?: number;
    hourlyWage?: number;
}

interface InsightData {
    type: 'tip' | 'warning' | 'opportunity' | 'info';
    text: string;
    action?: string;
}

export const SmartInsights = ({ transactions = [], monthlyIncome = 0, hourlyWage = 0 }: SmartInsightsProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const STORAGE_KEY = 'last_smart_insight_date';

    // Fetch the insight using React Query
    const { data: insight, isLoading, isError } = useQuery<InsightData | null>({
        queryKey: ['smart-insight', transactions.length, monthlyIncome],
        queryFn: async () => {
            const todayString = new Date().toDateString();
            const lastSeen = localStorage.getItem(STORAGE_KEY);

            // Only fetch once per day to avoid spamming the user and the API
            if (lastSeen === todayString || transactions.length === 0) return null;

            const res = await fetch('/api/smart-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions, monthlyIncome, hourlyWage })
            });

            if (!res.ok) return null;
            return res.json();
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: 1
    });

    useEffect(() => {
        if (insight && !isLoading) {
            // Delay the pop-in slightly for a premium feel when the app loads
            const timer = setTimeout(() => setIsVisible(true), 2500);
            return () => clearTimeout(timer);
        }
    }, [insight, isLoading]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().toDateString());
    };

    if (isError || transactions.length === 0) return null;

    // Loading State
    if (isLoading) {
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

    if (!insight || !isVisible) return null;

    const colors: Record<string, string> = {
        tip: "bg-blue-500/10 border-blue-500/20 text-blue-100",
        warning: "bg-red-500/10 border-red-500/20 text-red-100",
        opportunity: "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
        info: "bg-purple-500/10 border-purple-500/20 text-purple-100"
    };

    const icons: Record<string, any> = {
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
                    initial={{ opacity: 0, y: -100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -100, scale: 0.95 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(e, i) => { if (i.offset.y < -50) handleDismiss() }}
                    className="fixed top-24 left-4 right-4 z-40 md:w-96 md:left-1/2 md:-translate-x-1/2 cursor-grab active:cursor-grabbing"
                >
                    <div className={cn(
                        "rounded-3xl p-4 border flex items-start gap-4 relative overflow-hidden backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/5",
                        "bg-slate-900/80", // Premium glass base
                        colors[insight.type]?.replace('bg-', 'border-l-4 ') // Minimal coloring on left border
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />

                        <div className={cn("p-2 rounded-2xl shrink-0 bg-white/5 relative z-10")}>
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 pt-1 relative z-10 pr-6">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">
                                    {insight.type === 'warning' ? 'שים לב' : insight.type === 'opportunity' ? 'הזדמנות' : insight.type === 'info' ? 'טוב לדעת' : 'תובנה חכמה'} 💫
                                </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-slate-100">
                                {insight.text}
                            </p>
                            {insight.action && (
                                <button className="mt-3 text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg border border-white/5">
                                    {insight.action}
                                </button>
                            )}
                        </div>

                        {/* Dismiss action */}
                        <div className="absolute top-2 right-2 z-20">
                            <button
                                onClick={handleDismiss}
                                className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
