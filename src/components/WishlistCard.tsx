import React, { useState } from 'react';
import { Check, Sparkles, Plus, Minus, ChevronDown, ChevronUp, Clock, Target, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";
import { cn, formatAmount, formatDate } from "@/lib/utils";
import CountUp from 'react-countup';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { differenceInHours } from 'date-fns';
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

interface WishlistCardProps {
    item: WishlistItem;
    onAction: (item: WishlistItem, type: 'deposit' | 'withdraw' | 'didnt_buy') => void;
    onClick?: () => void;
}

export const WishlistCard = ({ item, onAction, onClick }: WishlistCardProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const [isExpanded, setIsExpanded] = useState(false);

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Calculate progress
    const saved = item.saved_amount || 0;
    const progress = Math.min((saved / item.price) * 100, 100);
    const isFullyFunded = saved >= item.price;

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
                triggerHaptic();
                setIsExpanded(!isExpanded);
                onClick?.();
            }}
            className={cn(
                "relative w-full overflow-hidden rounded-[2.5rem] border transition-all duration-300 cursor-pointer group select-none",
                "bg-slate-900/40 backdrop-blur-xl border-white/10 hover:border-purple-500/30",
                "hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] active:scale-[0.98]",
                isExpanded ? "ring-2 ring-purple-500/20" : ""
            )}
        >
            {/* Background Image / Placeholder with Gradient Blur */}
            <div className="absolute inset-0 z-0">
                {item.link ? (
                    <>
                        <img
                            src={item.link}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-50"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full bg-slate-900" />
                )}
                <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full transform-gpu" style={{ transform: "translateZ(30px)" }}>
                {/* Collapsed Content */}
                <div className="flex items-center p-5 gap-4 h-28">
                    {/* 1. Left: Image Portal */}
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border border-white/20 transition-all duration-500 overflow-hidden relative",
                        isFullyFunded
                            ? "shadow-emerald-500/20"
                            : "group-hover:scale-105 group-hover:rotate-2"
                    )}>
                        {item.link ? (
                            <img src={item.link} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                {isFullyFunded ? <Check className="w-8 h-8 text-emerald-400" /> : <Sparkles className="w-7 h-7 text-purple-400" />}
                            </div>
                        )}
                        {isFullyFunded && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                <Check className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                        )}
                    </div>

                    {/* 2. Center: Details */}
                    <div className="flex flex-col flex-1 overflow-hidden gap-1 text-right" dir="rtl">
                        <h3 className="font-bold text-white text-base truncate leading-tight group-hover:text-purple-300 transition-colors tracking-tighter">
                            {item.name}
                        </h3>

                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-lg font-black font-mono tracking-tighter tabular-nums",
                                    isFullyFunded ? "text-emerald-400" : "text-white"
                                )}>
                                    {isStealthMode ? (
                                        <span>{CURRENCY_SYMBOL}***</span>
                                    ) : (
                                        <><span className="text-xs mr-0.5 opacity-40 font-sans">{CURRENCY_SYMBOL}</span>{saved.toLocaleString('en-US')}</>
                                    )}
                                </span>
                                <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em]">
                                    מתוך {formatAmount(item.price, isStealthMode, CURRENCY_SYMBOL)}
                                </span>
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-purple-400/80">
                                {progress.toFixed(0)}% מוכן
                            </div>
                        </div>
                    </div>

                    {/* 3. Right: Arrows / Expand */}
                    <div className="text-white/20 group-hover:text-white/40 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="h-1 w-full bg-white/5 overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000 ease-out relative overflow-hidden",
                            isFullyFunded ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-purple-500"
                        )}
                        style={{ width: `${progress}% ` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                    </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="px-5 pb-5 pt-4 space-y-4 border-t border-white/5 bg-white/[0.02]"
                        >
                            {item.description && (
                                <p className="text-xs text-white/60 text-right leading-relaxed" dir="rtl">
                                    {item.description}
                                </p>
                            )}

                            {/* Impulse Control Alert */}
                            {item.price > 500 && differenceInHours(new Date(), new Date(item.created_at)) < 24 && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 flex items-center justify-between" dir="rtl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                                            <Clock className="w-4 h-4 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-orange-200">בקרת אימפולסיביות פעילה</p>
                                            <p className="text-[9px] text-orange-200/60">
                                                נשארו עוד {24 - differenceInHours(new Date(), new Date(item.created_at))} שעות למחשבה.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("בטוח? ממליצים לחכות 24 שעות כדי להימנע מקנייה אימפולסיבית.")) {
                                                onAction(item, 'withdraw');
                                            }
                                        }}
                                        className="text-[10px] text-white/40 hover:text-red-400 underline transition-colors"
                                    >
                                        דלג (חייב את זה!)
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3" dir="rtl">
                                <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold bg-white/5 p-2 rounded-xl">
                                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                                    <span>נוסף: {formatDate(item.created_at, LOCALE)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold bg-white/5 p-2 rounded-xl">
                                    <Target className="w-3.5 h-3.5 text-purple-400" />
                                    <span>עדיפות: {item.priority || 1}</span>
                                </div>
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-4 rounded-full border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 text-[11px] font-black"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerHaptic();
                                            onAction(item, 'didnt_buy');
                                        }}
                                    >
                                        <Minus className="w-3.5 h-3.5 ml-1.5" />
                                        ויתרתי על זה
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {saved > 0 && (
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="w-10 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/50 hover:text-red-400 transition-all"
                                            onClick={() => onAction(item, 'withdraw')}
                                        >
                                            <Minus className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        className={cn(
                                            "h-10 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-lg",
                                            isFullyFunded
                                                ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/40"
                                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/40"
                                        )}
                                        onClick={() => onAction(item, 'deposit')}
                                    >
                                        <Plus className="w-5 h-5 ml-2" />
                                        {isFullyFunded ? "מימוש חלום" : "הפקדה"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ transform: "translateZ(30px)" }} />
        </motion.div>
    );
};
