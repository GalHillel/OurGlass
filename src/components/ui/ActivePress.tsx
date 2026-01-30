"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ActivePressProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

export const ActivePress = ({ children, className, onClick, disabled }: ActivePressProps) => {
    return (
        <motion.div
            className={cn("cursor-pointer touch-manipulation", className, disabled && "opacity-50 pointer-events-none")}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};
