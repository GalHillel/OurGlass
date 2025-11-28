"use client";

import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Gift, AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { triggerHaptic } from "@/utils/haptics";

interface AddTransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    onSuccess?: (amount: number) => void;
}

export const AddTransactionDrawer = ({ isOpen, onClose, category, onSuccess }: AddTransactionDrawerProps) => {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [payer, setPayer] = useState<"him" | "her">("him");
    const [location, setLocation] = useState("מאתר מיקום...");
    const [isSurprise, setIsSurprise] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [loading, setLoading] = useState(false);

    const { user, profile } = useAuth();
    const supabase = createClientComponentClient();

    // Use profile wage or default
    const hourlyWage = profile?.hourly_wage || 60;

    useEffect(() => {
        if (isOpen) {
            setLocation("מאתר מיקום...");
            setAmount("");
            setDescription(category || "");
            setIsSurprise(false);
            setDate(new Date());
            const timer = setTimeout(() => {
                setLocation("Aroma Espresso Bar");
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, category]);

    const numericAmount = parseFloat(amount) || 0;
    const workHours = numericAmount / hourlyWage;
    const showWorkHours = numericAmount > 200;

    const handleSave = async () => {
        triggerHaptic();
        if (!amount || !user) return;
        setLoading(true);

        try {
            // 1. Insert Transaction
            const { error } = await supabase.from('transactions').insert({
                amount: numericAmount,
                category_id: null, // In real app, map category string to ID
                user_id: user.id,
                description: isSurprise ? "הוצאה סודית" : (description ? `${category}\n${description}` : category),
                is_surprise: isSurprise,
                location_lat: 0, // Mock
                location_lng: 0, // Mock
                date: date ? date.toISOString() : new Date().toISOString(),
            });

            if (error) throw error;

            // 2. Round-up Logic
            const roundedAmount = Math.ceil(numericAmount);
            const diff = roundedAmount - numericAmount;

            if (diff > 0) {
                // Find 'Savings' goal or just the first one for demo
                const { data: goals } = await supabase.from('goals').select('id, current_amount').limit(1).single();
                if (goals) {
                    await supabase.from('goals').update({
                        current_amount: goals.current_amount + diff
                    }).eq('id', goals.id);
                    toast.success(`חסכת ₪${diff.toFixed(2)} בעיגול אגורות!`);
                }
            }

            toast.success("ההוצאה נשמרה בהצלחה");
            if (onSuccess) onSuccess(numericAmount);
            onClose();

        } catch (error: any) {
            toast.error("שגיאה בשמירה", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="bg-slate-900/90 backdrop-blur-xl border-t border-white/10 text-white max-h-[90vh] flex flex-col">
                <div className="mx-auto w-full max-w-sm flex-1 flex flex-col overflow-hidden">
                    <DrawerHeader className="shrink-0">
                        <DrawerTitle className="text-center text-xl">הוספת הוצאה {category ? `- ${category}` : ""}</DrawerTitle>
                    </DrawerHeader>

                    <div className="p-4 space-y-6 pb-20 flex-1 overflow-y-auto">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-white/70">סכום</Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="text-4xl h-20 text-center bg-transparent border-white/20 focus:border-white/50 text-white placeholder:text-white/20"
                                    placeholder="0.00"
                                    autoFocus
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-white/40">₪</span>
                            </div>
                        </div>

                        {/* Date Picker (Native) */}
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-white/70">תאריך</Label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="date"
                                    value={date ? format(date, 'yyyy-MM-dd') : ''}
                                    onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl scheme-dark focus:outline-none focus:border-white/30"
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                            </div>
                        </div>

                        {/* Description Input */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white/70">הערות / פירוט</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white/5 border-white/10 text-white resize-none"
                                placeholder="פרטים נוספים..."
                            />
                        </div>

                        {/* Work Hour Cost Badge */}
                        {showWorkHours && (
                            <div className="flex justify-center">
                                {hourlyWage > 0 ? (
                                    <Badge variant="secondary" className="bg-red-500/20 text-red-200 border-red-500/30 py-1 px-3 gap-2 h-auto whitespace-normal text-center">
                                        <Clock className="w-3 h-3 shrink-0" />
                                        זה עולה לכם כ-{workHours.toFixed(1)} שעות עבודה
                                    </Badge>
                                ) : (
                                    <Link href="/settings" onClick={onClose}>
                                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-200 py-1 px-3 gap-2 h-auto whitespace-normal text-center cursor-pointer hover:bg-yellow-500/10">
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                            הגדר שכר שעתי כדי לראות כמה זה עולה באמת
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Identity Toggle */}
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                            <Label className="text-white">מי שילם?</Label>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm ${payer === "him" ? "text-white font-bold" : "text-white/50"}`}>הוא</span>
                                <Switch
                                    checked={payer === "her"}
                                    onCheckedChange={(checked) => setPayer(checked ? "her" : "him")}
                                    className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-blue-500"
                                />
                                <span className={`text-sm ${payer === "her" ? "text-white font-bold" : "text-white/50"}`}>היא</span>
                            </div>
                        </div>

                        {/* Surprise Mode Toggle */}
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-purple-400" />
                                <Label className="text-white">הפתעה?</Label>
                            </div>
                            <Switch
                                checked={isSurprise}
                                onCheckedChange={setIsSurprise}
                                className="data-[state=checked]:bg-purple-500"
                            />
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-white/50 text-sm justify-center">
                            <MapPin className="w-3 h-3" />
                            {location}
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-12 text-lg bg-white text-black hover:bg-white/90 rounded-xl font-bold mt-4"
                        >
                            {loading ? "שומר..." : "שמור הוצאה"}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
