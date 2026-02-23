"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { WishlistItem } from "@/types";
import { Plus, Sparkles, Hourglass, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

import { WishlistCard } from "@/components/WishlistCard";
import { WishlistActionDrawer } from "@/components/WishlistActionDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";
import { useAuth } from "@/components/AuthProvider";
import { SwipeableRow } from "@/components/SwipeableRow";
import { motion, AnimatePresence } from "framer-motion";
import { getHebrewError } from "@/lib/utils";

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemLink, setNewItemLink] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
    const [oracleData, setOracleData] = useState<{ hours: number; affordable: boolean; missing: number } | null>(null);
    const [realNumberBalance, setRealNumberBalance] = useState(0);

    // Smart Action State
    const [activeItem, setActiveItem] = useState<WishlistItem | null>(null);
    const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const supabaseRef = useRef(createClient());
    const supabase = supabaseRef.current;
    const { profile } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('wishlist')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);

            // Fetch balance logic (simplified for oracle)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: txData } = await supabase.from('transactions').select('amount').gte('date', startOfMonth.toISOString());
            const { data: subData } = await supabase.from('subscriptions').select('amount');

            const totalExpenses = txData?.reduce((sum: number, tx: { amount: number }) => sum + Number(tx.amount), 0) || 0;
            const totalFixed = subData?.reduce((sum: number, sub: { amount: number }) => sum + Number(sub.amount), 0) || 0;
            const budget = profile?.budget || 20000;

            setRealNumberBalance(budget - totalFixed - totalExpenses);

        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, profile?.budget]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = async () => {
        if (!newItemName || !newItemPrice) return;

        try {
            const { error } = await supabase.from('wishlist').insert({
                name: newItemName,
                price: parseFloat(newItemPrice),
                link: newItemLink,
                status: 'pending',
                couple_id: profile?.couple_id
            });

            if (error) throw error;

            toast.success("נוסף לרשימת המשאלות");
            setIsDialogOpen(false);
            setNewItemName("");
            setNewItemPrice("");
            setNewItemLink("");
            fetchData();
        } catch (error: unknown) {
            toast.error("שגיאה בהוספה", { description: getHebrewError(error) });
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic UI
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success("הפריט הוסר");

        try {
            const { error } = await supabase.from('wishlist').delete().eq('id', id);
            if (error) throw error;
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error("שגיאה במחיקה", { description: err.message });
            fetchData();
        }
    };

    const handleDidntBuy = async (item: WishlistItem) => {
        const reward = item.price * 0.5;
        try {
            // Optimistic UI
            setItems(prev => prev.filter(i => i.id !== item.id));
            confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
            toast.success(`ויתרת והרווחת! ₪${reward} הועברו לחיסכון הכללי 🏆`);

            // Find or Create 'General Savings'
            let { data: savings } = await supabase.from('goals').select('*').eq('name', 'General Savings').single();

            // If explicit General Savings doesn't exist, try to find any 'cash' goal
            if (!savings) {
                const { data: anyCash } = await supabase.from('goals').select('*').eq('type', 'cash').limit(1).single();
                if (anyCash) {
                    savings = anyCash;
                } else {
                    // Create new
                    const { data: newSavings, error } = await supabase.from('goals').insert({
                        name: 'General Savings',
                        current_amount: 0,
                        target_amount: 100000,
                        type: 'cash',
                        currency: 'ILS',
                        couple_id: profile?.couple_id
                    }).select().single();
                    if (error) throw error;
                    savings = newSavings;
                }
            }

            // Update Savings
            if (savings) {
                await supabase.from('goals').update({
                    current_amount: (Number(savings.current_amount) || 0) + reward
                }).eq('id', savings.id);
            }

            // Delete Wishlist Item
            await supabase.from('wishlist').delete().eq('id', item.id);

        } catch (e: unknown) {
            const err = e as { message?: string };
            console.error(err);
            toast.error("שגיאה בפעולה", { description: err.message });
            fetchData(); // Revert on error
        }
    };

    const handleAction = (item: WishlistItem, type: 'deposit' | 'withdraw' | 'didnt_buy') => {
        if (type === 'didnt_buy') {
            handleDidntBuy(item);
            return;
        }
        setActiveItem(item);
        setActionType(type);
        setIsDrawerOpen(true);
    };

    const handleMoneyMove = async (item: WishlistItem, amount: number) => {
        try {
            const currentSaved = item.saved_amount || 0;
            const type = actionType;
            const newSaved = type === 'deposit' ? currentSaved + amount : currentSaved - amount;

            if (newSaved < 0) return;

            // 1. Update Wishlist
            const { error: wishError } = await supabase
                .from('wishlist')
                .update({ saved_amount: newSaved })
                .eq('id', item.id);
            if (wishError) throw wishError;

            // 2. Create Transaction
            // Positive amount in drawer logic means 'moving money'. BUT Transaction table...
            // Wait, Expenses are positive usually.
            // If I deposit to wishlist (Expense), Amount should be positive? 
            // Standard Logic: Expenses reduce balance. So positive Amount in transactions = expense.
            // Deposit to Wishlist = Expense (Money leaves checking).
            // Withdraw from Wishlist = Income? (Money returns to checking).
            // Usually 'transactions' table stores expenses as positive numbers?
            // Let's check `TransactionList`. `balance = budget - expenses`.
            // So YES, Expense is Positive.

            const description = type === 'deposit' ? `חיסכון ל${item.name} ` : `משיכה מ${item.name} `;

            // If withdraw, we are 'Adding back' to balance, so transaction should probably allow Negative?
            // Or maybe Withdraw is 'Income'?
            // Assuming current logic handles standard expenses.
            // If Withdraw, `txAmount` should be NEGATIVE expense? (Add to balance).
            // Yes.

            const finalTxAmount = type === 'deposit' ? amount : -amount;

            const { error: txError } = await supabase.from('transactions').insert({
                amount: finalTxAmount,
                description: description,
                date: new Date().toISOString(),
                category_id: null, // "Savings" category ideally
                is_surprise: false,
                couple_id: profile?.couple_id
            });
            if (txError) throw txError;

            // 3. Celebration & Feedback
            if (type === 'deposit') {
                toast.success(`הפקדת ₪${amount} בהצלחה!`);
                if (newSaved >= item.price) {
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
                    toast.success("הגעת ליעד! כל הכבוד! 🎉");
                }
            } else {
                toast.success(`משכת ₪${amount} מהחיסכון`);
            }

            fetchData();
        } catch (e: unknown) {
            const err = e as { message?: string };
            toast.error("שגיאה בפעולה", { description: err.message });
        }
    };

    const checkOracle = (item: WishlistItem) => {
        const hourlyWage = profile?.hourly_wage || 60;
        const hoursNeeded = item.price / hourlyWage;
        const affordable = realNumberBalance >= item.price;
        const missing = item.price - realNumberBalance;

        setSelectedItem(item);
        setOracleData({ hours: hoursNeeded, affordable, missing });
        setIsOracleOpen(true);

        if (affordable) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pt-8 pb-32 px-4 shadow-none">


            {/* Active Savings / Spare Change Harvester */}
            {realNumberBalance > 0 && realNumberBalance % 100 > 0 && (
                <div className="mx-2 mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center animate-bounce-slow">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">עיגול לטובה</h3>
                                <p className="text-[10px] text-purple-200/60">
                                    יש לך ₪{Math.floor(realNumberBalance % 100)} עודף בארנק.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={async () => {
                                const amount = Math.floor(realNumberBalance % 100);
                                if (amount <= 0) return;

                                // Logic: Distribute to "Most Needed" (Highest Priority or Closest)
                                // For simplicity, deposit to the FIRST item in the current sorted list
                                const targetItem = items[0];
                                if (!targetItem) {
                                    toast.error("אין פריטים ברשימה");
                                    return;
                                }

                                try {
                                    // 1. Transaction (Expense)
                                    await supabase.from('transactions').insert({
                                        amount: amount,
                                        description: `עיגול לטובה: ${targetItem.name}`,
                                        date: new Date().toISOString(),
                                        category_id: null,
                                        is_surprise: false
                                    });

                                    // 2. Wishlist Update
                                    const newSaved = (targetItem.saved_amount || 0) + amount;
                                    await supabase.from('wishlist').update({ saved_amount: newSaved }).eq('id', targetItem.id);

                                    toast.success(`הועברו ₪${amount} ל-${targetItem.name}!`);
                                    confetti({ particleCount: 150, spread: 60, origin: { y: 0.6 } });
                                    fetchData(); // Refresh
                                } catch {
                                    toast.error("שגיאה בפעולה");
                                }
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/20"
                        >
                            שמור אותם
                        </Button>
                    </motion.div>
                </div>
            )}

            {/* Smart Prioritization Controls */}
            <div className="flex justify-end px-2 mb-2 gap-2">
                <select
                    className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-purple-500/50"
                    onChange={(e) => {
                        const newSort = e.target.value;
                        const sorted = [...items];
                        if (newSort === 'price') sorted.sort((a, b) => a.price - b.price); // Cheapest first
                        else if (newSort === 'progress') sorted.sort((a, b) => (b.saved_amount || 0) / b.price - (a.saved_amount || 0) / a.price); // Closest to goal first
                        else if (newSort === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                        setItems(sorted);
                    }}
                >
                    <option value="newest">סידור: הכי חדש</option>
                    <option value="progress">הכי קרוב ליעד</option>
                    <option value="price">הכי זול</option>
                </select>
            </div>

            <div className="w-full space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
                        <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {items.length === 0 ? (
                            <EmptyState
                                icon={Sparkles}
                                title="הרשימה ריקה"
                                description="תתחילו לחלום! הוסיפו פריט חדש לרשימה."
                                actionLabel="הוסף חלום"
                                onAction={() => setIsDialogOpen(true)}
                            />
                        ) : (
                            items.map((item) => (
                                <SwipeableRow
                                    key={item.id}
                                    onDelete={() => handleDelete(item.id)}
                                    deleteMessage="לוותר על החלום הזה?"
                                >
                                    <WishlistCard
                                        item={item}
                                        onClick={() => checkOracle(item)}
                                        onAction={handleAction}
                                    />
                                </SwipeableRow>
                            ))
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Floating Action Button (FAB) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center justify-center z-50 border border-white/20"
                    >
                        <Plus className="w-8 h-8" />
                    </motion.button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md top-[20%] translate-y-0 text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            חלום חדש
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="מה בא לך לקנות?"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="bg-slate-950/50 border-white/10 text-white h-12 text-lg text-center focus:border-purple-500/50 transition-colors"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="מחיר"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    className="bg-slate-950/50 border-white/10 text-white h-12 text-lg pl-8 focus:border-purple-500/50 transition-colors text-left"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <Input
                            placeholder="לינק (אופציונלי)"
                            value={newItemLink}
                            onChange={(e) => setNewItemLink(e.target.value)}
                            className="bg-slate-950/50 border-white/10 text-white h-10 text-sm focus:border-purple-500/50 transition-colors"
                        />
                        <Button onClick={handleAdd} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold h-12 text-lg shadow-lg hover:shadow-purple-500/25 transition-all">
                            שמור לרשימה
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Oracle Dialog */}
            <Dialog open={isOracleOpen} onOpenChange={setIsOracleOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm rounded-[2rem] text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">
                            {oracleData?.affordable ? "יש אישור! 🚀" : "רגע, בואו נחשוב..."}
                        </DialogTitle>
                        <DialogDescription className="text-center text-white/60">
                            {selectedItem?.name} - ₪{selectedItem?.price}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 animate-pulse">
                                <Hourglass className="w-8 h-8 text-blue-400 animate-spin-slow" />
                            </div>
                            <p className="text-lg font-medium">מחיר בזמן עבודה</p>
                            <p className="text-4xl font-black text-blue-200 neon-text">
                                {oracleData?.hours.toFixed(1)} <span className="text-lg text-white/50">שעות</span>
                            </p>
                            <p className="text-xs text-white/40">לפי שכר של ₪{profile?.hourly_wage || 60}/שעה</p>
                        </div>

                        {!oracleData?.affordable && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-200">חורג מהתקציב</p>
                                    <p className="text-sm text-red-200/70">
                                        חסרים לכם ₪{oracleData?.missing.toFixed(0)}.
                                        {oracleData?.missing && oracleData.missing > 0 && (
                                            <span> נסו לחסוך עוד קצת!</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsOracleOpen(false)} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl h-12">
                            הבנתי, תודה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Smart Action Drawer */}
            <WishlistActionDrawer
                key={isDrawerOpen ? `${activeItem?.id}-${actionType}` : 'closed'}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                item={activeItem}
                mode={actionType}
                onConfirm={handleMoneyMove}
            />
        </div >
    );
}

