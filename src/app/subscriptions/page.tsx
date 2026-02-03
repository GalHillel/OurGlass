"use client";

import { useState } from "react";
import { Plus, Calendar, CreditCard } from "lucide-react";
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
import { SwipeableRow } from "@/components/SwipeableRow";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { DEMO_SUBSCRIPTIONS } from "@/lib/demoData";

export default function SubscriptionsPage() {
    const [subscriptions] = useState(DEMO_SUBSCRIPTIONS);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { profile } = useAuth();

    const handleAdd = () => {
        toast.info("מצב דמו: לא ניתן להוסיף מנויים", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleEdit = () => {
        toast.info("מצב דמו: לא ניתן לערוך מנויים", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleDelete = () => {
        toast.info("מצב דמו: לא ניתן למחוק מנויים", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
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
                    <Button onClick={handleAdd} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                        <Plus className="w-4 h-4 ml-1" /> הוסף מנוי
                    </Button>
                </div>

                <div className="space-y-3">
                    {subscriptions.map((sub) => (
                        <SwipeableRow
                            key={sub.id}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
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
                </div>
            </div>
        </div>
    );
}
