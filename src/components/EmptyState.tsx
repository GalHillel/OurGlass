"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center space-y-4",
                "rounded-3xl border border-white/5 border-dashed bg-white/5 backdrop-blur-sm",
                className
            )}
        >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Icon className="w-8 h-8 text-white/20" />
            </div>

            <div className="space-y-1 max-w-[280px]">
                <h3 className="text-lg font-bold text-white/90">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{description}</p>
            </div>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    className="mt-4 border-white/10 hover:bg-white/10 text-white/80 hover:text-white"
                >
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
};
