"use client";

import { useLiveAssetBalance } from "@/hooks/useLiveAssetBalance";
import { Goal } from "@/types";
import { formatAmount } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface LiveAssetTickerProps {
    asset: Goal;
    className?: string;
}

export function LiveAssetTicker({ asset, className }: LiveAssetTickerProps) {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    const liveBalance = useLiveAssetBalance(asset);

    // If it's a "static" asset (cash with no interest), we can just show the value
    // but the hook handles that by returning the initial value.

    return (
        <span className={className}>
            {formatAmount(liveBalance, isStealthMode, CURRENCY_SYMBOL)}
        </span>
    );
}
