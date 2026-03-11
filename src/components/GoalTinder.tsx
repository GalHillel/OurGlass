"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Heart, X, Sparkles, ShoppingBag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";
import { formatAmount } from "@/lib/utils";
import Image from "next/image";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";

export function GoalTinder() {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const supabase = useRef(createClient()).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const { profile } = useAuth();
    const coupleId = profile?.couple_id ?? null;

    const { data: items = [], isLoading } = useQuery<WishlistItem[]>({
        queryKey: ['wishlist-items', coupleId],
        queryFn: async () => {
            if (!coupleId) return [];
            const { data, error } = await supabase
                .from('wishlist')
                .select('*')
                .eq('couple_id', coupleId)
                .order('priority', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!coupleId,
    });

    const activeItem = items[currentIndex];

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
    const likeOpacity = useTransform(x, [50, 150], [0, 1]);
    const dislikeOpacity = useTransform(x, [-50, -150], [0, 1]);

    const handleSwipe = (direction: 'left' | 'right') => {
        if (!activeItem) return;
        triggerHaptic();
        if (direction === 'right') {
            toast.success(`אושר: ${activeItem.name}!`, { icon: '❤️' });
        } else {
            toast.info(`נדחה: ${activeItem.name}`, { icon: '🙅' });
        }
        setCurrentIndex(prev => prev + 1);
        x.set(0);
    };

    if (isLoading) {
        return <div className="h-[450px] flex items-center justify-center text-white/20">טוען משאלות...</div>;
    }

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
                {activeItem && (
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
                        <div className="h-full w-full rounded-[2.5rem] bg-slate-900 border border-white/10 overflow-hidden relative shadow-2xl flex flex-col">
                            {/* Image Area */}
                            <div className="h-2/3 flex items-center justify-center relative bg-slate-800">
                                {activeItem.link && activeItem.link.includes('http') ? (
                                    <Image
                                        src={activeItem.link}
                                        alt={activeItem.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                    />
                                ) : (
                                    <ShoppingBag className="w-20 h-20 text-white/10" />
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                                {/* Overlay Indicators */}
                                <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 right-10 border-4 border-emerald-500 rounded-xl px-4 py-2 rotate-12 bg-slate-900/20 backdrop-blur-sm z-20">
                                    <span className="text-3xl font-black text-emerald-500 uppercase">יאס!</span>
                                </motion.div>
                                <motion.div style={{ opacity: dislikeOpacity }} className="absolute top-10 left-10 border-4 border-rose-500 rounded-xl px-4 py-2 -rotate-12 bg-slate-900/20 backdrop-blur-sm z-20">
                                    <span className="text-3xl font-black text-rose-500 uppercase">פחות</span>
                                </motion.div>
                            </div>

                            {/* Info Area */}
                            <div className="p-6 text-right relative z-30" dir="rtl">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-2xl font-black text-white">{activeItem.name}</h3>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-purple-400">
                                            {formatAmount(activeItem.price ?? 0, isStealthMode, CURRENCY_SYMBOL, '***')}
                                        </span>
                                        {activeItem.saved_amount > 0 && (
                                            <span className="text-[10px] text-emerald-400 font-bold">
                                                נחסכו {formatAmount(activeItem.saved_amount, isStealthMode, CURRENCY_SYMBOL, '***')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                                    האם זה הזמן הנכון להשקיע בחלום הזה? החליקו ימינה כדי לאשר רכישה עתידית או שמאלה כדי להמתין.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
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
