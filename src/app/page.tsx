"use client";

import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { TransactionList } from "@/components/TransactionList";
import { HomeTransactionFeed } from "@/components/HomeTransactionFeed";
import { HomeMosaic } from "@/components/HomeMosaic";
import { QuickActions } from "@/components/QuickActions";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HomeMosaicSkeleton } from "@/components/HomeMosaicSkeleton";
import { normalizeCategory } from "@/components/CategoryBreakdown";
import { getBillingPeriodForDate } from "@/lib/billing";
import { calculateBurnRate } from "@/lib/utils";
import { useState } from "react";
import { getNow } from "@/demo/demo-config";


import { Transaction } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useWealth } from "@/hooks/useWealth";
import { useAppStore } from "@/stores/appStore";
import { GuiltFreeWallets } from "@/components/GuiltFreeWallets";
import { motion, LayoutGroup } from "framer-motion";
import { useGlobalCashflow } from "@/hooks/useJointFinance";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, X, Zap, PieChart, CalendarDays, ChevronRight } from "lucide-react";
import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useTransactions, useSubscriptions, useLiabilities } from "@/hooks/useJointFinance";

// Simplified PullToRefresh Component that doesn't block scroll
const PullToRefresh = ({ children }: { children: React.ReactNode, onRefresh: () => Promise<void> }) => {
  const [isRefreshing] = useState(false);

  // handleRefresh removed as it was unused

  return (
    <div className="w-full touch-pan-y">
      {isRefreshing && (
        <div className="flex justify-center h-10 items-center hidden">
          {/* Spinner hidden per user request to remove "semicircle" */}
          {/* <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> */}
        </div>
      )}
      {children}
    </div>
  );
};

