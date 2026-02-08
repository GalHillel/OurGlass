"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const PWAInstallPrompt = () => {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Check if already installed (standalone)
        const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(standalone);

        // Show prompt if iOS and NOT standalone
        if (ios && !standalone) {
            // Check if user dismissed it recently (optional, skipping for now to ensure visibility)
            const hasSeen = localStorage.getItem("pwa_prompt_dismissed");
            if (!hasSeen) {
                // Delay slightly for effect
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
    };

    if (!isIOS || isStandalone) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-3xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                            <div className="relative w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50 overflow-hidden">
                                <Image src="/icons/icon-192x192.png" alt="OurGlass" width={32} height={32} className="object-contain opacity-90" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">OurGlass</h3>
                                <p className="text-sm text-slate-400">להתקין כאפליקציה למסך הבית</p>
                            </div>
                        </div>
                        <button onClick={dismiss} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs">1</span>
                            <span>לחצו על כפתור השיתוף <Share className="w-4 h-4 inline mx-1 text-blue-400" /> למטה</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs">2</span>
                            <span>בחרו באפשרות <span className="font-bold text-white">"הוסף למסך הבית"</span></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlusSquare className="w-5 h-5 text-slate-400 ml-9" />
                        </div>
                    </div>

                    {/* Visual Arrow pointing down */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
