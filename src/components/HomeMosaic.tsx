"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    HeartPulse,
    PiggyBank,
    Rocket,
    Shield,
    ChevronRight,
    TrendingUp,
    Wallet,
    Zap,
    Users,
    CalendarDays,
    PieChart,
    Settings2,
    Plus,
    LayoutGrid,
    Sparkles,
    Gift,
    CreditCard,
    ChevronLeft,
    CalendarRange
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { BudgetHealthScore } from "@/components/BudgetHealthScore";
import { SavingsTracker } from "@/components/SavingsTracker";
import { StockPortfolio } from "@/components/StockPortfolio";
import { cn, formatAmount } from "@/lib/utils";
import { Transaction, Asset, Subscription, Liability } from "@/types";
import { ReactorCore } from "@/components/ReactorCore";
import { PartnerStats } from "@/components/PartnerStats";
import { QuickActions } from "@/components/QuickActions";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { AIHubBanner } from "@/components/AIHubBanner";
import { WealthTimeMachine } from "@/components/WealthTimeMachine";
import { SmartInsights } from "@/components/SmartInsights";
import { MonthlyRoastPraise } from "@/components/MonthlyRoastPraise";

export interface HomeMosaicProps {
    balance: number;
    budget: number;
    monthlyIncome: number;
    totalExpenses: number;
    daysInMonth: number;
    daysPassed: number;
    assets: Asset[]; // Using Asset type which unifies Goal and Stock
    transactions: Transaction[];
    subscriptions: Subscription[];
    liabilities: Liability[];
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
    onRefresh?: () => Promise<void>;
    usdToIls?: number;
    viewingDate: Date;
    onViewingDateChange: (date: Date | ((prev: Date) => Date)) => void;
    onUpdateStatus?: (id: string, status: Subscription['status']) => void;
    onDeleteSubscription?: (id: string) => void;
}

import React, { useState } from "react";
import { useDashboardStore, WidgetConfig } from "@/stores/dashboardStore";
import { useAppStore } from "@/stores/appStore";
import { triggerHaptic } from "@/utils/haptics";
import { PAYERS, CURRENCY_SYMBOL, LOCALE } from "@/lib/constants";
import { format, subMonths, addMonths } from "date-fns";
import { he } from "date-fns/locale";
import { getBillingPeriodForDate } from "@/lib/billing";

import { useShallow } from 'zustand/react/shallow';

