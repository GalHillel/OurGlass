"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HeartPulse,
    PiggyBank,
    Rocket,
    Shield,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Wallet,
    Trophy,
    Zap,
    Users,
    Plus,
    CalendarDays,
    PieChart
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { BudgetHealthScore } from "@/components/BudgetHealthScore";
import { SavingsTracker } from "@/components/SavingsTracker";
import { StockPortfolio } from "@/components/StockPortfolio";
import { cn } from "@/lib/utils";
import { Transaction, Goal, Asset, Subscription } from "@/types";
import { MonthlySummary } from "@/components/MonthlySummary";
import { ReactorCore } from "@/components/ReactorCore";
import { PartnerStats } from "@/components/PartnerStats";
import { QuickActions } from "@/components/QuickActions";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";

interface HomeMosaicProps {
    balance: number;
    budget: number;
    monthlyIncome: number;
    totalExpenses: number;
    daysInMonth: number;
    daysPassed: number;
    assets: Asset[]; // Using Asset type which unifies Goal and Stock
    transactions: Transaction[];
    subscriptions: Subscription[];
    onRefresh: () => void;
    // Reactor Props
    burnRateStatus: 'safe' | 'warning' | 'critical';
    cycleStart: Date;
    cycleEnd: Date;
    // Quick Actions
    onQuickAdd: (category: string) => void;
    // Calendar & Categories
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
    selectedFilterCategory: string | null;
    onCategorySelect: (category: string | null) => void;
}

