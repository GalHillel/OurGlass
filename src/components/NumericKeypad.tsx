"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface NumericKeypadProps {
    onKeyPress: (key: string) => void;
    onDelete: () => void;
    className?: string;
}

export const NumericKeypad = ({ onKeyPress, onDelete, className }: NumericKeypadProps) => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

    const handlePress = (key: string) => {
        triggerHaptic();
        onKeyPress(key);
    };

    const handleDelete = () => {
        triggerHaptic();
        onDelete();
    };

    return (
        <div className={cn("grid grid-cols-3 gap-3 px-6 pb-6", className)}>
            {keys.map((key) => (
                <button
                    key={key}
                    onClick={() => handlePress(key)}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-500/20 active:scale-95 transition-all flex items-center justify-center text-2xl font-bold text-white shadow-sm border border-white/5 backdrop-blur-sm"
                >
                    {key}
                </button>
            ))}
            <button
                onClick={handleDelete}
                className="h-16 rounded-2xl bg-white/5 hover:bg-red-500/10 active:bg-red-500/20 active:scale-95 transition-all flex items-center justify-center text-white/70 hover:text-red-400 border border-white/5 backdrop-blur-sm"
            >
                <Delete className="w-8 h-8" />
            </button>
        </div>
    );
};
