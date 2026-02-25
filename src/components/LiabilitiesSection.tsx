"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Car, GraduationCap, CreditCard, Landmark, Wallet, CalendarClock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLiabilities, useAddLiability, useDeleteLiability, isLiabilityActive } from "@/hooks/useWealthData";
import { Liability, LiabilityType } from "@/types";
import { toast } from "sonner";
import { cn, formatAmount } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { SwipeableRow } from "@/components/SwipeableRow";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

const LIABILITY_ICONS: Record<string, typeof Home> = {
    "משכנתא": Home,
    "רכב": Car,
    "לימודים": GraduationCap,
    "כרטיס אשראי": CreditCard,
    "הלוואה אישית": Wallet,
    "אחר": Landmark,
    "חשבונות": Home,
};

const LIABILITY_LABELS: Record<string, string> = {
    "משכנתא": "משכנתא",
    "רכב": "רכב",
    "לימודים": "לימודים",
    "כרטיס אשראי": "כרטיס אשראי",
    "הלוואה אישית": "הלוואה אישית",
    "אחר": "אחר",
    "חשבונות": "חשבונות",
};

const LIABILITY_CATEGORIES = ["משכנתא", "רכב", "לימודים", "כרטיס אשראי", "הלוואה אישית", "אחר"];

const resolveAmounts = (liability: Liability) => {
    const total = Number(liability.total_amount || liability.principal || liability.amount || 0);
    const remaining = Number(liability.remaining_amount ?? liability.current_balance ?? liability.amount ?? 0);
    return { total, remaining };
};

export function LiabilitiesSection() {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const { data: liabilities = [], isLoading } = useLiabilities();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const sortedLiabilities = useMemo(
        () => [...liabilities].sort((a, b) => Number(b.interest_rate || 0) - Number(a.interest_rate || 0)),
        [liabilities]
    );

    const totalDebt = sortedLiabilities.reduce((sum, liability) => {
        const { remaining } = resolveAmounts(liability);
        return sum + remaining;
    }, 0);

    const totalMonthly = sortedLiabilities
        .filter((liability) => isLiabilityActive(liability))
        .reduce((sum, liability) => sum + Number(liability.monthly_payment ?? 0), 0);

    return (
        <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-800/80 p-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-red-300/90 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> ניהול החזר חובות
                        </h2>
                        <p className="text-[11px] text-white/60 mt-1">ממויין לפי ריבית (Avalanche) כדי לסגור קודם את היקר ביותר</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-red-600/90 hover:bg-red-600 text-white rounded-full text-xs font-bold">
                                <Plus className="w-4 h-4 ml-1" /> הוסף חוב
                            </Button>
                        </DialogTrigger>
                        <AddLiabilityDialog onClose={() => setIsDialogOpen(false)} />
                    </Dialog>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[10px] text-white/50">סה״כ יתרת חוב</p>
                        <p className="text-lg font-black text-red-300">{formatAmount(totalDebt, isStealthMode, CURRENCY_SYMBOL, '***')}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[10px] text-white/50">תשלומי חוב פעילים / חודש</p>
                        <p className="text-lg font-black text-orange-300">{formatAmount(totalMonthly, isStealthMode, CURRENCY_SYMBOL, '***')}</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-28 w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-28 w-full rounded-2xl bg-white/5" />
                </div>
            ) : sortedLiabilities.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="אין התחייבויות"
                    description="כדי לבנות תוכנית יציאה מחובות, הוסיפו התחייבות ראשונה"
                    actionLabel="הוסף התחייבות"
                    onAction={() => setIsDialogOpen(true)}
                    showPlusIcon
                />
            ) : (
                <AnimatePresence mode="popLayout">
                    {sortedLiabilities.map((liability) => (
                        <LiabilityCard key={liability.id} liability={liability} isStealthMode={isStealthMode} />
                    ))}
                </AnimatePresence>
            )}
        </section>
    );
}