export const HomeMosaic = ({
    balance,
    budget,
    monthlyIncome,
    totalExpenses,
    daysInMonth,
    daysPassed,
    assets,
    transactions,
    subscriptions,
    onRefresh,
    burnRateStatus,
    cycleStart,
    cycleEnd,
    onQuickAdd,
    selectedDate,
    onDateSelect,
    selectedFilterCategory,
    onCategorySelect
}: HomeMosaicProps) => {

    // -- Calculations for Tiles --

    // 1. Health Score (approximate calculation for preview)
    // Real calculation is inside BudgetHealthScore, but we need a preview.
    // We'll reuse the logic or just pass visual indicators.
    // For now, let's use a simple status.
    const budgetUsedPercent = Math.min(100, Math.round((totalExpenses / budget) * 100));
    const healthStatus = budgetUsedPercent > 90 ? "critical" : budgetUsedPercent > 75 ? "warning" : "good";

    // 2. Savings
    const actualSavings = monthlyIncome - totalExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.round((actualSavings / monthlyIncome) * 100) : 0;

    // 3. Investments (Stocks)
    const stockAssets = assets.filter(a => a.type === 'stock');
    const totalInvestments = stockAssets.reduce((sum, a) => sum + (Number(a.current_amount) || 0), 0); // Removed totalInvestments calculation

    // 4. Cash (Vault)
    const cashAssets = assets.filter(a => a.type === 'cash');
    const totalCash = cashAssets.reduce((sum, a) => sum + (Number(a.current_amount) || 0), 0); // Removed totalCash calculation

    return (
        <div className="grid grid-cols-2 gap-3 w-full max-w-md px-4 perspective-1000 pb-20">

            {/* Row 1: Reactor Core (Full Width) */}
            <div className="col-span-2 mb-2">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                    <ReactorCore
                        income={monthlyIncome}
                        budget={budget}
                        expenses={totalExpenses}
                        balance={balance}
                        burnRateStatus={burnRateStatus}
                        cycleStart={cycleStart}
                        cycleEnd={cycleEnd}
                    />
                </div>
            </div>

            {/* Row 2: Financial Health & Savings */}
            {/* Tile 1: Financial Health */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-blue-600/20 to-indigo-900/40 rounded-3xl p-4 border border-blue-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-blue-400/5 group-hover:bg-blue-400/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <HeartPulse className="w-5 h-5 text-blue-300" />
                            </div>
                            {healthStatus === 'critical' && <span className="text-xs font-bold text-red-400 animate-pulse">!</span>}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-blue-100/80">בריאות</h3>
                            <div className="text-xl font-bold text-white mt-0.5">
                                {100 - budgetUsedPercent}%
                            </div>
                            <div className="w-full bg-blue-900/50 h-1 mt-2 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full", healthStatus === 'critical' ? "bg-red-500" : "bg-blue-400")}
                                    style={{ width: `${100 - budgetUsedPercent}% ` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-0 overflow-hidden data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">בריאות פיננסית</DialogTitle>
                    <div className="max-h-[70vh] overflow-y-auto p-4">
                        <BudgetHealthScore
                            balance={balance}
                            budget={budget}
                            monthlyIncome={monthlyIncome}
                            totalExpenses={totalExpenses}
                            daysInMonth={daysInMonth}
                            daysPassed={daysPassed}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tile 2: Monthly Savings */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-emerald-600/20 to-teal-900/40 rounded-3xl p-4 border border-emerald-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-emerald-400/5 group-hover:bg-emerald-400/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <PiggyBank className="w-5 h-5 text-emerald-300" />
                            </div>
                            {savingsRate > 20 && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-emerald-100/80">חיסכון חודשי</h3>
                            <div className="text-xl font-bold text-white mt-0.5">
                                ₪{Math.max(0, actualSavings).toLocaleString()}
                            </div>
                            <p className="text-[10px] text-emerald-200/60 mt-1">
                                {savingsRate}% מההכנסה
                            </p>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-0 overflow-hidden data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">מעקב חיסכון</DialogTitle>
                    <div className="max-h-[70vh] overflow-y-auto p-4">
                        <SavingsTracker
                            monthlyIncome={monthlyIncome}
                            budget={budget}
                            totalSpent={totalExpenses}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Row 3: Investments & Vault */}
            {/* Tile 3: Investments */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-purple-600/20 to-fuchsia-900/40 rounded-3xl p-4 border border-purple-500/30 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-purple-400/5 group-hover:bg-purple-400/10 transition-colors" />
                        <div className="p-3 bg-purple-500/20 rounded-full relative z-10">
                            <Rocket className="w-6 h-6 text-purple-300" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-base font-bold text-white">תיק השקעות</h3>
                            <p className="text-[10px] text-purple-200/60 mt-1">
                                {stockAssets.length} נכסים
                            </p>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh] data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">תיק השקעות</DialogTitle>
                    <div className="h-full flex flex-col p-2">
                        <div className="flex-1 overflow-y-auto">
                            {/* We filter assets for StockPortfolio if needed, but it takes all assets and filters internally usually.
                                StockPortfolio takes `assets` prop. */}
                            <StockPortfolio assets={assets} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tile 4: Cash Vault */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-amber-600/20 to-orange-900/40 rounded-3xl p-4 border border-amber-500/30 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-amber-400/5 group-hover:bg-amber-400/10 transition-colors" />
                        <div className="p-3 bg-amber-500/20 rounded-full relative z-10">
                            <Shield className="w-6 h-6 text-amber-300" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-base font-bold text-white">מזומן וכספות</h3>
                            <p className="text-[10px] text-amber-200/60 mt-1">
                                נזילות מיידית
                            </p>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-0 overflow-hidden data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">מזומן וכספות</DialogTitle>
                    <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-full bg-amber-500/20">
                                <Shield className="w-8 h-8 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">המבצר</h2>
                                <p className="text-slate-400 text-sm">כספים נזילים וחיסכון לטווח קצר</p>
                            </div>
                        </div>

                        {cashAssets.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>אין כספות פעילות</p>
                            </div>
                        ) : (
                            cashAssets.map(asset => (
                                <div key={asset.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                            <Wallet className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{asset.name}</h3>
                                            <p className="text-xs text-slate-400">עודכן לאחרונה</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-400">₪{Number(asset.current_amount).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="bg-blue-900/20 rounded-xl p-4 mt-8">
                            <h4 className="text-blue-200 font-medium mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                טיפ לחיסכון
                            </h4>
                            <p className="text-sm text-blue-200/70 leading-relaxed">
                                מומלץ לשמור סכום של 3-6 חודשי הוצאות בצד ליום סגריר.
                                אתם כרגע מכסים כ-{Math.round(totalCash / (budget || 1))} חודשי מחיה.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Row 4: Quick Actions & Segmentation */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-cyan-600/20 to-blue-900/40 rounded-3xl p-4 border border-cyan-500/30 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors" />
                        <div className="p-3 bg-cyan-500/20 rounded-full relative z-10">
                            <Zap className="w-6 h-6 text-cyan-300" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-base font-bold text-white">פעולה מהירה</h3>
                            <p className="text-[10px] text-cyan-200/60 mt-1">
                                הוספת הוצאה
                            </p>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 overflow-visible data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="text-center text-white text-lg font-bold mb-1">פעולה מהירה</DialogTitle>
                    <div className="mt-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
                        <h3 className="text-center text-white/60 text-sm mb-6">בחר קטגוריה להוספה מהירה</h3>
                        <QuickActions onAction={onQuickAdd} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="aspect-[4/3] bg-gradient-to-br from-pink-600/20 to-rose-900/40 rounded-3xl p-4 border border-pink-500/30 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-pink-400/5 group-hover:bg-pink-400/10 transition-colors" />
                        <div className="p-3 bg-pink-500/20 rounded-full relative z-10">
                            <Users className="w-6 h-6 text-pink-300" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-base font-bold text-white">חלוקה</h3>
                            <p className="text-[10px] text-pink-200/60 mt-1">
                                אני / את / אנחנו
                            </p>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 overflow-hidden data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">חלוקת הוצאות</DialogTitle>
                    <div>
                        <h3 className="text-center text-white/60 text-sm mb-4">סיכום לפי משתמש</h3>
                        <PartnerStats transactions={transactions} subscriptions={subscriptions} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Row 5: Calendar (Full Width) */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="col-span-2 bg-gradient-to-br from-indigo-600/20 to-violet-900/40 rounded-3xl p-4 border border-indigo-500/30 backdrop-blur-md relative overflow-hidden flex items-center justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-indigo-400/5 group-hover:bg-indigo-400/10 transition-colors" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <CalendarDays className="w-5 h-5 text-indigo-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">לוח הוצאות</h3>
                                <p className="text-[10px] text-indigo-200/60">צפה בהוצאות יומיות</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors relative z-10" />
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh] data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">לוח הוצאות</DialogTitle>
                    <div className="h-full flex flex-col p-4">
                        <div className="flex-1 overflow-y-auto">
                            <MonthlyCalendar
                                transactions={transactions}
                                selectedDate={selectedDate}
                                onDateSelect={onDateSelect}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Row 6: Categories (Full Width) */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="col-span-2 bg-gradient-to-br from-rose-600/20 to-pink-900/40 rounded-3xl p-4 border border-rose-500/30 backdrop-blur-md relative overflow-hidden flex items-center justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-rose-400/5 group-hover:bg-rose-400/10 transition-colors" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-rose-500/20 rounded-xl">
                                <PieChart className="w-5 h-5 text-rose-300" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">קטגוריות</h3>
                                <p className="text-[10px] text-rose-200/60">פילוח הוצאות חודשי</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors relative z-10" />
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh] data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                    <DialogTitle className="sr-only">קטגוריות</DialogTitle>
                    <div className="h-full flex flex-col p-4">
                        <div className="flex-1 overflow-y-auto">
                            <CategoryBreakdown
                                transactions={transactions}
                                subscriptions={subscriptions}
                                selectedCategory={selectedFilterCategory}
                                onCategorySelect={onCategorySelect}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Row 7: Monthly Summary (Integrated - Full Width) */}
            <div className="col-span-2 mt-1">
                <MonthlySummary
                    currentBalance={balance}
                    transactions={transactions}
                    onRefresh={onRefresh}
                    customTrigger={
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <Trophy className="w-5 h-5 text-white/80" />
                                </div>
                                <span className="font-medium text-white/90">סיכום חודש</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                        </motion.div>
                    }
                />
            </div>
        </div>
    );
};
