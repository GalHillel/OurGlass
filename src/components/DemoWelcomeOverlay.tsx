"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, ShieldCheck, ArrowRight } from "lucide-react";
import { DEMO_MODE } from "@/demo/demo-config";

const steps = [
    {
        title: "ברוכים הבאים ל-OurGlass Demo",
        description: "הכנו לכם סביבה מלאה כדי שתוכלו לחוות את האפליקציה בדיוק כמו זוג אמיתי. כל הנתונים כאן הם דוגמה (Mock) בעברית מלאה.",
        icon: Sparkles,
        color: "text-purple-400"
    },
    {
        title: "הכל מקומי, הכל בטוח",
        description: "אין צורך בהרשמה, אין חיבור לבסיס נתונים חיצוני. כל שינוי שתעשו יישמר רק בדפדפן שלכם (localStorage).",
        icon: ShieldCheck,
        color: "text-emerald-400"
    },
    {
        title: "מה תמצאו כאן?",
        description: "מעל 100 טרנזקציות של זוג דמיוני (גל ומאיה), ניהול נכסים, מנויים, רשימת משאלות ואפילו צ'אט AI חכם - הכל מוכן לעבודה.",
        icon: Rocket,
        color: "text-blue-400"
    }
];

export function DemoWelcomeOverlay() {
    const [isOpen, setIsOpen] = useState(() => {
        if (DEMO_MODE) {
            const hasSeen = typeof window !== 'undefined' ? localStorage.getItem("ourglass_demo_welcome_seen") : "true";
            return !hasSeen;
        }
        return false;
    });
    const [step, setStep] = useState(0);

    const handleClose = () => {
        localStorage.setItem("ourglass_demo_welcome_seen", "true");
        setIsOpen(false);
    };

    const currentStep = steps[step];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-slate-950/90 backdrop-blur-2xl border-white/10 text-white sm:max-w-md p-0 overflow-hidden outline-none">
                <div className="relative p-8 flex flex-col items-center text-center gap-6">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -10 }}
                            className="relative z-10 flex flex-col items-center gap-6"
                        >
                            <div className={`w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl`}>
                                <currentStep.icon className={`w-10 h-10 ${currentStep.color}`} />
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-2xl font-black tracking-tight">{currentStep.title}</h2>
                                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                                    {currentStep.description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="w-full flex flex-col gap-3 mt-4 relative z-10">
                        <Button 
                            onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : handleClose()}
                            className="bg-white text-black hover:bg-white/90 font-bold h-12 rounded-2xl w-full flex items-center justify-center gap-2 group"
                        >
                            {step < steps.length - 1 ? "המשך" : "יאללה, בואו נתחיל!"}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-[-4px]" />
                        </Button>
                        
                        <div className="flex justify-center gap-1.5 mt-2">
                            {steps.map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-white" : "w-1.5 bg-white/20"}`} 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
