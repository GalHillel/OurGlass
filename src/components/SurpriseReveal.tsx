"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, EyeOff, PartyPopper } from "lucide-react";
import { Transaction } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import { hapticSuccess, hapticHeavy } from "@/utils/haptics";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";

const generateParticles = () =>
    Array.from({ length: 24 }).map((_, i) => ({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        rotate: Math.random() * 720,
        duration: 1.5 + Math.random() * 0.5,
        delay: Math.random() * 0.3,
        bg: [
            "#f472b6", "#a78bfa", "#60a5fa", "#34d399",
            "#fbbf24", "#fb923c", "#f87171", "#c084fc",
        ][i % 8],
    }));

interface Particle {
    x: number;
    y: number;
    rotate: number;
    duration: number;
    delay: number;
    bg: string;
}

interface SurpriseRevealProps {
    transaction: Transaction;
    /** Whether the current user is the recipient (not the one who marked it) */
    isRecipient: boolean;
}

/**
 * Surprise Transaction Reveal
 *
 * When a transaction is marked as `is_surprise`, it stays blurred until
 * the `surprise_reveal_date` is reached, at which point the recipient
 * can tap to reveal it with a confetti animation.
 */
export function SurpriseReveal({ transaction, isRecipient }: SurpriseRevealProps) {
    const [revealed, setRevealed] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const canReveal =
        !transaction.surprise_reveal_date ||
        new Date(transaction.surprise_reveal_date) <= new Date();

    const particles = useMemo(() => generateParticles(), []);

    const handleReveal = useCallback(() => {
        if (!canReveal || revealed) return;

        hapticHeavy();
        setShowConfetti(true);
        setTimeout(() => {
            hapticSuccess();
            setRevealed(true);
        }, 600);
        setTimeout(() => setShowConfetti(false), 3000);
    }, [canReveal, revealed]);

    if (!transaction.is_surprise) {
        return null; // Not a surprise transaction
    }

    const isHidden = isRecipient && !revealed && canReveal;
    const isLocked = isRecipient && !revealed && !canReveal;

    return (
        <div className="relative">
            {/* Confetti burst */}
            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 1 } }}
                    >
                        {particles.map((p: Particle, i: number) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    left: "50%",
                                    top: "50%",
                                    backgroundColor: p.bg,
                                }}
                                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                                animate={{
                                    x: p.x,
                                    y: p.y,
                                    scale: [0, 1.5, 0.5],
                                    opacity: [1, 1, 0],
                                    rotate: p.rotate,
                                }}
                                transition={{
                                    duration: p.duration,
                                    delay: p.delay,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transaction Card */}
            <motion.div
                className={cn(
                    "neon-card p-4 rounded-2xl relative overflow-hidden transition-all",
                    isHidden && "cursor-pointer hover:bg-white/5 border-white/10",
                    isLocked && "opacity-60 border-white/5"
                )}
                onClick={isHidden ? handleReveal : undefined}
                whileTap={isHidden ? { scale: 0.97 } : undefined}
            >
                {/* Blur overlay */}
                {(isHidden || isLocked) && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-2xl">
                        <div className="text-center space-y-2 px-4">
                            {isLocked ? (
                                <>
                                    <EyeOff className="w-8 h-8 text-purple-400/50 mx-auto" />
                                    <p className="text-xs text-purple-300/40">
                                        הפתעה! תתגלה ב-{formatDate(transaction.surprise_reveal_date!, LOCALE)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Gift className="w-10 h-10 text-purple-400 mx-auto" />
                                    </motion.div>
                                    <p className="text-sm text-purple-200 font-bold">לחץ/י לגלות! 🎁</p>
                                    <p className="text-[10px] text-white/30">הפתעה ממתינה לך</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Actual content (visible when not hidden) */}
                <div className={cn("flex items-center gap-4", (isHidden || isLocked) && "invisible")}>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                        {revealed ? (
                            <PartyPopper className="w-5 h-5 text-purple-400" />
                        ) : (
                            <Gift className="w-5 h-5 text-purple-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                            {transaction.description || "הפתעה"}
                        </p>
                        <p className="text-[10px] text-white/40">
                            {formatDate(transaction.date, LOCALE)}
                        </p>
                    </div>
                    <div className="text-left">
                        <p className="font-black text-lg text-purple-300">
                            {CURRENCY_SYMBOL}{transaction.amount.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Revealed sparkle */}
                {revealed && (
                    <motion.div
                        className="absolute top-2 right-2"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                    >
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                            ✨ נחשף!
                        </span>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

/**
 * Small surprise badge for transaction list items
 */
export function SurpriseBadge({ isSurprise }: { isSurprise: boolean | null }) {
    if (!isSurprise) return null;

    return (
        <span className="inline-flex items-center gap-1 text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/20">
            <Gift className="w-2.5 h-2.5" />
            הפתעה
        </span>
    );
}
