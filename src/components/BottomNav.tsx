"use client";

import { Home, Gift, Settings, CreditCard, Gem } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

const navItems = [
    { id: "home", label: "בית", icon: Home, path: "/" },
    { id: "wealth", label: "עושר", icon: Gem, path: "/wealth" },
    { id: "subscriptions", label: "קבועות", icon: CreditCard, path: "/subscriptions" },
    { id: "wishlist", label: "משאלות", icon: Gift, path: "/wishlist" },
    { id: "settings", label: "הגדרות", icon: Settings, path: "/settings" },
];

export const BottomNav = () => {
    const pathname = usePathname();
    const router = useRouter();

    // Don't show on login page
    if (pathname === "/login") return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-[env(safe-area-inset-bottom)] pt-3 z-50 pointer-events-none">
            {/* Floating Rounded Nav Container */}
            <nav className="neon-card rounded-3xl flex justify-around items-center p-2 backdrop-blur-2xl bg-slate-950/60 border-white/10 pointer-events-auto shadow-[0_0_40px_rgba(0,0,0,0.6)] max-w-md mx-auto ring-1 ring-white/5">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                triggerHaptic();
                                router.push(item.path);
                            }}
                            className="relative flex flex-col items-center justify-center flex-1 py-1 group"
                        >
                            {/* Active Background Pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute inset-1 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Icon */}
                            <item.icon className={cn(
                                "w-5 h-5 relative z-10 mb-0.5 transition-all duration-200",
                                isActive
                                    ? "text-blue-300 neon-text drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                    : "text-slate-500 group-hover:text-white/60"
                            )} />

                            {/* Label - Always visible */}
                            <span className={cn(
                                "relative z-10 text-[9px] font-medium transition-colors duration-200",
                                isActive
                                    ? "text-blue-200"
                                    : "text-slate-500 group-hover:text-white/60"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
