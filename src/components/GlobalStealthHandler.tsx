"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { triggerHaptic } from "@/utils/haptics";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";
import React from "react";

export function GlobalStealthHandler() {
    const { isStealthMode, toggleStealthMode } = useAppStore();

    useEffect(() => {
        let tapCount = 0;
        let lastTapTime = 0;
        const TRIPLE_TAP_DELAY = 500; // Total window for 3 taps

        const handleTap = (e: MouseEvent | TouchEvent) => {
            const currentTime = new Date().getTime();

            if (currentTime - lastTapTime > TRIPLE_TAP_DELAY) {
                tapCount = 0;
            }

            tapCount++;
            lastTapTime = currentTime;

            if (tapCount === 3) {
                // Triple tap detected
                toggleStealthMode();
                triggerHaptic();

                const stealthOn = !isStealthMode;

                toast(stealthOn ? "מצב פרטיות הופעל" : "מצב פרטיות כובה", {
                    icon: stealthOn ? <Shield className="w-4 h-4 text-blue-400" /> : <ShieldOff className="w-4 h-4 text-slate-400" />,
                    description: stealthOn ? "כל הסכומים הרגישים מוסתרים כעת" : "כל הסכומים גלויים כעת",
                });

                tapCount = 0;
            }
        };

        window.addEventListener('click', handleTap);
        return () => window.removeEventListener('click', handleTap);
    }, [isStealthMode, toggleStealthMode]);

    return null;
}
