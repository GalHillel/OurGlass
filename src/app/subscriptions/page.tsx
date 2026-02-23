"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Subscription } from "@/types";
import { Plus, Calendar, Utensils, Bus, ShoppingBag, Beer, Home, Heart, Briefcase, Zap, Coffee, Fuel, Car, GraduationCap, Sparkles, Shield } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableRow } from "@/components/SwipeableRow";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/AuthProvider";
import { SubscriptionKiller } from "@/components/SubscriptionKiller";

// Use the SAME categories as transactions - unified category system
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

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [day, setDay] = useState("");
    const [owner, setOwner] = useState<'him' | 'her' | 'joint'>('joint');
    const [category, setCategory] = useState<string>('חשבונות');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const { profile } = useAuth();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const fetchSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .order('amount', { ascending: false });

            if (error) throw error;
            setSubscriptions(data || []);
        } catch (error) {
            console.error("Error fetching subscriptions:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const openAddDialog = () => {
        setEditingSub(null);
        setName("");
        setAmount("");
        setDay("");
        setOwner('joint');
        setCategory('חשבונות');
        setIsDialogOpen(true);
    };

    const openEditDialog = (sub: Subscription) => {
        setEditingSub(sub);
        setName(sub.name);
        setAmount(sub.amount.toString());
        setDay(sub.billing_day?.toString() || "1");
        setOwner(sub.owner || 'joint');
        setCategory(sub.category || 'חשבונות');
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!name || !amount) {
            toast.error("נא למלא שם וסכום");
            return;
        }

        try {
            const payload = {
                name: name,
                amount: parseFloat(amount),
                billing_day: parseInt(day) || 1,
                owner: owner,
                category: category,
                couple_id: profile?.couple_id,
            };

            if (editingSub) {
                const { error } = await supabase
                    .from('subscriptions')
                    .update(payload)
                    .eq('id', editingSub.id);
                if (error) throw error;
                toast.success("המנוי עודכן בהצלחה");
            } else {
                const { error } = await supabase.from('subscriptions').insert(payload);
                if (error) throw error;
                toast.success("מנוי חדש נוסף");
            }

            setIsDialogOpen(false);
            fetchSubscriptions();
        } catch (error: unknown) {
            const err = error as { message?: string; details?: string };
            console.error("Save error:", err);
            if (err.message?.includes("subscriptions_owner_check") || err.details?.includes("subscriptions_owner_check")) {
                toast.error("שגיאה: אי תאימות בבסיס הנתונים", { description: "נא לעדכן את אילוצי הטבלה (CHECK constraint)" });
            } else {
                toast.error("שגיאה בשמירה", { description: err.message });
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('subscriptions').delete().eq('id', id);
            if (error) throw error;
            toast.success("מנוי הוסר");
            fetchSubscriptions();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה במחיקה", { description: err.message });
        }
    };

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pt-8 pb-24 px-4">


            {/* Fixed Overhead Indicator */}
            {profile?.budget && (
                (() => {
                    const ratio = (totalMonthly / (profile.budget || 20000)) * 100;
                    const isHigh = ratio > 50;

                    return (
                        <div className="neon-card p-4 rounded-3xl border border-white/5 flex items-center justify-between group overflow-hidden relative mb-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">עומס הוצאות קבועות</h3>
                                <p className="text-[10px] text-white/50 mt-0.5">
                                    {isHigh ? "אחוז גבוה מהתקציב. כדאי לצמצם מעט." : "ההוצאות הקבועות ביחס מעולה לתקציב."}
                                </p>
                            </div>
                            <div className={`text-2xl font-black font-mono tracking-tighter ${isHigh ? 'text-orange-400' : 'text-emerald-400'}`}>
                                {ratio.toFixed(0)}%
                            </div>
                        </div>
                    );
                })()
            )}

            {/* Total Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className="neon-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs uppercase tracking-widest text-white/60 mb-1 block text-center">
                        חודשי
                    </span>
                    <span className="text-3xl font-black text-white drop-shadow-lg neon-text text-center">
                        ₪{totalMonthly.toLocaleString()}
                    </span>
                </div>
                <div className="neon-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border-red-500/20 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                    <span className="text-xs uppercase tracking-widest text-red-200/60 mb-1 block text-center">
                        שנתי
                    </span>
                    <span className="text-3xl font-black text-red-200 drop-shadow-lg text-center">
                        ₪{(totalMonthly * 12).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">רשימת מנויים</h2>
                    <Button onClick={openAddDialog} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                        <Plus className="w-4 h-4 ml-1" /> הוסף מנוי
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subscriptions.length === 0 ? (
                            <EmptyState
                                icon={Zap}
                                title="אין מנויים עדיין"
                                description="הוסף את המנויים הקבועים שלך למעקב חודשי"
                                actionLabel="הוסף מנוי ראשון"
                                onAction={openAddDialog}
                            />
                        ) : (
                            subscriptions.map((sub) => {
                                const cat = CATEGORIES.find(c => c.id === sub.category) || CATEGORIES.find(c => c.id === 'חשבונות')!;
                                const IconComponent = cat.icon;
                                return (
                                    <SwipeableRow
                                        key={sub.id}
                                        onEdit={() => openEditDialog(sub)}
                                        onDelete={() => handleDelete(sub.id)}
                                        deleteMessage="האם להסיר את המנוי הזה מהחישוב החודשי?"
                                        className="mb-3 rounded-2xl overflow-hidden"
                                    >
                                        <div className="neon-card p-4 flex items-center justify-between group relative overflow-hidden">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", cat.bg, "border", cat.border)}>
                                                    <IconComponent className={cn("w-6 h-6", cat.color)} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{sub.name}</h3>
                                                    <div className="flex items-center text-xs text-slate-400 gap-2">
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <Calendar className="w-3 h-3" />
                                                            חיוב ב-{sub.billing_day || 1} לחודש
                                                        </span>
                                                        {sub.category && (
                                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", cat.bg, cat.color)}>
                                                                {cat.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <span className="font-black text-white text-xl tracking-tight">₪{sub.amount}</span>
                                            </div>
                                        </div>
                                    </SwipeableRow>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Subscription Killer Analysis */}
            {!loading && subscriptions.length > 0 && (
                <SubscriptionKiller
                    subscriptions={subscriptions}
                    onDelete={handleDelete}
                />
            )}

            {/* Edit/Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center neon-text text-xl">
                            {editingSub ? "עריכת מנוי" : "הוספת מנוי חדש"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>שם המנוי</Label>
                            <Input
                                placeholder="למשל: נטפליקס"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>סכום חודשי (₪)</Label>
                            <Input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>יום חיוב בחודש (1-31)</Label>
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="1"
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>קטגוריה</Label>
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                                {CATEGORIES.map((cat) => {
                                    const isSelected = category === cat.id;
                                    const IconComponent = cat.icon;
                                    return (
                                        <button
                                            type="button"
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200",
                                                isSelected
                                                    ? cn(cat.bg, cat.border, "scale-105 shadow-lg")
                                                    : "bg-slate-950 border-white/10 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <IconComponent className={cn("w-5 h-5 mb-1", cat.color)} />
                                            <span className={cn("text-[10px] whitespace-nowrap", isSelected ? "text-white font-bold" : "text-white/50")}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>שיוך</Label>
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setOwner('joint')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${owner === 'joint' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    משותף
                                </button>
                                <button
                                    onClick={() => setOwner('her')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${owner === 'her' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    איריס
                                </button>
                                <button
                                    onClick={() => setOwner('him')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${owner === 'him' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    גל
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 text-lg">
                            {editingSub ? "עדכן מנוי" : "שמור מנוי"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
