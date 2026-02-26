"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, TrendingUp, HeartPulse, Trophy, MessageSquare, History } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import { useState } from "react";
import { Transaction, Subscription, Liability } from "@/types";
import { cn } from "@/lib/utils";

// Dynamic imports for the 5 tools
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const PredictiveCashflow = dynamic(() => import('@/components/PredictiveCashflow').then(mod => mod.PredictiveCashflow), {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
});
const MoodSpendingInsight = dynamic(() => import('@/components/MoodSpendingInsight').then(mod => mod.MoodSpendingInsight), {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
});
const QuestsAndBadges = dynamic(() => import('@/components/QuestsAndBadges').then(mod => mod.QuestsAndBadges), {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
});
const MonthlyRoastPraise = dynamic(() => import('@/components/MonthlyRoastPraise').then(mod => mod.MonthlyRoastPraise), {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
});
const MonthlyStoryWrap = dynamic(() => import('@/components/MonthlyStoryWrap').then(mod => mod.MonthlyStoryWrap), {
    ssr: false,
    loading: () => <div className="h-20 w-full" />
});

interface AIHubBannerProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
    balance: number;
    budget: number;
    monthlyIncome: number;
}

export function AIHubBanner({
    transactions,
    subscriptions,
    liabilities,
    balance,
    budget,
    monthlyIncome
}: AIHubBannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [showStory, setShowStory] = useState(false);

    const tools = [
        {
            id: 'cashflow',
            name: 'תחזית תזרים',
            description: 'חיזוי מצב החשבון קדימה',
            icon: TrendingUp,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10'
        },
        {
            id: 'insights',
            name: 'ניתוח מצב רוח',
            description: 'איך הרגשת כשהוצאת כסף?',
            icon: HeartPulse,
            color: 'text-fuchsia-400',
            bg: 'bg-fuchsia-500/10'
        },
        {
            id: 'challenges',
            name: 'אתגרים והישגים',
            description: 'רמת החיסכון והתקדמות AI',
            icon: Trophy,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            id: 'summary',
            name: 'סיכום חודשי',
            description: 'ניתוח ה-AI להוצאות החודש',
            icon: MessageSquare,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
        },
        {
            id: 'story',
            name: 'סיפור ה-AI שלי',
            description: 'חוויה ויזואלית של החודש',
            icon: History,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10'
        }
    ];

    const renderTool = () => {
        switch (activeTool) {
            case 'cashflow':
                return <PredictiveCashflow balance={balance} budget={budget} transactions={transactions} subscriptions={subscriptions} liabilities={liabilities} />;
            case 'insights':
                return <MoodSpendingInsight transactions={transactions} liabilities={liabilities} subscriptions={subscriptions} />;
            case 'challenges':
                return <QuestsAndBadges transactions={transactions} subscriptions={subscriptions} liabilities={liabilities} balance={balance} budget={budget} />;
            case 'summary':
                return <MonthlyRoastPraise transactions={transactions} subscriptions={subscriptions} liabilities={liabilities} balance={balance} budget={budget} monthlyIncome={monthlyIncome} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full px-4 mb-2">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="w-full glass-panel p-6 relative overflow-hidden group cursor-pointer shadow-2xl"
                    >
                        {/* Premium Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-all" />

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-black text-white tracking-tight">מרכז העוזר החכם</h2>
                                    <p className="text-xs text-blue-200/60 font-medium">ניתוחים, אתגרים, וסיכומים חכמים</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white" />
                            </div>
                        </div>
                    </motion.div>
                </DrawerTrigger>

                <DrawerContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 text-white focus:outline-none">
                    <div className="mx-auto w-full max-w-md h-[80vh] flex flex-col p-6">
                        <DrawerHeader className="px-0 pt-0 pb-6 border-b border-white/5">
                            <DrawerTitle className="text-2xl font-black flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-blue-400" />
                                <span>AI Hub</span>
                            </DrawerTitle>
                        </DrawerHeader>

                        <div className="flex-1 overflow-y-auto pt-6 scrollbar-hide">
                            <AnimatePresence mode="wait">
                                {activeTool ? (
                                    <motion.div
                                        key="tool"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 pb-20"
                                    >
                                        <button
                                            onClick={() => setActiveTool(null)}
                                            className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 mb-4 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 rotate-180" />
                                            חזרה לרשימה
                                        </button>
                                        {renderTool()}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-1 gap-3 pb-20"
                                    >
                                        {tools.map((tool, i) => (
                                            <motion.button
                                                key={tool.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => {
                                                    if (tool.id === 'story') {
                                                        setShowStory(true);
                                                    } else {
                                                        setActiveTool(tool.id);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl transition-all group active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-3 rounded-2xl", tool.bg)}>
                                                        <tool.icon className={cn("w-5 h-5", tool.color)} />
                                                    </div>
                                                    <div className="text-right">
                                                        <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                                                        <p className="text-[10px] text-white/40">{tool.description}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            <AnimatePresence>
                {showStory && (
                    <MonthlyStoryWrap onClose={() => setShowStory(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