function LiabilityCard({ liability, isStealthMode }: { liability: Liability, isStealthMode: boolean }) {
    const deleteMutation = useDeleteLiability();
    const Icon = LIABILITY_ICONS[liability.category] || Landmark;
    const { total, remaining } = resolveAmounts(liability);
    const payment = Number(liability.monthly_payment ?? 0);
    const paid = Math.max(total - remaining, 0);
    const progress = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
    const isActive = isLiabilityActive(liability);

    return (
        <SwipeableRow
            onDelete={() => {
                deleteMutation.mutate(liability.id, {
                    onSuccess: () => toast.success("ההתחייבות הוסרה"),
                    onError: () => toast.error("שגיאה במחיקה"),
                });
            }}
            deleteMessage="האם אתה בטוח שברצונך למחוק התחייבות זו?"
            className="mb-3"
        >
            <motion.article
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "relative overflow-hidden p-5 rounded-2xl border transition-all duration-300",
                    isActive
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                        : "bg-emerald-500/5 border-emerald-500/10 grayscale-[0.5]"
                )}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                        <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-white text-sm truncate">{liability.name || "ללא שם"}</h3>
                                <p className="text-[11px] text-white/55">{liability.category}</p>
                            </div>
                            <div className="text-left">
                                <p className="font-black text-lg text-red-300">{formatAmount(remaining, isStealthMode, CURRENCY_SYMBOL, '***')}</p>
                                <p className="text-[10px] text-white/45">יתרה לתשלום</p>
                            </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-white/60">
                                <span>
                                    {isStealthMode ? '***' : `${CURRENCY_SYMBOL}${paid.toLocaleString()}`} שולם מתוך {formatAmount(total, isStealthMode, CURRENCY_SYMBOL, '***')}
                                </span>
                                {!isStealthMode && <span>{progress.toFixed(0)}%</span>}
                            </div>
                            <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-red-400" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-white/80">{formatAmount(payment, isStealthMode, CURRENCY_SYMBOL, '***')} / חודש</span>
                            <span className="rounded-xl bg-red-500/15 px-2.5 py-1 text-red-200">{isStealthMode ? '***' : Number(liability.interest_rate || 0).toFixed(2)}% ריבית</span>
                            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-white/70 inline-flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                {liability.end_date ? new Date(liability.end_date).toLocaleDateString(LOCALE) : "ללא תאריך סיום"}
                            </span>
                            {!isActive && <span className="rounded-xl bg-emerald-500/15 px-2.5 py-1 text-emerald-200">שולם / הסתיים</span>}
                        </div>
                    </div>
                </div>
            </motion.article>
        </SwipeableRow>
    );
}

function AddLiabilityDialog({ onClose }: { onClose: () => void }) {
    const addMutation = useAddLiability();
    const { profile } = useAuth();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("הלוואה אישית");
    const [totalAmount, setTotalAmount] = useState("");
    const [remainingAmount, setRemainingAmount] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [monthlyPayment, setMonthlyPayment] = useState("");
    const [endDate, setEndDate] = useState("");
    const [owner, setOwner] = useState<"him" | "her" | "joint">("joint");

    const handleSubmit = () => {
        if (!name || !remainingAmount || !monthlyPayment) {
            toast.error("נא למלא שם, יתרה ותשלום חודשי");
            return;
        }

        const coupleId = profile?.couple_id;
        if (!coupleId) {
            toast.error("לא נמצא מזהה זוגי לשמירה");
            return;
        }

        const selectedType = (Object.keys(LIABILITY_LABELS).find(key => LIABILITY_LABELS[key] === category) || "other") as LiabilityType;
        const remaining = Number(remainingAmount) || 0;
        const total = Number(totalAmount) || remaining;

        addMutation.mutate(
            {
                name,
                category,
                total_amount: total,
                remaining_amount: remaining,
                monthly_payment: Number(monthlyPayment) || 0,
                interest_rate: Number(interestRate) || 0,
                end_date: endDate || null,
                type: selectedType,
                principal: total,
                current_balance: remaining,
                start_date: null,
                owner,
                couple_id: coupleId,
            },
            {
                onSuccess: () => {
                    toast.success("ההתחייבות נוספה");
                    onClose();
                },
                onError: () => toast.error("שגיאה בשמירה"),
            }
        );
    };

    return (
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md" dir="rtl">
            <DialogHeader>
                <DialogTitle>הוספת / עריכת התחייבות</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div>
                    <Label className="text-white/70">שם התחייבות</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: הלוואת רכב" className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">קטגוריה</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                {LIABILITY_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-white/70">בעלות</Label>
                        <Select value={owner} onValueChange={(v) => setOwner(v as "him" | "her" | "joint")}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="joint">משותף</SelectItem>
                                <SelectItem value="him">{PAYERS.HIM}</SelectItem>
                                <SelectItem value="her">{PAYERS.HER}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">סכום מקורי ({CURRENCY_SYMBOL})</Label>
                        <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="500000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                        <Label className="text-white/70">יתרה נוכחית ({CURRENCY_SYMBOL})</Label>
                        <Input type="number" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} placeholder="320000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">תשלום חודשי ({CURRENCY_SYMBOL})</Label>
                        <Input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="3500" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                        <Label className="text-white/70">ריבית שנתית (%)</Label>
                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="6.2" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                </div>

                <div>
                    <Label className="text-white/70">תאריך סיום משוער</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" />
                </div>

                <Button onClick={handleSubmit} disabled={addMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {addMutation.isPending ? "...שומר" : "שמור התחייבות"}
                </Button>
            </div>
        </DialogContent>
    );
}
