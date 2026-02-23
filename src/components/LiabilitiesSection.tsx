"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Car, GraduationCap, CreditCard, Landmark, Wallet, Trash2, CalendarClock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useLiabilities, useAddLiability, useDeleteLiability, isLiabilityActive } from "@/hooks/useWealthData";
import { Liability, LiabilityType } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "react-countup";

const LIABILITY_ICONS: Record<LiabilityType, typeof Home> = {
    mortgage: Home,
    car: Car,
    student: GraduationCap,
    personal: Wallet,
    credit_card: CreditCard,
    other: Landmark,
};

const LIABILITY_LABELS: Record<LiabilityType, string> = {
    mortgage: "משכנתא",
    car: "רכב",
    student: "לימודים",
    personal: "הלוואה אישית",
    credit_card: "כרטיס אשראי",
    other: "אחר",
};

const CATEGORY_TO_TYPE: Record<string, LiabilityType> = {
    "Mortgage": "mortgage",
    "Car Loan": "car",
    "Student Loan": "student",
    "Credit Card": "credit_card",
    "Personal Loan": "personal",
};

const LIABILITY_CATEGORIES = ["Mortgage", "Car Loan", "Student Loan", "Credit Card", "Personal Loan", "Other"];

const resolveAmounts = (liability: Liability) => {
    const currentDebt = Number(liability.remaining_amount ?? liability.total_amount ?? liability.amount ?? liability.current_balance ?? 0);
    const total = Number(liability.total_amount ?? liability.amount ?? liability.principal ?? currentDebt);
    const remaining = currentDebt;
    return { total, remaining };
};

export function LiabilitiesSection() {
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
                            <TrendingUp className="w-4 h-4" /> Debt Payoff Manager
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
                        <p className="text-lg font-black text-red-300">₪<CountUp end={totalDebt} separator="," duration={1} /></p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-[10px] text-white/50">תשלומי חוב פעילים / חודש</p>
                        <p className="text-lg font-black text-orange-300">₪{totalMonthly.toLocaleString()}</p>
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
                    {sortedLiabilities.map((liability, index) => (
                        <LiabilityCard key={liability.id} liability={liability} index={index} />
                    ))}
                </AnimatePresence>
            )}
        </section>
    );
}

function LiabilityCard({ liability, index }: { liability: Liability; index: number }) {
    const deleteMutation = useDeleteLiability();
    const derivedType = liability.type ?? CATEGORY_TO_TYPE[liability.category] ?? "other";
    const Icon = LIABILITY_ICONS[derivedType] || Landmark;
    const { total, remaining } = resolveAmounts(liability);
    const payment = Number(liability.monthly_payment ?? 0);
    const paid = Math.max(total - remaining, 0);
    const progress = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;
    const isActive = isLiabilityActive(liability);

    return (
        <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/70 p-4"
        >
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                        <div>
                            <h3 className="font-bold text-white text-sm truncate">{liability.name || "ללא שם"}</h3>
                            <p className="text-[11px] text-white/55">{liability.category || LIABILITY_LABELS[derivedType]}</p>
                        </div>
                        <div className="text-left">
                            <p className="font-black text-lg text-red-300">₪{remaining.toLocaleString()}</p>
                            <p className="text-[10px] text-white/45">יתרה לתשלום</p>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span>₪{paid.toLocaleString()} שולם מתוך ₪{total.toLocaleString()}</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 bg-white/10" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-xl bg-white/10 px-2.5 py-1 text-white/80">₪{payment.toLocaleString()} / חודש</span>
                        <span className="rounded-xl bg-red-500/15 px-2.5 py-1 text-red-200">{Number(liability.interest_rate || 0).toFixed(2)}% APR</span>
                        <span className="rounded-xl bg-white/10 px-2.5 py-1 text-white/70 inline-flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            {liability.end_date ? new Date(liability.end_date).toLocaleDateString("he-IL") : "ללא תאריך סיום"}
                        </span>
                        {!isActive && <span className="rounded-xl bg-emerald-500/15 px-2.5 py-1 text-emerald-200">שולם / הסתיים</span>}
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>למחוק התחייבות זו?</AlertDialogTitle>
                            <AlertDialogDescription>פעולה זו אינה הפיכה.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white">ביטול</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    deleteMutation.mutate(liability.id, {
                                        onSuccess: () => toast.success("ההתחייבות הוסרה"),
                                        onError: () => toast.error("שגיאה במחיקה"),
                                    });
                                }}
                                className="bg-red-600"
                            >
                                מחק
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </motion.article>
    );
}

function AddLiabilityDialog({ onClose }: { onClose: () => void }) {
    const addMutation = useAddLiability();
    const { profile } = useAuth();
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Personal Loan");
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

        const selectedType = CATEGORY_TO_TYPE[category] ?? "other";
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
                couple_id: profile?.couple_id,
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
                                <SelectItem value="him">שלו</SelectItem>
                                <SelectItem value="her">שלה</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">סכום מקורי (₪)</Label>
                        <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="500000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                        <Label className="text-white/70">יתרה נוכחית (₪)</Label>
                        <Input type="number" value={remainingAmount} onChange={(e) => setRemainingAmount(e.target.value)} placeholder="320000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">תשלום חודשי (₪)</Label>
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
