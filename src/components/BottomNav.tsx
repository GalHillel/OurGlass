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
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
            <div className="glass rounded-2xl flex justify-around items-center p-2 backdrop-blur-xl bg-black/20 border-white/10">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${isActive ? "text-white" : "text-white/50 hover:text-white/80"}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon className="w-6 h-6 mb-1 relative z-10" />
                            <span className="text-[10px] font-medium relative z-10">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
