"use client";

import { Home, Sparkles, Settings, CreditCard, Gem, Gift, Rocket } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { useDashboardStore, FeatureKey, NavItemConfig } from "@/stores/dashboardStore";
import { useMemo } from "react";
import { useShallow } from 'zustand/react/shallow';

interface NavItem {
    id: string;
    label: string;
    icon: typeof Home;
    path: string;
    featureKey?: FeatureKey;
}

const navItemsRegistry: NavItem[] = [
    { id: "home", label: "בית", icon: Home, path: "/" },
    { id: "wealth", label: "עושר", icon: Gem, path: "/wealth", featureKey: "enableStocks" },
    { id: "stocks", label: "מניות", icon: Rocket, path: "/stocks", featureKey: "enableStocksPage" },
    { id: "lounge", label: "לובי", icon: Sparkles, path: "/lounge", featureKey: "enableLounge" },
    { id: "subscriptions", label: "קבועות", icon: CreditCard, path: "/subscriptions", featureKey: "enableSubscriptions" },
    { id: "wishlist", label: "משאלות", icon: Gift, path: "/wishlist", featureKey: "enableWishlist" },
    { id: "settings", label: "הגדרות", icon: Settings, path: "/settings" },
];

export const BottomNav = () => {
    const pathname = usePathname();
    const { navItems, features, _hasHydrated } = useDashboardStore(useShallow((s) => ({
        navItems: s.navItems,
        features: s.features,
        _hasHydrated: s._hasHydrated
    })));

    const visibleItems = useMemo(() => {
        if (!_hasHydrated) return [];
        return [...navItems]
            .filter(item => item.enabled)
            .sort((a, b) => a.order - b.order)
            .map(item => {
                const baseItem = navItemsRegistry.find(n => n.id === item.id);
                return baseItem ? { ...baseItem, ...item } : null;
            })
            .filter((n): n is NavItem & NavItemConfig => n !== null && (!n.featureKey || (features as any)[n.featureKey]));
    }, [navItems, features, _hasHydrated]);

    // Don't show on login page or before hydration
    if (pathname === "/login" || !_hasHydrated) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-[env(safe-area-inset-bottom)] pt-3 z-50 pointer-events-none">
            {/* Floating Rounded Nav Container */}
            <nav className="rounded-full flex justify-around items-center p-2.5 backdrop-blur-xl bg-[#0c0f1a]/70 border border-white/[0.08] pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-md mx-auto">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            prefetch={true}
                            onClick={() => {
                                triggerHaptic();
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
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

