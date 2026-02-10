"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Goal } from "@/types";
import { Loader2, Coins, TrendingUp, Building, Bitcoin } from "lucide-react";
import { ASSET_TYPES } from "@/lib/constants";

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Goal | null;
}

export const AddAssetDialog = ({ isOpen, onClose, onSuccess, initialData }: AddAssetDialogProps) => {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"cash" | "stock" | "crypto" | "real_estate">("cash"); // Internal type mapping
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [loading, setLoading] = useState(false);

    const supabaseRef = useRef(createClientComponentClient());
    const supabase = supabaseRef.current;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setAmount(initialData.current_amount.toString());
                // Map existing types
                if (initialData.type === 'stock') setType('stock');
                else if (initialData.investment_type === 'crypto') setType('crypto');
                else if (initialData.investment_type === 'real_estate') setType('real_estate');
                else setType('cash');

                setSymbol(initialData.symbol || "");
                setQuantity(initialData.quantity?.toString() || "");
                setInterestRate(initialData.interest_rate?.toString() || "");
            } else {
                setName("");
                setAmount("");
                setType("cash");
                setSymbol("");
                setQuantity("");
                setInterestRate("");
            }
        }
    }, [isOpen, initialData]);

    const handleSave = async () => {
        if (!name) {
            toast.error("יש להזין שם לנכס");
            return;
        }
        setLoading(true);

        try {
            // Mapping Logic
            // If Stock/Crypto, quantity is key. Amount might be calculated or manually entered as "Initial Investment".
            // We'll store quantity if relevant.

            const numericAmount = parseFloat(amount) || 0; // Current Value or Invested
            const numericQty = parseFloat(quantity) || 0;
            const numericYield = parseFloat(interestRate) || 0;

            const payload: any = {
                name,
                current_amount: numericAmount, // Base value
                quantity: numericQty,
                symbol: (type === 'stock' || type === 'crypto') ? symbol.toUpperCase() : null,
                type: (type === 'stock' || type === 'crypto') ? 'stock' : 'cash', // DB 'type' is strict
                investment_type: type, // New field for specific subtype
                interest_rate: numericYield,
                last_interest_calc: new Date().toISOString(), // Reset calc date on update to avoid jump? Or maybe keep old? 
                // Decision: Reset calc date when manually updating amount to avoid double counting.
                last_updated: new Date().toISOString(),
                // Determine icon or color if needed
            };

            if (initialData) {
                const { error } = await supabase.from('goals').update(payload).eq('id', initialData.id);
                if (error) throw error;
                toast.success("הנכס עודכן");
            } else {
                // Needed fields for Goal table constraints if any?
                payload.target_amount = numericAmount * 2; // Dummy target if required
                payload.growth_rate = 0;

                const { error } = await supabase.from('goals').insert(payload);
                if (error) throw error;
                toast.success("נכס חדש נוסף");
            }

            onSuccess();
            onClose();

        } catch (error: any) {
            toast.error("שגיאה בשמירה", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center neon-text text-xl">
                        {initialData ? "עריכת נכס" : "הוספת נכס חדש"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>סוג הנכס</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="bg-slate-950 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="cash">💰 {ASSET_TYPES.CASH}</SelectItem>
                                <SelectItem value="stock">📈 {ASSET_TYPES.STOCK}</SelectItem>
                                <SelectItem value="crypto">🪙 {ASSET_TYPES.CRYPTO}</SelectItem>
                                <SelectItem value="real_estate">🏠 {ASSET_TYPES.REAL_ESTATE}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>שם הנכס</Label>
                        <Input
                            value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="לדוגמה: קרן השתלמות, טסלה..."
                            className="bg-slate-950 border-white/10 text-white text-base h-11"
                        />
                    </div>

                    {(type === 'stock' || type === 'crypto') && (
                        <div className="flex gap-4">
                            <div className="space-y-2 flex-1">
                                <Label>סימול (Symbol)</Label>
                                <Input
                                    value={symbol} onChange={(e) => setSymbol(e.target.value)}
                                    placeholder="AAPL, BTC..."
                                    className="bg-slate-950 border-white/10 text-white uppercase font-mono text-base h-11"
                                />
                            </div>
                            <div className="space-y-2 flex-1">
                                <Label>כמות יחידות</Label>
                                <Input
                                    type="number"
                                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-slate-950 border-white/10 text-white text-base h-11"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{(type === 'stock' || type === 'crypto') ? "שווי השקעה מקורי (למעקב רווח)" : "שווי נוכחי (בש״ח)"}</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amount} onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white text-base h-11 pl-10"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₪</span>
                        </div>
                    </div>

                    {/* Annual Yield Field */}
                    <div className="space-y-2">
                        <Label>תשואה שנתית משוערת (%)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                                placeholder="0"
                                className="bg-slate-950 border-white/10 text-white pl-10 text-base h-11"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
                        </div>
                        <p className="text-[10px] text-white/40">
                            הנכס יצבור ריבית דריבית יומית אוטומטית לפי אחוז זה.
                        </p>
                    </div>

                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור נכס"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
