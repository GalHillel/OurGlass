"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Gift, AlertTriangle, Calendar as CalendarIcon, User, Users } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";
import { Transaction } from "@/types";

interface AddTransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    initialData?: Transaction | null;
    onSuccess?: (amount: number) => void;
}

export const AddTransactionDrawer = ({ isOpen, onClose, category, initialData, onSuccess }: AddTransactionDrawerProps) => {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [payer, setPayer] = useState<'him' | 'her' | 'joint'>('him');
    const [location, setLocation] = useState("מאתר מיקום...");
    const [isSurprise, setIsSurprise] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [loading, setLoading] = useState(false);

    const { user, profile } = useAuth();
    const supabase = createClientComponentClient();

    const hourlyWage = profile?.hourly_wage || 60;

    useEffect(() => {
        if (isOpen) {
            triggerHaptic();
            if (initialData) {
                setAmount(initialData.amount.toString());
                setDescription(initialData.description || "");
                setIsSurprise(initialData.is_surprise || false);
                setDate(new Date(initialData.date));
                setPayer(initialData.payer || 'him');
                setLocation("תל אביב");
            } else {
                setLocation("מאתר מיקום...");
                setAmount("");
                setDescription(category || "");
                setIsSurprise(false);
                setDate(new Date());
                setPayer('him');
                setLocation("תל אביב");
            }
        }
    }, [isOpen, category, initialData]);

    const numericAmount = parseFloat(amount) || 0;
    const workHours = numericAmount / hourlyWage;
    const showWorkHours = numericAmount > 200;

    const handleSave = async () => {
        triggerHaptic();
        if (!amount || !user) {
            toast.error("יש להזין סכום");
            return;
        }
        setLoading(true);

        try {
            const txData = {
                amount: numericAmount,
                user_id: user.id,
                description: isSurprise ? "הוצאה סודית" : (description ? (initialData ? description : `${category}\n${description}`) : category),
                is_surprise: isSurprise,
                date: date ? date.toISOString() : new Date().toISOString(),
                payer: payer,
            };

            if (initialData) {
                const { error } = await supabase
                    .from('transactions')
                    .update(txData)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success("העסקה עודכנה בהצלחה");
            } else {
                const { error } = await supabase.from('transactions').insert(txData);
                if (error) throw error;

                // Round-up logic
                const roundedAmount = Math.ceil(numericAmount);
                const diff = roundedAmount - numericAmount;

                if (diff > 0) {
                    const { data: goals } = await supabase.from('goals').select('id, current_amount').limit(1).single();
                    if (goals) {
                        await supabase.from('goals').update({
                            current_amount: goals.current_amount + diff
                        }).eq('id', goals.id);
                        toast.success(`חסכת ₪${diff.toFixed(2)} בעיגול אגורות!`);
                    }
                }
                toast.success("ההוצאה נשמרה בהצלחה");
            }

            if (onSuccess) onSuccess(numericAmount);
            onClose();

        } catch (error: any) {
            toast.error("שגיאה בשמירה", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white w-full max-w-lg h-[90vh] md:h-auto overflow-y-auto rounded-3xl p-0 flex flex-col gap-0 shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/10 shrink-0">
                    <DialogTitle className="text-center text-xl font-bold neon-text">
                        {initialData ? "עריכת הוצאה" : `הוספת הוצאה ${category ? `- ${category}` : ""}`}
                    </DialogTitle>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* Amount */}
                    <div className="space-y-4 text-center">
                        <Label htmlFor="amount" className="text-white/60 uppercase tracking-widest text-xs">סכום ההוצאה</Label>
                        <div className="relative inline-block w-full">
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="text-5xl h-24 text-center bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-white/10 font-black p-0"
                                placeholder="0"
                                autoFocus
                            />
                            <span className="text-2xl text-blue-400 absolute top-1/2 -translate-y-1/2 -ml-8 font-bold">₪</span>
                        </div>
                    </div>

                    {/* Payer Selector (3-Way) */}
                    <div className="space-y-3">
                        <Label className="text-white/60 uppercase tracking-widest text-xs block text-center">מי שילם?</Label>
                        <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-white/10 relative overflow-hidden">
                            {/* Animated Background could go here but kept simple for stability */}

                            <button
                                onClick={() => setPayer('him')}
                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 gap-1 ${payer === 'him'
                                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        : 'text-white/40 hover:bg-white/5'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span className="text-xs font-bold">הוא</span>
                            </button>

                            <button
                                onClick={() => setPayer('joint')}
                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 gap-1 ${payer === 'joint'
                                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                                        : 'text-white/40 hover:bg-white/5'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span className="text-xs font-bold">משותף</span>
                            </button>

                            <button
                                onClick={() => setPayer('her')}
                                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 gap-1 ${payer === 'her'
                                        ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]'
                                        : 'text-white/40 hover:bg-white/5'
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span className="text-xs font-bold">היא</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-white/60 uppercase tracking-widest text-xs">תאריך</Label>
                        <div className="relative">
                            <input
                                type="date"
                                id="date"
                                value={date ? format(date, 'yyyy-MM-dd') : ''}
                                onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                                className="w-full bg-slate-950/50 border border-white/10 text-white p-4 rounded-xl scheme-dark focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-white/60 uppercase tracking-widest text-xs">הערות</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-950/50 border-white/10 text-white resize-none h-24 rounded-xl focus:border-blue-500/50"
                            placeholder="על מה יצא הכסף?"
                        />
                    </div>

                    {/* Cost in Hours */}
                    {showWorkHours && (
                        <div className="flex justify-center pt-2">
                            {hourlyWage > 0 ? (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-200 border-red-500/20 py-2 px-4 gap-2 h-auto text-sm animate-pulse">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    זה שווה ל-{workHours.toFixed(1)} שעות עבודה!
                                </Badge>
                            ) : null}
                        </div>
                    )}

                    {/* Surprise Toggle */}
                    <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-purple-400" />
                            <Label className="text-white font-medium">הוצאה סודית?</Label>
                        </div>
                        <Switch
                            checked={isSurprise}
                            onCheckedChange={setIsSurprise}
                            className="data-[state=checked]:bg-purple-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 shrink-0 bg-slate-900/50 backdrop-blur-md">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-14 text-lg bg-white text-black hover:bg-slate-200 rounded-2xl font-black tracking-wide shadow-lg shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? "שומר..." : (initialData ? "עדכן הוצאה" : "שמור הוצאה")}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};

