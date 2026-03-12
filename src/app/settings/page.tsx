"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, Save, User, Smartphone } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { triggerHaptic } from "@/utils/haptics";
import { PAYERS, CURRENCY_SYMBOL } from "@/lib/constants";
import { CustomizationManager } from "@/components/CustomizationManager";
import { DEMO_MODE, getNow } from "@/demo/demo-config";
import { RefreshCw } from "lucide-react";

export default function SettingsPage() {
    const { user, profile, updateProfile } = useAuth();
    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const router = useRouter();

    const [name, setName] = useState("");
    const [hourlyWage, setHourlyWage] = useState("");
    const [budget, setBudget] = useState("");
    const [income, setIncome] = useState("");
    const [loading, setLoading] = useState(false);
    const { appIdentity, setAppIdentity } = useAppStore();

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (profile && !isLoaded) {
            setName(profile.name || "");
            setHourlyWage(profile.hourly_wage?.toString() || "");
            setBudget(profile.budget?.toString() || "20000");
            setIncome(profile.monthly_income?.toString() || "");
            setIsLoaded(true);
        }
    }, [profile, isLoaded]);

    const savingsRate = income && budget ? ((Number(income) - Number(budget)) / Number(income)) * 100 : 0;
    const potentialSavings = income && budget ? Number(income) - Number(budget) : 0;

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const updates = {
                id: user.id,
                name,
                hourly_wage: parseFloat(hourlyWage) || 0,
                budget: parseFloat(budget) || 20000,
                monthly_income: parseFloat(income) || 0,
                updated_at: getNow().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            updateProfile({
                name,
                hourly_wage: parseFloat(hourlyWage) || 0,
                budget: parseFloat(budget) || 20000,
                monthly_income: parseFloat(income) || 0,
            });
            toast.success("הפרופיל עודכן בהצלחה");
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה בעדכון הפרופיל", { description: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Clear any persisted state that might cause issues
            localStorage.clear();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login"); // Force redirect anyway
        }
    };


    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto pt-8 pb-0 px-4">
            <h1 className="text-3xl font-black text-white text-center mb-4 neon-text tracking-tight">הגדרות</h1>

            <div className="neon-card p-6 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-4 mb-2 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <User className="w-6 h-6 text-blue-200" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">הפרופיל שלי</h2>
                        <p className="text-xs text-blue-200/60 font-mono tracking-wide">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-5 relative z-10">
                    <div className="space-y-2">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">שם תצוגה</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-950/50 border-white/10 text-white focus:border-blue-500/50 transition-colors h-11"
                            placeholder="השם שלך"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">שכר שעתי (לחישוב עלות)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={hourlyWage}
                                onChange={(e) => setHourlyWage(e.target.value)}
                                className="bg-slate-950/50 border-white/10 text-white pl-10 text-lg font-mono h-11"
                                placeholder="0.00"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{CURRENCY_SYMBOL}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-emerald-400 text-xs font-bold uppercase tracking-wider">הכנסה חודשית נטו (משותף)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={income}
                                onChange={(e) => setIncome(e.target.value)}
                                className="bg-slate-950/50 border-emerald-500/20 text-emerald-100 pl-10 text-lg font-mono font-bold h-11 focus:border-emerald-500/50"
                                placeholder="25000"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50">{CURRENCY_SYMBOL}</span>
                        </div>
                    </div>

                    {/* Smart Savings Indicator */}
                    {Number(income) > Number(budget) && (
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-emerald-200">פוטנציאל חיסכון:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                                {savingsRate.toFixed(0)}% ({CURRENCY_SYMBOL}{potentialSavings.toLocaleString()})
                            </span>
                        </div>
                    )}

                    {Number(income) > 0 && Number(income) < Number(budget) && (
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-red-200">גירעון מתוכנן:</span>
                            <span className="font-bold text-red-400 font-mono">
                                ({CURRENCY_SYMBOL}{(Number(budget) - Number(income)).toLocaleString()})
                            </span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">תקציב חודשי (להוצאות)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="bg-slate-950/50 border-white/10 text-white pl-10 text-lg font-mono font-bold h-11"
                                placeholder="20000"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{CURRENCY_SYMBOL}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5" />
                            זהות משתמש במכשיר זה
                        </Label>
                        <p className="text-[11px] text-white/40 leading-tight">
                            הגדר מי משתמש במכשיר הנוכחי כדי שהאפליקציה תדע למלא אוטומטית מי שילם על הוצאות חדשות. (הגדרה שרלוונטית רק למכשיר זה).
                        </p>

                        <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setAppIdentity('him')}
                                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all ${appIdentity === 'him'
                                    ? 'bg-blue-500/20 border border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'hover:bg-white/5 text-white/50 border border-transparent'
                                    }`}
                            >
                                <span className="text-2xl mb-1">👨🏻</span>
                                <span className="text-xs font-bold">{PAYERS.HIM}</span>
                            </button>
                            <button
                                onClick={() => setAppIdentity('her')}
                                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-all ${appIdentity === 'her'
                                    ? 'bg-pink-500/20 border border-pink-500/30 text-white shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                                    : 'hover:bg-white/5 text-white/50 border border-transparent'
                                    }`}
                            >
                                <span className="text-2xl mb-1">👩🏻</span>
                                <span className="text-xs font-bold">{PAYERS.HER}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl mt-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02]"
                >
                    <Save className="w-4 h-4 ml-2" />
                    {loading ? "שומר..." : "שמור שינויים"}
                </Button>
            </div>

            {/* ── Universal Customization Section ── */}
            <div className="neon-card p-6 rounded-3xl space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/5 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                        <span className="text-2xl">🎨</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">התאמה אישית</h2>
                        <p className="text-xs text-white/40">שלוט במראה ובתכונות של האפליקציה</p>
                    </div>
                </div>

                <Drawer>
                    <DrawerTrigger asChild>
                        <Button
                            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-14 rounded-2xl transition-all flex items-center justify-between px-6 group"
                            onClick={() => triggerHaptic()}
                        >
                            <span className="font-bold">ערוך פריסת רכיבים ומסכים</span>
                            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                <Save className="w-4 h-4 text-blue-300 rotate-90" />
                            </div>
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="bg-slate-950 border-white/10 h-[85vh]">
                        <div className="max-w-md mx-auto w-full h-full flex flex-col pt-2">
                            <DrawerHeader className="border-b border-white/5 pb-4">
                                <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-6" />
                                <DrawerTitle className="text-2xl font-black text-white neon-text text-center">מרכז ההתאמה האישית</DrawerTitle>
                            </DrawerHeader>
                            <div className="flex-1 overflow-y-auto px-4 pb-12 pt-4">
                                <CustomizationManager />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>

            <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 h-12 rounded-xl transition-all"
            >
                <LogOut className="w-4 h-4 ml-2" />
                התנתק
            </Button>

            {DEMO_MODE && (
                <div className="neon-card p-6 rounded-3xl space-y-4 border-orange-500/20 bg-orange-500/5 relative overflow-hidden mt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">איפוס נתוני דמו</h2>
                            <p className="text-[10px] text-orange-200/60">חזור למצב ההתחלתי של המדגמים</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (confirm("האם לאפס את כל נתוני הדמו? פעולה זו תמחק את כל השינויים המקומיים שלך.")) {
                                localStorage.removeItem('ourglass_demo_db_transactions');
                                localStorage.removeItem('ourglass_demo_db_assets');
                                localStorage.removeItem('ourglass_demo_db_subscriptions');
                                localStorage.removeItem('ourglass_demo_db_wishlist');
                                localStorage.removeItem('ourglass_demo_welcome_seen');
                                window.location.reload();
                            }
                        }}
                        className="w-full border-orange-500/20 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 h-11 rounded-xl transition-all"
                    >
                        אפס הכל והתחל מחדש
                    </Button>
                </div>
            )}

            {/* Final bottom spacer for edge-to-edge layout accessibility */}
            <div className="h-32 w-full" />
        </div>
    );
}