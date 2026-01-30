"use client";

import { memo, useState, useEffect } from "react";
import { format } from "date-fns";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    titleColor?: string;
    className?: string;
}

export const AppHeader = memo(({ title, subtitle, icon: Icon, iconColor = "text-blue-400", titleColor = "text-blue-500", className }: AppHeaderProps) => {
    const [greeting, setGreeting] = useState("");
    const [isZen, setIsZen] = useState(false);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting("בוקר טוב, גל ☕");
        else if (hour >= 12 && hour < 17) setGreeting("המשך יום מעולה, גל ☀️");
        else if (hour >= 17 && hour < 22) setGreeting("ערב טוב, גל 🌙");
        else setGreeting("לילה טוב, חסכת היום? ✨");

        // Check if Zen mode was active
        if (typeof document !== 'undefined' && document.body.classList.contains("zen-mode")) {
            setIsZen(true);
        }
    }, []);

    const toggleZenMode = () => {
        const newState = !isZen;
        setIsZen(newState);
        if (typeof document !== 'undefined') {
            if (newState) {
                document.body.classList.add("zen-mode");
            } else {
                document.body.classList.remove("zen-mode");
            }
        }
    };

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4",
            "backdrop-blur-xl bg-slate-950/80 border-b border-white/5",
            className
        )}>
            {/* Right Side (RTL Start) - Title */}
            <h1 className="text-xl font-black tracking-tight neon-text flex items-center gap-2">
                <Icon className={cn("w-6 h-6", iconColor)} />
                {title} {subtitle && <span className={titleColor}>{subtitle}</span>}
            </h1>

            {/* Left Side (RTL End) - Smart Greeting & Zen Mode */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-white/60 hidden sm:inline-block animate-in fade-in slide-in-from-top-1 duration-700">
                    {greeting}
                </span>
                <button
                    onClick={toggleZenMode}
                    className="p-2 -m-2 text-white/40 hover:text-blue-400 transition-colors active:scale-95"
                    aria-label="Zen Mode"
                >
                    {isZen ? (
                        <EyeOff className="w-5 h-5 text-blue-400" />
                    ) : (
                        <Eye className="w-5 h-5" />
                    )}
                </button>
            </div>
        </header>
    );
});

AppHeader.displayName = "AppHeader";
