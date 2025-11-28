"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error("שגיאה בהתחברות", { description: error.message });
            setLoading(false);
        } else {
            toast.success("התחברת בהצלחה!");
            router.refresh();
            router.push("/");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 p-8 glass rounded-3xl"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">OurGlass</h1>
                    <p className="text-white/60">התחברו כדי לראות את המצב</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="אימייל"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 text-lg text-center"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="סיסמה"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 text-lg text-center"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 text-lg bg-white text-black hover:bg-white/90 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? "מתחבר..." : "כניסה"}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