export const HomeMosaic = React.memo(({
    balance,
    budget,
    monthlyIncome,
    totalExpenses,
    daysInMonth,
    daysPassed,
    assets,
    transactions,
    subscriptions,
    liabilities,
    burnRateStatus,
    cycleStart,
    cycleEnd,
    onQuickAdd,
    selectedDate,
    onDateSelect,
    selectedFilterCategory,
    onCategorySelect,
    onRefresh,
    usdToIls,
    viewingDate,
    onViewingDateChange,
    onUpdateStatus,
    onDeleteSubscription,
}: HomeMosaicProps) => {
    const [isEditModeOpen, setIsEditModeOpen] = useState(false);

    const isStealthMode = useAppStore(useShallow(s => s.isStealthMode));
    const { widgets = [], features = {} as any, _hasHydrated = false } = useDashboardStore(useShallow(s => ({
        widgets: s.widgets,
        features: s.features,
        _hasHydrated: s._hasHydrated
    })));

    if (!_hasHydrated) {
        return <div className="w-full max-w-md px-4 min-h-[50vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>;
    }

    // -- Calculations for Tiles --
    const budgetUsedPercent = Math.min(100, Math.round((totalExpenses / budget) * 100));
    const healthStatus = budgetUsedPercent > 90 ? "critical" : budgetUsedPercent > 75 ? "warning" : "good";

    const actualSavings = monthlyIncome - totalExpenses;
    const savingsRate = monthlyIncome > 0 ? Math.round((actualSavings / monthlyIncome) * 100) : 0;

    const stockAssets = assets.filter(a => a.type === 'stock');

    const cashAssets = assets.filter(a => a.type === 'cash');
    const totalCash = cashAssets.reduce((sum: number, a: Asset) => sum + (Number(a.current_amount) || 0), 0);

    const activeWidgets = [...widgets].filter(w => w.enabled).sort((a, b) => a.order - b.order);

    const renderWidget = (id: string, key: string) => {
        switch (id) {
            case 'reactor':
                return (
                    <div key={key} className="col-span-2 mb-2">
                        <div className="glass-panel overflow-hidden relative">
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

                        {/* Integrated Billing Cycle Navigation */}
                        <div className="mt-4 px-2 flex items-center justify-between">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewingDateChange(prev => subMonths(prev, 1));
                                    triggerHaptic();
                                }}
                                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all border border-white/10"
                            >
                                <ChevronRight className="w-4 h-4 text-white/60" />
                            </button>
                            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                                <CalendarRange className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-bold text-white/90">
                                    {format(getBillingPeriodForDate(viewingDate).start, 'd בMMMM', { locale: he })}
                                    {' - '}
                                    {format(getBillingPeriodForDate(viewingDate).end, 'd בMMMM', { locale: he })}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewingDateChange(prev => addMonths(prev, 1));
                                    triggerHaptic();
                                }}
                                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all border border-white/10"
                            >
                                <ChevronLeft className="w-4 h-4 text-white/60" />
                            </button>
                        </div>
                    </div>
                );
            case 'ai-hub':
                return (
                    <div key={key} className="col-span-2">
                        <AIHubBanner
                            transactions={transactions}
                            subscriptions={subscriptions}
                            liabilities={liabilities}
                            balance={balance}
                            budget={budget}
                            monthlyIncome={monthlyIncome}
                        />
                    </div>
                );
            case 'smart-insights':
                return (
                    <div key={key} className="col-span-2">
                        <SmartInsights
                            transactions={transactions}
                            subscriptions={subscriptions}
                            liabilities={liabilities}
                            monthlyIncome={monthlyIncome}
                            isInline={true}
                        />
                    </div>
                );
            case 'monthly-roast':
                return (
                    <div key={key} className="col-span-2">
                        <MonthlyRoastPraise
                            transactions={transactions}
                            subscriptions={subscriptions}
                            liabilities={liabilities}
                            balance={balance}
                            budget={budget}
                            monthlyIncome={monthlyIncome}
                        />
                    </div>
                );
            case 'health':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-sky-400/5 group-hover:bg-sky-400/10 transition-colors" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="p-2 bg-blue-500/20 rounded-xl">
                                        <HeartPulse className="w-5 h-5 text-blue-300" />
                                    </div>
                                    {healthStatus === 'critical' && <span className="text-xs font-bold text-red-400 animate-pulse">!</span>}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-blue-100/40 uppercase tracking-[0.2em]">בריאות</h3>
                                    <div className="text-2xl font-black text-white mt-1 font-mono tracking-tighter tabular-nums text-right">
                                        {100 - budgetUsedPercent}%
                                    </div>
                                    <div className="w-full bg-blue-900/50 h-1 mt-2 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", healthStatus === 'critical' ? "bg-red-500" : "bg-blue-400")}
                                            style={{ width: `${100 - budgetUsedPercent}%` }}
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
                );
            case 'savings':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-emerald-400/5 group-hover:bg-emerald-400/10 transition-colors" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                                        <PiggyBank className="w-5 h-5 text-emerald-300" />
                                    </div>
                                    {savingsRate > 20 && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-emerald-100/40 uppercase tracking-[0.2em]">חיסכון חודשי</h3>
                                    <div className="text-2xl font-black text-white mt-1 font-mono tracking-tighter tabular-nums text-right">
                                        {formatAmount(Math.max(0, actualSavings), isStealthMode, CURRENCY_SYMBOL, '***')}
                                    </div>
                                    <p className="text-[9px] text-emerald-200/40 mt-1 font-black uppercase tracking-wider">
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
                );
            case 'investments':
                if (!features.enableStocks) {
                    return (
                        <motion.div
                            key={key}
                            layout
                            whileTap={{ scale: 0.95 }}
                            className="aspect-[4/3] glass-panel p-6 flex flex-col items-center justify-center gap-2 text-center opacity-60"
                        >
                            <div className="p-3 bg-purple-500/10 rounded-full">
                                <Rocket className="w-6 h-6 text-purple-300/30" />
                            </div>
                            <p className="text-xs text-white/30 font-medium">תיק השקעות</p>
                            <p className="text-[10px] text-blue-300/50">הפעל בהגדרות</p>
                        </motion.div>
                    );
                }
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-purple-400/5 group-hover:bg-purple-400/10 transition-colors" />
                                <div className="p-3 bg-purple-500/20 rounded-full relative z-10">
                                    <Rocket className="w-6 h-6 text-purple-300" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">תיק השקעות</h3>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-1">
                                        {stockAssets.length} נכסים
                                    </p>
                                </div>
                            </motion.div>
                        </DialogTrigger>
                        <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh] data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                            <DialogTitle className="sr-only">תיק השקעות</DialogTitle>
                            <div className="h-full flex flex-col p-2">
                                <div className="flex-1 overflow-y-auto">
                                    <StockPortfolio assets={assets} usdToIls={usdToIls} />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            case 'vault':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-amber-400/5 group-hover:bg-amber-400/10 transition-colors" />
                                <div className="p-3 bg-amber-500/20 rounded-full relative z-10">
                                    <Shield className="w-6 h-6 text-amber-300" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">מזומן וכספות</h3>
                                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-1">
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
                                    cashAssets.map((asset: Asset) => (
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
                                                <div className="text-lg font-bold text-emerald-400">
                                                    {formatAmount(Number(asset.current_amount), isStealthMode, CURRENCY_SYMBOL)}
                                                </div>
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
                                <div className="mt-4">
                                    <WealthTimeMachine
                                        currentNetWorth={totalCash + stockAssets.reduce((s: number, a: Asset) => s + (Number(a.current_amount) || 0), 0)}
                                        monthlySavings={Math.max(0, actualSavings)}
                                    />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            case 'quick-action':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors" />
                                <div className="p-3 bg-cyan-500/20 rounded-full relative z-10">
                                    <Zap className="w-6 h-6 text-cyan-300" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">פעולה מהירה</h3>
                                    <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest mt-1">
                                        ניהול הוצאה
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
                );
            case 'partner-stats':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center gap-3 group text-center cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-pink-400/5 group-hover:bg-pink-400/10 transition-colors" />
                                <div className="p-3 bg-pink-500/20 rounded-full relative z-10">
                                    <Users className="w-6 h-6 text-pink-300" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">חלוקה</h3>
                                    <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest mt-1">
                                        {PAYERS.HIM} / {PAYERS.HER}
                                    </p>
                                </div>
                            </motion.div>
                        </DialogTrigger>
                        <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 overflow-hidden data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:zoom-in-95">
                            <DialogTitle className="sr-only">חלוקת הוצאות</DialogTitle>
                            <div>
                                <h3 className="text-center text-white/60 text-sm mb-4">סיכום לפי משתמש</h3>
                                <PartnerStats transactions={transactions} subscriptions={subscriptions} liabilities={liabilities} viewingDate={cycleStart} />
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            case 'calendar':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="col-span-2 glass-panel p-6 relative overflow-hidden flex items-center justify-between group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-indigo-400/5 group-hover:bg-indigo-400/10 transition-colors" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                                        <CalendarDays className="w-5 h-5 text-indigo-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">לוח הוצאות</h3>
                                        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-1">הוצאות יומיות</p>
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
                );
            case 'categories':
                return (
                    <Dialog key={key}>
                        <DialogTrigger asChild>
                            <motion.div
                                layout
                                whileTap={{ scale: 0.95 }}
                                className="col-span-2 glass-panel p-6 relative overflow-hidden flex items-center justify-between group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-rose-400/5 group-hover:bg-rose-400/10 transition-colors" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2 bg-rose-500/20 rounded-xl">
                                        <PieChart className="w-5 h-5 text-rose-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">קטגוריות</h3>
                                        <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest mt-1">פילוח חודשי</p>
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
                                        liabilities={liabilities}
                                        selectedCategory={selectedFilterCategory}
                                        onCategorySelect={onCategorySelect}
                                        viewingDate={cycleStart}
                                    />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            case 'settlements':
                if (!features.enableSettlements) return null;
                // SettleUp widget placeholder
                return null;
            case 'subscriptions':
                return (
                    <motion.div
                        key={key}
                        layout
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.href = '/subscriptions'}
                        className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-blue-400/5 group-hover:bg-blue-400/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <CreditCard className="w-5 h-5 text-blue-300" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-blue-100/40 uppercase tracking-[0.2em]">קבועות</h3>
                            <div className="text-2xl font-black text-white mt-1 font-mono tracking-tighter tabular-nums text-right">
                                {subscriptions.length}
                            </div>
                            <p className="text-[9px] text-blue-200/40 mt-1 font-black uppercase tracking-wider">מנויים פעילים</p>
                        </div>
                    </motion.div>
                );
            case 'wishlist':
                return (
                    <motion.div
                        key={key}
                        layout
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.href = '/wishlist'}
                        className="aspect-[4/3] glass-panel p-6 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-pink-400/5 group-hover:bg-pink-400/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-2 bg-pink-500/20 rounded-xl">
                                <Gift className="w-5 h-5 text-pink-300" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-pink-100/40 uppercase tracking-[0.2em]">משאלות</h3>
                            <div className="text-2xl font-black text-white mt-1 font-mono tracking-tighter tabular-nums text-right">
                                {isStealthMode ? '***' : assets.filter(a => a.type === 'wish').length}
                            </div>
                            <p className="text-[9px] text-pink-200/40 mt-1 font-black uppercase tracking-wider">פריטים בקולקציה</p>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-md space-y-4">
            <div className="grid grid-cols-2 gap-3 w-full px-4 perspective-1000">
                <AnimatePresence mode="popLayout">
                    {activeWidgets.length > 0 ? (
                        activeWidgets.map((widgetValue: WidgetConfig) => renderWidget(widgetValue.id, widgetValue.id))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-2"
                        >
                            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-20 text-white" />
                                <p className="text-white/40 text-sm">הדשבורד ריק. ניתן להפעיל רכיבים בהגדרות.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

HomeMosaic.displayName = 'HomeMosaic';

