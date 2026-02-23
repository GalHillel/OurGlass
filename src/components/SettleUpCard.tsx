"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Check, ChevronDown, ChevronUp, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettleUp } from "@/hooks/useJointFinance";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "react-countup";
import { toast } from "sonner";
import { hapticSuccess, triggerHaptic } from "@/utils/haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export function SettleUpCard() {
    const { data, isLoading } = useSettleUp();
    const [expanded, setExpanded] = useState(false);
    const queryClient = useQueryClient();
    const { profile } = useAuth();
    const supabase = createClient();

    const settleMutation = useMutation({
        mutationFn: async ({ amount, himOwes }: { amount: number, himOwes: number }) => {
            if (!profile?.couple_id) throw new Error("No couple ID");

            // himOwes positive -> him owes her. So "him" is paying "her"
            // "him" gets an expense, "her" gets a negative expense (income)
            const payer = himOwes > 0 ? "him" : "her";
            const receiver = himOwes > 0 ? "her" : "him";

            const settleTxs = [
                {
                    amount: amount,
                    category_id: null, // "Settlement" category_id would be ideal but null is okay for auto-generated adjustment
                    couple_id: profile.couple_id,
                    description: "העברת התחשבנות (תשלום המשתווה)",
                    date: new Date().toISOString(),
                    payer: payer,
                    is_auto_generated: true, // Mark as auto to exclude from variable burn rate
                },
                {
                    amount: -amount, // Income for receiver
                    category_id: null,
                    couple_id: profile.couple_id,
                    description: "העברת התחשבנות (קבלת תשלום)",
                    date: new Date().toISOString(),
                    payer: receiver,
                    is_auto_generated: true,
                }
            ];

            const { error } = await supabase.from("transactions").insert(settleTxs);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settle-up"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["guilt-free"] });
            hapticSuccess();
            toast.success("בום! החשבון סודר 🎉");
            setExpanded(false);
        },
        onError: (error: any) => {
            toast.error(`שגיאה בסידור חשבון: ${error.message}`);
        }
    });

    if (isLoading) {
        return <Skeleton className="h-32 w-full rounded-2xl bg-white/5" />;
    }

    if (!data) return null;

    const { himTotal, herTotal, jointTotal, splitRatio, himOwes } = data;
    const isSettled = Math.abs(himOwes) < 1;
    const whoOwes = himOwes > 0 ? "הוא" : "היא";
    const oweAmount = Math.abs(himOwes);

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSettled ? "bg-emerald-500/20" : "bg-orange-500/20"
                        }`}>
                        {isSettled ? (
                            <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <ArrowLeftRight className="w-5 h-5 text-orange-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">סידור חשבון</h3>
                        <p className="text-sm text-white/60">
                            {isSettled
                                ? "מסודר! אין חובות 🎉"
                                : `${whoOwes} חייב/ת ₪${oweAmount.toLocaleString()}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    {expanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                </button>
            </div>

            {/* Big Number */}
            {!isSettled && (
                <div className="px-6 pb-6">
                    <div className="text-center py-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <p className="text-[10px] text-white/40 mb-1">{whoOwes} צריך/ה להעביר</p>
                        <div className="text-3xl font-black text-orange-400">
                            ₪<CountUp end={oweAmount} separator="," duration={0.8} />
                        </div>
                        <Button
                            size="sm"
                            className="mt-3 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs"
                            onClick={() => {
                                triggerHaptic();
                                settleMutation.mutate({ amount: oweAmount, himOwes });
                            }}
                            disabled={settleMutation.isPending}
                        >
                            {settleMutation.isPending ? (
                                <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                            ) : (
                                <Check className="w-3 h-3 ml-1" />
                            )}
                            {settleMutation.isPending ? "מסדר..." : "סמן כמסודר"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10 px-6 py-6 space-y-4"
                >
                    {/* Split visualization */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-500/10 rounded-xl p-2 border border-blue-500/10">
                            <p className="text-[9px] text-blue-300/60 uppercase tracking-wider">הוא</p>
                            <p className="text-sm font-bold text-blue-300">₪{himTotal.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-500/10 rounded-xl p-2 border border-purple-500/10">
                            <p className="text-[9px] text-purple-300/60 uppercase tracking-wider">משותף</p>
                            <p className="text-sm font-bold text-purple-300">₪{jointTotal.toLocaleString()}</p>
                        </div>
                        <div className="bg-pink-500/10 rounded-xl p-2 border border-pink-500/10">
                            <p className="text-[9px] text-pink-300/60 uppercase tracking-wider">היא</p>
                            <p className="text-sm font-bold text-pink-300">₪{herTotal.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Split ratio */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">חלוקה:</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-pink-500"
                                style={{ width: `${splitRatio * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-white/30">
                            {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
