import { Rank } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RankBadgeProps {
    rank: Rank;
    size?: "sm" | "md" | "lg";
    showName?: boolean;
    className?: string;
}

export const RankBadge = ({ rank, size = "md", showName = false, className }: RankBadgeProps) => {
    const Icon = rank.icon;

    const sizeClasses = {
        sm: "w-6 h-6 p-1",
        md: "w-10 h-10 p-2",
        lg: "w-16 h-16 p-3"
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-8 h-8"
    };

    return (
        <motion.div
            className={cn("flex items-center gap-2", className)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
            <div className={cn(
                "rounded-full flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden group",
                "bg-slate-900/80 backdrop-blur-md",
                sizeClasses[size]
            )}>
                {/* Glow Background */}
                <div className={cn("absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-current", rank.color)} />

                <Icon className={cn(rank.color, "relative z-10", iconSizes[size])} />
            </div>

            {showName && (
                <div className="flex flex-col">
                    <span className={cn("font-bold text-xs uppercase tracking-wider", rank.color)}>
                        {rank.name}
                    </span>
                </div>
            )}
        </motion.div>
    );
};
