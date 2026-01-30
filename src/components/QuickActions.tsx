"use client";

import { Coffee, ShoppingCart, Fuel, Utensils, ShoppingBag, Film, Car, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";

const actions = [
    { id: "coffee", label: "קפה", icon: Coffee, color: "bg-amber-500/20" },
    { id: "supermarket", label: "סופר", icon: ShoppingCart, color: "bg-green-500/20" },
    { id: "restaurant", label: "מסעדה", icon: Utensils, color: "bg-red-500/20" },
    { id: "fuel", label: "דלק", icon: Fuel, color: "bg-blue-500/20" },
    { id: "shopping", label: "קניות", icon: ShoppingBag, color: "bg-purple-500/20" },
    { id: "entertainment", label: "בילוי", icon: Film, color: "bg-pink-500/20" },
    { id: "transport", label: "תחבורה", icon: Car, color: "bg-cyan-500/20" },
    { id: "bills", label: "חשבונות", icon: FileText, color: "bg-orange-500/20" },
];

export const QuickActions = ({ onAction }: { onAction: (id: string) => void }) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex gap-4 px-4 w-full overflow-x-auto snap-x hide-scrollbar pb-4 mask-gradient-right"
        >
            {actions.map((action) => (
                <motion.button
                    key={action.id}
                    variants={item}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        triggerHaptic();
                        onAction(action.id);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[5rem] h-20 p-2 rounded-2xl glass border border-white/10 ${action.color} backdrop-blur-md shadow-lg transition-colors hover:bg-white/20 snap-start`}
                >
                    <action.icon className="w-8 h-8 text-white mb-1 stroke-[1.5]" />
                    <span className="text-[10px] font-medium text-white/90 text-center leading-tight">{action.label}</span>
                </motion.button>
            ))}
            {/* Spacer for end of list */}
            <div className="min-w-[1rem]" />
        </motion.div>
    );
};
