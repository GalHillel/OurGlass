"use client";

import { motion } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    /** Hint text shown below the CTA button */
    hint?: string;
    /** Show a "+" icon on the CTA button */
    showPlusIcon?: boolean;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
    hint,
    showPlusIcon = false,
}: EmptyStateProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center space-y-4",
                "rounded-3xl border border-white/5 border-dashed bg-white/[0.03] backdrop-blur-sm",
                className
            )}
            role="status"
            aria-label={title}
        >
            <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center mb-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <Icon className="w-8 h-8 text-blue-400/60" />
            </motion.div>

            <div className="space-y-1.5 max-w-[300px]">
                <h3 className="text-lg font-bold text-white/90">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{description}</p>
            </div>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="mt-4 bg-blue-600/80 hover:bg-blue-600 text-white border-0 gap-2"
                >
                    {showPlusIcon && <Plus className="w-4 h-4" />}
                    {actionLabel}
                </Button>
            )}

            {hint && (
                <p className="text-xs text-white/30 mt-2">{hint}</p>
            )}
        </motion.div>
    );
};
