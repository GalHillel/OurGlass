"use client";

import { useDashboardStore, type FeatureKey } from "@/stores/dashboardStore";
import { WIDGET_REGISTRY } from "./WIDGET_REGISTRY";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown, LayoutGrid, TrendingUp, CreditCard, Sparkles, Wand2, Shield, Users, Smartphone, Gift, Rocket, Zap } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";

type FeatureToggleProps = {
    featureKey: FeatureKey;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    colorClass?: string;
};

function FeatureToggle({ featureKey, label, description, icon: Icon, colorClass = "blue" }: FeatureToggleProps) {
    const { features, toggleFeature } = useDashboardStore();
    const isActive = features[featureKey];

    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, scale: 0.95, y: 10 },
                visible: { opacity: 1, scale: 1, y: 0 }
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                toggleFeature(featureKey);
                triggerHaptic();
            }}
            className={cn(
                "relative flex flex-col justify-between p-5 rounded-[2.2rem] border transition-all duration-500 cursor-pointer overflow-hidden group/item h-[160px]",
                isActive
                    ? "bg-white/[0.05] border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    : "bg-black/20 border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
            )}
        >
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "absolute inset-0 bg-gradient-to-br transition-all duration-700 pointer-events-none opacity-20",
                            colorClass === "blue" && "from-blue-600/40 via-transparent to-indigo-600/20",
                            colorClass === "purple" && "from-purple-600/40 via-transparent to-pink-600/20",
                            colorClass === "emerald" && "from-emerald-600/40 via-transparent to-teal-600/20",
                            colorClass === "orange" && "from-orange-600/40 via-transparent to-red-600/20",
                            colorClass === "pink" && "from-pink-600/40 via-transparent to-rose-600/20"
                        )}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-start justify-between relative z-10 w-full">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 border border-white/10 shadow-xl relative overflow-hidden",
                    isActive
                        ? "bg-white/10 scale-110 rotate-3"
                        : "bg-white/5"
                )}>
                    <div className={cn(
                        "absolute inset-0 opacity-20 bg-gradient-to-tr",
                        colorClass === "blue" && "from-blue-500 to-cyan-500",
                        colorClass === "purple" && "from-purple-500 to-pink-500",
                        colorClass === "emerald" && "from-emerald-500 to-teal-500",
                        colorClass === "orange" && "from-orange-500 to-yellow-500"
                    )} />
                    <Icon className={cn(
                        "w-6 h-6 relative z-10",
                        isActive ? "text-white" : "text-white/20"
                    )} />
                </div>

                <Switch
                    checked={isActive}
                    onCheckedChange={() => {
                        // handled via card click
                    }}
                    className={cn(
                        "transition-all scale-110",
                        isActive && colorClass === "blue" && "data-[state=checked]:bg-blue-500",
                        isActive && colorClass === "purple" && "data-[state=checked]:bg-purple-500",
                        isActive && colorClass === "emerald" && "data-[state=checked]:bg-emerald-500",
                        isActive && colorClass === "orange" && "data-[state=checked]:bg-orange-500"
                    )}
                />
            </div>

            <div className="relative z-10">
                <p className="text-[15px] font-black text-white tracking-tight leading-tight mb-1">{label}</p>
                <p className="text-[10px] text-white/40 leading-snug font-medium line-clamp-2">{description}</p>
            </div>

            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover/item:bg-white/10 transition-colors pointer-events-none" />
        </motion.div>
    );
}

