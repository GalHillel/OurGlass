"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hapticForAmount, hapticError } from "@/utils/haptics";
import {
    Coffee,
    Bus,
    ShoppingBag,
    Utensils,
    Beer,
    X,
    Briefcase,
    Zap,
    Heart,
    Home,
    Calendar as CalendarIcon,
    Fuel,
    Car,
    GraduationCap,
    Sparkles,
    Shield,
    Brain,
    Repeat
} from "lucide-react";
import { addMonths } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDeepFreeze } from "@/hooks/useDeepFreeze";
import { DeepFreezeDialog } from "@/components/DeepFreezeDialog";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import { NumericKeypad } from "./NumericKeypad";
import { useAppStore } from "@/stores/appStore";
import { PAYERS, CURRENCY_SYMBOL } from "@/lib/constants";

interface AddTransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    initialData?: Transaction | null;
    onSuccess?: (amount: number, newTx?: Transaction) => void;
}

type SavePayload =
    | { txs: Array<Record<string, unknown>>; txData?: never }
    | { txs?: never; txData: Record<string, unknown> };

// Hebrew categories that match the database category text field
const CATEGORIES = [
    { id: 'אוכל', label: 'אוכל', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    { id: 'קפה', label: 'קפה', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    { id: 'סופר', label: 'סופר', icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    { id: 'תחבורה', label: 'תחבורה', icon: Bus, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    { id: 'דלק', label: 'דלק', icon: Fuel, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
    { id: 'רכב', label: 'רכב', icon: Car, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    { id: 'קניות', label: 'קניות', icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
    { id: 'בילוי', label: 'בילוי', icon: Beer, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
    { id: 'מסעדה', label: 'מסעדה', icon: Utensils, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    { id: 'חשבונות', label: 'חשבונות', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    { id: 'בריאות', label: 'בריאות', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
    { id: 'ביטוח', label: 'ביטוח', icon: Shield, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30' },
    { id: 'לימודים', label: 'לימודים', icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
    { id: 'קוסמטיקה', label: 'קוסמטיקה', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30' },
    { id: 'עבודה', label: 'עבודה', icon: Briefcase, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    { id: 'אחר', label: 'אחר', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
];

export const AddTransactionDrawer = ({ isOpen, onClose, category, initialData, onSuccess }: AddTransactionDrawerProps) => {
    const [amountStr, setAmountStr] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("אחר");
    const [moodRating, setMoodRating] = useState<number | null>(null);
    const [payer, setPayer] = useState<'him' | 'her' | 'joint'>('him');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const [installments, setInstallments] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    const [isImpulse, setIsImpulse] = useState(false);

    const { user, profile } = useAuth();
    const { appIdentity } = useAppStore();
    const queryClient = useQueryClient();
    const coupleId = profile?.couple_id ?? null;
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const saveMutation = useMutation({
        mutationFn: async (payload: SavePayload) => {
            if (payload.txs) {
                const { data, error } = await supabase
                    .from('transactions')
                    .upsert(payload.txs, { onConflict: 'couple_id,idempotency_key' })
                    .select();
                if (error) throw error;
                return data;
            } else if (payload.txData) {
                if (initialData) {
                    if (!coupleId) throw new Error("Missing couple_id");
                    const { data, error } = await supabase
                        .from('transactions')
                        .update(payload.txData)
                        .eq('id', initialData.id)
                        .eq('couple_id', coupleId)
                        .select()
                        .single();
                    if (error) throw error;
                    return data;
                } else {
                    const { data, error } = await supabase
                        .from('transactions')
                        .upsert(payload.txData, { onConflict: 'couple_id,idempotency_key' })
                        .select()
                        .single();
                    if (error) throw error;
                    return data;
                }
            }
            throw new Error("Invalid payload");
        },
        onMutate: async (payload) => {
            if (!coupleId) throw new Error("Missing couple_id");

            await queryClient.cancelQueries({ queryKey: ['transactions', coupleId] });
            await queryClient.cancelQueries({ queryKey: ['global-cashflow', coupleId] });
            await queryClient.cancelQueries({ queryKey: ['settle-up', coupleId] });
            await queryClient.cancelQueries({ queryKey: ['guilt-free', coupleId] });

            const previousTransactionsEntries = queryClient.getQueriesData({ queryKey: ['transactions', coupleId] });

            if (payload.txData && !initialData && !payload.txs) {
                queryClient.setQueriesData({ queryKey: ['transactions', coupleId] }, (old: Transaction[] | undefined) => {
                    const optimisticTx = {
                        ...payload.txData,
                        id: (payload.txData as { id?: string }).id ?? crypto.randomUUID(),
                        created_at: new Date().toISOString()
                    };
                    return Array.isArray(old) ? [optimisticTx, ...old] : [optimisticTx];
                });
            }

            return { previousTransactionsEntries };
        },
        onError: (err, newTx, context) => {
            if (context?.previousTransactionsEntries) {
                for (const [key, data] of context.previousTransactionsEntries) {
                    queryClient.setQueryData(key, data);
                }
            }
            const errorMsg = err instanceof Error ? err.message : "שגיאה בשמירה";
            toast.error("שגיאה בשמירה: " + errorMsg);
            console.error("Save error:", err);
            hapticError();
            setLoading(false);
        },
        onSuccess: (data, payload) => {
            const numericAmount = parseFloat(amountStr);
            hapticForAmount(numericAmount);
            if (payload.txs) {
                toast.success(`נוספו ${installments} תשלומים בהצלחה!`);
                if (onSuccess && Array.isArray(data) && data.length > 0) onSuccess(numericAmount, data[0] as Transaction);
            } else {
                toast.success(initialData ? "עודכן בהצלחה" : "הוסף בהצלחה!");
                if (onSuccess) onSuccess(numericAmount, data as Transaction);
            }

            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["global-cashflow"] });
            queryClient.invalidateQueries({ queryKey: ["settle-up"] });
            queryClient.invalidateQueries({ queryKey: ["guilt-free"] });

            setLoading(false);
            onClose();
        }
    });

    const performSave = async () => {
        const numericAmount = parseFloat(amountStr);
        if (!numericAmount || numericAmount <= 0) {
            toast.error("נא להזין סכום");
            return;
        }

        triggerHaptic();
        setLoading(true);

        if (!user?.id) {
            toast.error("יש להתחבר מחדש");
            setLoading(false);
            return;
        }
        if (!coupleId) {
            toast.error("לא נמצא מזהה זוג (couple_id)");
            setLoading(false);
            return;
        }

        let finalDescription = description.trim() || selectedCategory || "הוצאה כללית";
        if (isImpulse) {
            finalDescription += " #impulse";
        }

        // Combine date and time for absolute precision
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const finalDate = new Date(year, month - 1, day, hours, minutes);

        if (installments > 1) {
            const totalCents = Math.round(numericAmount * 100);
            const baseCents = Math.floor(totalCents / installments);
            const remainder = totalCents - baseCents * installments;

            const txs = [];
            for (let i = 0; i < installments; i++) {
                const installmentDate = addMonths(finalDate, i);
                const cents = baseCents + (i < remainder ? 1 : 0);
                const id = crypto.randomUUID();
                txs.push({
                    id,
                    idempotency_key: id,
                    type: 'expense',
                    amount: cents / 100,
                    user_id: user.id,
                    couple_id: coupleId,
                    description: `${finalDescription} (תשלום ${i + 1}/${installments})`,
                    is_surprise: false,
                    date: installmentDate.toISOString(),
                    payer: payer,
                    category: selectedCategory,
                    mood_rating: moodRating,
                });
            }
            saveMutation.mutate({ txs });
        } else {
            const id = initialData?.id ?? crypto.randomUUID();
            const txData = {
                id,
                idempotency_key: initialData?.idempotency_key ?? id,
                type: initialData?.type ?? 'expense',
                amount: numericAmount,
                user_id: user.id,
                couple_id: coupleId,
                description: finalDescription,
                is_surprise: false,
                date: finalDate.toISOString(),
                payer: payer,
                category: selectedCategory,
                mood_rating: moodRating,
            };
            saveMutation.mutate({ txData });
        }
    };

    const handleFreezeConfirmed = async () => {
        const numericAmount = parseFloat(amountStr);
        const itemName = description.trim() || selectedCategory || "הוצאה גדולה";

        try {
            setLoading(true);
            if (!user?.id) throw new Error("Missing user");
            if (!coupleId) throw new Error("Missing couple_id");
            const { error } = await supabase.from('wishlist').insert({
                name: `❄️ [מוקפא] ${itemName}`,
                price: numericAmount,
                status: 'pending',
                couple_id: coupleId,
                requested_by: user.id,
                approved_by: null,
                saved_amount: 0,
                priority: 0,
                link: null,
            });

            if (error) throw error;

            toast.success("הוקפא בהצלחה! 🧊", { description: "ההוצאה הועברה לרשימת המשאלות ל-24 שעות." });
            const confetti = (await import("canvas-confetti")).default;
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            onClose();
        } catch (e: unknown) {
            const err = e as { message?: string };
            toast.error("שגיאה בהקפאה");
            console.error("Freeze error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const {
        isFreezeDialogOpen,
        checkTransaction,
        handleFreeze,
        handleBuyAnyway,
        closeDialog
    } = useDeepFreeze({
        onFreezeConfirmed: handleFreezeConfirmed,
        onBuyAnywayConfirmed: performSave
    });

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amountStr);
        if (!numericAmount) return;

        // Check for Deep Freeze (only for new transactions)
        if (!initialData && checkTransaction(numericAmount, description || selectedCategory || "")) {
            return;
        }

        performSave();
    };

    useEffect(() => {
        if (isOpen) {
            triggerHaptic();
            if (initialData) {
                setAmountStr(initialData.amount.toString());
                setDescription(initialData.description || "");
                setSelectedCategory(initialData.category || "אחר");
                setPayer(initialData.payer || 'him');
                const dt = new Date(initialData.date);
                setDate(dt.toISOString().split('T')[0]);
                setTime(dt.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
                setMoodRating(initialData.mood_rating || null);
            } else {
                setAmountStr("");
                setDescription("");
                setMoodRating(null);
                if (category) {
                    setSelectedCategory(category);
                    setDescription('');
                } else {
                    setSelectedCategory("אחר");
                }

                // Set default payer to the active app identity, or fallback to 'him'
                setPayer(appIdentity || "him");

                const now = new Date();
                setDate(now.toISOString().split("T")[0]);
                setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
                setInstallments(1);
            }
        }
    }, [isOpen, category, initialData, appIdentity]);

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

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} dismissible={true}>
            <DrawerContent className="bg-slate-950/95 backdrop-blur-3xl border-t border-white/10 h-[95dvh] flex flex-col outline-none">

                {/* Header Actions */}
                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 rounded-full bg-white/5 text-white/60">
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
                            <span className="text-3xl text-blue-400">{CURRENCY_SYMBOL}</span>
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
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("him"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "him" ? "bg-blue-600 shadow-md text-white" : "text-white/30")}>{PAYERS.HIM}</button>
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("joint"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "joint" ? "bg-purple-600 shadow-md text-white" : "text-white/30")}>משותף</button>
                                <button type="button" onClick={() => { triggerHaptic(); setPayer("her"); }} className={cn("flex-1 py-2.5 rounded-lg text-xs font-bold transition-all", payer === "her" ? "bg-pink-600 shadow-md text-white" : "text-white/30")}>{PAYERS.HER}</button>
                            </div>

                            {/* Date & Time Pickers - NATIVE */}
                            <div className="flex flex-[2] gap-2">
                                <div className="relative flex-[1.5]">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full h-11 bg-slate-900 border border-white/5 rounded-xl px-2 text-white text-[13px] text-right font-medium appearance-none focus:border-blue-500 focus:outline-none"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-blue-400">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="relative flex-1">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full h-11 bg-slate-900 border border-white/5 rounded-xl px-2 text-white text-[13px] text-right font-medium appearance-none focus:border-blue-500 focus:outline-none"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-purple-400">
                                        <Repeat className="w-3.5 h-3.5 rotate-90" />
                                    </div>
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

                        {/* Installments Stepper */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <Repeat className="w-4 h-4 text-white/60" />
                                    </div>
                                    <span className="text-white/80 text-sm font-medium">תשלומים</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { triggerHaptic(); setInstallments(Math.max(1, installments - 1)); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 disabled:opacity-30 active:scale-90 transition-transform"
                                        disabled={installments <= 1}
                                    >
                                        <span className="text-xl pb-1">-</span>
                                    </button>
                                    <span className="text-white font-mono text-lg w-6 text-center">{installments}</span>
                                    <button
                                        onClick={() => { triggerHaptic(); setInstallments(Math.min(36, installments + 1)); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 active:scale-90 transition-transform"
                                    >
                                        <span className="text-xl pb-1">+</span>
                                    </button>
                                </div>
                            </div>
                            {installments > 1 && (
                                <div className="text-center text-xs text-blue-300/60 font-mono">
                                    {installments} תשלומים של {CURRENCY_SYMBOL}{(parseFloat(amountStr || "0") / installments).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                            )}
                        </div>

                        {/* Impulse vs Value Toggle */}
                        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={isImpulse}
                                    onCheckedChange={(checked) => { triggerHaptic(); setIsImpulse(checked); }}
                                    className="data-[state=checked]:bg-purple-600"
                                />
                                <Label className="text-white/80 text-xs cursor-pointer" onClick={() => setIsImpulse(!isImpulse)}>
                                    {isImpulse ? "קנייה אימפולסיבית" : "קנייה מחושבת"}
                                </Label>
                            </div>
                            {isImpulse ? (
                                <Brain className="w-5 h-5 text-purple-400" />
                            ) : (
                                <Shield className="w-5 h-5 text-emerald-400" />
                            )}
                        </div>

                        {/* Mood Selector (AI Tracking) */}
                        <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <span className="text-white/80 text-xs text-center font-medium">איך הרגשת בקנייה? (מעקב AI)</span>
                            <div className="flex justify-between items-center px-4">
                                {[
                                    { rating: 1, emoji: '😭' },
                                    { rating: 2, emoji: '😞' },
                                    { rating: 3, emoji: '😐' },
                                    { rating: 4, emoji: '🙂' },
                                    { rating: 5, emoji: '🤩' },
                                ].map((mood) => (
                                    <button
                                        type="button"
                                        key={mood.rating}
                                        onClick={() => { triggerHaptic(); setMoodRating(mood.rating); }}
                                        className={cn(
                                            "text-3xl transition-all duration-300",
                                            moodRating === mood.rating ? "scale-150 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10" : "opacity-30 hover:opacity-80 hover:scale-110 grayscale"
                                        )}
                                        style={moodRating === mood.rating ? { filter: 'grayscale(0%)' } : undefined}
                                    >
                                        {mood.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

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

                <DeepFreezeDialog
                    isOpen={isFreezeDialogOpen}
                    amount={parseFloat(amountStr) || 0}
                    itemName={description || selectedCategory || ""}
                    onFreeze={handleFreeze}
                    onBuyAnyway={handleBuyAnyway}
                    onCancel={closeDialog}
                />

            </DrawerContent>
        </Drawer>
    );
};
