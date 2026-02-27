"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Goal } from "@/types";
import { Loader2, ArrowLeftRight, CreditCard, Banknote, Landmark, TrendingUp, Home } from "lucide-react";
import { ASSET_TYPES, CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

type AssetType = "cash" | "savings" | "foreign_currency" | "real_estate" | "money_market";

interface AddAssetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Goal | null;
    usdToIls?: number;
}

export const AddAssetDialog = ({ isOpen, onClose, onSuccess, initialData, usdToIls = 3.7 }: AddAssetDialogProps) => {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<AssetType>("cash");
    const [symbol, setSymbol] = useState("");
    const [quantity, setQuantity] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const isForeignCurrency = type === 'foreign_currency';
    const isMoneyMarket = type === 'money_market';
    const isSavings = type === 'savings';
    const isCashOnly = type === 'cash';

    // Dual Currency State
    const [amountUSD, setAmountUSD] = useState("");
    const [amountILS, setAmountILS] = useState("");

    // Bi-directional sync for foreign currency
    const handleUSDChange = (val: string) => {
        setAmountUSD(val);
        const numeric = parseFloat(val) || 0;
        setAmountILS((numeric * usdToIls).toFixed(2));
        setAmount(val); // Save USD amount to DB
    };

    const handleILSChange = (val: string) => {
        setAmountILS(val);
        const numeric = parseFloat(val) || 0;
        const usdValue = (numeric / usdToIls).toFixed(2);
        setAmountUSD(usdValue);
        setAmount(usdValue); // Save USD amount to DB
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                const initAmount = initialData.calculatedValue ?? initialData.current_amount;
                setAmount(initAmount.toString());
                // Map existing types
                if (initialData.type === 'money_market' || initialData.investment_type === 'money_market') setType('money_market');
                else if (initialData.investment_type === 'real_estate') setType('real_estate');
                else if (initialData.investment_type === 'savings' || (initialData.type === 'cash' && initialData.interest_rate)) setType('savings');
                else if (initialData.investment_type === 'foreign_currency' || initialData.type === 'foreign_currency') {
                    setType('foreign_currency');
                    const usdVal = initialData.current_amount.toString();
                    setAmountUSD(usdVal);
                    setAmountILS((initialData.current_amount * usdToIls).toFixed(2));
                }
                else setType('cash');

                setSymbol(initialData.symbol || "");
                setQuantity(initialData.quantity?.toString() || "");
                setInterestRate(initialData.interest_rate?.toString() || "");
                setInvestmentDate(initialData.last_interest_calc?.split('T')[0] || new Date().toISOString().split('T')[0]);
            } else {
                setName("");
                setAmount("");
                setAmountUSD("");
                setAmountILS("");
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
            const numericAmount = parseFloat(amount) || 0;
            const numericQty = parseFloat(quantity) || 0;
            const numericYield = parseFloat(interestRate) || 0;

            const finalPrincipal = numericAmount;
            const accrualStartIso = new Date(`${investmentDate}T00:00:00.000Z`).toISOString();

            const payload: Partial<Goal> = {
                name,
                current_amount: finalPrincipal,
                quantity: numericQty,
                type: isMoneyMarket ? 'money_market' : isForeignCurrency ? 'foreign_currency' : 'cash',
                investment_type: type,
                interest_rate: (isMoneyMarket || isSavings) ? (numericYield || (isMoneyMarket ? 4.5 : 0)) : 0,
                last_interest_calc: initialData?.last_interest_calc || accrualStartIso,
                last_updated: new Date().toISOString(),
                couple_id: profile?.couple_id || null,
                currency: isForeignCurrency ? 'USD' : undefined,
            };

            if (initialData) {
                const { error } = await supabase.from('goals').update(payload).eq('id', initialData.id);
                if (error) throw error;
                toast.success("הנכס עודכן");
            } else {
                payload.target_amount = numericAmount * 2;
                payload.growth_rate = 0;

                const { error } = await supabase.from('goals').insert(payload);
                if (error) throw error;
                toast.success("נכס חדש נוסף");
            }

            queryClient.invalidateQueries({ queryKey: ['wealthData'] });
            queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });

            onSuccess();
            onClose();

        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה בשמירה", { description: err.message || "Unknown error" });
        } finally {
            setLoading(false);
        }
    };

    const amountLabel = isForeignCurrency
        ? 'הכנס סכום (דולר או שקל)'
        : isMoneyMarket
            ? 'סכום השקעה (בש״ח)'
            : "שווי נוכחי (בש״ח)";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center neon-text text-xl">
                        {initialData ? "עריכת נכס" : "הוספת נכס חדש"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-white/60 mr-1">סוג הנכס</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'cash', label: ASSET_TYPES.CASH, icon: "💰", color: "blue" },
                                { id: 'savings', label: ASSET_TYPES.SAVINGS, icon: "🐷", color: "emerald" },
                                { id: 'foreign_currency', label: ASSET_TYPES.FOREIGN_CURRENCY, icon: "💵", color: "blue" },
                                { id: 'real_estate', label: ASSET_TYPES.REAL_ESTATE, icon: "🏠", color: "orange" },
                                { id: 'money_market', label: ASSET_TYPES.MONEY_MARKET || "קרן כספית", icon: "🏦", color: "purple" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setType(item.id as AssetType)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 gap-1.5",
                                        type === item.id
                                            ? `bg-${item.color}-500/20 border-${item.color}-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]`
                                            : "bg-slate-950/50 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className={cn(
                                        "text-[11px] font-bold",
                                        type === item.id ? `text-${item.color}-300` : "text-white/40"
                                    )}>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>שם הנכס</Label>
                        <Input
                            value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="לדוגמה: קרן השתלמות, טסלה..."
                            className="bg-slate-950 border-white/10 text-white text-base h-11"
                        />
                    </div>


                    <AnimatePresence mode="wait">
                        {isMoneyMarket && !initialData && (
                            <motion.div
                                key="money-market-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2">
                                    <Label>תאריך השקעה</Label>
                                    <Input
                                        type="date"
                                        value={investmentDate}
                                        onChange={(e) => setInvestmentDate(e.target.value)}
                                        className="bg-slate-950 border-white/10 text-white text-base h-11"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-2">
                        <Label>{amountLabel}</Label>
                        {isForeignCurrency ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-white/40">סכום בדולר ($)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={amountUSD}
                                            onChange={(e) => handleUSDChange(e.target.value)}
                                            className="bg-slate-950 border-white/10 text-white text-base h-11 pl-8"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">$</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-white/40">סכום בשקל ({CURRENCY_SYMBOL})</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={amountILS}
                                            onChange={(e) => handleILSChange(e.target.value)}
                                            className="bg-slate-950 border-white/10 text-white text-base h-11 pl-8"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">{CURRENCY_SYMBOL}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={amount} onChange={(e) => setAmount(e.target.value)}
                                    className="bg-slate-950 border-white/10 text-white text-base h-11 pl-10"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{CURRENCY_SYMBOL}</span>
                            </div>
                        )}

                        {/* Live exchange rate hint for foreign currency */}
                        {isForeignCurrency && (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-300/70 mt-1 p-2 bg-blue-500/10 rounded-lg border border-blue-500/15">
                                <ArrowLeftRight className="w-3 h-3 shrink-0" />
                                <span>שער נוכחי: 1$ = {CURRENCY_SYMBOL}{usdToIls.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Annual Yield Field - Hidden for Cash and Foreign Currency */}
                    {!isCashOnly && !isForeignCurrency && (
                        <div className="space-y-2">
                            <Label>{isMoneyMarket ? 'ריבית שנתית (ברירת מחדל: 4.5%)' : 'תשואה שנתית משוערת (%)'}</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                                    placeholder={isMoneyMarket ? '4.5' : '0'}
                                    className="bg-slate-950 border-white/10 text-white pl-10 text-base h-11"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
                            </div>
                            <p className="text-[10px] text-white/40">
                                {isMoneyMarket
                                    ? 'ריבית דריבית יומית לפי ריבית בנק ישראל (~4.5%). השווי יגדל כל יום.'
                                    : 'הנכס יצבור ריבית דריבית יומית אוטומטית לפי אחוז זה.'}
                            </p>
                        </div>
                    )}

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
