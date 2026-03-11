"use client";

import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { TransactionList } from "@/components/TransactionList";
import { HomeMosaic } from "@/components/HomeMosaic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HomeMosaicSkeleton } from "@/components/HomeMosaicSkeleton";
import { normalizeCategory } from "@/components/CategoryBreakdown";
import { getBillingPeriodForDate } from "@/lib/billing";
import { calculateBurnRate } from "@/lib/utils";
import { useState } from "react";


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
import { Calendar, X } from "lucide-react";
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

  const [viewingDate, setViewingDate] = useState(new Date());
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
    const isCurrentMonth = viewingDate.getMonth() === new Date().getMonth() && viewingDate.getFullYear() === new Date().getFullYear();
    if (!isCurrentMonth || !cashflow) return { status: 'safe' as const, projectedDate: null };

    const daysIntoPeriod = Math.max(1, differenceInDays(new Date(), start) + 1);
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
    const daysRemaining = Math.max(0, differenceInDays(end, new Date()));

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
                    daysPassed={Math.max(1, differenceInDays(new Date(), getBillingPeriodForDate(viewingDate).start))}
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

        {/* Transactions */}
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

        {/* Phase 4-6: Insights & Bento Box Gamification Layout */}
        {!loading && cashflow?.balance !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-md px-4 grid grid-cols-2 gap-3"
          >
            {/* Guilt-Free Wallets - Full Width (since SettleUp was moved) */}
            <div className="col-span-2 flex flex-col h-full">
              <GuiltFreeWallets viewingDate={viewingDate} />
            </div>
          </motion.div>
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