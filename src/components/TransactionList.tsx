"use client";

import { Transaction } from "@/types";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Trash2, Edit2, ShoppingBag, Coffee, Car, Film, FileText, Utensils, Fuel, ShoppingCart } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TransactionListProps {
    transactions: Transaction[];
    onRefresh: () => void;
}

const getIcon = (description: string | null) => {
    if (!description) return ShoppingBag;
    if (description.includes("קפה")) return Coffee;
    if (description.includes("סופר")) return ShoppingCart;
    if (description.includes("דלק")) return Fuel;
    if (description.includes("מסעדה")) return Utensils;
    if (description.includes("בילוי")) return Film;
    if (description.includes("תחבורה")) return Car;
    if (description.includes("חשבונות")) return FileText;
    return ShoppingBag;
};

export const TransactionList = ({ transactions, onRefresh }: TransactionListProps) => {
    const supabase = createClientComponentClient();

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            toast.success("העסקה נמחקה");
            onRefresh();
        } catch (error: any) {
            toast.error("שגיאה במחיקה", { description: error.message });
        }
    };

    if (transactions.length === 0) {
        return (
            <div className="text-center text-white/40 py-8">
                אין עסקאות להצגה
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-3 px-4">
            <h3 className="text-white/80 text-lg font-medium mb-2">פירוט עסקאות</h3>
            {transactions.map((tx) => {
                const [title, note] = (tx.description || "").split('\n');
                const Icon = getIcon(title || tx.description || "");
                return (
                    <div key={tx.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white truncate">{title || "ללא תיאור"}</h4>
                                {note && (
                                    <p className="text-sm text-white/70 break-words line-clamp-2">{note}</p>
                                )}
                                <p className="text-xs text-white/50 mt-0.5">
                                    {format(new Date(tx.date), "d בMMMM, HH:mm", { locale: he })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-bold text-white">₪{tx.amount}</span>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors flex-shrink-0">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>למחוק את העסקה?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-white/60">
                                            פעולה זו לא ניתנת לביטול.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/10 border-white/10 text-white hover:bg-white/20">ביטול</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-red-500 hover:bg-red-600 text-white">
                                            מחק
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
