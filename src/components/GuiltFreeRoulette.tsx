"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Gift, Zap, Utensils, Coffee, Camera, Plane, Music, Sparkles, Heart } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

const TREATS = [
    { label: "דייט בבקתה", icon: Plane, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "ארוחת שף", icon: Utensils, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "ערב סרט", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "קפה ומאפה", icon: Coffee, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "יום ספא", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "סדנת צילום", icon: Camera, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "כרטיס להופעה", icon: Music, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "מתנה קטנה", icon: Gift, color: "text-cyan-400", bg: "bg-cyan-500/10" },
];

export function GuiltFreeRoulette() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<typeof TREATS[0] | null>(null);

    const spin = async () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setResult(null);
        triggerHaptic();

        // Realistic spin logic with deceleration
        const totalSteps = 25 + Math.floor(Math.random() * 10);
        let currentStep = 0;

        const runSpin = async () => {
            if (currentStep >= totalSteps) return;

            const randomIndex = Math.floor(Math.random() * TREATS.length);
            setResult(TREATS[randomIndex]);
            triggerHaptic();

            currentStep++;
            // Calculate delay based on step for deceleration effect
            const delay = 100 + (Math.pow(currentStep / totalSteps, 2) * 400);

            await new Promise(resolve => setTimeout(resolve, delay));
            await runSpin();
        };

        await runSpin();

        const finalResult = TREATS[Math.floor(Math.random() * TREATS.length)];
        setResult(finalResult);
        setIsSpinning(false);

        const confetti = (await import("canvas-confetti")).default;
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });
    };

    return (
        <div className="neon-card p-8 rounded-[2rem] border border-white/10 flex flex-col items-center gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white/5 flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                    {result ? (
                        <motion.div
                            key={result.label}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={result.bg + " p-4 rounded-full"}
                        >
                            <result.icon className={"w-8 h-8 " + result.color} />
                        </motion.div>
                    ) : (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-8 h-8 text-white/20" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="text-center min-h-[60px]">
                {result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h3 className="text-2xl font-black text-white mb-1">{result.label}</h3>
                        <p className="text-xs text-white/40 tracking-widest uppercase">הזכייה שלכם להיום!</p>
                    </motion.div>
                ) : (
                    <p className="text-sm text-white/40 max-w-[200px] leading-relaxed">
                        נשאר עודף בתקציב? תנו למזל להחליט איך להתפנק.
                    </p>
                )}
            </div>

            <Button
                onClick={spin}
                disabled={isSpinning}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
            >
                {isSpinning ? "מגריל..." : "סובבו את הגלגל"}
            </Button>
        </div>
    );
}

