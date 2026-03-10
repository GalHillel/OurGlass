"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Goal } from "@/types";
import { Loader2, ArrowLeftRight, Calendar } from "lucide-react";
import { ASSET_TYPES, CURRENCY_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Slider } from "@/components/ui/slider";

const assetSchema = z.object({
    name: z.string().min(2, "שם הנכס חייב להכיל לפחות 2 תווים"),
    initial_amount: z.number().min(0, "סכום ראשוני לא יכול להיות שלילי"),
    annual_interest_percent: z.number().min(0, "ריבית לא יכולה להיות שלילית"),
    tax_rate_percent: z.number().min(0).max(100).nullable(),
    start_date: z.string(),
    type: z.enum(["cash", "savings", "foreign_currency", "real_estate", "money_market", "mutual_fund"]),
    symbol: z.string().optional(),
    quantity: z.number().optional(),
    exit_dates: z.array(z.object({
        date: z.string(),
        amount: z.number()
    })).nullable()
});

type AssetType = "cash" | "savings" | "foreign_currency" | "real_estate" | "money_market" | "mutual_fund";

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
    const [taxRate, setTaxRate] = useState(0);
    const [initialDeposit, setInitialDeposit] = useState("");
    const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [exitDates, setExitDates] = useState<{ date: string; amount: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;

    const isForeignCurrency = type === 'foreign_currency';
    const isMoneyMarket = type === 'money_market';
    const isMutualFund = type === 'mutual_fund';
    const isSavings = type === 'savings';
    const isCashOnly = type === 'cash';

    const showTaxAndAccretion = isMoneyMarket || isSavings || isMutualFund;
    const showExitDates = isMoneyMarket || isSavings;

    // Dual Currency State
    const [amountUSD, setAmountUSD] = useState("");
    const [amountILS, setAmountILS] = useState("");

    const handleUSDChange = (val: string) => {
        setAmountUSD(val);
        const numeric = parseFloat(val) || 0;
        setAmountILS((numeric * usdToIls).toFixed(2));
        setAmount(val);
    };

    const handleILSChange = (val: string) => {
        setAmountILS(val);
        const numeric = parseFloat(val) || 0;
        const usdValue = (numeric / usdToIls).toFixed(2);
        setAmountUSD(usdValue);
        setAmount(usdValue);
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name || "");
                const initAmount = initialData.calculatedValue ?? initialData.current_amount ?? 0;
                setAmount(initAmount.toString());

                // Type Mapping
                if (initialData.investment_type === 'money_market' || initialData.type === 'money_market') setType('money_market');
                else if (initialData.investment_type === 'mutual_fund' || initialData.type === 'mutual_fund') setType('mutual_fund');
                else if (initialData.investment_type === 'real_estate') setType('real_estate');
                else if (initialData.investment_type === 'savings' || (initialData.type === 'cash' && initialData.interest_rate)) setType('savings');
                else if (initialData.investment_type === 'foreign_currency' || initialData.type === 'foreign_currency') {
                    setType('foreign_currency');
                    const usdVal = (initialData.current_amount || 0).toString();
                    setAmountUSD(usdVal);
                    setAmountILS(((initialData.current_amount || 0) * usdToIls).toFixed(2));
                }
                else setType('cash');

                setSymbol(initialData.symbol || "");
                setQuantity(initialData.quantity?.toString() || "");
                setInterestRate(initialData.annual_interest_percent?.toString() || initialData.interest_rate?.toString() || "");
                setTaxRate(initialData.tax_rate_percent || 0);
                setInitialDeposit(initialData.initial_amount?.toString() || "");
                setInvestmentDate(initialData.start_date?.split('T')[0] || initialData.last_interest_calc?.split('T')[0] || new Date().toISOString().split('T')[0]);
                setExitDates(initialData.exit_dates || []);
            } else {
                setName("");
                setAmount("");
                setAmountUSD("");
                setAmountILS("");
                setType("cash");
                setSymbol("");
                setQuantity("");
                setInterestRate("");
                setTaxRate(0);
                setInitialDeposit("");
                setInvestmentDate(new Date().toISOString().split('T')[0]);
                setExitDates([]);
            }
        }
    }, [isOpen, initialData, usdToIls]);

    const handleSave = async () => {
        try {
            const numericInitial = parseFloat(initialDeposit) || parseFloat(amount) || 0;
            const accrualStartIso = new Date(`${investmentDate}T00:00:00.000Z`).toISOString();

            const validationData = {
                name,
                initial_amount: numericInitial,
                annual_interest_percent: parseFloat(interestRate) || (isMoneyMarket || isMutualFund ? 4.5 : 0),
                tax_rate_percent: taxRate,
                start_date: accrualStartIso,
                type,
                symbol: symbol || undefined,
                quantity: parseFloat(quantity) || undefined,
                exit_dates: (showExitDates && exitDates.length > 0) ? exitDates : null
            };

            const validated = assetSchema.parse(validationData);
            setLoading(true);

            const payload: any = {
                name: validated.name,
                current_amount: parseFloat(amount) || 0,
                quantity: validated.quantity || 0,
                type: (isMoneyMarket || isMutualFund) ? 'money_market' : isForeignCurrency ? 'foreign_currency' : 'cash',
                investment_type: validated.type,
                annual_interest_percent: validated.annual_interest_percent,
                interest_rate: validated.annual_interest_percent,
                last_updated: new Date().toISOString(),
                couple_id: profile?.couple_id || null,
                currency: isForeignCurrency ? 'USD' : undefined,
                initial_amount: validated.initial_amount,
                start_date: validated.start_date,
                tax_rate_percent: validated.tax_rate_percent,
                exit_dates: validated.exit_dates,
                symbol: validated.symbol || null,
            };

            if (initialData) {
                const { error } = await supabase.from('goals').update(payload).eq('id', initialData.id);
                if (error) throw error;
                toast.success("הנכס עודכן");
            } else {
                payload.target_amount = (validated.initial_amount || 1) * 2;
                payload.growth_rate = validated.annual_interest_percent;
                const { error } = await supabase.from('goals').insert(payload);
                if (error) throw error;
                toast.success("נכס חדש נוסף");
            }

            queryClient.invalidateQueries({ queryKey: ['wealthData'] });
            queryClient.invalidateQueries({ queryKey: ['global-cashflow'] });
            onSuccess();
            onClose();

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                toast.error(error.issues[0].message);
            } else {
                toast.error("שגיאה בשמירה", { description: error.message || "Unknown error" });
            }
        } finally {
            setLoading(false);
        }
    };

    const amountLabel = isForeignCurrency
        ? 'הכנס סכום (דולר או שקל)'
        : isMoneyMarket || isMutualFund
            ? 'סכום השקעה (בש״ח)'
            : "שווי נוכחי (בש״ח)";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                                { id: 'money_market', label: ASSET_TYPES.MONEY_MARKET, icon: "🏦", color: "purple" },
                                { id: 'mutual_fund', label: ASSET_TYPES.MUTUAL_FUND, icon: "📈", color: "indigo" },
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
                        {showTaxAndAccretion && (
                            <motion.div
                                key="wealth-extra-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden space-y-4"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>תאריך הפקדה</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={investmentDate}
                                                onChange={(e) => setInvestmentDate(e.target.value)}
                                                className="bg-slate-950 border-white/10 text-white text-base h-11 pr-10"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>סכום התחלתי</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={initialDeposit}
                                                onChange={(e) => setInitialDeposit(e.target.value)}
                                                placeholder={amount || "0"}
                                                className="bg-slate-950 border-white/10 text-white text-base h-11 pl-8"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">{CURRENCY_SYMBOL}</span>
                                        </div>
                                    </div>
                                </div>
                                {showExitDates && (
                                    <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold text-white/60">משיכות (Exit Dates)</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExitDates([...exitDates, { date: new Date().toISOString().split('T')[0], amount: 0 }])}
                                                className="h-7 text-[10px] bg-white/5 hover:bg-white/10"
                                            >
                                                הוסף משיכה +
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {exitDates.map((exit, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Input
                                                        type="date"
                                                        value={exit.date}
                                                        onChange={(e) => {
                                                            const newExits = [...exitDates];
                                                            newExits[idx].date = e.target.value;
                                                            setExitDates(newExits);
                                                        }}
                                                        className="h-8 text-xs bg-slate-950 border-white/5"
                                                    />
                                                    <div className="relative flex-1">
                                                        <Input
                                                            type="number"
                                                            value={exit.amount || ""}
                                                            onChange={(e) => {
                                                                const newExits = [...exitDates];
                                                                newExits[idx].amount = parseFloat(e.target.value) || 0;
                                                                setExitDates(newExits);
                                                            }}
                                                            placeholder="סכום"
                                                            className="h-8 text-xs bg-slate-950 border-white/5 pl-6"
                                                        />
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-white/30">{CURRENCY_SYMBOL}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setExitDates(exitDates.filter((_, i) => i !== idx))}
                                                        className="h-8 w-8 text-white/20 hover:text-red-400"
                                                    >
                                                        <Loader2 className="w-3 h-3 rotate-45" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

                        {isForeignCurrency && (
                            <div className="flex items-center gap-1.5 text-[11px] text-blue-300/70 mt-1 p-2 bg-blue-500/10 rounded-lg border border-blue-500/15">
                                <ArrowLeftRight className="w-3 h-3 shrink-0" />
                                <span>שער נוכחי: 1$ = {CURRENCY_SYMBOL}{usdToIls.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {
                        !isCashOnly && !isForeignCurrency && (
                            <div className="space-y-2">
                                <Label>{isMoneyMarket || isMutualFund ? 'ריבית שנתית (ברירת מחדל: 4.5%)' : 'תשואה שנתית משוערת (%)'}</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={interestRate} onChange={(e) => setInterestRate(e.target.value)}
                                        placeholder={isMoneyMarket || isMutualFund ? '4.5' : '0'}
                                        className="bg-slate-950 border-white/10 text-white pl-10 text-base h-11"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">%</span>
                                </div>
                                <p className="text-[10px] text-white/40">
                                    {isMoneyMarket || isMutualFund
                                        ? 'ריבית דריבית יומית לפי ריבית בנק ישראל (~4.5%). השווי יגדל כל יום.'
                                        : 'הנכס יצבור ריבית דריבית יומית אוטומטית לפי אחוז זה.'}
                                </p>
                            </div>
                        )
                    }
                </div >

                <DialogFooter className="sticky bottom-0 bg-slate-900 pt-2 border-t border-white/5">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור נכס"}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
};