export function CustomizationManager() {
    const { widgets, toggleWidget, reorderWidgets } = useDashboardStore();
    const [activeTab, setActiveTab] = useState<'home' | 'screens' | 'wealth' | 'stocks' | 'subs' | 'lounge' | 'wishlist'>('screens');

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

        const [movedWidget] = newWidgets.splice(index, 1);
        newWidgets.splice(targetIndex, 0, movedWidget);

        const updatedWidgets = newWidgets.map((w, i) => ({ ...w, order: i }));
        reorderWidgets(updatedWidgets);
        triggerHaptic();
    };

    const TABS = [
        { id: 'screens', label: 'מסכים', icon: Smartphone },
        { id: 'home', label: 'רכיבים', icon: LayoutGrid },
        { id: 'wealth', label: 'עושר', icon: TrendingUp },
        { id: 'stocks', label: 'מניות', icon: Rocket },
        { id: 'subs', label: 'מנויים', icon: CreditCard },
        { id: 'lounge', label: 'לובי', icon: Sparkles },
        { id: 'wishlist', label: 'משאלות', icon: Gift },
    ] as const;

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-900/60 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            triggerHaptic();
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[1.8rem] transition-all duration-700 relative z-10",
                            activeTab === tab.id
                                ? "text-white"
                                : "text-white/20 hover:text-white/40"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-pill"
                                className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[1.8rem] shadow-[0_4px_20px_rgba(37,99,235,0.4)]"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.7 }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-50 blur-sm rounded-[1.8rem]" />
                            </motion.div>
                        )}
                        <tab.icon className={cn("w-5 h-5 relative z-20 transition-all duration-500", activeTab === tab.id ? "scale-110 rotate-0" : "scale-90 opacity-40")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] relative z-20">{tab.label}</span>
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="grid grid-cols-2 gap-3"
            >
                {activeTab === 'home' && (
                    <>
                        <div className="col-span-2 px-2 flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-black text-white/50 uppercase tracking-widest">רכיבי בית</h3>
                            </div>
                        </div>
                        <FeatureToggle featureKey="showMonthlyRoast" label="סיכום חודשי" description="תובנות עוקצניות מה-AI" icon={Zap} colorClass="orange" />
                        <FeatureToggle featureKey="showSmartInsights" label="תובנות חכמות" description="זיהוי מגמות חריגות" icon={Sparkles} colorClass="purple" />
                        {widgets.map((widget) => {
                            const info = WIDGET_REGISTRY[widget.id];
                            if (!info) return null;
                            const Icon = info.icon;
                            const isActive = widget.enabled;

                            return (
                                <motion.div
                                    key={widget.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.95, y: 10 },
                                        visible: { opacity: 1, scale: 1, y: 0 }
                                    }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className={cn(
                                        "relative flex flex-col justify-between p-5 rounded-[2.2rem] border transition-all duration-500 cursor-pointer h-[160px] overflow-hidden group/widget",
                                        isActive
                                            ? "bg-white/[0.05] border-white/20 shadow-xl"
                                            : "bg-black/20 border-white/5 opacity-60 grayscale hover:opacity-100 h-[100px] grayscale-0"
                                    )}
                                    onClick={() => { toggleWidget(widget.id); triggerHaptic(); }}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 border border-white/10",
                                            isActive ? "bg-white/10 scale-110" : "bg-white/5"
                                        )}>
                                            <Icon className={cn("w-6 h-6", isActive ? info.color : "text-white/20")} />
                                        </div>
                                        <Switch checked={isActive} onCheckedChange={() => { }} className="pointer-events-none" />
                                    </div>
                                    <div className="relative z-10 pr-1">
                                        <p className="text-[14px] font-black text-white tracking-tight">{info.label}</p>
                                        <p className="text-[9px] text-white/30 font-medium leading-tight line-clamp-2">{info.description}</p>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveWidget(widgets.findIndex(w => w.id === widget.id), 'up'); }}
                                                className="p-1 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveWidget(widgets.findIndex(w => w.id === widget.id), 'down'); }}
                                                className="p-1 hover:bg-white/10 rounded-lg text-white/30 hover:text-white transition-colors"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </>
                )}

                {activeTab === 'screens' && (
                    <>
                        <div className="col-span-2 px-2 flex items-center gap-2 mb-1">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-sm font-black text-white/50 uppercase tracking-widest">עמודי אפליקציה</h3>
                        </div>
                        <FeatureToggle featureKey="enableStocks" label="עושר" description="נכסים, מזומן ושווי נקי" icon={TrendingUp} colorClass="emerald" />
                        <FeatureToggle featureKey="enableStocksPage" label="מניות" description="תיק השקעות ודיבידנדים" icon={Rocket} colorClass="blue" />
                        <FeatureToggle featureKey="enableSubscriptions" label="קבועות" description="ניהול מנויים והלוואות" icon={CreditCard} colorClass="purple" />
                        <FeatureToggle featureKey="enableLounge" label="לובי" description="נווה-מדבר ומשחקיות" icon={Sparkles} colorClass="pink" />
                        <FeatureToggle featureKey="enableWishlist" label="משאלות" description="מעקב אחר יעדי רכישה" icon={Gift} colorClass="orange" />
                    </>
                )}

                {activeTab === 'wealth' && (
                    <>
                        <FeatureToggle featureKey="wealthShowSummaryCards" label="כרטיסי סיכום" description="סיכום השקעות ומזומן" icon={Shield} colorClass="emerald" />
                        <FeatureToggle featureKey="wealthShowHistory" label="גרף שווי נקי" description="היסטוריית הצמיחה שלך" icon={TrendingUp} colorClass="emerald" />
                        <FeatureToggle featureKey="wealthShowAssets" label="רשימת נכסים" description="ניהול נכסים נזילים" icon={Shield} colorClass="emerald" />
                        <FeatureToggle featureKey="showRebalancingCoach" label="מאמן איזון" description="תובנות על פיזור הנכסים" icon={Users} colorClass="emerald" />
                    </>
                )}

                {activeTab === 'stocks' && (
                    <>
                        <FeatureToggle featureKey="wealthShowPortfolio" label="תיק השקעות" description="פירוט מניות וניירות ערך" icon={LayoutGrid} colorClass="blue" />
                        <FeatureToggle featureKey="showDividendForecast" label="תחזית דיב׳" description="צפי הכנסות עתידיות" icon={Gift} colorClass="blue" />
                        <FeatureToggle featureKey="showSP500Benchmark" label="השוואת מדדים" description="ביצועים מול S&P 500" icon={TrendingUp} colorClass="blue" />
                    </>
                )}

                {activeTab === 'subs' && (
                    <>
                        <FeatureToggle featureKey="subsShowSummary" label="כרטיסי סיכום" description="סיכום חודשי ושנתי" icon={Shield} colorClass="purple" />
                        <FeatureToggle featureKey="subsShowIndicator" label="מדד עומס" description="אחוז הקבועות מהתקציב" icon={CreditCard} colorClass="purple" />
                        <FeatureToggle featureKey="subsShowGhost" label="הצעות למנויים" description="זיהוי מנויים פוטנציאליים" icon={Sparkles} colorClass="purple" />
                        <FeatureToggle featureKey="subsShowLiabilities" label="התחייבויות" description="ניהול הלוואות וחובות" icon={Shield} colorClass="purple" />
                        <FeatureToggle featureKey="subsShowKiller" label="קוצץ הוצאות" description="ניתוח חכם לביטול" icon={Zap} colorClass="purple" />
                    </>
                )}

                {activeTab === 'lounge' && (
                    <>
                        <FeatureToggle featureKey="loungeShowVibe" label="מדד אווירה" description="מצב הרוח הכלכלי הנוכחי" icon={Sparkles} colorClass="pink" />
                        <FeatureToggle featureKey="loungeShowRoulette" label="רולטת Guilt-Free" description="משחק פינוקים על בסיס חיסכון" icon={LayoutGrid} colorClass="pink" />
                        <FeatureToggle featureKey="loungeShowTinder" label="Tinder חלומות" description="סידור סדרי עדיפויות" icon={Sparkles} colorClass="pink" />
                    </>
                )}

                {activeTab === 'wishlist' && (
                    <div className="col-span-2">
                        <FeatureToggle featureKey="wishlistShowHarvester" label="עיגול לטובה" description="הפקדת עודפים מהתקציב למשאלות" icon={Sparkles} colorClass="orange" />
                    </div>
                )}
            </motion.div>
        </div>
    );
}
