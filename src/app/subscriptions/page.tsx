"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Subscription } from "@/types";
import { Plus, Calendar, CreditCard } from "lucide-react"; // Removed Trash2, Edit2 as they are in SwipeableRow
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
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [day, setDay] = useState("");
    const [owner, setOwner] = useState<'him' | 'her' | 'joint'>('joint');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const { profile } = useAuth();
    const supabase = createClientComponentClient();

    const fetchSubscriptions = async () => {
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
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const openAddDialog = () => {
        setEditingSub(null);
        setName("");
        setAmount("");
        setDay("");
        setOwner('joint');
        setIsDialogOpen(true);
    };

    const openEditDialog = (sub: Subscription) => {
        setEditingSub(sub);
        setName(sub.name);
        setAmount(sub.amount.toString());
        setDay(sub.billing_day?.toString() || "1");
        setOwner(sub.owner || 'joint');
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
        } catch (error: any) {
            console.error("Save error:", error);
            if (error.message?.includes("subscriptions_owner_check") || error.details?.includes("subscriptions_owner_check")) {
                toast.error("שגיאה: אי תאימות בבסיס הנתונים", { description: "נא לעדכן את אילוצי הטבלה (CHECK constraint)" });
            } else {
                toast.error("שגיאה בשמירה", { description: error.message });
            }
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('subscriptions').delete().eq('id', id);
            if (error) throw error;
            toast.success("מנוי הוסר");
            fetchSubscriptions();
        } catch (error: any) {
            toast.error("שגיאה במחיקה", { description: error.message });
        }
    };

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pt-8 pb-24 px-4">
            <AppHeader
                title="הוצאות"
                subtitle="קבועות"
                icon={CreditCard}
                iconColor="text-purple-400"
                titleColor="text-purple-500"
            />
            {/* Spacing for fixed header */}
            <div className="h-4" />

            {/* Vampire Index Analysis */}
            {profile?.budget && (
                (() => {
                    const ratio = (totalMonthly / (profile.budget || 20000)) * 100;
                    const isVampire = ratio > 50;

                    return (
                        <div className={`p-4 rounded-3xl border mb-2 relative overflow-hidden transition-all ${isVampire ? 'bg-red-950/40 border-red-500/30' : 'bg-emerald-950/40 border-emerald-500/30'}`}>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isVampire ? 'text-red-300' : 'text-emerald-300'}`}>
                                        מדד הערפד 🧛
                                    </h3>
                                    <p className="text-xs text-white/60 mt-1 max-w-[200px]">
                                        {isVampire
                                            ? "ההוצאות הקבועות מדממות את ההכנסה שלך. בטל מנוי אחד כדי לנשום."
                                            : "מצב מעולה! ההוצאות הקבועות בשליטה."}
                                    </p>
                                </div>
                                <div className={`text-3xl font-black ${isVampire ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {ratio.toFixed(0)}%
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-3 h-2 w-full bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${isVampire ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(ratio, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })()
            )}

            {/* Total Card */}
            <div className="grid grid-cols-2 gap-4">
                <div className="neon-card p-6 rounded-3xl text-center relative overflow-hidden flex flex-col justify-center group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs uppercase tracking-widest text-white/60 mb-1 block">
                        חודשי
                    </span>
                    <span className="text-3xl font-black text-white drop-shadow-lg neon-text">
                        ₪{totalMonthly.toLocaleString()}
                    </span>
                </div>
                <div className="neon-card p-6 rounded-3xl text-center relative overflow-hidden flex flex-col justify-center border-red-500/20 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                    <span className="text-xs uppercase tracking-widest text-red-200/60 mb-1 block">
                        שנתי
                    </span>
                    <span className="text-3xl font-black text-red-200 drop-shadow-lg">
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
                        {subscriptions.map((sub) => (
                            <SwipeableRow
                                key={sub.id}
                                onEdit={() => openEditDialog(sub)}
                                onDelete={() => handleDelete(sub.id)}
                                deleteMessage="האם להסיר את המנוי הזה מהחישוב החודשי?"
                                className="mb-3 rounded-2xl overflow-hidden"
                            >
                                <div className="neon-card p-4 flex items-center justify-between group relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-lg shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                                            {sub.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{sub.name}</h3>
                                            <div className="flex items-center text-xs text-slate-400 gap-1 font-mono">
                                                <Calendar className="w-3 h-3" />
                                                חיוב ב-{sub.billing_day || 1} לחודש
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <span className="font-black text-white text-xl tracking-tight">₪{sub.amount}</span>
                                    </div>
                                </div>
                            </SwipeableRow>
                        ))}
                        {subscriptions.length === 0 && (
                            <div className="text-center py-10 text-slate-500 text-sm bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                אין מנויים עדיין. הכל נקי!
                            </div>
                        )}
                    </div>
                )}
            </div>

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
