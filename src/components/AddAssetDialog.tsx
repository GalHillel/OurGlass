"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Goal } from "@/types";
import { Loader2, Coins, TrendingUp, Building, Bitcoin, DollarSign } from "lucide-react";
import { ASSET_TYPES } from "@/lib/constants";
import { useAuth } from "@/components/AuthProvider";

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Goal | null;
}

export const AddAssetDialog = ({ isOpen, onClose, onSuccess, initialData }: AddAssetDialogProps) => {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"cash" | "stock" | "crypto" | "real_estate" | "money_market" | "usd_cash">("cash");
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                const initAmount = initialData.calculatedValue ?? initialData.current_amount;
                setAmount(initAmount.toString());
                // Map existing types
                if (initialData.type === 'money_market' || initialData.investment_type === 'money_market') setType('money_market');
                else if (initialData.type === 'stock') setType('stock');
                else if (initialData.investment_type === 'crypto') setType('crypto');
                else if (initialData.investment_type === 'real_estate') setType('real_estate');
                else if (initialData.investment_type === 'usd_cash') setType('usd_cash');
                else setType('cash');

                setSymbol(initialData.symbol || "");
                setQuantity(initialData.quantity?.toString() || "");
                setInterestRate(initialData.interest_rate?.toString() || "");
                setInvestmentDate(initialData.last_interest_calc?.split('T')[0] || new Date().toISOString().split('T')[0]);
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

            const isMoneyMarket = type === 'money_market';
            const isUsdCash = type === 'usd_cash';

            const payload: Partial<Goal> = {
                name,
                current_amount: numericAmount,
                quantity: numericQty,
                symbol: (type === 'stock' || type === 'crypto') ? symbol.toUpperCase() : undefined,
                type: isMoneyMarket ? 'money_market' : isUsdCash ? 'usd_cash' : (type === 'stock' || type === 'crypto') ? 'stock' : 'cash',
                investment_type: type,
                interest_rate: isMoneyMarket ? (numericYield || 4.5) : numericYield,
                last_interest_calc: isMoneyMarket ? new Date(investmentDate).toISOString() : new Date().toISOString(),
                last_updated: new Date().toISOString(),
                couple_id: profile?.couple_id || null,
                currency: isUsdCash ? 'USD' : undefined,
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

        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה בשמירה", { description: err.message || "Unknown error" });
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
                        <Select value={type} onValueChange={(v: typeof type) => setType(v)}>
                            <SelectTrigger className="bg-slate-950 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="cash">💰 {ASSET_TYPES.CASH}</SelectItem>
                                <SelectItem value="stock">📈 {ASSET_TYPES.STOCK}</SelectItem>
                                <SelectItem value="crypto">🪙 {ASSET_TYPES.CRYPTO}</SelectItem>
                                <SelectItem value="real_estate">🏠 {ASSET_TYPES.REAL_ESTATE}</SelectItem>
                                <SelectItem value="money_market">🏦 {ASSET_TYPES.MONEY_MARKET}</SelectItem>
                                <SelectItem value="usd_cash">💵 {ASSET_TYPES.USD_CASH}</SelectItem>
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

                    {type === 'money_market' && (
                        <div className="space-y-2">
                            <Label>תאריך השקעה</Label>
                            <Input
                                type="date"
                                value={investmentDate}
                                onChange={(e) => setInvestmentDate(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white text-base h-11"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{type === 'usd_cash' ? 'סכום בדולרים ($)' : type === 'money_market' ? 'סכום השקעה (בש״ח)' : (type === 'stock' || type === 'crypto') ? "שווי השקעה מקורי (למעקב רווח)" : "שווי נוכחי (בש״ח)"}</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amount} onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-950 border-white/10 text-white text-base h-11 pl-10"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{type === 'usd_cash' ? '$' : '₪'}</span>
                        </div>
                    </div>

                    {/* Annual Yield Field */}
                    <div className="space-y-2">
                        <Label>{type === 'money_market' ? 'ריבית שנתית (ברירת מחדל: 4.5%)' : 'תשואה שנתית משוערת (%)'}</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                                placeholder={type === 'money_market' ? '4.5' : '0'}
                                className="bg-slate-950 border-white/10 text-white pl-10 text-base h-11"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
                        </div>
                        <p className="text-[10px] text-white/40">
                            {type === 'money_market'
                                ? 'ריבית דריבית יומית לפי ריבית בנק ישראל (~4.5%). השווי יגדל כל יום.'
                                : 'הנכס יצבור ריבית דריבית יומית אוטומטית לפי אחוז זה.'}
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
