"use client";

import { ReactorCore } from "@/components/ReactorCore";
import { QuickActions } from "@/components/QuickActions";
import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { MonthlySummary } from "@/components/MonthlySummary";
import { StreakCounter } from "@/components/StreakCounter";
import { TransactionList } from "@/components/TransactionList";
import { FinancialWisdom } from "@/components/FinancialWisdom";
import { PartnerStats } from "@/components/PartnerStats";
import { getDaysRemainingInCycle, getBillingPeriodForDate } from "@/lib/billing";
import { triggerHaptic } from "@/utils/haptics";
import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Transaction, Goal, Subscription } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { useWealth } from "@/hooks/useWealth";
import { Skeleton } from "@/components/ui/skeleton";
import { isSameDay, addMonths, subMonths, format, differenceInDays, addDays } from "date-fns";
import { Shield, Rocket, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import CountUp from "react-countup";

import { SmartInsights } from "@/components/SmartInsights";
import { useScroll, useTransform, useMotionValue } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// Inline PullToRefresh Component for native feel
const PullToRefresh = ({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const splitY = useMotionValue(0); // Track drag

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.y > 100) { // Threshold
      setIsRefreshing(true);
      triggerHaptic();
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2} // High resistance like native
      onDragEnd={handleDragEnd}
      className="w-full touch-pan-y"
      style={{ y: splitY }} // Create nice springy effect
    >
      <div className="flex justify-center -mt-10 h-10 items-center overflow-hidden">
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : (
          <span className="text-xs text-white/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Pull to refresh
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [comparisonDiff, setComparisonDiff] = useState<number | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState(new Date());
  const [budgetInfo, setBudgetInfo] = useState({ budget: 20000, fixed: 0 });

  const daysRemaining = getDaysRemainingInCycle(); // This is for current cycle only, maybe update if needed for UI but keeping for now

  const supabase = createClientComponentClient();
  const { user, profile, loading: authLoading } = useAuth();
  const { netWorth, investmentsValue, cashValue, loading: wealthLoading } = useWealth();

  const fetchData = useCallback(async () => {
    // 1. Wait for Auth to be ready
    if (authLoading) return;

    // 2. If no user, we can't fetch. 
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (balance === null) setLoading(true);

      // 3. Billing Period for VIEWING DATE
      const { start, end } = getBillingPeriodForDate(viewingDate);

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', start.toISOString())
        .lt('date', end.toISOString())
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      // 2. Calculate "Real Number"
      const MONTHLY_BUDGET = profile?.budget || 20000;

      // Fetch subscriptions to subtract fixed costs
      const { data: subsData } = await supabase.from('subscriptions').select('*');
      const totalFixed = subsData?.reduce((sum: number, sub: any) => sum + Number(sub.amount), 0) || 0;
      setSubscriptions(subsData || []);
      setBudgetInfo({ budget: MONTHLY_BUDGET, fixed: totalFixed });

      const totalExpenses = txData?.reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;
      setBalance(Math.round((MONTHLY_BUDGET - totalFixed - totalExpenses) * 100) / 100);

      // --- Comparison Logic ---
      // Compare "Spending so far this month" vs "Spending at same point last month"
      // Only meaningful if viewing current month (or close to it), but we can always show diff vs prev month same timeframe.

      // Calculate how many days passed in this viewed period relative to its start
      // If viewing Date is "Now" (current month), limit to Now. 
      // If viewing past month, take full month? 
      // The prompt says "if today is Jan 30, fetch Dec 1 - Dec 30". This implies "Same relative point".

      const now = new Date();
      let limitDate = end; // Default full month
      if (viewingDate.getMonth() === now.getMonth() && viewingDate.getFullYear() === now.getFullYear()) {
        limitDate = now;
      }

      const daysIntoPeriod = differenceInDays(limitDate, start);

      const prevStart = subMonths(start, 1);
      const prevLimit = addDays(prevStart, daysIntoPeriod);
      // We want transactions GTE prevStart AND LTE prevLimit
      // Actually LTE is tricky with times, let's use LT (prevLimit + 1 day) or just naive comparison.
      // Let's use End of Day concept if needed, but ISO string comparison works fine.

      const { data: prevTxData } = await supabase
        .from('transactions')
        .select('amount')
        .gte('date', prevStart.toISOString())
        .lte('date', prevLimit.toISOString()); // lte covers up to the exact timestamp

      const prevExpenses = prevTxData?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;

      // Filter current transactions to the same limitDate for fair comparison if we fetched full month but are mid-month?
      // Actually txData is already for the full viewing period.
      // If we are looking at specific timeframe calculation:
      const currentExpensesSoFar = txData
        ?.filter(tx => new Date(tx.date) <= limitDate)
        .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;

      const diff = currentExpensesSoFar - prevExpenses;
      setComparisonDiff(diff);


      // 3. Fetch Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

    } catch (error: any) {
      console.error("API Error:", error);
      toast.error("שגיאה בטעינת הנתונים");
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

  const handleTransactionAdded = (amount: number) => {
    // Optimistic UI Update
    if (balance !== null) {
      // Expenses subtract, so we iterate down
      setBalance(prev => (prev !== null ? prev - amount : null));
    }
    setIsDrawerOpen(false);
    // Background refresh
    fetchData();
  };

  const filteredTransactions = selectedDate
    ? transactions.filter(tx => isSameDay(new Date(tx.date), selectedDate))
    : transactions;

  return (
    <div className="flex flex-col min-h-screen pb-20 text-white selection:bg-blue-500/50">

      <AppHeader
        title="סקירה"
        subtitle="כללית"
        icon={LayoutGrid}
        iconColor="text-blue-400"
        titleColor="text-blue-500"
      />

      {/* Spacer for fixed header */}
      <div className="h-10" />

      <div className="mt-4">
        <SmartInsights />
      </div>

      <main className="flex-1 flex flex-col items-center gap-6 w-full mx-auto pb-8">
        {/* Pull to Refresh Wrapper */}
        <PullToRefresh onRefresh={fetchData}>
          {loading || balance === null ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Skeleton className="w-80 h-80 rounded-full bg-blue-900/20" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 w-full relative z-10 py-8">
              <ReactorCore
                income={profile?.budget || 20000}
                expenses={(profile?.budget || 20000) - balance}
                balance={balance}
              />
            </div>
          )}
        </PullToRefresh>

        {/* Action Header & Summary - Floating Glass Card */}
        <div className="w-full px-6 mt-4">
          <div className="neon-card p-4 rounded-3xl flex flex-col gap-4">
            <div className="flex justify-between items-center w-full">
              <button onClick={() => setViewingDate(d => subMonths(d, 1))} className="p-2 rounded-full hover:bg-white/10 transition">
                <ChevronRight className="w-5 h-5 text-white/70" />
              </button>
              <div className="text-center">
                <span className="text-xs text-white/40 uppercase tracking-widest block">תקופת חיוב</span>
                <span className="text-sm font-medium text-white">
                  {format(getBillingPeriodForDate(viewingDate).start, 'dd/MM')} - {format(getBillingPeriodForDate(viewingDate).end, 'dd/MM')}
                </span>
              </div>
              <button onClick={() => setViewingDate(d => addMonths(d, 1))} className="p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <div className="h-px w-full bg-white/5" />

            <div className="flex justify-between items-center">
              <h2 className="text-white/60 text-sm font-medium tracking-wider pl-2">פעולות מהירות</h2>
              {balance !== null && (
                <MonthlySummary currentBalance={balance} onRefresh={fetchData} />
              )}
            </div>
          </div>
        </div>

        {/* Partner Stats */}
        <PartnerStats
          transactions={filteredTransactions}
          subscriptions={subscriptions}
          monthlyBudget={budgetInfo.budget}
        />

        {/* Streak Counter */}
        {/* Streak Counter */}
        {/* Streak Counter - Floating Glass */}
        <div className="w-full px-6 mt-4">
          <div className="neon-card p-1 rounded-2xl flex justify-center">
            <StreakCounter
              transactions={transactions}
              monthlyBudget={budgetInfo.budget}
              fixedExpenses={budgetInfo.fixed}
            />
          </div>
        </div>

        {/* Daily Tip */}
        <FinancialWisdom />

        {/* Quick Actions */}
        <div className="w-full">
          <QuickActions onAction={handleQuickAction} />
        </div>



        {/* Wealth Cards (Investments/Savings) */}
        {loading ? (
          <Skeleton className="w-full max-w-md h-40 rounded-2xl bg-white/10 mx-4" />
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full px-4">
            {/* Investments Card (Rocket) - Aggregated */}
            {goals.some(g => g.type === 'stock') && (
              <div className="neon-card p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between min-h-[160px] h-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">השקעות</h3>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="text-2xl font-black text-white tracking-tight break-all">
                    ₪<CountUp
                      end={investmentsValue}
                      separator=","
                      duration={2.5}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      תיק כולל
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 blur-[30px] rounded-full pointer-events-none" />
              </div>
            )}

            {/* Joint Savings Card (Fortress) - Aggregated */}
            {goals.some(g => g.type === 'cash') && (
              <div className="neon-card p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between min-h-[160px] h-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">החסכונות שלנו</h3>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="text-2xl font-black text-white tracking-tight break-all">
                    ₪<CountUp
                      end={cashValue}
                      separator=","
                      duration={2}
                    />
                  </div>
                  <p className="text-white/40 text-[10px] mt-1 truncate">נזילות מיידית</p>
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/20 blur-[30px] rounded-full pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <MonthlyCalendar
          transactions={transactions}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />

        {/* History Insight */}
        {comparisonDiff !== null && (
          <div className="text-center -mt-2 mb-4">
            <p className="text-[10px] text-white/40">
              {comparisonDiff > 0 ? (
                <>
                  החודש הוצאת <span className="text-rose-400 font-medium">₪{Math.abs(comparisonDiff).toLocaleString()} יותר</span> מחודש שעבר 📉
                </>
              ) : (
                <>
                  החודש הוצאת <span className="text-emerald-400 font-medium">₪{Math.abs(comparisonDiff).toLocaleString()} פחות</span> מחודש שעבר 👏
                </>
              )}
            </p>
          </div>
        )}

        {/* Transactions */}
        <TransactionList
          transactions={filteredTransactions}
          onRefresh={fetchData}
          onEdit={(tx) => {
            setEditingTransaction(tx);
            setIsDrawerOpen(true);
          }}
        />
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
    </div >
  );
}
