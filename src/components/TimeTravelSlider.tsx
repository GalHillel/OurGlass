"use client";

import { motion } from "framer-motion";
import { format, subMonths, addMonths } from "date-fns";
import { he } from "date-fns/locale";
import { triggerHaptic } from "@/utils/haptics";

interface TimeTravelSliderProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export const TimeTravelSlider = ({ currentDate, onDateChange }: TimeTravelSliderProps) => {
    // Generate ranges: -3 months to +1 month
    const offsets = [-3, -2, -1, 0, 1];

    return (
        <div className="flex items-center justify-center gap-6 py-4 relative overflow-hidden">
            {/* The Track */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {offsets.map((offset) => {
                const date = addMonths(new Date(), offset);
                // Simple equality check by month/year
                const isActive = date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();

                return (
                    <button
                        key={offset}
                        onClick={() => { triggerHaptic(); onDateChange(date); }}
                        className="relative z-10 flex flex-col items-center gap-2 group transition-all"
                    >
                        {/* Notch */}
                        <motion.div
                            animate={{
                                height: isActive ? 16 : 8,
                                opacity: isActive ? 1 : 0.3,
                                backgroundColor: isActive ? "#3b82f6" : "#ffffff"
                            }}
                            className="w-1 rounded-full bg-white transition-all"
                        />

                        {/* Label */}
                        <motion.span
                            animate={{ opacity: isActive ? 1 : 0.4, scale: isActive ? 1.1 : 0.9 }}
                            className="text-[10px] font-mono tracking-widest text-white uppercase"
                        >
                            {offset === 0 ? "הווה" : format(date, "MMM", { locale: he })}
                        </motion.span>
                    </button>
                );
            })}
        </div>
    );
};
