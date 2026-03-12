"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { hapticSuccess } from "@/utils/haptics";
import { PAYERS } from "@/lib/constants";

export const IdentityGate = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const { appIdentity, setAppIdentity } = useAppStore();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Don't show anything while determining mount/auth/identity status
    if (!isMounted || loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white/80 rounded-full animate-spin" />
        </div>;
    }

    // If not logged in at all, just render children (auth protection handles redirects)
    if (!user) {
        return <>{children}</>;
    }

    // If logged in and identity is selected, render app
    if (appIdentity) {
        return <>{children}</>;
    }

    // Otherwise, show the Netflix-style profile selector
    const handleSelect = (identity: 'him' | 'her') => {
        hapticSuccess();
        setAppIdentity(identity);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6 antialiased">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-pink-900/20 pointer-events-none" />

            {/* Glowing orb background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-lg max-h-lg bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md flex flex-col items-center"
            >
                <div className="flex items-center gap-2 mb-12">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <h1 className="text-3xl font-black text-white tracking-tight">מי משתמש באפליקציה?</h1>
                </div>

                <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
                    {/* GAL */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect('him')}
                        className="group flex flex-col items-center gap-4"
                    >
                        <div className="w-full aspect-square rounded-3xl bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/30 group-hover:border-blue-400 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
                            <span className="text-5xl">👨🏻</span>
                        </div>
                        <span className="text-xl font-bold text-white/80 group-hover:text-white transition-colors">{PAYERS.HIM}</span>
                    </motion.button>

                    {/* MAYA */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect('her')}
                        className="group flex flex-col items-center gap-4"
                    >
                        <div className="w-full aspect-square rounded-3xl bg-pink-500/20 border-2 border-pink-500/30 flex items-center justify-center group-hover:bg-pink-500/30 group-hover:border-pink-400 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all duration-300">
                            <span className="text-5xl">👩🏻</span>
                        </div>
                        <span className="text-xl font-bold text-white/80 group-hover:text-white transition-colors">{PAYERS.HER}</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};
