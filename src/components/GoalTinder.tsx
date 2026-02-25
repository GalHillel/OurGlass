"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Heart, X, Sparkles, ShoppingBag } from "lucide-react";
import { useWealth } from "@/hooks/useWealth";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";
import { cn, formatAmount } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export function GoalTinder() {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const { assets } = useWealth();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter real wishlist items from assets
    const items = assets.filter(a => a.type === 'wish');

    const activeItem = items[currentIndex];

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const dislikeOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleSwipe = (direction: 'left' | 'right') => {
        triggerHaptic();
        if (direction === 'right') {
            toast.success(`אושר: ${activeItem?.name}!`, { icon: '❤️' });
        } else {
            toast.info(`נדחה: ${activeItem?.name}`, { icon: '🙅' });
        }
        setCurrentIndex(prev => prev + 1);
        x.set(0);
    };

    if (currentIndex >= items.length) {
        return (
            <div className="neon-card p-12 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white/60">אין עוד משאלות</h3>
                <p className="text-xs text-white/30">רוצו להוסיף עוד חלומות ברשימת המשאלות!</p>
            </div>
        );
    }

    return (
        <div className="relative h-[450px] w-full max-w-sm mx-auto">
            <AnimatePresence>
                <motion.div
                    key={activeItem.id}
                    style={{ x, rotate, opacity }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, info) => {
                        if (info.offset.x > 100) handleSwipe('right');
                        else if (info.offset.x < -100) handleSwipe('left');
                    }}
                    className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                >
                    <div className="h-full w-full rounded-[2.5rem] bg-slate-900 border border-white/10 overflow-hidden relative shadow-2xl">
                        {/* Mock Image Area */}
                        <div className="h-2/3 bg-gradient-to-br from-purple-500/20 via-slate-900 to-pink-500/10 flex items-center justify-center relative">
                            <ShoppingBag className="w-20 h-20 text-white/10" />

                            {/* Overlay Indicators */}
                            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 right-10 border-4 border-emerald-500 rounded-xl px-4 py-2 rotate-12">
                                <span className="text-3xl font-black text-emerald-500 uppercase">יאס!</span>
                            </motion.div>
                            <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-10 left-10 border-4 border-rose-500 rounded-xl px-4 py-2 -rotate-12">
                                <span className="text-3xl font-black text-rose-500 uppercase">פחות</span>
                            </motion.div>
                        </div>

                        {/* Info Area */}
                        <div className="p-6 text-right" dir="rtl">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-black text-white">{activeItem.name}</h3>
                                <span className="text-xl font-bold text-purple-400">
                                    {formatAmount(activeItem.target_amount ?? 0, isStealthMode, CURRENCY_SYMBOL, '***')}
                                </span>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed">
                                שלב האישור: ממתין להחלטה שלכם. החליקו ימינה כדי לאשר רכישה עתידית או שמאלה כדי להשהות.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Background stack effect */}
            <div className="absolute inset-x-4 inset-y-4 -z-10 rounded-[2.5rem] bg-white/5 border border-white/5 translate-y-4 scale-95" />
            <div className="absolute inset-x-8 inset-y-8 -z-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 translate-y-8 scale-90" />

            {/* Action Buttons */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
                <button
                    onClick={() => handleSwipe('left')}
                    className="w-14 h-14 rounded-full bg-slate-950 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-900/20 active:scale-90 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="w-14 h-14 rounded-full bg-slate-950 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-90 transition-all"
                >
                    <Heart className="w-6 h-6 fill-current" />
                </button>
            </div>
        </div>
    );
}
