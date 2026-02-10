"use client";

import { QuickActions } from "@/components/QuickActions";
import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { MonthlySummary } from "@/components/MonthlySummary";
import { TransactionList } from "@/components/TransactionList";
import { PartnerStats } from "@/components/PartnerStats";
import { HomeMosaic } from "@/components/HomeMosaic";
import { CategoryBreakdown, normalizeCategory } from "@/components/CategoryBreakdown";
import { getDaysRemainingInCycle, getBillingPeriodForDate } from "@/lib/billing";
import { triggerHaptic } from "@/utils/haptics";
import { calculateBurnRate, cn } from "@/lib/utils";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BudgetGauges } from "@/components/BudgetGauges";
import { BudgetHealthScore } from "@/components/BudgetHealthScore";
import { SavingsTracker } from "@/components/SavingsTracker";
import dynamic from 'next/dynamic';

import { TimeTravelSlider } from "@/components/TimeTravelSlider";

const ReactorCore = dynamic(() => import('@/components/ReactorCore').then(mod => mod.ReactorCore), {
  loading: () => <div className="w-[300px] h-[300px] rounded-full border border-white/10 animate-pulse" />,
  ssr: false
});

const MonthlyCalendar = dynamic(() => import('@/components/MonthlyCalendar').then(mod => mod.MonthlyCalendar), {
  ssr: false
});

const SmartInsights = dynamic(() => import('@/components/SmartInsights').then(mod => mod.SmartInsights), {
  ssr: false
});
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Transaction, Goal, Subscription } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useWealth } from "@/hooks/useWealth";
import { Skeleton } from "@/components/ui/skeleton";
import { isSameDay, addMonths, subMonths, format, differenceInDays, addDays } from "date-fns";
import { he } from "date-fns/locale";
import { Shield, Rocket, ChevronLeft, ChevronRight, LayoutGrid, EyeOff, CalendarRange, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import CountUp from "react-countup";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Loader2 } from "lucide-react";

