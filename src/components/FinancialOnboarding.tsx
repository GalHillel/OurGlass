"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Wallet, Target, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { hapticSuccess } from "@/utils/haptics";
import { PAYERS, CURRENCY_SYMBOL } from "@/lib/constants";

interface OnboardingData {
    name: string;
    monthlyIncome: string;
    budget: string;
    partnerName: string;
}

const STEPS = [
    {
        id: "welcome",
        icon: Sparkles,
        title: "!ברוכים הבאים ל-OurGlass",
        subtitle: "בואו נתחיל לבנות את העתיד הכלכלי שלכם יחד",
    },
    {
        id: "profile",
        icon: Users,
        title: "מי אתם?",
        subtitle: "נכיר אתכם קצת כדי להתאים את החוויה",
    },
    {
        id: "budget",
        icon: Wallet,
        title: "הגדרת תקציב",
        subtitle: "כמה מרוויחים וכמה רוצים להוציא בחודש",
    },
    {
        id: "goals",
        icon: Target,
        title: "!הכל מוכן",
        subtitle: "אתם מוכנים להתחיל לנהל את הכספים בחוכמה",
    },
];

export function FinancialOnboarding({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        name: "",
        monthlyIncome: "",
        budget: "",
        partnerName: "",
    });
    const [saving, setSaving] = useState(false);
    const { user, updateProfile } = useAuth();

    const handleNext = useCallback(() => {
        if (step < STEPS.length - 1) {
            setStep((s) => s + 1);
        }
    }, [step]);

    const handleBack = useCallback(() => {
        if (step > 0) {
            setStep((s) => s - 1);
        }
    }, [step]);

    const handleFinish = useCallback(async () => {
        if (!user) return;
        setSaving(true);

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("profiles")
                .update({
                    name: data.name || null,
                    monthly_income: data.monthlyIncome ? Number(data.monthlyIncome) : 0,
                    budget: data.budget ? Number(data.budget) : 20000,
                    onboarding_completed: true,
                })
                .eq("id", user.id);

            if (error) throw error;

            updateProfile({
                name: data.name,
                monthly_income: Number(data.monthlyIncome) || 0,
                budget: Number(data.budget) || 20000,
            } as Partial<import("@/types").Profile>);

            hapticSuccess();
            toast.success("!ההגדרות נשמרו בהצלחה");
            onComplete();
        } catch {
            toast.error("שגיאה בשמירת ההגדרות");
        } finally {
            setSaving(false);
        }
    }, [user, data, onComplete, updateProfile]);

    const currentStep = STEPS[step];
    const StepIcon = currentStep.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i === step
                                ? "w-8 bg-blue-500"
                                : i < step
                                    ? "w-2 bg-blue-500/60"
                                    : "w-2 bg-white/20"
                                }`}
                        />
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="glass rounded-2xl p-8 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                            <StepIcon className="w-8 h-8 text-blue-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {currentStep.title}
                        </h2>
                        <p className="text-white/60 mb-8">{currentStep.subtitle}</p>

                        {/* Step 1: Profile */}
                        {step === 1 && (
                            <div className="space-y-4 text-right">
                                <div>
                                    <Label className="text-white/80">השם שלך</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData({ ...data, name: e.target.value })}
                                        placeholder={`למשל: ${PAYERS.HIM}`}
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-white/80">שם בן/בת הזוג</Label>
                                    <Input
                                        value={data.partnerName}
                                        onChange={(e) =>
                                            setData({ ...data, partnerName: e.target.value })
                                        }
                                        placeholder={`למשל: ${PAYERS.HER}`}
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Budget */}
                        {step === 2 && (
                            <div className="space-y-4 text-right">
                                <div>
                                    <Label className="text-white/80">הכנסה חודשית ({CURRENCY_SYMBOL})</Label>
                                    <Input
                                        type="number"
                                        value={data.monthlyIncome}
                                        onChange={(e) =>
                                            setData({ ...data, monthlyIncome: e.target.value })
                                        }
                                        placeholder="20,000"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-white/80">תקציב חודשי להוצאות ({CURRENCY_SYMBOL})</Label>
                                    <Input
                                        type="number"
                                        value={data.budget}
                                        onChange={(e) =>
                                            setData({ ...data, budget: e.target.value })
                                        }
                                        placeholder="15,000"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Done */}
                        {step === 3 && (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-10 h-10 text-emerald-400" />
                                </div>
                                <p className="text-white/60 text-sm">
                                    אפשר תמיד לשנות הגדרות אלה בהמשך דרך דף ההגדרות
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-6 gap-3">
                    {step > 0 ? (
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            <ArrowRight className="w-4 h-4 ml-2" />
                            חזרה
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < STEPS.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            הבא
                            <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saving ? "...שומר" : "בואו נתחיל! 🚀"}
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
