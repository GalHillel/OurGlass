import React from 'react';
import { ExternalLink, Check, Sparkles, Plus, Minus, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import CountUp from 'react-countup';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { differenceInHours } from 'date-fns';

interface WishlistCardProps {
    item: WishlistItem;
    onAction: (item: WishlistItem, type: 'deposit' | 'withdraw' | 'didnt_buy') => void;
    onClick?: () => void;
}

export const WishlistCard = ({ item, onAction, onClick }: WishlistCardProps) => {
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
    const remaining = item.price - saved;

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
                "relative w-full overflow-hidden rounded-[2rem] border transition-all duration-300 cursor-pointer group select-none",
                "bg-slate-900/60 backdrop-blur-md border-white/10 hover:border-purple-500/30",
                "hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] active:scale-[0.98]"
            )}
        >
            {/* Shimmering Progress Bar Background (Bottom) */}
            <div className="absolute bottom-0 left-0 h-3 w-full bg-slate-800/50 overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(236,72,153,0.5)] relative overflow-hidden",
                        isFullyFunded ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
                    )}
                    style={{ width: `${progress}%` }}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                </div>
            </div>

            <div className="flex items-center p-6 gap-5 h-full relative z-10 w-full transform-gpu" style={{ transform: "translateZ(20px)" }}>
                {/* 1. Left: Icon / Image */}
                <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/5 transition-colors",
                    isFullyFunded
                        ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20"
                )}>
                    {isFullyFunded ? <Check className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                </div>

                {/* 2. Center: Details */}
                <div className="flex flex-col flex-1 overflow-hidden gap-1">
                    <h3 className="font-bold text-white text-xl truncate leading-tight group-hover:text-purple-200 transition-colors">
                        {item.name}
                    </h3>

                    <div className="flex flex-col">
                        {/* Status Text: Saved of Total */}
                        <div className="flex items-baseline gap-1.5 align-bottom">
                            <span className={cn(
                                "text-lg font-bold font-mono tracking-tight",
                                isFullyFunded ? "text-emerald-400" : "text-white/90"
                            )}>
                                ₪<CountUp end={saved} separator="," duration={1.5} />
                            </span>
                            <span className="text-xs text-white/40 font-medium uppercase tracking-wide mb-0.5">
                                מתוך ₪{item.price.toLocaleString()}
                            </span>
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
                                אני באמת חייב את זה
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
                                className="w-10 h-10 rounded-full border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white/50 hover:text-emerald-400 transition-all"
                                title="ויתרתי על זה (הוסף לחיסכון)"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic();
                                    onAction(item, 'didnt_buy');
                                }}
                            >
                                <ThumbsDown className="w-4 h-4" />
                            </Button>

                            <Button
                                size="icon"
                                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 border border-white/10 hover:scale-110 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic();
                                    onAction(item, 'deposit');
                                }}
                            >
                                <Plus className="w-6 h-6" />
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
