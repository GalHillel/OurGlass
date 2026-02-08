"use client";

import { useState, useEffect } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Coffee,
    Bus,
    ShoppingBag,
    Utensils,
    Beer,
    User,
    Users,
    X,
    Briefcase,
    Zap,
    Heart,
    Home,
    Calendar as CalendarIcon,
    ChevronDown,
    Fuel,
    Film,
    Car,
    FileText
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "./NumericKeypad";

interface AddTransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    initialData?: Transaction | null;
    onSuccess?: (amount: number, newTx?: Transaction) => void;
}

const LAST_PAYER_KEY = "ourglass_last_payer";

// Hebrew categories that match the database category text field
const CATEGORIES = [
    { id: 'אוכל', label: 'אוכל', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    { id: 'קפה', label: 'קפה', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    { id: 'סופר', label: 'סופר', icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    { id: 'תחבורה', label: 'תחבורה', icon: Bus, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    { id: 'דלק', label: 'דלק', icon: Fuel, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
    { id: 'קניות', label: 'קניות', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
    { id: 'בילוי', label: 'בילוי', icon: Beer, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
    { id: 'מסעדה', label: 'מסעדה', icon: Utensils, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    { id: 'חשבונות', label: 'חשבונות', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    { id: 'בריאות', label: 'בריאות', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
    { id: 'עבודה', label: 'עבודה', icon: Briefcase, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    { id: 'אחר', label: 'אחר', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
];

export const AddTransactionDrawer = ({ isOpen, onClose, category, initialData, onSuccess }: AddTransactionDrawerProps) => {
    const [amountStr, setAmountStr] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("אחר");
    const [payer, setPayer] = useState<'him' | 'her' | 'joint'>('him');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (isOpen) {
            triggerHaptic();
            if (initialData) {
                setAmountStr(initialData.amount.toString());
                setDescription(initialData.description || "");
                setSelectedCategory(initialData.category || "אחר");
                setPayer(initialData.payer || 'him');
                setDate(new Date(initialData.date).toISOString().split('T')[0]);
            } else {
                setAmountStr("");
                setDescription("");
                // If category prop is provided (from QuickActions), use it
                if (category) {
                    // Map QuickActions labels to category IDs
                    const categoryMap: Record<string, string> = {
                        'קפה': 'קפה',
                        'סופר': 'סופר',
                        'מסעדה': 'מסעדה',
                        'דלק': 'דלק',
                        'קניות': 'קניות',
                        'בילוי': 'בילוי',
                        'תחבורה': 'תחבורה',
                        'חשבונות': 'חשבונות',
                    };
                    setSelectedCategory(categoryMap[category] || "אחר");
                    setDescription(category);
                } else {
                    setSelectedCategory("אחר");
                }
                const savedPayer = typeof window !== "undefined" ? localStorage.getItem(LAST_PAYER_KEY) : null;
                setPayer((savedPayer === "him" || savedPayer === "her" || savedPayer === "joint") ? savedPayer : "him");
                setDate(new Date().toISOString().split("T")[0]);
            }
        }
    }, [isOpen, category, initialData]);

    const handleKeyPress = (key: string) => {
        triggerHaptic();
        if (key === '.' && amountStr.includes('.')) return;
        if (amountStr.length >= 8) return;
        setAmountStr(prev => prev + key);
    };

    const handleDelete = () => {
        triggerHaptic();
        setAmountStr(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amountStr);
        if (!numericAmount || numericAmount <= 0) {
            toast.error("נא להזין סכום");
            return;
        }

        triggerHaptic();
        setLoading(true);

        try {
            const finalDescription = description.trim() || selectedCategory || "הוצאה כללית";
            const finalDate = new Date(date);

            const txData = {
                amount: numericAmount,
                user_id: user?.id,
                description: finalDescription,
                is_surprise: false,
                date: finalDate.toISOString(),
                payer: payer,
                category: selectedCategory, // Using text field directly
            };

            let resultTx;
            if (initialData) {
                const { data, error } = await supabase.from('transactions').update(txData).eq('id', initialData.id).select().single();
                if (error) throw error;
                resultTx = data;
                toast.success("עודכן בהצלחה");
            } else {
                const { data, error } = await supabase.from('transactions').insert(txData).select().single();
                if (error) throw error;
                resultTx = data;
                toast.success("הוסף בהצלחה!");
            }

            if (typeof window !== "undefined") localStorage.setItem(LAST_PAYER_KEY, payer);
            const mappedTx = resultTx as Transaction;
            if (onSuccess) onSuccess(numericAmount, mappedTx);
            onClose();

        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה בשמירה");
            console.error("Save error:", JSON.stringify({ message: err?.message }, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} dismissible={false}>
            <DrawerContent className="bg-slate-950/95 backdrop-blur-3xl border-t border-white/10 h-[95dvh] flex flex-col outline-none">

                {/* Header Actions */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/5 text-white/60">
                        <X className="w-5 h-5" />
                    </Button>
                    <DrawerTitle className="text-white font-medium">
                        {initialData ? "עריכת הוצאה" : "הוספת הוצאה"}
                    </DrawerTitle>
                    <Button variant="ghost" size="icon" className="opacity-0 pointer-events-none"><X /></Button>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">

                    {/* 1. AMOUNT SECTION - Big & Center */}
                    <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl" />
                        <span className="text-white/40 text-xs mb-1 relative z-10">סכום ההוצאה</span>
                        <div className="flex items-baseline relative z-10 rtl:flex-row-reverse gap-1">
                            <span className="text-3xl text-blue-400">₪</span>
                            <span className={cn("font-black text-white tracking-tighter transition-all", amountStr.length > 5 ? "text-5xl" : "text-6xl")}>
                                {amountStr || "0"}
                            </span>
                            {!amountStr && <span className="w-0.5 h-10 bg-blue-500 animate-pulse ml-1" />}
                        </div>
                    </div>

                    {/* 2. INLINE KEYPAD */}
                    <div className="bg-slate-900/50 rounded-2xl p-2 border border-white/5">
                        <NumericKeypad
                            onKeyPress={handleKeyPress}
                            onDelete={handleDelete}
                            className="grid-cols-4 gap-x-4 gap-y-2"
                        />
                    </div>

                    {/* 3. CATEGORY SELECTION - Required */}
                    <div>
                        <p className="text-white/60 text-sm font-medium mb-2 mr-1">קטגוריה</p>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => { triggerHaptic(); setSelectedCategory(cat.id); }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200",
                                            isSelected
                                                ? cn(cat.bg, cat.border, "scale-105 shadow-lg")
                                                : "bg-slate-900/50 border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <cat.icon className={cn("w-5 h-5 mb-1", cat.color)} />
                                        <span className={cn("text-[10px] whitespace-nowrap", isSelected ? "text-white font-bold" : "text-white/50")}>
                                            {cat.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. DETAILS FORM */}
                    <div className="space-y-3">

                        {/* Payer & Date Row */}
                        <div className="flex gap-3">
                            {/* Payer Toggle */}
                            <div className="flex bg-slate-900 rounded-xl p-1 border border-white/5 flex-1">
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("him"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "him" ? "bg-blue-600 shadow-md text-white" : "text-white/30")}>אני</button>
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("joint"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "joint" ? "bg-purple-600 shadow-md text-white" : "text-white/30")}>משותף</button>
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("her"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "her" ? "bg-pink-600 shadow-md text-white" : "text-white/30")}>בת זוג</button>
                            </div>

                            {/* Date Picker - NATIVE */}
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-white/40">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-full bg-slate-900 border border-white/5 rounded-xl px-3 text-white text-sm text-right font-medium appearance-none focus:border-blue-500 focus:outline-none"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-blue-400">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Description Input */}
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="תיאור (אופציונלי)"
                            className="bg-slate-900 border-white/5 h-12 text-right text-white placeholder:text-white/30 focus:border-blue-500 rounded-xl text-lg"
                        />

                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-950 border-t border-white/5 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button
                        onClick={handleSubmit}
                        disabled={!amountStr || loading}
                        className={cn(
                            "w-full h-14 text-xl font-bold rounded-2xl transition-all shadow-lg",
                            amountStr
                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                                : "bg-white/5 text-white/20"
                        )}
                    >
                        {loading ? "שומר..." : initialData ? "עדכן הוצאה" : "שמור הוצאה"}
                    </Button>
                </div>

            </DrawerContent>
        </Drawer>
    );
};
