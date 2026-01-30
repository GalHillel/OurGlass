"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingSplash } from "@/components/LoadingSplash";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const autoLogin = async () => {
            // Delay purely for the aesthetic feel of the "initializing" sequence
            // and to prevent a flash if the connection is too fast
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const email = process.env.NEXT_PUBLIC_AUTO_EMAIL;
                const password = process.env.NEXT_PUBLIC_AUTO_PASSWORD;

                if (!email || !password) {
                    throw new Error("Missing auto-login credentials");
                }

                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // toast.success("ברוכים הבאים הביתה ❤️");
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
    }, [router, supabase]);

    if (hasError) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 text-center">
                <div className="space-y-4">
                    <h1 className="text-red-500 text-xl font-bold">שגיאה בהתחברות</h1>
                    <p className="text-white/60">נא לוודא שמשתני הסביבה מוגדרים היטב.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                        נסה שוב
                    </button>
                </div>
            </div>
        );
    }

    return <LoadingSplash />;
}
