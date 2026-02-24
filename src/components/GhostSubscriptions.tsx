"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, AlertCircle, Plus, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SwipeableRow } from "./SwipeableRow";

interface GhostSub {
    name: string;
    amount: number;
    frequency: string;
    confidence: number;
    reason: string;
}

const CACHE_KEY = "ourglass_ghost_subs_cache";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

interface GhostSubscriptionsProps {
    onAddGhost?: (ghost: { name: string; amount: number }) => void;
}

export function GhostSubscriptions({ onAddGhost }: GhostSubscriptionsProps) {
    const [ghosts, setGhosts] = useState<GhostSub[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    useEffect(() => {
        // Load from cache on mount if available
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    setGhosts(data);
                    setLastUpdated(timestamp);
                    setHasFetched(true);
                }
            } catch (e) {
                console.error("Failed to parse ghost subs cache", e);
            }
        }
    }, []);

    const fetchGhosts = async (force = false) => {
        setLoading(true);
        setError(null);
        setIsQuotaExceeded(false);

        try {
            const res = await fetch("/api/ghost-subs");
            if (!res.ok) {
                const errorText = await res.text();
                let errorMessage = "Failed to fetch ghost subscriptions";
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            const data = await res.json();
            setGhosts(data);
            setHasFetched(true);
            const timestamp = Date.now();
            setLastUpdated(timestamp);

            // Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));

            if (force) {
                toast.success("הנתונים עודכנו בהצלחה!");
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error(error);
            if (error.message?.includes("המכסה היומית") || error.message?.includes("429")) {
                setIsQuotaExceeded(true);
            } else {
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (ghost: GhostSub) => {
        if (onAddGhost) {
            onAddGhost({ name: ghost.name, amount: ghost.amount });
        } else {
            toast.success(`המנוי ${ghost.name} נוסף למעקב!`);
            const updatedGhosts = ghosts.filter(g => g.name !== ghost.name);
            setGhosts(updatedGhosts);

            // Update cache
            if (lastUpdated) {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedGhosts, timestamp: lastUpdated }));
            }
        }
    };

    const handleIgnore = (name: string) => {
        toast.info("המנוי הוסתר");
        const updatedGhosts = ghosts.filter(g => g.name !== name);
        setGhosts(updatedGhosts);

        // Update cache
        if (lastUpdated) {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: updatedGhosts, timestamp: lastUpdated }));
        }
    };

    if (isQuotaExceeded) {
        return (
            <div className="neon-card p-4 border-violet-500/20 bg-violet-500/5 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 shrink-0 opacity-50" />
                <div className="flex-1">
                    <p className="text-xs text-violet-200/60 font-medium">ה-AI שלנו נח כרגע...</p>
                    <p className="text-[10px] text-violet-200/40">נחזור לזהות מנויים אוטומטית בקרוב.</p>
                </div>
            </div>
        );
    }

    if (!hasFetched && !loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Ghost className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">זיהוי מנויי רפאים</h3>
                        <p className="text-[10px] text-white/40">סרוק את החשבון למציאת הוצאות נסתרות</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchGhosts()}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
                >
                    <Sparkles className="w-4 h-4" />
                    סרוק מנויים נסתרים עם AI
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="neon-card p-8 border-purple-500/20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <div className="text-center">
                    <p className="text-sm font-bold text-white">ה-AI סורק את העסקאות שלך...</p>
                    <p className="text-[10px] text-white/40">זה לוקח כמה שניות</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="neon-card p-4 border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-200/80">{error}</p>
                <button
                    onClick={() => fetchGhosts(true)}
                    className="mr-auto p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4 text-white/40" />
                </button>
            </div>
        );
    }

    if (hasFetched && ghosts.length === 0) {
        return (
            <div className="neon-card p-6 border-emerald-500/20 bg-emerald-500/5 text-center">
                <p className="text-sm font-bold text-emerald-400">לא נמצאו מנויי רפאים!</p>
                <p className="text-[10px] text-emerald-400/60 mt-1">הכל נראה תקין בחשבון שלך.</p>
                <button
                    onClick={() => fetchGhosts(true)}
                    className="mt-4 text-[10px] text-white/40 hover:text-white/60 flex items-center gap-1 mx-auto"
                >
                    <RefreshCw className="w-3 h-3" />
                    בדוק שוב
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Ghost className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight">זיהוי מנויי רפאים</h3>
                        <p className="text-[10px] text-white/40">מצאנו הוצאות קבועות שלא מופיעות ברשימה שלך</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchGhosts(true)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
                    title="רענן סריקה"
                >
                    <RefreshCw className="w-4 h-4 text-white/40 group-hover:text-violet-400 transition-colors" />
                </button>
            </div>

            <div className="grid gap-3">
                <AnimatePresence>
                    {ghosts.map((ghost) => (
                        <SwipeableRow
                            key={ghost.name}
                            onEdit={() => handleAdd(ghost)}
                            onDelete={() => handleIgnore(ghost.name)}
                            deleteMessage="להתעלם מהמנוי הזה בעתיד?"
                        >
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="neon-card p-4 border-purple-500/20 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-purple-500/[0.02] group-hover:bg-purple-500/[0.05] transition-colors" />

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-white">{ghost.name}</h4>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                {Math.round(ghost.confidence * 100)}% ודאות
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3 text-amber-400" />
                                            {ghost.reason}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-lg font-black text-white">₪{ghost.amount}</div>
                                        <div className="text-[10px] text-white/40 uppercase">חודשי</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 relative z-10">
                                    <button
                                        onClick={() => handleAdd(ghost)}
                                        className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-lg shadow-purple-500/20"
                                    >
                                        <Plus className="w-3 h-3" />
                                        הוסף למעקב
                                    </button>
                                    <button
                                        onClick={() => handleIgnore(ghost.name)}
                                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-medium"
                                    >
                                        התעלם
                                    </button>
                                </div>
                            </motion.div>
                        </SwipeableRow>
                    ))}
                </AnimatePresence>
            </div>

            {lastUpdated && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <p className="text-[10px] text-white/20 italic">
                        עודכן לאחרונה מזיכרון ה-AI
                    </p>
                    <button
                        onClick={() => fetchGhosts(true)}
                        className="p-1 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <RefreshCw className="w-3 h-3 text-white/20" />
                    </button>
                </div>
            )}
        </div>
    );
}
