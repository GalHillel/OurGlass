import React from 'react';
import { Check, Sparkles, Plus, Minus, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";
import { cn, formatAmount } from "@/lib/utils";
import CountUp from 'react-countup';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
    // const remaining = item.price - saved;

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
                onClick?.();
            }}
            className={cn(
                "relative w-full overflow-hidden rounded-[2.5rem] border transition-all duration-300 cursor-pointer group select-none h-28",
                "bg-slate-900/40 backdrop-blur-xl border-white/10 hover:border-purple-500/30",
                "hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] active:scale-[0.98]"
            )}
        >
            {/* Background Image / Placeholder with Gradient Blur */}
            <div className="absolute inset-0 z-0">
                {item.link ? (
                    <>
                        <img
                            src={item.link}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full bg-slate-900" />
                )}
                <div className="absolute inset-0 backdrop-blur-[2px]" />
            </div>

            {/* Shimmering Progress Bar (Floating Thin Line) */}
            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/5 overflow-hidden z-20">
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

            <div className="flex items-center p-6 gap-5 h-full relative z-10 w-full transform-gpu" style={{ transform: "translateZ(30px)" }}>
                {/* 1. Left: Image Portal */}
                <div className={cn(
                    "w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-2xl border border-white/20 transition-all duration-500 overflow-hidden relative",
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
                            <Check className="w-10 h-10 text-white drop-shadow-lg" />
                        </div>
                    )}
                </div>

                {/* 2. Center: Details */}
                <div className="flex flex-col flex-1 overflow-hidden gap-1 text-right" dir="rtl">
                    <h3 className="font-black text-white text-lg truncate leading-tight group-hover:text-purple-300 transition-colors tracking-tighter">
                        {item.name}
                    </h3>

                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-xl font-black font-mono tracking-tighter tabular-nums",
                                isFullyFunded ? "text-emerald-400" : "text-white"
                            )}>
                                {isStealthMode ? (
                                    <span>{CURRENCY_SYMBOL}***</span>
                                ) : (
                                    <><span className="text-xs mr-1 opacity-40 font-sans">{CURRENCY_SYMBOL}</span>{saved.toLocaleString()}</>
                                )}
                            </span>
                            <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">
                                מתוך {formatAmount(item.price, isStealthMode, CURRENCY_SYMBOL)}
                            </span>
                        </div>

                        {/* Progress Label */}
                        <div className="text-[9px] font-black uppercase tracking-widest text-purple-400/80">
                            {progress.toFixed(0)}% הושלם
                        </div>
                    </div>
                </div>

                {/* 3. Right: Quick Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Impulse Control Logic */}
                    {item.price > 500 && differenceInHours(new Date(), new Date(item.created_at)) < 24 ? (
                        <div className="flex flex-col items-end gap-1">
                            <div className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-2">
                                <span className="animate-pulse">⏳</span>
                                <span>
                                    {24 - differenceInHours(new Date(), new Date(item.created_at))}ש׳ להירגעות
                                </span>
                            </div>

                            {/* Force Buy Option - Hidden by default or small link */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("בטוח? ממליצים לחכות 24 שעות כדי להימנע מקנייה אימפולסיבית.")) {
                                        onAction(item, 'withdraw');
                                    }
                                }}
                                className="text-[10px] text-white/20 hover:text-red-400 underline decoration-red-500/30 transition-colors"
                            >
                                {PAYERS.HIM} באמת חייב את זה
                            </button>
                        </div>
                    ) : !isFullyFunded ? (
                        <>
                            {saved > 0 && (
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="w-10 h-10 rounded-full border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/50 hover:text-red-400 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerHaptic();
                                        onAction(item, 'withdraw');
                                    }}
                                >
                                    <Minus className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Didn't Buy It - Delayed Gratification Reward */}
                            <Button
                                size="icon"
                                variant="outline"
                                className="w-9 h-9 rounded-full border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white/50 hover:text-emerald-400 transition-all font-black text-xs"
                                title="ויתרתי על זה (הוסף לחיסכון)"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic();
                                    onAction(item, 'didnt_buy');
                                }}
                            >
                                -
                            </Button>

                            <Button
                                size="icon"
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 border border-white/10 hover:scale-110 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic();
                                    onAction(item, 'deposit');
                                }}
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </>
                    ) : (
                        <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
                            מוכן!
                        </div>
                    )}
                </div>
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ transform: "translateZ(30px)" }} />
        </motion.div>
    );
};
