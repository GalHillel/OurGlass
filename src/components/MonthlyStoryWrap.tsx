"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorySlide {
    title: string;
    description: string;
    emoji: string;
    colorGlow: string;
}

interface MonthlyStoryWrapProps {
    onClose: () => void;
}

export function MonthlyStoryWrap({ onClose }: MonthlyStoryWrapProps) {
    const [slides, setSlides] = useState<StorySlide[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        async function fetchStory() {
            try {
                const res = await fetch("/api/monthly-story");
                const text = await res.text();

                if (!res.ok) {
                    let errorMessage = "Failed to generate story";
                    try {
                        const errorJson = JSON.parse(text);
                        errorMessage = errorJson.error || errorMessage;
                    } catch {
                        errorMessage = text || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                const data = JSON.parse(text);
                setSlides(data);
                setLoading(false);
            } catch (err: unknown) {
                const error = err as Error;
                console.error("Fetch Story Error:", error);
                setError(error.message);
                setLoading(false);
            }
        }
        fetchStory();
    }, [onClose]);

    useEffect(() => {
        if (loading || slides.length === 0) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    if (currentIndex < slides.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        return 0;
                    } else {
                        onClose();
                        return 100;
                    }
                }
                return prev + 1; // 100 steps in 5s (approx)
            });
        }, 50);

        return () => clearInterval(interval);
    }, [currentIndex, loading, slides, onClose]);

    const next = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center w-screen h-screen" dir="rtl">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Sparkles className="w-12 h-12 text-blue-400" />
                </motion.div>
                <p className="absolute bottom-20 text-blue-400/60 font-mono tracking-widest uppercase text-sm text-center w-full px-8">מייצר את הסיפור שלכם...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center space-y-6 w-screen h-screen" dir="rtl">
                <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">אופס, ה-AI עמוס כרגע</h2>
                <p className="text-white/60 text-lg">
                    {error}
                </p>
                <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
                >
                    הבנתי, אחזור אחר כך
                </button>
            </div>
        );
    }

    const currentSlide = slides[currentIndex];

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white select-none w-screen h-screen overflow-hidden touch-none" dir="rtl">
            {/* Background Glow */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn("absolute inset-0 bg-gradient-to-b opacity-40 blur-3xl", currentSlide.colorGlow, "to-black")}
                />
            </AnimatePresence>

            {/* Progress Bars (Right to Left) */}
            <div className="absolute top-4 left-4 right-4 flex flex-row-reverse gap-1.5 z-[10000]" dir="rtl">
                {slides.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={false}
                            animate={{
                                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%"
                            }}
                            className="h-full bg-white origin-right"
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 left-4 right-4 flex flex-row-reverse justify-between items-center z-50">
                <div className="flex flex-row-reverse items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px]">OG</div>
                    </div>
                    <span className="font-bold text-sm tracking-tight">OurGlass AI Recap</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors rotate-180">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Slide Content */}
            <div className="h-full flex flex-col items-center justify-center p-8 text-center relative z-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="text-8xl mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{currentSlide.emoji}</div>
                        <h2 className="text-4xl font-black neon-text leading-tight text-right">{currentSlide.title}</h2>
                        <p className="text-xl text-white/80 max-w-xs mx-auto leading-relaxed text-right">
                            {currentSlide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls - RTL Instagram Logic: Left = NEXT, Right = PREV */}
            <div className="absolute inset-0 z-30 flex">
                <div className="w-1/2 h-full cursor-pointer" onClick={next} title="Next Slide (Left)" />
                <div className="w-1/2 h-full cursor-pointer" onClick={prev} title="Prev Slide (Right)" />
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-12 left-0 right-0 p-8 flex justify-center z-40">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold tracking-widest uppercase"
                >
                    סגור
                </motion.button>
            </div>
        </div>
    );
}
