"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types";

interface CalendarProps {
    transactions: Transaction[];
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
}

export const MonthlyCalendar = ({ transactions, selectedDate, onDateSelect }: CalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const getDailyTotal = (date: Date) => {
        return transactions
            .filter(tx => isSameDay(new Date(tx.date), date))
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
    };

    const selectedTotal = selectedDate ? getDailyTotal(selectedDate) : 0;

    return (
        <div className="w-full">
            <div className="glass p-6 rounded-3xl border border-white/10 shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: he })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
                        <div key={day} className="text-xs text-white/40 font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const total = getDailyTotal(day);
                        const hasActivity = total !== 0;

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => onDateSelect(isSelected ? null : day)}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200",
                                    !isCurrentMonth && "opacity-20",
                                    isSelected
                                        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110 z-10 font-bold"
                                        : "hover:bg-white/5 text-white/80",
                                    isToday(day) && !isSelected && "border border-white/20 bg-white/5"
                                )}
                            >
                                <span className={cn(
                                    "text-sm",
                                    isSelected && "text-black"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {hasActivity && !isSelected && (
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full mt-1",
                                        total > 0 ? "bg-red-400" : "bg-emerald-400" // Red for expenses (positive in DB?), Green for income
                                        // Wait, typical DB: Expense = Positive, Income = Negative? Or vice versa?
                                        // Usually Expense is Positive number in simple trackers, or Negative. 
                                        // Assuming Expense = Positive based on previous Real Number calc (Budget - Expenses).
                                        // So Positive = Red (Expense). Negative = Green (Income/Refund).
                                    )} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Daily Transactions */}
            {selectedDate && (() => {
                const dayTransactions = transactions.filter(tx => isSameDay(new Date(tx.date), selectedDate));
                return (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-4 space-y-3">
                        <div className="glass p-4 rounded-2xl border border-white/10 flex justify-between items-center bg-blue-500/10">
                            <span className="text-white/60 text-sm">סה״כ ל-{format(selectedDate, 'd.M', { locale: he })}:</span>
                            <span className="text-xl font-black text-white">₪{selectedTotal.toLocaleString()}</span>
                        </div>

                        {dayTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {dayTransactions.map(tx => (
                                    <div key={tx.id} className="glass p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className="text-sm font-medium text-white truncate">
                                                {tx.description || 'ללא תיאור'}
                                            </span>
                                            {tx.category && (
                                                <span className="text-[10px] text-white/40">{tx.category}</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-red-400 shrink-0 mr-3">
                                            ₪{Number(tx.amount).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-white/30 text-sm py-2">אין הוצאות ביום זה</p>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};
