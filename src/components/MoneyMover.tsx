"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Wallet, Rocket, Shield, User } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

interface MoneyMoverProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const MoneyMover = ({ isOpen, onClose, onSuccess }: MoneyMoverProps) => {
    const [amount, setAmount] = useState("");
    const [destination, setDestination] = useState<string>("cash");
    const [loading, setLoading] = useState(false);
    const supabase = createClientComponentClient();

    const handleMove = async () => {
        if (!amount) return;
        setLoading(true);

        try {
            const numericAmount = parseFloat(amount);

            // 1. Find the target goal
            const { data: existingGoal } = await supabase
                .from('goals')
                .select('*')
                .eq('type', destination)
                .single();

            if (existingGoal) {
                // Update existing
                const { error } = await supabase
                    .from('goals')
                    .update({ current_amount: existingGoal.current_amount + numericAmount })
                    .eq('id', existingGoal.id);

                if (error) throw error;
            } else {
                // Create new if doesn't exist
                let name = "חסכונות";
                if (destination === 'stock') name = "השקעות";
                if (destination === 'pocket_him') name = "כיס שלו";
                if (destination === 'pocket_her') name = "כיס שלה";

                const { error } = await supabase.from('goals').insert({
                    name,
                    target_amount: 10000, // Default target
                    current_amount: numericAmount,
                    type: destination,
                    growth_rate: destination === 'stock' ? 7 : 0
                });

                if (error) throw error;
            }

            toast.success("הכסף עבר בהצלחה! 💸");
            onSuccess();
            onClose();
            setAmount("");
        } catch (error: any) {
            toast.error("שגיאה בהעברה", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                        מזיזים כספים
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>לאן הכסף הולך?</Label>
                        <Select value={destination} onValueChange={setDestination}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="cash">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-400" />
                                        <span>המבצר (מזומן)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="stock">
                                    <div className="flex items-center gap-2">
                                        <Rocket className="w-4 h-4 text-purple-400" />
                                        <span>הטיל (השקעות)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pocket_him">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-blue-400" />
                                        <span>כיס שלו</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="pocket_her">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-pink-400" />
                                        <span>כיס שלה</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>כמה להעביר?</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-10 h-12 text-lg"
                                placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₪</span>
                        </div>
                        <p className="text-xs text-white/40">אפשר להזין מספר שלילי כדי למשוך כסף</p>
                    </div>

                    <Button
                        onClick={handleMove}
                        disabled={loading}
                        className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold rounded-xl"
                    >
                        {loading ? "מעביר..." : "בצע העברה"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
