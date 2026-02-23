"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Car, GraduationCap, CreditCard, Landmark, Wallet, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useLiabilities, useAddLiability, useDeleteLiability } from "@/hooks/useWealthData";
import { Liability, LiabilityType } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
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

const LIABILITY_COLORS: Record<LiabilityType, string> = {
    mortgage: "text-orange-400 bg-orange-500/20",
    car: "text-blue-400 bg-blue-500/20",
    student: "text-purple-400 bg-purple-500/20",
    personal: "text-yellow-400 bg-yellow-500/20",
    credit_card: "text-red-400 bg-red-500/20",
    other: "text-slate-400 bg-slate-500/20",
};

const LIABILITY_LABELS: Record<LiabilityType, string> = {
    mortgage: "משכנתא",
    car: "רכב",
    student: "לימודים",
    personal: "הלוואה אישית",
    credit_card: "כרטיס אשראי",
    other: "אחר",
};

export function LiabilitiesSection() {
    const { data: liabilities = [], isLoading } = useLiabilities();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const totalDebt = liabilities.reduce((sum, l) => sum + l.current_balance, 0);
    const totalMonthly = liabilities.reduce((sum, l) => sum + l.monthly_payment, 0);

    return (
        <div className="space-y-4">
            {/* Summary Header */}
            <div className="flex justify-between items-end px-2">
                <div>
                    <h2 className="text-sm font-bold text-red-300/80 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> התחייבויות
                    </h2>
                    {totalDebt > 0 && (
                        <div className="flex gap-3 mt-1">
                            <span className="text-xs text-white/40">
                                סה״כ חוב: <span className="text-red-400 font-bold">₪<CountUp end={totalDebt} separator="," duration={1} /></span>
                            </span>
                            <span className="text-xs text-white/40">
                                תשלום חודשי: <span className="text-orange-400 font-bold">₪{totalMonthly.toLocaleString()}</span>
                            </span>
                        </div>
                    )}
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-red-600/80 hover:bg-red-600 text-white rounded-full text-xs font-bold">
                            <Plus className="w-4 h-4 ml-1" /> הוסף חוב
                        </Button>
                    </DialogTrigger>
                    <AddLiabilityDialog onClose={() => setIsDialogOpen(false)} />
                </Dialog>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                    <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
                </div>
            ) : liabilities.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="אין התחייבויות"
                    description="עדיף ככה! אם יש לכם הלוואות, הוסיפו אותן כדי לראות את השווי הנקי האמיתי"
                    actionLabel="הוסף התחייבות"
                    onAction={() => setIsDialogOpen(true)}
                    showPlusIcon
                />
            ) : (
                <AnimatePresence mode="popLayout">
                    {liabilities.map((liability, i) => (
                        <LiabilityCard key={liability.id} liability={liability} index={i} />
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
}

function LiabilityCard({ liability, index }: { liability: Liability; index: number }) {
    const deleteMutation = useDeleteLiability();
    const Icon = LIABILITY_ICONS[liability.type] || Landmark;
    const colorClass = LIABILITY_COLORS[liability.type] || LIABILITY_COLORS.other;

    const payoffProgress = liability.principal > 0
        ? ((liability.principal - liability.current_balance) / liability.principal) * 100
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className="neon-card p-4 rounded-2xl relative overflow-hidden"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-white text-sm truncate">{liability.name}</h3>
                            <span className="text-[10px] text-white/40">{LIABILITY_LABELS[liability.type]}</span>
                        </div>
                        <div className="text-left">
                            <div className="font-black text-lg text-red-400">₪{liability.current_balance.toLocaleString()}</div>
                            <span className="text-[10px] text-white/40">₪{liability.monthly_payment.toLocaleString()}/חודש</span>
                        </div>
                    </div>

                    {/* Payoff Progress */}
                    {payoffProgress > 0 && (
                        <div className="mt-2">
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-red-500 to-orange-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${payoffProgress}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <span className="text-[10px] text-white/30 mt-1">{payoffProgress.toFixed(0)}% שולם</span>
                        </div>
                    )}
                </div>

                {/* Delete */}
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
                                        onSuccess: () => toast.success("התחייבות הוסרה"),
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
        </motion.div>
    );
}

function AddLiabilityDialog({ onClose }: { onClose: () => void }) {
    const addMutation = useAddLiability();
    const [name, setName] = useState("");
    const [type, setType] = useState<LiabilityType>("personal");
    const [principal, setPrincipal] = useState("");
    const [currentBalance, setCurrentBalance] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [monthlyPayment, setMonthlyPayment] = useState("");
    const [owner, setOwner] = useState<"him" | "her" | "joint">("joint");

    const handleSubmit = () => {
        if (!name || !currentBalance) {
            toast.error("נא למלא שם ויתרה");
            return;
        }

        addMutation.mutate(
            {
                name,
                type,
                principal: Number(principal) || Number(currentBalance),
                current_balance: Number(currentBalance),
                interest_rate: Number(interestRate) || 0,
                monthly_payment: Number(monthlyPayment) || 0,
                start_date: null,
                end_date: null,
                owner,
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
                <DialogTitle>הוספת התחייבות</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
                <div>
                    <Label className="text-white/70">שם</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="למשל: משכנתא דירה"
                        className="mt-1 bg-white/5 border-white/10 text-white"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">סוג</Label>
                        <Select value={type} onValueChange={(v) => setType(v as LiabilityType)}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                {Object.entries(LIABILITY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-white/70">בעלות</Label>
                        <Select value={owner} onValueChange={(v) => setOwner(v as "him" | "her" | "joint")}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
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
                        <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="500,000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                        <Label className="text-white/70">יתרה נוכחית (₪)</Label>
                        <Input type="number" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder="350,000" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-white/70">ריבית שנתית (%)</Label>
                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="3.5" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                        <Label className="text-white/70">תשלום חודשי (₪)</Label>
                        <Input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} placeholder="3,500" className="mt-1 bg-white/5 border-white/10 text-white" />
                    </div>
                </div>

                <Button onClick={handleSubmit} disabled={addMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    {addMutation.isPending ? "...שומר" : "הוסף התחייבות"}
                </Button>
            </div>
        </DialogContent>
    );
}
