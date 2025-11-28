"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { WishlistItem } from "@/types";
import { Plus, Check, X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";
import { useAuth } from "@/components/AuthProvider";
import { WishlistGrid } from "@/components/WishlistGrid";

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

    const supabase = createClientComponentClient();
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

            // Fetch balance logic
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: txData } = await supabase.from('transactions').select('amount').gte('date', startOfMonth.toISOString());
            const { data: subData } = await supabase.from('subscriptions').select('amount');

            const totalExpenses = txData?.reduce((sum, tx: any) => sum + Number(tx.amount), 0) || 0;
            const totalFixed = subData?.reduce((sum, sub) => sum + Number(sub.amount), 0) || 0;
            const budget = profile?.budget || 20000;

            setRealNumberBalance(budget - totalFixed - totalExpenses);

        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, profile?.budget, profile?.hourly_wage]); // Only depend on specific profile fields

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
                status: 'pending'
            });

            if (error) throw error;

            toast.success("נוסף לרשימת המשאלות");
            setIsDialogOpen(false);
            setNewItemName("");
            setNewItemPrice("");
            setNewItemLink("");
            fetchData();
        } catch (error: any) {
            toast.error("שגיאה בהוספה", { description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic UI
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success("הפריט הוסר");

        try {
            const { error } = await supabase.from('wishlist').delete().eq('id', id);
            if (error) throw error;
        } catch (error: any) {
            toast.error("שגיאה במחיקה", { description: error.message });
            fetchData(); // Revert on error
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
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pt-8 pb-20 px-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">רשימת משאלות</h1>
                <p className="text-white/60">דברים שבא לנו לקנות</p>
            </div>

            <div className="flex justify-center">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-8 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            <Plus className="w-4 h-4 mr-2" /> הוסף משאלה
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>מה בא לכם לקנות?</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="שם הפריט"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="מחיר משוער"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Input
                                placeholder="לינק (אופציונלי)"
                                value={newItemLink}
                                onChange={(e) => setNewItemLink(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <Button onClick={handleAdd} className="w-full bg-white text-black font-bold hover:bg-white/90">
                                הוסף לרשימה
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {loading ? (
                    <>
                        <Skeleton className="h-48 rounded-3xl bg-white/5" />
                        <Skeleton className="h-48 rounded-3xl bg-white/5" />
                    </>
                ) : (
                    <WishlistGrid
                        items={items}
                        onDelete={handleDelete}
                        onCheckOracle={checkOracle}
                    />
                )}
            </div>

            {/* Oracle Dialog */}
            <Dialog open={isOracleOpen} onOpenChange={setIsOracleOpen}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
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
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                <Clock className="w-8 h-8 text-blue-400" />
                            </div>
                            <p className="text-lg font-medium">מחיר בזמן עבודה</p>
                            <p className="text-3xl font-bold text-blue-200">
                                {oracleData?.hours.toFixed(1)} שעות
                            </p>
                            <p className="text-sm text-white/40">לפי שכר של ₪{profile?.hourly_wage || 60}/שעה</p>
                        </div>

                        {!oracleData?.affordable && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
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
                        <Button onClick={() => setIsOracleOpen(false)} className="w-full bg-white/10 hover:bg-white/20 text-white">
                            הבנתי, תודה
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
