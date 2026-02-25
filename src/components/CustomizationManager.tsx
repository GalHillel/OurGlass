"use client";

import { useDashboardStore, WidgetConfig, FeatureKey } from "@/stores/dashboardStore";
import { WIDGET_REGISTRY } from "./WIDGET_REGISTRY";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, LayoutGrid, TrendingUp, CreditCard, Sparkles, Wand2, Shield, Users, Smartphone, Gift, Rocket, Zap } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CustomizationManager() {
    const { widgets, features, toggleWidget, toggleFeature, reorderWidgets } = useDashboardStore();
    const [activeTab, setActiveTab] = useState<'home' | 'screens' | 'wealth' | 'stocks' | 'subs' | 'lounge' | 'wishlist'>('screens');

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newWidgets.length) return;

        // Swap
        const [movedWidget] = newWidgets.splice(index, 1);
        newWidgets.splice(targetIndex, 0, movedWidget);

        // Update orders
        const updatedWidgets = newWidgets.map((w, i) => ({ ...w, order: i }));
        reorderWidgets(updatedWidgets);
        triggerHaptic();
    };

    const FeatureToggle = ({ featureKey, label, description, icon: Icon }: { featureKey: FeatureKey, label: string, description: string, icon: any }) => (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
            features[featureKey] ? "bg-white/10 border-white/10" : "bg-white/[0.02] border-white/5 opacity-60"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", features[featureKey] ? "bg-blue-500/20" : "bg-white/5")}>
                    <Icon className={cn("w-4 h-4", features[featureKey] ? "text-blue-300" : "text-white/20")} />
                </div>
                <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-[10px] text-white/40 leading-tight">{description}</p>
                </div>
            </div>
            <Switch
                checked={features[featureKey]}
                onCheckedChange={() => {
                    toggleFeature(featureKey);
                    triggerHaptic();
                }}
                className="data-[state=checked]:bg-blue-500"
            />
        </div>
    );

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
            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-2xl">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300",
                            activeTab === tab.id
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                >
                    {activeTab === 'home' && (
                        <div className="space-y-3">
                            <div className="px-2 flex items-center gap-2 mb-2">
                                <Wand2 className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-bold text-white/70">סידור וניהול ווידג׳טים</h3>
                            </div>
                            {widgets.map((widget, index) => {
                                const info = WIDGET_REGISTRY[widget.id];
                                if (!info) return null;
                                const Icon = info.icon;

                                return (
                                    <div
                                        key={widget.id}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                                            widget.enabled ? "bg-white/10 border-white/10" : "bg-white/[0.02] border-white/5 opacity-60"
                                        )}
                                    >
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === 0}
                                                onClick={() => moveWidget(index, 'up')}
                                                className="h-8 w-8 rounded-lg hover:bg-white/10 disabled:opacity-20"
                                            >
                                                <ChevronUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={index === widgets.length - 1}
                                                onClick={() => moveWidget(index, 'down')}
                                                className="h-8 w-8 rounded-lg hover:bg-white/10 disabled:opacity-20"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className={cn("p-2.5 rounded-xl", widget.enabled ? "bg-blue-500/20" : "bg-white/5")}>
                                            <Icon className={cn("w-5 h-5", widget.enabled ? info.color : "text-white/20")} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate text-white">{info.label}</p>
                                            <p className="text-[10px] text-white/40 truncate">{info.description}</p>
                                        </div>

                                        <Switch
                                            checked={widget.enabled}
                                            onCheckedChange={() => {
                                                toggleWidget(widget.id);
                                                triggerHaptic();
                                            }}
                                            className="data-[state=checked]:bg-blue-500"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'screens' && (
                        <div className="space-y-3">
                            <div className="px-2 flex items-center gap-2 mb-2">
                                <Smartphone className="w-4 h-4 text-blue-400" />
                                <h3 className="text-sm font-bold text-white/70">ניהול עמודי אפליקציה</h3>
                            </div>
                            <FeatureToggle featureKey="enableStocks" label="מסך עושר" description="נכסים, מזומן ושווי נקי" icon={TrendingUp} />
                            <FeatureToggle featureKey="enableStocksPage" label="מסך מניות" description="תיק השקעות, דיבידנדים וביצועים" icon={Rocket} />
                            <FeatureToggle featureKey="enableSubscriptions" label="מסך קבועות" description="ניהול מנויים, הלוואות והוצאות קבועות" icon={CreditCard} />
                            <FeatureToggle featureKey="enableLounge" label="מסך לובי" description="רולטת פינוקים ויומן אווירה" icon={Sparkles} />
                            <FeatureToggle featureKey="enableWishlist" label="מסך משאלות" description="מעקב אחר יעדי רכישה וחלומות" icon={Gift} />
                        </div>
                    )}

                    {activeTab === 'wealth' && (
                        <div className="space-y-3">
                            <FeatureToggle featureKey="wealthShowSummaryCards" label="כרטיסי סיכום" description="סיכום השקעות ומזומן" icon={Shield} />
                            <FeatureToggle featureKey="wealthShowHistory" label="גרף שווי נקי" description="הצגת היסטוריית השווי הנקי שלך" icon={TrendingUp} />
                            <FeatureToggle featureKey="wealthShowAssets" label="רשימת נכסים" description="ניהול נכסים נזילים ונדל״ן" icon={Shield} />
                            <FeatureToggle featureKey="showRebalancingCoach" label="מאמן איזון" description="תובנות על פיזור הנכסים" icon={Users} />
                        </div>
                    )}

                    {activeTab === 'stocks' && (
                        <div className="space-y-3">
                            <FeatureToggle featureKey="wealthShowPortfolio" label="תיק השקעות" description="פירוט מניות וניירות ערך" icon={LayoutGrid} />
                            <FeatureToggle featureKey="showDividendForecast" label="תחזית דיבידנדים" description="צפי הכנסות עתידיות ממניות" icon={Gift} />
                            <FeatureToggle featureKey="showSP500Benchmark" label="השוואת מדדים" description="ביצועים מול S&P 500" icon={TrendingUp} />
                        </div>
                    )}

                    {activeTab === 'subs' && (
                        <div className="space-y-3">
                            <FeatureToggle featureKey="subsShowSummary" label="כרטיסי סיכום" description="סיכום חודשי ושנתי" icon={Shield} />
                            <FeatureToggle featureKey="subsShowIndicator" label="מדד עומס" description="אחוז ההוצאות הקבועות מהתקציב" icon={CreditCard} />
                            <FeatureToggle featureKey="subsShowGhost" label="הצעות למנויים" description="זיהוי מנויים פוטנציאליים" icon={Sparkles} />
                            <FeatureToggle featureKey="subsShowLiabilities" label="התחייבויות" description="הצגת הלוואות כתשלום קבוע" icon={Shield} />
                            <FeatureToggle featureKey="subsShowKiller" label="קוצץ הוצאות" description="ניתוח חכם לביטול מנויים" icon={Zap} />
                        </div>
                    )}

                    {activeTab === 'lounge' && (
                        <div className="space-y-3">
                            <FeatureToggle featureKey="loungeShowVibe" label="מדד אווירה" description="מצב הרוח הכלכלי הנוכחי" icon={Sparkles} />
                            <FeatureToggle featureKey="loungeShowRoulette" label="רולטת Guilt-Free" description="משחק פינוקים על בסיס חיסכון" icon={LayoutGrid} />
                            <FeatureToggle featureKey="loungeShowTinder" label="Tinder חלומות" description="סידור סדרי עדיפויות לחיסכון" icon={Sparkles} />
                        </div>
                    )}

                    {activeTab === 'wishlist' && (
                        <div className="space-y-3">
                            <FeatureToggle featureKey="wishlistShowHarvester" label="עיגול לטובה" description="הפקדת עודפים מהתקציב למשאלות" icon={Sparkles} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
