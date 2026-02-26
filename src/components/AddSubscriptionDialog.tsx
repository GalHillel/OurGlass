"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Subscription } from "@/types";
import {
    Utensils,
    Bus,
    ShoppingBag,
    Beer,
    Home,
    Heart,
    Briefcase,
    Zap,
    Coffee,
    Fuel,
    Car,
    GraduationCap,
    Sparkles,
    Shield
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

export const CATEGORIES = [
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

interface AddSubscriptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: { name: string; amount: number } | null;
    editingSub?: Subscription | null;
    onSuccess?: () => void;
}

export function AddSubscriptionDialog({
    isOpen,
    onClose,
    initialData,
    editingSub,
    onSuccess
}: AddSubscriptionDialogProps) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [day, setDay] = useState("1");
    const [owner, setOwner] = useState<'him' | 'her' | 'joint'>('joint');
    const [category, setCategory] = useState<string>('חשבונות');
    const [loading, setLoading] = useState(false);

    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            if (editingSub) {
                setName(editingSub.name);
                setAmount(editingSub.amount.toString());
                setDay(editingSub.billing_day?.toString() || "1");
                setOwner(editingSub.owner || 'joint');
                setCategory(editingSub.category || 'חשבונות');
            } else if (initialData) {
                setName(initialData.name);
                setAmount(initialData.amount.toString());
                setDay("1");
                setOwner('joint');
                setCategory('חשבונות');
            } else {
                setName("");
                setAmount("");
                setDay("1");
                setOwner('joint');
                setCategory('חשבונות');
            }
        }
    }, [isOpen, editingSub, initialData]);

    const handleSave = async () => {
        if (!name || !amount) {
            toast.error("נא למלא שם וסכום");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name: name,
                amount: parseFloat(amount),
                billing_day: parseInt(day) || 1,
                owner: owner,
                category: category,
                couple_id: profile?.couple_id,
                active: true,
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

            // Invalidate queries to refresh global state
            queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });
            queryClient.invalidateQueries({ queryKey: ['wealthData'] });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: unknown) {
            const err = error as { message?: string; details?: string };
            console.error("Save error:", err);
            toast.error("שגיאה בשמירה", { description: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-center neon-text text-xl">
                        {editingSub ? "עריכת מנוי" : initialData ? "אישור מנוי מזהה AI" : "הוספת מנוי חדש"}
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
                        <Label>סכום חודשי ({CURRENCY_SYMBOL})</Label>
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
                                {PAYERS.HER}
                            </button>
                            <button
                                onClick={() => setOwner('him')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${owner === 'him' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                {PAYERS.HIM}
                            </button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 text-lg"
                    >
                        {loading ? "שומר..." : editingSub ? "עדכן מנוי" : "שמור מנוי"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