// Simplified PullToRefresh Component that doesn't block scroll
const PullToRefresh = ({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    triggerHaptic();

    // Safety timeout - force stop spinning after 2 seconds
    const safetyTimeout = setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);

    try {
      await onRefresh();
    } finally {
      clearTimeout(safetyTimeout);
      setIsRefreshing(false);
    }
  };

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
  const [balance, setBalance] = useState<number | null>(null);
  const [comparisonDiff, setComparisonDiff] = useState<number | null>(null);
  // const [goals, setGoals] = useState<Goal[]>([]); // Removed: Using assets from useWealth
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState(new Date());
  const [budgetInfo, setBudgetInfo] = useState({ budget: 20000, fixed: 0 });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false); // Manual Privacy Mode

  const daysRemaining = getDaysRemainingInCycle(); // This is for current cycle only, maybe update if needed for UI but keeping for now

  const supabaseRef = useRef(createClientComponentClient());
  const supabase = supabaseRef.current;
  const { user, profile, loading: authLoading } = useAuth();
  const { netWorth, investmentsValue, cashValue, assets, loading: wealthLoading } = useWealth();

  const [burnRateData, setBurnRateData] = useState<{ status: 'safe' | 'warning' | 'critical', projectedDate: Date | null }>({ status: 'safe', projectedDate: null });

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (balance === null) setLoading(true);

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
      const [txResult, subsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, amount, date, description, category, payer, is_surprise, created_at')
          .gte('date', start.toISOString())
          .lt('date', end.toISOString())
          .order('date', { ascending: false })
          .abortSignal(signal),
        supabase.from('subscriptions').select('*').abortSignal(signal),
      ]);

      const { data: txData, error: txError } = txResult;
      const { data: subsData, error: subsError } = subsResult;

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

      const MONTHLY_BUDGET = profile?.budget || 20000;
      const totalFixed = subsData?.reduce((sum: number, sub: any) => sum + Number(sub.amount), 0) || 0;
      setBudgetInfo({ budget: MONTHLY_BUDGET, fixed: totalFixed });

      const totalExpenses = transactionsData.reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;
      const currentBalance = Math.round((MONTHLY_BUDGET - totalFixed - totalExpenses) * 100) / 100;
      setBalance(currentBalance);

      // Burn Rate Logic: "Variable Only"
      // User request: "without the fixed ones"
      // Strategy: Filter out transactions that match known subscription amounts (Fixed Expenses)
      // and calculate average daily spend based on the remaining "Variable" transactions.
      const isCurrentMonth = viewingDate.getMonth() === new Date().getMonth() && viewingDate.getFullYear() === new Date().getFullYear();
      if (isCurrentMonth) {
        const daysIntoPeriod = differenceInDays(new Date(), start) + 1;

        // 1. Identify Fixed Amounts from Subscriptions
        const fixedAmounts = new Set(subsData?.map((s: any) => Number(s.amount)) || []);

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

      const { data: prevTxData, error: prevError } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', prevStart.toISOString())
        .lte('date', prevLimit.toISOString());

      if (prevError) console.error("Prev Data Error:", prevError);

      const prevExpenses = prevTxData?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
      const currentExpensesSoFar = transactionsData
        .filter(tx => new Date(tx.date) <= limitDate)
        .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;

      setComparisonDiff(currentExpensesSoFar - prevExpenses);

    } catch (error: any) {
      console.error("API Error Detailed:", {
        message: error?.message,
        stack: error?.stack,
        raw: error
      });
      toast.error(`שגיאה בטעינת הנתונים: ${error?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, profile, balance, authLoading, viewingDate]);

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

  const handleQuickAction = (id: string) => {
    setSelectedCategory(id);
    setIsDrawerOpen(true);
  };

  const handleTransactionAdded = (amount: number, newTx?: Transaction) => {
    if (balance !== null) {
      setBalance(prev => (prev !== null ? prev - amount : null));
    }
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

  const balanceRatio = balance && profile?.budget ? balance / profile.budget : 0.5;
  const isLowFunds = balanceRatio < 0.2;
  // Removed gradient backgrounds to fix colored square glitch
  const environmentClass = '';

  const getGreeting = () => {
    const hour = new Date().getHours();
    const billingPeriod = getBillingPeriodForDate(viewingDate);
    const daysRemaining = Math.max(1, differenceInDays(billingPeriod.end, new Date()));
    const dailyBudget = balance && balance > 0 ? Math.round(balance / daysRemaining) : 0;

    if (balance && balance < 0) return "שים לב למינוס";
    if (hour < 5) return "לילה טוב";
    if (hour < 12) return `בוקר טוב! התקציב להיום: ₪${dailyBudget}`;
    if (hour < 18) return `המשך יום נעים (נותרו ₪${dailyBudget})`;
    return "ערב טוב, נרגעים?";
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 text-white selection:bg-blue-500/50 bg-slate-950">



      {/* ... SmartInsights ... */}

      <main className="flex-1 flex flex-col items-center gap-6 w-full mx-auto pb-8">
        {/* Pull to Refresh Wrapper */}
        <PullToRefresh onRefresh={fetchData}>
          {loading || balance === null ? (
            // SKELETONS ...
            <div className="flex flex-col items-center justify-center py-10 gap-8 animate-in fade-in duration-700">
              {/* ... */}
            </div>
          ) : (
            <div className={cn("flex flex-col items-center gap-2 w-full relative z-10 py-2 transition-all duration-500", isPrivacyMode && "blur-xl opacity-50 grayscale")}>
              {/* Billing Cycle Navigation */}
              <div className="w-full max-w-md px-4 flex items-center justify-between mb-1">
                <button
                  onClick={() => { setViewingDate(prev => subMonths(prev, 1)); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                >
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-blue-400/60" />
                  <span className="text-sm font-medium text-white/70">
                    {format(getBillingPeriodForDate(viewingDate).start, 'd.M', { locale: he })}
                    {' - '}
                    {format(getBillingPeriodForDate(viewingDate).end, 'd.M', { locale: he })}
                  </span>
                </div>
                <button
                  onClick={() => { setViewingDate(prev => addMonths(prev, 1)); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Widgets Container - Mosaic Layout */}
              <div className="w-full flex justify-center mb-2">
                <HomeMosaic
                  balance={balance || 0}
                  budget={profile?.budget || 20000}
                  monthlyIncome={profile?.monthly_income || profile?.budget || 20000}
                  totalExpenses={(profile?.budget || 20000) - balance}
                  daysInMonth={differenceInDays(getBillingPeriodForDate(viewingDate).end, getBillingPeriodForDate(viewingDate).start)}
                  daysPassed={Math.max(1, differenceInDays(new Date(), getBillingPeriodForDate(viewingDate).start))}
                  assets={assets}
                  transactions={transactions}
                  subscriptions={subscriptions}
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
            onEdit={(tx) => {
              setEditingTransaction(tx);
              setIsDrawerOpen(true);
            }}
          />
        </LayoutGroup>
      </main>

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
