"use client";

import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { TransactionList } from "@/components/TransactionList";
import { HomeMosaic } from "@/components/HomeMosaic";
import { HomeMosaicSkeleton } from "@/components/HomeMosaicSkeleton";
import { normalizeCategory } from "@/components/CategoryBreakdown";
import { getBillingPeriodForDate } from "@/lib/billing";
import { calculateBurnRate, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";


import { createClient } from "@/utils/supabase/client";
import { Transaction, Subscription, Liability } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useWealth } from "@/hooks/useWealth";
import { useGlobalCashflow } from "@/hooks/useJointFinance";
import { Skeleton } from "@/components/ui/skeleton";
import { isSameDay, addMonths, subMonths, format, differenceInDays, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarRange, Calendar, X } from "lucide-react";
import { toast } from "sonner";

import { motion, LayoutGroup } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

// Phase 4-6 components
import { GuiltFreeWallets } from "@/components/GuiltFreeWallets";

// Simplified PullToRefresh Component that doesn't block scroll
const PullToRefresh = ({ children }: { children: React.ReactNode, onRefresh: () => Promise<void> }) => {
  const [isRefreshing] = useState(false);

  // handleRefresh removed as it was unused

  return (
    <div className="w-full touch-pan-y">
      {isRefreshing && (
        <div className="flex justify-center h-10 items-center hidden">
          {/* Spinner hidden per user request to remove "semicircle" */}
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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

  // const [goals, setGoals] = useState<Goal[]>([]); // Removed: Using assets from useWealth
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState(new Date());
  const [isPrivacyMode] = useState(false); // Manual Privacy Mode

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const { user, profile, loading: authLoading } = useAuth();
  const { assets, usdToIls } = useWealth();
  const { appIdentity } = useAppStore();

  const [burnRateData, setBurnRateData] = useState<{ status: 'safe' | 'warning' | 'critical', projectedDate: Date | null }>({ status: 'safe', projectedDate: null });

  const { data: cashflow, isLoading: cashflowLoading, refetch: refetchCashflow } = useGlobalCashflow(viewingDate);

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (cashflow?.balance === undefined && !cashflowLoading) setLoading(true);

      // Validate viewingDate
      if (isNaN(viewingDate.getTime())) {
        console.error("Invalid viewingDate:", viewingDate);
        throw new Error("Invalid viewingDate");
      }

      const { start, end } = getBillingPeriodForDate(viewingDate);
      // console.log("Fetching for range:", start.toISOString(), "to", end.toISOString());

      const controller = new AbortController();
      const signal = controller.signal;

      // OPTIMIZATION: Select only needed columns
      const [txResult, subsResult, liabResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, amount, date, description, category, payer, is_surprise, created_at, mood_rating')
          .gte('date', start.toISOString())
          .lt('date', end.toISOString())
          .order('date', { ascending: false })
          .abortSignal(signal),
        supabase.from('subscriptions').select('*').abortSignal(signal),
        supabase.from('liabilities').select('*').abortSignal(signal),
      ]);

      const { data: txData, error: txError } = txResult;
      const { data: subsData, error: subsError } = subsResult;
      const { data: liabData } = liabResult;

      if (txError) {
        console.error("Supabase Transaction Error:", txError);
        throw new Error(`Transaction Fetch Error: ${txError.message || JSON.stringify(txError)}`);
      }
      if (subsError) {
        console.error("Supabase Subscription Error:", subsError);
        // We might not want to throw on subs error, but good to know
      }

      // Cast to Transaction[] as we are selecting a subset that matches the shape we need
      const transactionsData = (txData || []) as unknown as Transaction[];
      setTransactions(transactionsData);
      setSubscriptions(subsData || []);
      setLiabilities(liabData || []);

      // MANDATE 1: UNIFY GLOBAL MONTHLY SPEND MATH
      // We consume the live value from our centralized hook
      const currentBalance = cashflow?.balance ?? 0;

      // Burn Rate Logic: "Variable Only"
      // User request: "without the fixed ones"
      // Strategy: Filter out transactions that match known subscription amounts (Fixed Expenses)
      // and calculate average daily spend based on the remaining "Variable" transactions.
      const isCurrentMonth = viewingDate.getMonth() === new Date().getMonth() && viewingDate.getFullYear() === new Date().getFullYear();
      if (isCurrentMonth) {
        const daysIntoPeriod = differenceInDays(new Date(), start) + 1;

        // 1. Identify Fixed Amounts from Subscriptions & Liabilities (Debt)
        const fixedAmounts = new Set([
          ...(subsData?.map((s: Subscription) => Number(s.amount)) || []),
          ...(liabData?.map((l: Liability) => Number(l.monthly_payment)) || [])
        ]);

        // 2. Filter Transactions: Exclude matches (Fixed)
        // We use a small tolerance or exact match. Exact is safer to avoid excluding common prices like 50.
        // But rent/bills are usually unique. Let's use strict match for now.
        // Also helps if we exclude "Rent", "Bills" categories if we had them.
        const variableTransactions = transactionsData.filter(tx => {
          const amount = Number(tx.amount);
          // If amount exists in subscriptions, likely a fixed bill. 
          // BUT, common amounts (like 30, 50) might be coincidental.
          // Heuristic: If amount > 200 and matches specific subscription, exclude it.
          // Or just exclude if it matches ANY subscription?
          // Let's exclude if it matches any subscription amount > 100.
          if (fixedAmounts.has(amount) && amount > 100) return false;
          return true;
        });

        const totalVariableExpenses = variableTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const avgDaily = daysIntoPeriod > 0 ? totalVariableExpenses / daysIntoPeriod : 0;

        const daysRemaining = differenceInDays(end, new Date());
        const { status, projectedDate } = calculateBurnRate(currentBalance, daysRemaining, avgDaily);
        setBurnRateData({ status, projectedDate });
      } else {
        setBurnRateData({ status: 'safe', projectedDate: null });
      }

      // Comparison Logic
      const now = new Date();
      let limitDate = end;
      if (viewingDate.getMonth() === now.getMonth() && viewingDate.getFullYear() === now.getFullYear()) {
        limitDate = now;
      }
      const daysIntoPeriod = differenceInDays(limitDate, start);
      const prevStart = subMonths(start, 1);
      const prevLimit = addDays(prevStart, daysIntoPeriod);

      const { error: prevError } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', prevStart.toISOString())
        .lte('date', prevLimit.toISOString());

      if (prevError) console.error("Prev Data Error:", prevError);

      // setComparisonDiff(currentExpensesSoFar - prevExpenses); // Removed as comparisonDiff is unused
    } catch (error: unknown) {
      console.error("API Error Detailed:", error);
      toast.error(`שגיאה בטעינת הנתונים: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, authLoading, viewingDate, cashflow?.balance, cashflowLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  // Render Failsafe
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <Skeleton className="w-20 h-20 rounded-full bg-blue-900/20 animate-pulse" />
      </div>
    );
  }



  const handleTransactionAdded = (amount: number, newTx?: Transaction) => {
    // We let the centralized hook handle the balance math.
    // We just need to trigger a refetch of all data.
    if (newTx) {
      setTransactions(prev => {
        const exists = prev.some(t => t.id === newTx.id);
        if (exists) {
          return prev.map(t => t.id === newTx.id ? newTx : t);
        }
        return [newTx, ...prev];
      });
    }
    setIsDrawerOpen(false);
    refetchCashflow();
    fetchData();
  };

  // Filter transactions (simple variable, not a hook)
  let filteredTransactions = transactions;
  if (selectedDate) {
    filteredTransactions = filteredTransactions.filter(tx => isSameDay(new Date(tx.date), selectedDate));
  }
  if (selectedFilterCategory) {
    filteredTransactions = filteredTransactions.filter(tx => normalizeCategory(tx.category) === selectedFilterCategory);
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
        <PullToRefresh onRefresh={fetchData}>
          {loading || cashflow?.balance === undefined ? (
            <HomeMosaicSkeleton />
          ) : (
            <div className={cn("flex flex-col items-center gap-2 w-full relative z-10 py-2 transition-all duration-500", isPrivacyMode && "blur-xl opacity-50 grayscale")}>
              {/* Widgets Container - Mosaic Layout */}
              <div className="w-full flex justify-center mb-2">
                <HomeMosaic
                  balance={cashflow?.balance ?? 0}
                  budget={cashflow?.budget ?? 20000}
                  monthlyIncome={profile?.monthly_income || cashflow?.budget || 20000}
                  totalExpenses={(cashflow?.budget || 20000) - (cashflow?.balance ?? 0)}
                  daysInMonth={differenceInDays(getBillingPeriodForDate(viewingDate).end, getBillingPeriodForDate(viewingDate).start)}
                  daysPassed={Math.max(1, differenceInDays(new Date(), getBillingPeriodForDate(viewingDate).start))}
                  assets={assets}
                  transactions={transactions}
                  subscriptions={subscriptions}
                  liabilities={liabilities}
                  onRefresh={fetchData}
                  // Reactor Props
                  burnRateStatus={burnRateData.status}
                  cycleStart={getBillingPeriodForDate(viewingDate).start}
                  cycleEnd={getBillingPeriodForDate(viewingDate).end}
                  // Quick Actions
                  onQuickAdd={(label) => {
                    setSelectedCategory(label);
                    setIsDrawerOpen(true);
                  }}
                  // Calendar & Categories
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  selectedFilterCategory={selectedFilterCategory}
                  onCategorySelect={setSelectedFilterCategory}
                  usdToIls={usdToIls}
                  viewingDate={viewingDate}
                  onViewingDateChange={setViewingDate}
                />
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
            onRefresh={fetchData}
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
