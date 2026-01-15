"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Subscription } from "@/types";
import { Plus, Trash2, Calendar, Edit2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [day, setDay] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);

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
        setIsDialogOpen(true);
    };

    const openEditDialog = (sub: Subscription) => {
        setEditingSub(sub);
        setName(sub.name);
        setAmount(sub.amount.toString());
        setDay(sub.billing_day?.toString() || "1");
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
            toast.error("שגיאה בשמירה", { description: error.message });
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
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto pt-8 pb-24 px-4">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-white neon-text flex items-center justify-center gap-2">
                    <CreditCard className="w-6 h-6 text-purple-400" />
                    הוצאות <span className="text-purple-500">קבועות</span>
                </h1>
            </div>

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
                        שנתי (וואו!)
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
                            <div key={sub.id} className="neon-card p-4 rounded-2xl flex items-center justify-between group relative overflow-hidden">
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

                                    {/* Actions */}
                                    <div className="flex gap-1 ml-2 opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditDialog(sub)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>למחוק מנוי זה?</AlertDialogTitle>
                                                    <AlertDialogDescription>פעולה זו תסיר את המנוי מהחישוב החודשי.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white">ביטול</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(sub.id)} className="bg-red-600">מחק</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
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
                                placeholder="1"
                                value={day}
                                onChange={(e) => setDay(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 text-lg">
                            {editingSub ? "עדכן מנוי" : "שמור מנוי"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
