"use client";

import { useRef } from "react";
import { Coffee, ShoppingCart, Fuel, Utensils, ShoppingBag, Film, Car, FileText } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

const actions = [
    { id: "coffee", label: "קפה", icon: Coffee, color: "bg-amber-500/20 text-amber-200 border-amber-500/30" },
    { id: "supermarket", label: "סופר", icon: ShoppingCart, color: "bg-green-500/20 text-green-200 border-green-500/30" },
    { id: "restaurant", label: "מסעדה", icon: Utensils, color: "bg-red-500/20 text-red-200 border-red-500/30" },
    { id: "fuel", label: "דלק", icon: Fuel, color: "bg-blue-500/20 text-blue-200 border-blue-500/30" },
    { id: "shopping", label: "קניות", icon: ShoppingBag, color: "bg-purple-500/20 text-purple-200 border-purple-500/30" },
    { id: "entertainment", label: "בילוי", icon: Film, color: "bg-pink-500/20 text-pink-200 border-pink-500/30" },
    { id: "transport", label: "תחבורה", icon: Car, color: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30" },
    { id: "bills", label: "חשבונות", icon: FileText, color: "bg-orange-500/20 text-orange-200 border-orange-500/30" },
];

export const QuickActions = ({ onAction }: { onAction: (id: string, label: string) => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={scrollRef}
            className="quick-actions-scroll"
            style={{
                display: 'flex',
                gap: '12px',
                width: '100%',
                overflowX: 'scroll',
                overflowY: 'hidden',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                touchAction: 'pan-x',
            }}
        >
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => {
                        triggerHaptic();
                        onAction(action.id, action.label);
                    }}
                    style={{
                        touchAction: 'pan-x',
                        flexShrink: 0,
                    }}
                    className="flex flex-col items-center gap-1.5"
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} border active:scale-95 transition-transform duration-150`}>
                        <action.icon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <span className="text-[10px] font-medium text-white/60 whitespace-nowrap">{action.label}</span>
                </button>
            ))}
            {/* End spacer */}
            <div style={{ width: '8px', flexShrink: 0 }} aria-hidden="true" />
        </div>
    );
};
