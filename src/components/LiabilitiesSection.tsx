"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Car, GraduationCap, CreditCard, Landmark, Wallet, CalendarClock, TrendingUp, Info, Receipt, Percent, History as HistoryIcon, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLiabilities, useAddLiability, useUpdateLiability, useDeleteLiability, isLiabilityActive } from "@/hooks/useWealthData";
import { Liability, LiabilityType } from "@/types";
import { toast } from "sonner";
import { cn, formatAmount, formatDate } from "@/lib/utils";
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
    const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

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
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-orange-500/5 opacity-50" />
                <div className="relative z-10">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold text-red-300/90 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> ניהול החזר חובות
                            </h2>
                            <p className="text-[11px] text-white/60 mt-1">ממויין לפי ריבית (Avalanche) כדי לסגור קודם את היקר ביותר</p>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setEditingLiability(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setEditingLiability(null);
                                        setIsDialogOpen(true);
                                    }}
                                    className="bg-red-600/90 hover:bg-red-600 text-white rounded-full text-xs font-bold"
                                >
                                    <Plus className="w-4 h-4 ml-1" /> הוסף חוב
                                </Button>
                            </DialogTrigger>
                            <LiabilityDialog
                                key={editingLiability?.id || 'new'}
                                initialData={editingLiability}
                                onClose={() => {
                                    setIsDialogOpen(false);
                                    setEditingLiability(null);
                                }}
                            />
                        </Dialog>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 group-hover:bg-white/[0.08] transition-colors">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">סה״כ יתרת חוב</p>
                            <p className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums">{formatAmount(totalDebt, isStealthMode, CURRENCY_SYMBOL, '***')}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 group-hover:bg-white/[0.08] transition-colors">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">החזר חודשי</p>
                            <p className="text-2xl font-black text-rose-400 font-mono tracking-tighter tabular-nums">{formatAmount(totalMonthly, isStealthMode, CURRENCY_SYMBOL, '***')}</p>
                        </div>
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
                        <LiabilityCard
                            key={liability.id}
                            liability={liability}
                            isStealthMode={isStealthMode}
                            onEdit={() => {
                                setEditingLiability(liability);
                                setIsDialogOpen(true);
                            }}
                        />
                    ))}
                </AnimatePresence>
            )}
        </section>
    );
}

function LiabilityCard({
    liability,
    isStealthMode,
    onEdit
}: {
    liability: Liability,
    isStealthMode: boolean,
    onEdit: () => void
}) {
    const deleteMutation = useDeleteLiability();
    const Icon = LIABILITY_ICONS[liability.category] || Landmark;
    const { total, remaining } = resolveAmounts(liability);
    const payment = Number(liability.monthly_payment ?? 0);
    const paid = Math.max(total - remaining, 0);
    const progress = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
    const isActive = isLiabilityActive(liability);

    return (
        <SwipeableRow
            onEdit={onEdit}
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
                    "relative overflow-hidden p-6 rounded-[1.5rem] border transition-all duration-300",
                    isActive
                        ? "bg-slate-900/40 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
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
                                    {isStealthMode ? '***' : `${CURRENCY_SYMBOL}${paid.toLocaleString('en-US')}`} שולם מתוך {formatAmount(total, isStealthMode, CURRENCY_SYMBOL, '***')}
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
                                {liability.estimated_end_date ? formatDate(liability.estimated_end_date, LOCALE) : (liability.end_date ? formatDate(liability.end_date, LOCALE) : "ללא תאריך סיום")}
                            </span>
                            {liability.estimated_end_date && !liability.end_date && (
                                <span className="rounded-xl bg-blue-500/15 px-2.5 py-1 text-blue-200">חישוב אוטומטי</span>
                            )}
                            {!isActive && <span className="rounded-xl bg-emerald-500/15 px-2.5 py-1 text-emerald-200">שולם / הסתיים</span>}
                        </div>
                    </div>
                </div>
            </motion.article>
        </SwipeableRow>
    );
}

