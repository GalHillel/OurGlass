"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Subscription } from "@/types";
import { useTotalLiabilities } from "@/hooks/useWealthData";
import { Plus, Calendar, Zap, Shield } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableRow } from "@/components/SwipeableRow";
import { cn, formatAmount } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { useDashboardStore } from "@/stores/dashboardStore";

import { useAuth } from "@/components/AuthProvider";
import { SubscriptionKiller } from "@/components/SubscriptionKiller";
import { GhostSubscriptions } from "@/components/GhostSubscriptions";
import { LiabilitiesSection } from "@/components/LiabilitiesSection";
import { useSubscriptions } from "@/hooks/useJointFinance";
import { useQueryClient } from "@tanstack/react-query";

import { AddSubscriptionDialog, CATEGORIES } from "@/components/AddSubscriptionDialog";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default function SubscriptionsPage() {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const features = useDashboardStore((s) => s.features) ?? {};
    const {
        subsShowIndicator = true,
        subsShowLiabilities = true,
        subsShowGhost = true,
        subsShowKiller = true,
        subsShowSummary = true
    } = features;
    const { profile } = useAuth();
    const coupleId = profile?.couple_id ?? null;
    const queryClient = useQueryClient();
    const { data: subscriptions = [], isLoading: loading } = useSubscriptions();

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const [selectedGhost, setSelectedGhost] = useState<{ name: string; amount: number } | null>(null);

    const handleUpdateStatus = async (id: string, status: Subscription['status']) => {
        try {
            if (!coupleId) throw new Error("Missing couple_id");
            const { error } = await createClient()
                .from('subscriptions')
                .update({ status })
                .eq('id', id)
                .eq('couple_id', coupleId);
            if (error) throw error;
            toast.success("סטטוס המנוי עודכן");
            queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
            queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
        } catch {
            toast.error("שגיאה בעדכון הסטטוס");
        }
    };

    const openAddDialog = () => {
        setEditingSub(null);
        setSelectedGhost(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (sub: Subscription) => {
        setEditingSub(sub);
        setSelectedGhost(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            if (!coupleId) throw new Error("Missing couple_id");
            const { error } = await createClient()
                .from('subscriptions')
                .delete()
                .eq('id', id)
                .eq('couple_id', coupleId);
            if (error) throw error;
            toast.success("מנוי הוסר");
            queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
            queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
        } catch {
            toast.error("שגיאה במחיקה");
        }
    };

    const handleDeleteLiability = async (id: string) => {
        try {
            if (!coupleId) throw new Error("Missing couple_id");
            const { error } = await createClient()
                .from('liabilities')
                .delete()
                .eq('id', id)
                .eq('couple_id', coupleId);
            if (error) throw error;
            toast.success("התחייבות הוסרה");
            queryClient.invalidateQueries({ queryKey: ['liabilities', coupleId] });
            queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
        } catch {
            toast.error("שגיאה במחיקה");
        }
    };

    const handleSuccess = () => {
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['subscriptions', coupleId] });
        queryClient.invalidateQueries({ queryKey: ['global-cashflow', coupleId] });
    };

    const { activeLiabilities = [], monthlyPayments: totalDebtMonthly = 0 } = useTotalLiabilities();

    const totalMonthly = subscriptions.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0) + (totalDebtMonthly || 0);

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pt-8 pb-0 px-4">
            {/* Indicator */}
            {subsShowIndicator && profile?.budget && (
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
                                {isStealthMode ? "**%" : `${ratio.toFixed(0)}%`}
                            </div>
                        </div>
                    );
                })()
            )}

            {/* Total Card */}
            {subsShowSummary && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="neon-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none group-hover:opacity-100 transition-opacity" />
                        <span className="text-xs uppercase tracking-widest text-white/60 mb-1 block text-center">
                            חודשי
                        </span>
                        <span className="text-3xl font-black text-white drop-shadow-lg neon-text text-center">
                            {formatAmount(totalMonthly, isStealthMode, CURRENCY_SYMBOL)}
                        </span>
                    </div>
                    <div className="neon-card p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border-red-500/20 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
                        <span className="text-xs uppercase tracking-widest text-red-200/60 mb-1 block text-center">
                            שנתי
                        </span>
                        <span className="text-3xl font-black text-red-200 drop-shadow-lg text-center">
                            {formatAmount(totalMonthly * 12, isStealthMode, CURRENCY_SYMBOL)}
                        </span>
                    </div>
                </div>
            )}

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
                                                <span className="font-black text-white text-xl tracking-tight">{formatAmount(sub.amount, isStealthMode, CURRENCY_SYMBOL)}</span>
                                            </div>
                                        </div>
                                    </SwipeableRow>
                                );
                            })
                        )}

                        {/* Liabilities (Debt) as Fixed Expenses */}
                        {subsShowLiabilities && activeLiabilities.length > 0 && (
                            <div className="pt-4 space-y-4">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">תשלומי חובות (הוצאה קבועה)</h2>
                                {activeLiabilities.map((liab: { id: string; name: string; estimated_months_to_payoff: number; monthly_payment: number }) => (
                                    <SwipeableRow
                                        key={liab.id}
                                        onEdit={() => { }}
                                        onDelete={() => handleDeleteLiability(liab.id)}
                                        deleteMessage="האם למחוק התחייבות זו?"
                                        className="mb-3"
                                    >
                                        <div className="neon-card p-4 flex items-center justify-between group relative overflow-hidden opacity-90 border-red-500/10">
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-red-500/10 border border-red-500/20">
                                                    <Shield className="w-6 h-6 text-red-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{liab.name}</h3>
                                                    <div className="flex items-center text-xs text-slate-400 gap-2">
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <Calendar className="w-3 h-3" />
                                                            מסתיים בעוד {liab.estimated_months_to_payoff} חודשים
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            חוב (קבוע)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <span className="font-black text-white text-xl tracking-tight">{formatAmount(liab.monthly_payment, isStealthMode, CURRENCY_SYMBOL)}</span>
                                            </div>
                                        </div>
                                    </SwipeableRow>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Liabilities Section */}
            <div className="pt-4 space-y-4">
                <div className="px-1">
                    <h2 className="text-xl font-black text-white neon-text">התחייבויות וחובות</h2>
                    <p className="text-xs text-white/40 mt-1">ניהול החזרים חודשיים וחובות מצטברים בהוצאה קבועה</p>
                </div>
                <LiabilitiesSection />
            </div>

            {/* Ghost Subscriptions */}
            {subsShowGhost && (
                <div className="pt-4 space-y-4">
                    <GhostSubscriptions onAddGhost={(data) => {
                        setSelectedGhost(data);
                        setIsDialogOpen(true);
                    }} />
                </div>
            )}

            {/* Subscription Killer Analysis */}
            {subsShowKiller && !loading && subscriptions.length > 0 && (
                <SubscriptionKiller
                    subscriptions={subscriptions}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                />
            )}

            <AddSubscriptionDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setEditingSub(null);
                    setSelectedGhost(null);
                }}
                editingSub={editingSub}
                initialData={selectedGhost}
                onSuccess={handleSuccess}
            />

            {/* Final bottom spacer for edge-to-edge layout accessibility */}
            <div className="h-32 w-full" />
        </div>
    );
}
