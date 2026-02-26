"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

import { useAppStore } from "@/stores/appStore";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    fontSize?: string;
    fontWeight?: string;
    className?: string;
    color?: string;
    showPlus?: boolean;
    prefix?: string;
    currencySymbol?: string;
}

export function AnimatedCounter({
    value,
    className = "",
    prefix = "",
    currencySymbol = ""
}: AnimatedCounterProps) {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 40,
        stiffness: 100,
    });

    const displayValue = useTransform(springValue, (latest) => {
        if (isStealthMode) return currencySymbol + "***";
        return prefix + Math.round(latest).toLocaleString();
    });

    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    return (
        <motion.span className={className}>
            {displayValue}
        </motion.span>
    );
}
