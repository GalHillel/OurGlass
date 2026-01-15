"use client";

import { Home, Gift, Settings, CreditCard, Gem } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
            {/* Pointer events none on container, auto on nav to let clicks pass through sides */}
            <div className="neon-card rounded-3xl flex justify-around items-center p-2 backdrop-blur-xl bg-slate-950/80 border-white/5 pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? "text-white scale-110" : "text-slate-500 hover:text-white/60"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute inset-0 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <item.icon className={`w-6 h-6 mb-1 relative z-10 ${isActive ? "neon-text drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : ""}`} />
                            {isActive && (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[10px] font-bold text-blue-200 relative z-10"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
