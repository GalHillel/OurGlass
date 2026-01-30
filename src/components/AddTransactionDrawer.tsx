"use client";

import { useState, useEffect } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Gift,
    Coffee,
    Bus,
    ShoppingBag,
    Utensils,
    Beer,
    Moon,
    User,
    Users,
    X,
    Briefcase,
    Zap,
    Heart,
    Home,
    Smartphone
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { getHebrewError } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "./NumericKeypad";

interface AddTransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    initialData?: Transaction | null;
    onSuccess?: (amount: number) => void;
}

const CATEGORIES = [
    { id: 'food', label: 'אוכל', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    { id: 'transport', label: 'תחבורה', icon: Bus, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    { id: 'shopping', label: 'קניות', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
    { id: 'entertainment', label: 'בילוי', icon: Beer, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
    { id: 'bills', label: 'חשבונות', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    { id: 'health', label: 'בריאות', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    { id: 'work', label: 'עבודה', icon: Briefcase, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    { id: 'other', label: 'אחר', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
];

export const AddTransactionDrawer = ({ isOpen, onClose, category, initialData, onSuccess }: AddTransactionDrawerProps) => {
    const [amountStr, setAmountStr] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [payer, setPayer] = useState<'him' | 'her' | 'joint'>('him');
    const [loading, setLoading] = useState(false);

    // Auth & Supabase
    const { user } = useAuth();
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (isOpen) {
            triggerHaptic(); // Open feedback
            if (initialData) {
                setAmountStr(initialData.amount.toString());
                setDescription(initialData.description || "");
                setSelectedCategory(null); // Or map from description/metadata if we had it
                setPayer(initialData.payer || 'him');
            } else {
                setAmountStr("");
                setDescription(category || "");
                setSelectedCategory(null);
                setPayer('him');
            }
        }
    }, [isOpen, category, initialData]);

    const handleKeyPress = (key: string) => {
        if (key === '.' && amountStr.includes('.')) return;
        if (amountStr.length >= 8) return; // Max length safety
        setAmountStr(prev => prev + key);
    };

    const handleDelete = () => {
        setAmountStr(prev => prev.slice(0, -1));
    };

    const handleCategorySelect = (id: string) => {
        triggerHaptic();
        setSelectedCategory(prev => prev === id ? null : id);
    };

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amountStr);
        if (!numericAmount || numericAmount <= 0) return;

        triggerHaptic();
        setLoading(true);

        try {
            const finalCategory = selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.label : null;
            const finalDescription = description.trim() || finalCategory || "הוצאה כללית";

            const txData = {
                amount: numericAmount,
                user_id: user?.id,
                description: finalDescription,
                is_surprise: false,
                date: initialData?.date || new Date().toISOString(),
                payer: payer,
            };

            if (initialData) {
                const { error } = await supabase.from('transactions').update(txData).eq('id', initialData.id);
                if (error) throw error;
                toast.success("עודכן בהצלחה");
            } else {
                const { error } = await supabase.from('transactions').insert(txData);
                if (error) throw error;

                // Round Up Logic Check (Optional, keeping consistent with previous logic)
                // Leaving out complex round-up for now to focus on native feel, can re-enable if critical.
                toast.success("הוסף בהצלחה!");
            }

            if (onSuccess) onSuccess(numericAmount);
            onClose();

        } catch (error: any) {
            toast.error("שגיאה בשמירה");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const numericAmount = parseFloat(amountStr) || 0;

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} dismissible={false}>
            <DrawerContent
                className="bg-slate-950/95 backdrop-blur-3xl border-t border-white/5 h-[92dvh] outline-none flex flex-col"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                {/* 1. Fixed Header */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0 bg-transparent z-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <DrawerTitle className="text-lg font-bold text-white tracking-widest uppercase">
                        {initialData ? "עריכה" : "הוצאה חדשה"}
                    </DrawerTitle>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Main Flex Wrapper - The Key to Stability */}
                <div className="flex-1 flex flex-col min-h-0">

                    {/* 2. Amount Display (Fixed or shrinking slightly) */}
                    <div className="shrink-0 flex flex-col items-center justify-center py-2 relative">
                        <div className="flex items-baseline justify-center gap-1 rtl:flex-row-reverse">
                            {/* Symbol */}
                            <span className="text-3xl font-medium text-slate-500 translate-y-[-4px]">
                                ₪
                            </span>
                            {/* Number */}
                            <span className={cn(
                                "font-black text-white tracking-tighter transition-all",
                                amountStr.length > 5 ? "text-5xl" : "text-6xl",
                                !amountStr && "text-white/10"
                            )}>
                                {amountStr || "0"}
                            </span>
                            {/* Cursor */}
                            <span className="w-1 h-12 bg-blue-500 ml-1 animate-pulse rounded-full opacity-80" />
                        </div>
                    </div>

                    {/* 3. SCROLLABLE MIDDLE SECTION (Categories + Meta) */}
                    {/* This is the ONLY part that scrolls if space is tight */}
                    <div className="flex-1 overflow-y-auto min-h-0 px-4 space-y-4 py-2">

                        {/* Payer Toggle */}
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mx-auto max-w-xs w-full shrink-0">
                            <button onClick={() => setPayer('him')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", payer === 'him' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/30")}>הוא</button>
                            <button onClick={() => setPayer('joint')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", payer === 'joint' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-white/30")}>משותף</button>
                            <button onClick={() => setPayer('her')} className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", payer === 'her' ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20" : "text-white/30")}>היא</button>
                        </div>

                        {/* Description Input */}
                        <div className="shrink-0">
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="על מה הוצאת?"
                                className="bg-transparent border-b border-white/10 rounded-none text-center text-base text-white placeholder:text-white/20 focus:border-blue-500 transition-all h-12 w-full"
                            />
                        </div>

                        {/* Category Grid */}
                        <div className="grid grid-cols-4 gap-2 pb-4">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all duration-200",
                                            isSelected
                                                ? cn(cat.bg, cat.border, "scale-105 shadow-[0_0_15px_rgba(0,0,0,0.3)]")
                                                : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <cat.icon className={cn("w-5 h-5 mb-1", cat.color, isSelected && "neon-text")} />
                                        <span className={cn("text-[9px] font-bold", isSelected ? "text-white" : "text-white/50")}>
                                            {cat.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. Fixed Footer & Keypad */}
                    <div className="mt-auto bg-slate-900 border-t border-white/5 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 shrink-0">
                        <NumericKeypad
                            onKeyPress={handleKeyPress}
                            onDelete={handleDelete}
                            className="mb-2 px-4 gap-2"
                        />

                        <div className="px-6">
                            <Button
                                onClick={handleSubmit}
                                disabled={!numericAmount || loading}
                                className={cn(
                                    "w-full h-14 text-xl font-black italic tracking-wide rounded-2xl transition-all active:scale-[0.98]",
                                    !numericAmount
                                        ? "bg-white/5 text-white/20 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]"
                                )}
                            >
                                {loading ? "שומר..." : `הוסף ₪${numericAmount || 0}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
