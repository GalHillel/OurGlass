"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, Save, User } from "lucide-react";

export default function SettingsPage() {
    console.log("Settings Page Rendering"); // Debug log for build verification
    const { user, profile } = useAuth();
    const supabase = createClientComponentClient();
    const router = useRouter();

    const [name, setName] = useState("");
    const [hourlyWage, setHourlyWage] = useState("");
    const [budget, setBudget] = useState("");
    const [income, setIncome] = useState("");
    const [loading, setLoading] = useState(false);

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
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            toast.success("הפרופיל עודכן בהצלחה");
        } catch (error: any) {
            toast.error("שגיאה בעדכון הפרופיל", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto pt-8 pb-32 px-4">
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50">₪</span>
                        </div>
                    </div>

                    {/* Smart Savings Indicator */}
                    {Number(income) > Number(budget) && (
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-emerald-200">פוטנציאל חיסכון:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                                {savingsRate.toFixed(0)}% (₪{potentialSavings.toLocaleString()})
                            </span>
                        </div>
                    )}

                    {Number(income) > 0 && Number(income) < Number(budget) && (
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-red-200">גירעון מתוכנן:</span>
                            <span className="font-bold text-red-400 font-mono">
                                (₪{(Number(budget) - Number(income)).toLocaleString()})
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
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
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

            <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 h-12 rounded-xl transition-all"
            >
                <LogOut className="w-4 h-4 ml-2" />
                התנתק
            </Button>
        </div>
    );
}
