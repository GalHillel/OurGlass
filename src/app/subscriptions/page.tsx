"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Subscription } from "@/types";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [newSubName, setNewSubName] = useState("");
    const [newSubAmount, setNewSubAmount] = useState("");
    const [newSubDay, setNewSubDay] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

    const handleAdd = async () => {
        if (!newSubName || !newSubAmount) return;

        try {
            const { error } = await supabase.from('subscriptions').insert({
                name: newSubName,
                amount: parseFloat(newSubAmount),
                billing_day: parseInt(newSubDay) || 1,
            });

            if (error) throw error;

            toast.success("מנוי נוסף בהצלחה");
            setIsDialogOpen(false);
            setNewSubName("");
            setNewSubAmount("");
            setNewSubDay("");
            fetchSubscriptions();
        } catch (error: any) {
            toast.error("שגיאה בהוספה", { description: error.message });
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
        <div className="flex flex-col gap-6 max-w-md mx-auto pt-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">החור השחור</h1>
                <p className="text-white/60">הוצאות קבועות ומנויים</p>
            </div>

            {/* Total Card */}
            <div className="glass p-8 rounded-3xl text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
                <span className="text-sm uppercase tracking-widest text-white/60 mb-2 block">
                    סה״כ חודשי
                </span>
                <span className="text-5xl font-bold text-white drop-shadow-lg">
                    ₪{totalMonthly.toLocaleString()}
                </span>
            </div>

            {/* List */}
            <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-lg font-medium text-white/80">רשימת מנויים</h2>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full">
                                <Plus className="w-4 h-4 mr-1" /> הוסף
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>הוספת מנוי חדש</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input
                                    placeholder="שם המנוי (למשל: נטפליקס)"
                                    value={newSubName}
                                    onChange={(e) => setNewSubName(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Input
                                    type="number"
                                    placeholder="סכום חודשי"
                                    value={newSubAmount}
                                    onChange={(e) => setNewSubAmount(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Input
                                    type="number"
                                    placeholder="יום חיוב (1-31)"
                                    value={newSubDay}
                                    onChange={(e) => setNewSubDay(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                                <Button onClick={handleAdd} className="w-full bg-white text-black font-bold hover:bg-white/90">
                                    הוסף לרשימה
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
                    </div>
                ) : (
                    subscriptions.map((sub) => (
                        <div key={sub.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-200 font-bold text-lg">
                                    {sub.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{sub.name}</h3>
                                    <div className="flex items-center text-xs text-white/50 gap-1">
                                        <Calendar className="w-3 h-3" />
                                        יום חיוב: {sub.billing_day || 1}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-white text-lg">₪{sub.amount}</span>
                                <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-2 rounded-full hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
