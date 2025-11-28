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
    const { user, profile } = useAuth();
    const supabase = createClientComponentClient();
    const router = useRouter();

    const [name, setName] = useState("");
    const [hourlyWage, setHourlyWage] = useState("");
    const [budget, setBudget] = useState("");
    const [loading, setLoading] = useState(false);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (profile && !isLoaded) {
            setName(profile.name || "");
            setHourlyWage(profile.hourly_wage?.toString() || "");
            setBudget(profile.budget?.toString() || "20000");
            setIsLoaded(true);
        }
    }, [profile, isLoaded]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const updates = {
                id: user.id,
                name,
                hourly_wage: parseFloat(hourlyWage) || 0,
                budget: parseFloat(budget) || 20000,
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
        <div className="flex flex-col gap-6 max-w-md mx-auto pt-8">
            <h1 className="text-3xl font-bold text-white text-center mb-4">הגדרות</h1>

            <div className="glass p-6 rounded-3xl space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">הפרופיל שלי</h2>
                        <p className="text-sm text-white/60">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-white/80">שם תצוגה</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="השם שלך"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">שכר שעתי (לחישוב עלות עבודה)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={hourlyWage}
                                onChange={(e) => setHourlyWage(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-10"
                                placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₪</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white/80">תקציב חודשי (לחישוב המספר האמיתי)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-10"
                                placeholder="20000"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₪</span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-white/90 font-bold h-12 rounded-xl mt-4"
                >
                    <Save className="w-4 h-4 ml-2" />
                    {loading ? "שומר..." : "שמור שינויים"}
                </Button>
            </div>

            <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30 h-12 rounded-xl"
            >
                <LogOut className="w-4 h-4 ml-2" />
                התנתק
            </Button>
        </div>
    );
}
