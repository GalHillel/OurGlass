"use client";

import { useRef } from "react";
import { Utensils, Coffee, ShoppingBag, Bus, Fuel, Car, Beer, Home, Heart, Shield, GraduationCap, Sparkles, Briefcase, Zap } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";

const actions = [
    { id: 'אוכל', label: 'אוכל', icon: Utensils, color: 'text-orange-400' },
    { id: 'קפה', label: 'קפה', icon: Coffee, color: 'text-amber-400' },
    { id: 'סופר', label: 'סופר', icon: ShoppingBag, color: 'text-green-400' },
    { id: 'תחבורה', label: 'תחבורה', icon: Bus, color: 'text-blue-400' },
    { id: 'דלק', label: 'דלק', icon: Fuel, color: 'text-cyan-400' },
    { id: 'רכב', label: 'רכב', icon: Car, color: 'text-red-400' },
    { id: 'קניות', label: 'קניות', icon: ShoppingBag, color: 'text-purple-400' },
    { id: 'בילוי', label: 'בילוי', icon: Beer, color: 'text-pink-400' },
    { id: 'מסעדה', label: 'מסעדה', icon: Utensils, color: 'text-red-400' },
    { id: 'חשבונות', label: 'חשבונות', icon: Home, color: 'text-emerald-400' },
    { id: 'בריאות', label: 'בריאות', icon: Heart, color: 'text-rose-400' },
    { id: 'ביטוח', label: 'ביטוח', icon: Shield, color: 'text-sky-400' },
    { id: 'לימודים', label: 'לימודים', icon: GraduationCap, color: 'text-indigo-400' },
    { id: 'קוסמטיקה', label: 'קוסמטיקה', icon: Sparkles, color: 'text-fuchsia-400' },
    { id: 'עבודה', label: 'עבודה', icon: Briefcase, color: 'text-slate-400' },
    { id: 'אחר', label: 'אחר', icon: Zap, color: 'text-yellow-400' },
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
