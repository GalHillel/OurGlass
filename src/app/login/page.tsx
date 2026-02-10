"use client";

import { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingSplash } from "@/components/LoadingSplash";

export default function LoginPage() {
    const router = useRouter();
    const supabaseRef = useRef(createClientComponentClient());
    const supabase = supabaseRef.current;
    const [hasError, setHasError] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const attemptedLogin = useRef(false);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = setTimeout(() => setCooldownSeconds(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldownSeconds]);

    useEffect(() => {
        const autoLogin = async () => {
            // Prevent double-fire with ref guard
            if (attemptedLogin.current) return;
            attemptedLogin.current = true;

            try {
                // Check for existing session first - avoid unnecessary login attempt
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    router.replace("/");
                    return;
                }

                // Delay for aesthetic loading feel
                await new Promise(resolve => setTimeout(resolve, 1500));

                const email = process.env.NEXT_PUBLIC_AUTO_EMAIL;
                const password = process.env.NEXT_PUBLIC_AUTO_PASSWORD;

                if (!email || !password) {
                    throw new Error("Missing auto-login credentials");
                }

                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    // Handle rate limit (429) specifically
                    if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
                        setCooldownSeconds(60);
                        toast.error("נסיונות רבים מדי", {
                            description: "אנא המתן 60 שניות ונסה שוב"
                        });
                        setHasError(true);
                        return;
                    }
                    throw error;
                }

                router.refresh();
                router.replace("/");
            } catch (error: any) {
                console.error("Auto-login failed:", error);
                setHasError(true);
                toast.error("שגיאה בהתחברות אוטומטית", {
                    description: "אנא בדקו את ההגדרות או התחברו ידנית"
                });
            }
        };

        autoLogin();
        // Empty dependency array - run only once on mount
    }, []);

    const handleRetry = () => {
        if (cooldownSeconds > 0) return;
        attemptedLogin.current = false;
        setHasError(false);
        window.location.reload();
    };

    if (hasError) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 text-center">
                <div className="space-y-4">
                    <h1 className="text-red-500 text-xl font-bold">שגיאה בהתחברות</h1>
                    {cooldownSeconds > 0 ? (
                        <p className="text-white/60">
                            אנא המתן <span className="text-amber-400 font-bold">{cooldownSeconds}</span> שניות לפני ניסיון נוסף
                        </p>
                    ) : (
                        <p className="text-white/60">נא לוודא שמשתני הסביבה מוגדרים היטב.</p>
                    )}
                    <button
                        onClick={handleRetry}
                        disabled={cooldownSeconds > 0}
                        className={`px-6 py-2 rounded-full transition-colors ${cooldownSeconds > 0
                            ? "bg-white/5 text-white/30 cursor-not-allowed"
                            : "bg-white/10 hover:bg-white/20"
                            }`}
                    >
                        {cooldownSeconds > 0 ? `המתן ${cooldownSeconds}s` : "נסה שוב"}
                    </button>
                </div>
            </div>
        );
    }

    return <LoadingSplash />;
}
