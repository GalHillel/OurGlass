"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ShoppingBag, Coffee, Car, Film, FileText, Utensils, Fuel, ShoppingCart, ChevronLeft } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { ActivePress } from '@/components/ui/ActivePress';

interface HomeTransactionFeedProps {
    transactions: Transaction[];
    onEdit: (tx: Transaction) => void;
    limit?: number;
}

const getIcon = (description: string | null) => {
    if (!description) return ShoppingBag;
    const desc = description.toLowerCase();
    if (desc.includes("קפה")) return Coffee;
    if (desc.includes("סופר")) return ShoppingCart;
    if (desc.includes("דלק")) return Fuel;
    if (desc.includes("מסעדה")) return Utensils;
    if (desc.includes("בילוי")) return Film;
    if (desc.includes("תחבורה")) return Car;
    if (desc.includes("חשבונות")) return FileText;
    return ShoppingBag;
};

export const HomeTransactionFeed = ({ transactions, onEdit, limit = 10 }: HomeTransactionFeedProps) => {
    const isStealthMode = useAppStore(s => s.isStealthMode);
    
    // Sort by date descending and take top N
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

    if (recentTransactions.length === 0) return null;

    return (
        <div className="w-full max-w-md px-4 mt-2">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">פעילות אחרונה</h3>
                <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">{recentTransactions.length} עסקאות אחרונות</span>
            </div>

            <div className="space-y-2">
                {recentTransactions.map((tx, idx) => {
                    const cleanDescription = (tx.description || "").replace(/\s*\(תשלום \d+\/\d+\)/, "");
                    const [title] = cleanDescription.split('\n');
                    const Icon = getIcon(title || cleanDescription || "");
                    
                    return (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <ActivePress 
                                onClick={() => onEdit(tx)}
                                className="glass-panel p-3 flex items-center justify-between hover:bg-white/5 transition-colors border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white line-clamp-1">{title || "ללא תיאור"}</h4>
                                        <p className="text-[10px] text-white/30 uppercase tracking-tighter">
                                            {(() => {
                                                const d = new Date(tx.date);
                                                if (isNaN(d.getTime())) return "תאריך לא ידוע";
                                                return format(d, "d MMM", { locale: he });
                                            })()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-white">
                                        {formatAmount(tx.amount, isStealthMode, CURRENCY_SYMBOL, '***')}
                                    </span>
                                    <ChevronLeft className="w-3 h-3 text-white/10" />
                                </div>
                            </ActivePress>
                        </motion.div>
                    );
                })}
            </div>
            
            <div className="mt-4 text-center">
                <button 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors"
                >
                    צפייה בכל הפירוט
                </button>
            </div>
        </div>
    );
};
