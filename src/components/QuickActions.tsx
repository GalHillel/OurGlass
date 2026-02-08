"use client";

import { useRef } from "react";
import { Coffee, ShoppingCart, Fuel, Utensils, ShoppingBag, Film, Car, FileText } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

const actions = [
    { id: "coffee", label: "קפה", icon: Coffee, color: "text-amber-400" },
    { id: "supermarket", label: "סופר", icon: ShoppingCart, color: "text-emerald-400" },
    { id: "restaurant", label: "מסעדה", icon: Utensils, color: "text-rose-400" },
    { id: "fuel", label: "דלק", icon: Fuel, color: "text-blue-400" },
    { id: "shopping", label: "קניות", icon: ShoppingBag, color: "text-purple-400" },
    { id: "entertainment", label: "בילוי", icon: Film, color: "text-pink-400" },
    { id: "transport", label: "תחבורה", icon: Car, color: "text-cyan-400" },
    { id: "bills", label: "חשבונות", icon: FileText, color: "text-orange-400" },
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
                    className="flex flex-col items-center gap-1.5 group"
                >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-900/40 bg-cyan-500/10 backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition-all duration-150 group-hover:bg-cyan-500/20 ${action.color}`}>
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