function LiabilityDialog({ initialData, onClose }: { initialData?: Liability | null, onClose: () => void }) {
    const addMutation = useAddLiability();
    const updateMutation = useUpdateLiability();
    const { profile } = useAuth();

    const [name, setName] = useState(initialData?.name || "");
    const [category, setCategory] = useState(initialData?.category || "הלוואה אישית");
    const [totalAmount, setTotalAmount] = useState(initialData?.total_amount?.toString() || initialData?.principal?.toString() || "");
    const [remainingAmount, setRemainingAmount] = useState(initialData?.remaining_amount?.toString() || initialData?.current_balance?.toString() || "");
    const [interestRate, setInterestRate] = useState(initialData?.interest_rate?.toString() || "");
    const [monthlyPayment, setMonthlyPayment] = useState(initialData?.monthly_payment?.toString() || "");
    const [startDate, setStartDate] = useState(initialData?.start_date?.split('T')[0] || "");
    const [endDate, setEndDate] = useState(initialData?.end_date?.split('T')[0] || "");
    const [owner, setOwner] = useState<"him" | "her" | "joint">(initialData?.owner || "joint");

    const isPending = addMutation.isPending || updateMutation.isPending;

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

        const payload = {
            name,
            category,
            total_amount: total,
            remaining_amount: remaining,
            monthly_payment: Number(monthlyPayment) || 0,
            interest_rate: Number(interestRate) || 0,
            start_date: startDate || null,
            end_date: endDate || null,
            type: selectedType,
            principal: total,
            current_balance: remaining,
            owner,
            couple_id: coupleId,
        };

        if (initialData?.id) {
            updateMutation.mutate(
                { id: initialData.id, ...payload },
                {
                    onSuccess: () => {
                        toast.success("ההתחייבות עודכנה");
                        onClose();
                    },
                    onError: () => toast.error("שגיאה בעדכון"),
                }
            );
        } else {
            addMutation.mutate(
                payload,
                {
                    onSuccess: () => {
                        toast.success("ההתחייבות נוספה");
                        onClose();
                    },
                    onError: () => toast.error("שגיאה בשמירה"),
                }
            );
        }
    };

    return (
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border-white/10 text-white sm:max-w-lg p-0 overflow-hidden rounded-[2rem] shadow-2xl shadow-red-900/20" dir="rtl">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-pink-600 to-red-600" />

            <div className="p-8">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-3xl font-black bg-gradient-to-l from-white to-white/60 bg-clip-text text-transparent flex items-center gap-3">
                        {initialData ? <Edit2 className="w-8 h-8 text-red-400" /> : <Plus className="w-8 h-8 text-red-400" />}
                        {initialData ? "עריכת התחייבות" : "התחייבות חדשה"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8">
                    {/* Section 1: Basic Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-red-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">פרטים בסיסיים</h4>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-[11px] font-bold text-white/50 mb-1.5 block mr-1">שם ההתחייבות / מלווה</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="למשל: הלוואת בנק פועלים"
                                    className="bg-white/[0.03] border-white/5 h-12 text-lg focus:border-red-500/50 transition-all rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[11px] font-bold text-white/50 mb-1.5 block mr-1">קטגוריה</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-white/[0.03] border-white/5 h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                            {LIABILITY_CATEGORIES.map((item) => (
                                                <SelectItem key={item} value={item} className="focus:bg-red-500/10 focus:text-red-200">
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-[11px] font-bold text-white/50 mb-1.5 block mr-1">בעלות</Label>
                                    <Select value={owner} onValueChange={(v) => setOwner(v as "him" | "her" | "joint")}>
                                        <SelectTrigger className="bg-white/[0.03] border-white/5 h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-xl">
                                            <SelectItem value="joint">משותף 👥</SelectItem>
                                            <SelectItem value="him">{PAYERS.HIM} 👔</SelectItem>
                                            <SelectItem value="her">{PAYERS.HER} 👗</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Financials */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Receipt className="w-4 h-4 text-red-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">נתונים כספיים</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                <Label className="text-[10px] font-black text-white/30 uppercase block mb-1">סכום מקורי</Label>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20 text-sm">{CURRENCY_SYMBOL}</span>
                                    <Input
                                        type="number"
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(e.target.value)}
                                        className="bg-transparent border-none p-0 h-8 text-xl font-bold focus-visible:ring-0 text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                <Label className="text-[10px] font-black text-red-500/50 uppercase block mb-1">יתרה נוכחית</Label>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-red-500/30 text-sm">{CURRENCY_SYMBOL}</span>
                                    <Input
                                        type="number"
                                        value={remainingAmount}
                                        onChange={(e) => setRemainingAmount(e.target.value)}
                                        className="bg-transparent border-none p-0 h-8 text-xl font-bold text-red-200 focus-visible:ring-0 text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 mr-1">
                                    <Wallet className="w-3.5 h-3.5 text-white/30" />
                                    <Label className="text-[11px] font-bold text-white/50">החזר חודשי</Label>
                                </div>
                                <Input
                                    type="number"
                                    value={monthlyPayment}
                                    onChange={(e) => setMonthlyPayment(e.target.value)}
                                    className="bg-white/[0.03] border-white/5 h-11 rounded-xl text-left"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5 mr-1">
                                    <Percent className="w-3.5 h-3.5 text-white/30" />
                                    <Label className="text-[11px] font-bold text-white/50">ריבית שנתית</Label>
                                </div>
                                <Input
                                    type="number"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    className="bg-white/[0.03] border-white/5 h-11 rounded-xl text-left"
                                    placeholder="%"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Timeframe */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <HistoryIcon className="w-4 h-4 text-red-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">לוח זמנים</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[11px] font-bold text-white/50 mb-1.5 block mr-1">תאריך התחלה</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white/[0.03] border-white/5 h-11 rounded-xl text-center"
                                />
                                <p className="text-[9px] text-white/30 mt-1.5 mr-1 italic">* לחישוב יתרה דינמי</p>
                            </div>
                            <div>
                                <Label className="text-[11px] font-bold text-white/50 mb-1.5 block mr-1">תאריך סיום (ידני)</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white/[0.03] border-white/5 h-11 rounded-xl text-center"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black h-14 rounded-2xl text-lg shadow-xl shadow-red-900/20 transition-all active:scale-[0.98]"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    שורף חובות...
                                </div>
                            ) : (initialData ? "עדכן פרטי התחייבות" : "שמור התחייבות חדשה")}
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
