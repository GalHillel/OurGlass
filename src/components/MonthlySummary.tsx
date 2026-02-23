"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, AlertTriangle, Shield, Check, CalendarCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Goal } from "@/types";

interface MonthlySummaryProps {
    currentBalance: number;
    onRefresh: () => void;
}

export const MonthlySummary = ({ currentBalance, onRefresh }: MonthlySummaryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'summary' | 'action' | 'done'>('summary');
    const [loading, setLoading] = useState(false);

    const supabase = createClient();
    const isSurplus = currentBalance > 0;
    const absAmount = Math.abs(currentBalance);

    const handleAction = async () => {
        setLoading(true);
        try {
            // Find "Fortress" (Savings) goal
            const { data: fortress } = await supabase
                .from('goals')
                .select('*')
                .eq('type', 'cash')
                .single() as { data: Goal | null };

            if (!fortress) throw new Error("לא נמצא מחסנית 'מבצר' (cash)");

            let newAmount = fortress.current_amount;
            let description = "";

            if (isSurplus) {
                // Add surplus to fortress
                newAmount += absAmount;
                description = `סגירת חודש: הפקדת עודף (${absAmount})`;
            } else {
                // Cover deficit from fortress
                newAmount -= absAmount;
                if (newAmount < 0) throw new Error("אין מספיק כסף במבצר לכיסוי הגירעון");
                description = `סגירת חודש: כיסוי גירעון (${absAmount})`;
            }

            // Update Goal
            const { error: goalError } = await supabase
                .from('goals')
                .update({ current_amount: newAmount })
                .eq('id', fortress.id);

            if (goalError) throw goalError;

            // Create Transaction to record this move (so budget resets sort of?)
            const { error: txError } = await supabase.from('transactions').insert({
                amount: isSurplus ? absAmount : -absAmount, // Surplus = Expense (leaves pocket), Deficit = Income (enters pocket)
                description: description,
                date: new Date().toISOString(),
                category_id: null,
                is_surprise: false
            });

            if (txError) throw txError;

            if (isSurplus) {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }

            setStep('done');
            onRefresh();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה בסגירת חודש", { description: err.message || "Unknown error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setStep('summary'); // Reset on close
        }}>
            <DialogTrigger asChild>
                <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-3xl p-4 border border-slate-700/50 backdrop-blur-md relative overflow-hidden flex items-center justify-between group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-slate-700/50 rounded-xl">
                            <CalendarCheck className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">סגירת חודש</h3>
                            <p className="text-[10px] text-slate-400">איפוס והעברת יתרות</p>
                        </div>
                    </div>
                </motion.div>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md w-[90vw] rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">סוגרים חודש 🌙</DialogTitle>
                </DialogHeader>

                <div className="py-6 text-center space-y-6">
                    {step === 'summary' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                            <div className="flex justify-center">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isSurplus ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                    {isSurplus ? <Trophy className="w-10 h-10 text-emerald-400" /> : <AlertTriangle className="w-10 h-10 text-red-400" />}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white/80">
                                    {isSurplus ? "כל הכבוד! נשארתם בפלוס" : "אופס... נכנסתם למינוס"}
                                </h3>
                                <div className={`text-4xl font-black mt-2 ${isSurplus ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ₪{currentBalance.toLocaleString()}
                                </div>
                            </div>
                            <Button className="w-full h-12 text-lg" onClick={() => setStep('action')}>
                                {isSurplus ? "מה עושים עם הכסף?" : "איך מכסים את זה?"}
                                <ArrowRight className="w-5 h-5 mr-2" />
                            </Button>
                        </div>
                    )}

                    {step === 'action' && (
                        <div className="animate-in fade-in slide-in-from-right-8 space-y-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                                <h4 className="text-xl font-bold mb-2">המבצר המשותף</h4>
                                <p className="text-white/60 text-sm leading-relaxed">
                                    {isSurplus
                                        ? `להעביר את העודף (₪${absAmount.toLocaleString()}) לחיסכון במבצר?`
                                        : `למשוך ₪${absAmount.toLocaleString()} מהמבצר כדי לאפס את העובר ושב?`
                                    }
                                </p>
                            </div>
                            <Button
                                onClick={handleAction}
                                disabled={loading}
                                className={`w-full h-12 font-bold ${isSurplus ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                                {loading ? "מבצע..." : isSurplus ? "כן, תעביר למבצר! 💰" : "כסה אותנו 🛡️"}
                            </Button>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="animate-in zoom-in duration-300 space-y-6">
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">בוצע בהצלחה!</h3>
                                <p className="text-white/60 mt-2">החודש נסגר והתקציב אופס.</p>
                            </div>
                            <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full border-white/10">
                                סגור
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
