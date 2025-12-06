"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Lock, Delete, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (pin.length === 4) {
            handleLogin();
        }
    }, [pin]);

    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleLogin = async () => {
        if (cooldown > 0) {
            toast.error("נסו שוב בעוד כמה שניות");
            return;
        }

        setLoading(true);

        // DELAY for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 800));

        if (pin === "1103") {
            try {
                // Hardcoded credentials as requested for this build
                const { error } = await supabase.auth.signInWithPassword({
                    email: 'admin@ourglass.app',
                    password: 'password123',
                });

                if (error) throw error;

                toast.success("ברוכים הבאים הביתה ❤️");
                router.refresh();
                router.push("/");
            } catch (error: any) {
                // If we get a rate limit error, force a longer cooldown
                if (error.message?.includes("rate limit") || error.status === 429) {
                    setCooldown(60); // 1 minute cooldown for actual rate limits
                    toast.error("יותר מדי ניסיונות", { description: "נא להמתין דקה" });
                } else {
                    toast.error("שגיאה בהתחברות", { description: error.message });
                    setCooldown(5); // 5 second cooldown for other errors
                }
                shakeError();
            }
        } else {
            shakeError();
            toast.error("קוד שגוי", { description: "נסו שוב" });
            setCooldown(2); // Short cooldown for wrong PIN to prevent spamming
        }
        setLoading(false);
    };

    const shakeError = () => {
        setError(true);
        setTimeout(() => {
            setPin("");
            setError(false);
        }, 500);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm z-10"
            >
                <div className="text-center space-y-6 mb-10">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                        <Lock className="w-8 h-8 text-white/80" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">OurGlass</h1>
                        <p className="text-white/40 text-sm">המבצר הפיננס של גל ואיריס</p>
                    </div>
                </div>

                {/* PIN Dots */}
                <div dir="ltr" className="flex justify-center gap-4 mb-12 h-4">
                    <AnimatePresence mode="wait">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={{
                                    scale: pin.length > i ? 1.2 : 1,
                                    backgroundColor: pin.length > i ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.1)",
                                    borderColor: error ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.2)"
                                }}
                                className={`w-4 h-4 rounded-full border border-white/20 transition-all duration-200 ${error ? 'bg-red-500/50' : ''}`}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Keypad */}
                <motion.div
                    dir="ltr"
                    animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-3 gap-6 px-4"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            disabled={loading}
                            className="h-20 w-20 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-3xl font-light text-white transition-all active:scale-90 flex items-center justify-center mx-auto"
                        >
                            {num}
                        </button>
                    ))}

                    {/* Bottom Row */}
                    <div className="h-20 w-20 mx-auto" /> {/* Empty spacer */}

                    <button
                        onClick={() => handleNumberClick("0")}
                        disabled={loading}
                        className="h-20 w-20 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-3xl font-light text-white transition-all active:scale-90 flex items-center justify-center mx-auto"
                    >
                        0
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="h-20 w-20 rounded-full bg-transparent text-white/40 hover:text-white transition-all active:scale-90 flex items-center justify-center mx-auto"
                    >
                        <Delete className="w-8 h-8" />
                    </button>
                </motion.div>

                <p className="text-center text-white/20 text-xs mt-12">
                    Secured by OurGlass
                </p>
            </motion.div>
        </div>
    );
}
