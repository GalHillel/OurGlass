"use client";

import { memo, useState, useMemo } from "react";
import { getNow } from "@/demo/demo-config";

import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGlobalCashflow } from "@/hooks/useJointFinance";
import { Sparkles } from "lucide-react";
import { WeeklyMoneyDate } from "./WeeklyMoneyDate";

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    titleColor?: string;
    className?: string;
    onIconClick?: () => void;
}

export const AppHeader = memo(({ title, subtitle, icon: Icon, iconColor = "text-blue-400", titleColor = "text-blue-500", className, onIconClick }: AppHeaderProps) => {
    const greeting = useMemo(() => {
        const hour = getNow().getHours();
        if (hour >= 5 && hour < 12) return "בוקר טוב ☕";
        if (hour >= 12 && hour < 17) return "המשך יום מעולה ☀️";
        if (hour >= 17 && hour < 22) return "ערב טוב 🌙";
        return "לילה טוב, חסכת היום? ✨";
    }, []);

    const [isZen, setIsZen] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.body.classList.contains("zen-mode");
        }
        return false;
    });

    const [isMoneyDateOpen, setIsMoneyDateOpen] = useState(false);

    // Mock data for the ritual - in a real app this would come from an API/hook
    const ritualData = useMemo(() => ({
        win: { category: "בילויים", amount: 450, diff: 120 },
        drift: { category: "קניות ברשת", amount: 890, diff: 210 }
    }), []);



    const toggleZenMode = () => {
        const newState = !isZen;
        setIsZen(newState);
        if (typeof document !== 'undefined') {
            if (newState) {
                document.body.classList.add("zen-mode");
            } else {
                document.body.classList.remove("zen-mode");
            }
        }
    };

    const { data: cashflow } = useGlobalCashflow();

    const burnRatePercent = useMemo(() => {
        if (!cashflow?.budget || !cashflow?.totalSpent) return 0;
        return Math.min(100, (cashflow.totalSpent / cashflow.budget) * 100);
    }, [cashflow]);

    const burnColor = useMemo(() => {
        if (burnRatePercent > 90) return "bg-red-500";
        if (burnRatePercent > 75) return "bg-orange-500";
        if (burnRatePercent > 50) return "bg-yellow-500";
        return "bg-emerald-500";
    }, [burnRatePercent]);

    return (
        <>
            {/* MANDATE 4: GLOBAL BURN RATE INDICATOR */}
            <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${burnRatePercent}%` }}
                    className={cn("h-full transition-colors duration-500 mb-0", burnColor)}
                />
            </div>

            <header className={cn(
                "fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4",
                "backdrop-blur-2xl bg-slate-900/40 border-b border-white/5",
                className
            )}>
                {/* Right Side (RTL Start) - Title */}
                <h1 className="text-xl font-black tracking-tight neon-text flex items-center gap-2">
                    <button aria-label="Left Icon" onClick={onIconClick} className="active:scale-90 transition-transform">
                        <Icon className={cn("w-6 h-6", iconColor)} />
                    </button>
                    {title} {subtitle && <span className={titleColor}>{subtitle}</span>}
                </h1>

                {/* Left Side (RTL End) - Smart Greeting & Zen Mode */}
                <div className="flex items-center gap-3">
                    <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                        className="text-xs font-medium text-white/60 hidden sm:inline-block"
                    >
                        {greeting}
                    </motion.span>

                    {/* Level Badge (Gamification) */}
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 mr-2">
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wide">SAVER</span>
                        <span className="text-xs font-black text-orange-200">LV.5</span>
                    </div>

                    <button
                        onClick={toggleZenMode}
                        className="p-2 -m-2 text-white/40 hover:text-blue-400 transition-colors active:scale-95"
                        aria-label="Zen Mode"
                    >
                        {isZen ? (
                            <EyeOff className="w-5 h-5 text-blue-400" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>

                    {/* Weekly Money Date Trigger */}
                    <button
                        onClick={() => setIsMoneyDateOpen(true)}
                        className="relative p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-90 group"
                    >
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    </button>
                </div>
            </header >

            <WeeklyMoneyDate
                isOpen={isMoneyDateOpen}
                onClose={() => setIsMoneyDateOpen(false)}
                win={ritualData.win}
                drift={ritualData.drift}
            />
        </>
    );
});

AppHeader.displayName = "AppHeader";
