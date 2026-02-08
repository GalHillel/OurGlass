"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, AlertTriangle, Shield, Check, Star, ShoppingBag, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Transaction } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface MonthlySummaryProps {
    currentBalance: number;
    transactions: Transaction[];
    onRefresh: () => void;
}

export const MonthlySummary = ({ currentBalance, transactions = [], onRefresh }: MonthlySummaryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [slideIndex, setSlideIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const supabase = createClientComponentClient();
    const isSurplus = currentBalance > 0;
    const absAmount = Math.abs(currentBalance);

    // Calc Stats
    const stats = useMemo(() => {
        if (!isOpen) return null;

        const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

        // Mock Categories until we have real ones populated or joined
        // Group by description keywords for now or category_id if available
        const categoryMap: Record<string, number> = {};
        let biggestPurchase = { amount: 0, name: '' };

        transactions.forEach(t => {
            const amount = Number(t.amount);
            if (amount > biggestPurchase.amount) biggestPurchase = { amount, name: t.description || 'לא ידוע' };

            // Simple keyword categorization
            let cat = 'אחר';
            const desc = (t.description || '').toLowerCase();
            if (desc.includes('food') || desc.includes('אוכל') || desc.includes('סופר')) cat = 'מזון';
            else if (desc.includes('car') || desc.includes('דלק') || desc.includes('רכב')) cat = 'רכב';
            else if (desc.includes('house') || desc.includes('בית')) cat = 'בית';

            categoryMap[cat] = (categoryMap[cat] || 0) + amount;
        });

        const sortedCats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCats[0] || ['כללי', 0];

        return { totalSpent, topCategory, biggestPurchase };
    }, [transactions, isOpen]);

    const slides = [
        // Slide 0: Intro
        {
            bg: "bg-slate-900",
            content: (
                <div className="text-center space-y-6">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isSurplus ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        {isSurplus ? <Trophy className="w-12 h-12 text-emerald-400" /> : <AlertTriangle className="w-12 h-12 text-red-400" />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-2">החודש שלכם</h3>
                        <div className={`text-5xl font-black ${isSurplus ? 'text-emerald-400 neon-text' : 'text-red-400'}`}>
                            ₪{currentBalance.toLocaleString()}
                        </div>
                        <p className="text-white/60 mt-2">{isSurplus ? "נשארתם בפלוס! איזה כיף 🤩" : "חרגתם מהתקציב... לא נורא 😬"}</p>
                    </div>
                </div>
            )
        },
        // Slide 1: Spending
        {
            bg: "bg-blue-900",
            content: (
                <div className="text-center space-y-8">
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto animate-pulse">
                        <ShoppingBag className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold opacity-80">סך כל ההוצאות</h3>
                        <div className="text-4xl font-black text-white mt-2">
                            ₪{stats?.totalSpent.toLocaleString()}
                        </div>
                    </div>
                    {stats?.biggestPurchase.name && (
                        <div className="bg-white/10 rounded-xl p-4 mx-4">
                            <p className="text-xs text-white/60 mb-1">הקנייה הכי גדולה</p>
                            <p className="font-bold text-lg">{stats.biggestPurchase.name}</p>
                            <p className="font-mono text-blue-300">₪{stats.biggestPurchase.amount.toLocaleString()}</p>
                        </div>
                    )}
                </div>
            )
        },
        // Slide 2: Categories (Mock)
        {
            bg: "bg-purple-900",
            content: (
                <div className="text-center space-y-8">
                    <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                        <Star className="w-10 h-10 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold opacity-80">הקטגוריה המובילה</h3>
                        <div className="text-4xl font-black text-white mt-2">
                            {stats?.topCategory[0]}
                        </div>
                        <p className="text-purple-300 font-mono mt-1">₪{stats?.topCategory[1].toLocaleString()}</p>
                    </div>
                    <div className="px-8 text-sm opacity-60">
                        "זה לא בזבוז אם זה עושה אתכם שמחים... או שבעים."
                    </div>
                </div>
            )
        },
        // Slide 3: Action
        {
            bg: "bg-slate-900",
            isAction: true,
            content: (
                <div className="text-center space-y-6">
                    <Shield className="w-16 h-16 text-blue-400 mx-auto" />
                    <h3 className="text-2xl font-bold">סגירת חודש</h3>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-right">
                        <p className="text-white/80 text-sm leading-relaxed">
                            {isSurplus
                                ? `יש לכם עודף של ₪${absAmount.toLocaleString()}. האם להעביר אותו למבצר (חיסכון)?`
                                : `יש גירעון של ₪${absAmount.toLocaleString()}. האם למשוך מהמבצר כדי לאזן?`
                            }
                        </p>
                    </div>
                    <Button
                        onClick={() => handleAction()}
                        disabled={loading}
                        className={`w-full h-12 font-bold text-lg ${isSurplus ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {loading ? "מבצע..." : isSurplus ? "כן, לחיסכון! 💰" : "איזון תקציב 🛡️"}
                    </Button>
                </div>
            )
        }
    ];

    const currentSlide = slides[slideIndex];

    const handleAction = async () => {
        setLoading(true);
        try {
            // Find "Fortress" (Savings) goal
            const { data: fortress } = await supabase
                .from('goals')
                .select('*')
                .eq('type', 'cash')
                .single();

            if (!fortress) throw new Error("לא נמצא מחסנית 'מבצר' (cash)");

            let newAmount = fortress.current_amount;
            let description = "";

            if (isSurplus) {
                newAmount += absAmount;
                description = `סגירת חודש: הפקדת עודף (${absAmount})`;
            } else {
                newAmount -= absAmount;
                if (newAmount < 0) throw new Error("אין מספיק כסף במבצר לכיסוי הגירעון");
                description = `סגירת חודש: כיסוי גירעון (${absAmount})`;
            }

            // Update Goal
            const { error: goalError } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', fortress.id);
            if (goalError) throw goalError;

            // Create Transaction
            const { error: txError } = await supabase.from('transactions').insert({
                amount: isSurplus ? absAmount : -absAmount,
                description: description,
                date: new Date().toISOString(),
                category_id: null,
                is_surprise: false
            });
            if (txError) throw txError;

            if (isSurplus) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }

            toast.success("החודש נסגר בהצלחה!");
            setIsOpen(false);
            onRefresh();
        } catch (error: any) {
            toast.error("שגיאה בסגירת חודש", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const nextSlide = () => {
        if (slideIndex < slides.length - 1) setSlideIndex(prev => prev + 1);
    };

    const prevSlide = () => {
        if (slideIndex > 0) setSlideIndex(prev => prev - 1);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setSlideIndex(0);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 text-white/60 hover:text-white hover:bg-white/5">
                    סיכום חודש
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 border-none bg-transparent max-w-sm overflow-hidden rounded-[2rem] aspect-[9/16] max-h-[85vh]">
                {/* Story Container */}
                <div className={`relative w-full h-full ${currentSlide.bg} flex flex-col transition-colors duration-500`}>

                    {/* Progress Bar */}
                    <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                        {slides.map((_, idx) => (
                            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-white transition-all duration-300 ${idx <= slideIndex ? 'w-full' : 'w-0'}`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={slideIndex}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                {currentSlide.content}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    {!currentSlide.isAction && (
                        <div className="absolute inset-0 z-0 flex">
                            <div className="w-1/3 h-full" onClick={prevSlide} />
                            <div className="w-2/3 h-full" onClick={nextSlide} />
                        </div>
                    )}

                    {/* Hint */}
                    <div className="absolute bottom-6 w-full text-center text-xs text-white/30 z-20">
                        {slideIndex < slides.length - 1 ? "הקש כדי להמשיך" : ""}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
