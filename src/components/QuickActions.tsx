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
    return (
        <div className="grid grid-cols-4 gap-4 px-4 w-full max-w-md mx-auto">
            {actions.map((action) => (
                <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        triggerHaptic();
                        onAction(action.id);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl glass border border-white/10 ${action.color} backdrop-blur-md shadow-lg transition-colors hover:bg-white/20`}
                >
                    <action.icon className="w-6 h-6 text-white mb-2" />
                    <span className="text-xs font-medium text-white">{action.label}</span>
                </motion.button>
            ))}
        </div>
    );
};