export default function Home() {
  // MANDATE: USE GLOBAL CASHFLOW BALANCE
  // Removed local balance state to avoid sync issues. Use cashflow.balance directly in UI.
  // comparisonDiff removed as it was unused

  const [viewingDate, setViewingDate] = useState(getNow());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isPrivacyMode] = useState(false);

  const { profile, loading: authLoading } = useAuth();
  const { netWorth, assets, usdToIls } = useWealth();
  const { appIdentity } = useAppStore();
  const queryClient = useQueryClient();

  const { data: cashflow, isLoading: cashflowLoading } = useGlobalCashflow(viewingDate);
  const { data: transactions = [], isLoading: txLoading } = useTransactions(viewingDate);
  const { data: subscriptions = [], isLoading: subsLoading } = useSubscriptions();
  const { data: liabilities = [], isLoading: liabLoading } = useLiabilities();

  const loading = cashflowLoading || txLoading || subsLoading || liabLoading;

  const burnRateData = useMemo(() => {
    const { start, end } = getBillingPeriodForDate(viewingDate);
    const isCurrentMonth = viewingDate.getMonth() === getNow().getMonth() && viewingDate.getFullYear() === getNow().getFullYear();
    if (!isCurrentMonth || !cashflow) return { status: 'safe' as const, projectedDate: null };

    const daysIntoPeriod = Math.max(1, differenceInDays(getNow(), start) + 1);
    const currentBalance = cashflow.balance;

    const fixedAmounts = new Set([
      ...subscriptions.map(s => Number(s.amount)),
      ...liabilities.map(l => Number(l.monthly_payment))
    ]);

    const variableTransactions = transactions.filter(tx => {
      if ((tx.type ?? 'expense') !== 'expense') return false;
      const amount = Number(tx.amount);
      if (fixedAmounts.has(amount) && amount > 100) return false;
      return true;
    });

    const totalVariableExpenses = variableTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const avgDaily = totalVariableExpenses / daysIntoPeriod;
    const daysRemaining = Math.max(0, differenceInDays(end, getNow()));

    return calculateBurnRate(currentBalance, daysRemaining, avgDaily);
  }, [viewingDate, cashflow, transactions, subscriptions, liabilities]);

  const handleQuickAdd = useCallback((label: string) => {
    setSelectedCategory(label);
    setIsDrawerOpen(true);
  }, []);

  const handleViewingDateChange = useCallback((date: Date | ((prev: Date) => Date)) => {
    setViewingDate(date);
  }, []);

  const handleDateSelect = useCallback((date: Date | null) => {
    setSelectedDate(date);
  }, []);

  const handleCategorySelect = useCallback((category: string | null) => {
    setSelectedFilterCategory(category);
  }, []);

  const handleTransactionAdded = () => {
    setIsDrawerOpen(false);
    setEditingTransaction(null);
    queryClient.invalidateQueries({ queryKey: ['transactions', profile?.couple_id] });
    queryClient.invalidateQueries({ queryKey: ['global-cashflow', profile?.couple_id] });
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (selectedDate) {
      result = result.filter(tx => isSameDay(new Date(tx.date), selectedDate));
    }
    if (selectedFilterCategory) {
      result = result.filter(tx => normalizeCategory(tx.category) === selectedFilterCategory);
    }
    return result;
  }, [transactions, selectedDate, selectedFilterCategory]);

  // Render Failsafe
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Skeleton className="w-20 h-20 rounded-full bg-blue-900/20 animate-pulse" />
      </div>
    );
  }



  return (
    <div className="flex flex-col min-h-screen text-white selection:bg-blue-500/50 bg-slate-950">



      {/* ... SmartInsights ... */}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col items-center gap-6 w-full mx-auto"
      >
        {/* Pull to Refresh Wrapper */}
        <PullToRefresh onRefresh={async () => handleTransactionAdded()}>
          {loading || cashflow?.balance === undefined ? (
            <HomeMosaicSkeleton />
          ) : (
            <div className={cn("flex flex-col items-center gap-2 w-full relative z-10 py-2 transition-all duration-500", isPrivacyMode && "blur-xl opacity-50 grayscale")}>
              {/* Widgets Container - Mosaic Layout */}
              <div className="w-full flex justify-center mb-2">
                <ErrorBoundary fallback={<div className="p-8 text-center glass-panel">שגיאה בטעינת הדשבורד</div>}>
                  <HomeMosaic
                    balance={cashflow?.balance ?? 0}
                    budget={cashflow?.budget ?? 20000}
                    monthlyIncome={profile?.monthly_income || cashflow?.budget || 20000}
                    totalExpenses={cashflow?.totalSpent ?? 0}
                    daysInMonth={differenceInDays(getBillingPeriodForDate(viewingDate).end, getBillingPeriodForDate(viewingDate).start)}
                    daysPassed={Math.max(1, differenceInDays(getNow(), getBillingPeriodForDate(viewingDate).start))}
                    assets={assets}
                    transactions={transactions}
                    subscriptions={subscriptions}
                    liabilities={liabilities}
                    // Reactor Props
                    burnRateStatus={burnRateData.status}
                    cycleStart={getBillingPeriodForDate(viewingDate).start}
                    cycleEnd={getBillingPeriodForDate(viewingDate).end}
                    // Quick Actions
                    onQuickAdd={handleQuickAdd}
                    // Calendar & Categories
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    selectedFilterCategory={selectedFilterCategory}
                    onCategorySelect={handleCategorySelect}
                    usdToIls={usdToIls}
                    viewingDate={viewingDate}
                    onViewingDateChange={handleViewingDateChange}
                    totalWealth={netWorth}
                  />
                </ErrorBoundary>
              </div>
            </div>
          )}
        </PullToRefresh>

        {/* Premium Bento Grid - Opening Tiles */}
        {!loading && cashflow?.balance !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-md px-4 grid grid-cols-2 gap-3 mb-2"
          >
            {/* Quick Add Tile */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 glass-panel p-5 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-cyan-500/20 rounded-xl">
                                <Zap className="w-5 h-5 text-cyan-300" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-cyan-100/40 uppercase tracking-[0.2em]">פעולה מהירה</h3>
                            <div className="text-lg font-black text-white mt-1">הוצאה חדשה</div>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90vw] rounded-[2rem] border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 overflow-visible">
                    <DialogTitle className="text-center text-white text-lg font-bold mb-1">פעולה מהירה</DialogTitle>
                    <div className="mt-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
                        <h3 className="text-center text-white/60 text-sm mb-6">בחר קטגוריה להוספה מהירה</h3>
                        <QuickActions onAction={handleQuickAdd} />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Daily Calendar Tile */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        className="col-span-1 glass-panel p-5 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-indigo-400/5 group-hover:bg-indigo-400/10 transition-colors" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <CalendarDays className="w-5 h-5 text-indigo-300" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-indigo-100/40 uppercase tracking-[0.2em]">לוח הוצאות</h3>
                            <div className="text-lg font-black text-white mt-1">לפי יום</div>
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh]">
                    <DialogTitle className="sr-only">לוח הוצאות</DialogTitle>
                    <div className="h-full flex flex-col p-4">
                        <div className="flex-1 overflow-y-auto">
                            <MonthlyCalendar
                                transactions={transactions}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Category Breakdown Tile (Full Width) */}
            <Dialog>
                <DialogTrigger asChild>
                    <motion.div 
                        whileTap={{ scale: 0.95 }}
                        className="col-span-2 glass-panel p-5 relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-rose-400/5 group-hover:bg-rose-400/10 transition-colors" />
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <PieChart className="w-5 h-5 text-rose-300" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-rose-100/40 uppercase tracking-[0.2em]">פילוג הוצאות</h3>
                                    <div className="text-lg font-black text-white mt-0.5">קטגוריות מובילות</div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" />
                        </div>
                    </motion.div>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[95vw] rounded-[2rem] border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden h-[80vh]">
                    <DialogTitle className="sr-only">קטגוריות</DialogTitle>
                    <div className="h-full flex flex-col p-6">
                        <div className="flex-1 overflow-y-auto">
                            <CategoryBreakdown
                                transactions={transactions}
                                subscriptions={subscriptions}
                                liabilities={liabilities}
                                selectedCategory={selectedFilterCategory}
                                onCategorySelect={handleCategorySelect}
                                viewingDate={viewingDate}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Guilt-Free Wallets - Full Width */}
            <div className="col-span-2 flex flex-col h-full mt-2">
              <GuiltFreeWallets viewingDate={viewingDate} />
            </div>
          </motion.div>
        )}

        {/* Active Filters */}
        {(selectedDate || selectedFilterCategory) && (
          <div className="w-full max-w-md px-4 mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
            {selectedDate && (
              <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1 text-sm text-blue-100">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(selectedDate, "d.M", { locale: he })}</span>
                <button onClick={() => setSelectedDate(null)} className="hover:text-white p-0.5 rounded-full hover:bg-white/10 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {selectedFilterCategory && (
              <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 py-1 text-sm text-purple-100">
                <span className="text-xs">🏷️</span>
                <span>{selectedFilterCategory}</span>
                <button onClick={() => setSelectedFilterCategory(null)} className="hover:text-white p-0.5 rounded-full hover:bg-white/10 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button onClick={() => { setSelectedDate(null); setSelectedFilterCategory(null); }} className="text-xs text-white/40 hover:text-white px-2">
              נקה הכל
            </button>
          </div>
        )}

        {/* Recent Feed (Visible by default) */}
        {!selectedDate && !selectedFilterCategory && (
          <HomeTransactionFeed 
            transactions={transactions} 
            onEdit={(tx: Transaction) => {
              setEditingTransaction(tx);
              setIsDrawerOpen(true);
            }} 
          />
        )}

        {/* Transactions (Full List / Filtered) */}
        {(selectedDate || selectedFilterCategory) && (
          <LayoutGroup key={selectedFilterCategory ?? 'all'}>
            <TransactionList
              key={selectedFilterCategory ?? 'all'}
              transactions={filteredTransactions}
              subscriptions={subscriptions}
              onRefresh={handleTransactionAdded}
              activeFilter={selectedFilterCategory}
              activeDateFilter={selectedDate} // Pass date filter
              currentPayer={appIdentity ?? undefined}
              onEdit={(tx) => {
                setEditingTransaction(tx);
                setIsDrawerOpen(true);
              }}
            />
          </LayoutGroup>
        )}

        {/* Final bottom spacer for edge-to-edge layout accessibility */}
        <div className="h-32 w-full" />
      </motion.main>

      {/* AI Psychologist Nudge Button removed as it is now global */}

      <AddTransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingTransaction(null);
          setSelectedCategory(undefined);
        }}
        category={selectedCategory}
        initialData={editingTransaction}
        onSuccess={handleTransactionAdded}
      />
    </div>
  );
}