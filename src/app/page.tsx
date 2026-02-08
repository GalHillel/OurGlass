"use client";

import { QuickActions } from "@/components/QuickActions";
import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { MonthlySummary } from "@/components/MonthlySummary";
import { StreakCounter } from "@/components/StreakCounter";
import { TransactionList } from "@/components/TransactionList";
import { FinancialWisdom } from "@/components/FinancialWisdom";
import { PartnerStats } from "@/components/PartnerStats";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { getDaysRemainingInCycle, getBillingPeriodForDate } from "@/lib/billing";
import { triggerHaptic } from "@/utils/haptics";
import { calculateBurnRate, cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
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
import { Shield, Rocket, ChevronLeft, ChevronRight, LayoutGrid, EyeOff } from "lucide-react";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState(new Date());
  const [budgetInfo, setBudgetInfo] = useState({ budget: 20000, fixed: 0 });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false); // Manual Privacy Mode

  const daysRemaining = getDaysRemainingInCycle(); // This is for current cycle only, maybe update if needed for UI but keeping for now

  const supabase = createClientComponentClient();
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

      // OPTIMIZATION: Select only needed columns
      const [txResult, subsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, amount, date, description, category, payer, is_surprise, created_at')
          .gte('date', start.toISOString())
          .lt('date', end.toISOString())
          .order('date', { ascending: false }),
        supabase.from('subscriptions').select('*'),
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

      // Burn Rate Logic
      const isCurrentMonth = viewingDate.getMonth() === new Date().getMonth() && viewingDate.getFullYear() === new Date().getFullYear();
      if (isCurrentMonth) {
        const daysIntoPeriod = differenceInDays(new Date(), start) + 1;
        const avgDaily = daysIntoPeriod > 0 ? totalExpenses / daysIntoPeriod : 0;
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

  const filteredTransactions = selectedDate
    ? transactions.filter(tx => isSameDay(new Date(tx.date), selectedDate))
    : transactions;

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
            <div className={cn("flex flex-col items-center gap-6 w-full relative z-10 py-6 transition-all duration-500", isPrivacyMode && "blur-xl opacity-50 grayscale")}>
              <ReactorCore
                income={profile?.budget || 20000}
                expenses={(profile?.budget || 20000) - balance}
                balance={balance}
                burnRateStatus={burnRateData.status}
                cycleStart={getBillingPeriodForDate(viewingDate).start}
                cycleEnd={getBillingPeriodForDate(viewingDate).end}
              />

              {/* Widgets Container - Unified max-width */}
              <div className="w-full max-w-md space-y-4 px-4">
                {/* Budget Health Score Widget */}
                <BudgetHealthScore
                  balance={balance}
                  budget={profile?.budget || 20000}
                  monthlyIncome={profile?.monthly_income || profile?.budget || 20000}
                  totalExpenses={(profile?.budget || 20000) - balance}
                  daysInMonth={differenceInDays(getBillingPeriodForDate(viewingDate).end, getBillingPeriodForDate(viewingDate).start)}
                  daysPassed={Math.max(1, differenceInDays(new Date(), getBillingPeriodForDate(viewingDate).start))}
                />

                {/* Savings Tracker Widget */}
                <SavingsTracker
                  monthlyIncome={profile?.monthly_income || profile?.budget || 20000}
                  budget={profile?.budget || 20000}
                  totalSpent={(profile?.budget || 20000) - balance}
                />
              </div>

              {/* Quick Actions - Quick Expense Buttons */}
              <div className="w-full max-w-md" style={{ touchAction: 'auto', overflow: 'visible' }}>
                <p className="text-white/40 text-xs font-medium mb-2 px-4">הוספה מהירה</p>
                <QuickActions
                  onAction={(id, label) => {
                    setSelectedCategory(label);
                    setIsDrawerOpen(true);
                  }}
                />
              </div>
            </div>
          )}
        </PullToRefresh>

        {/* ... */}
        {/* Focus Mode Wrapper - MANUAL PRIVACY ONLY */}
        <motion.div
          animate={{ opacity: isPrivacyMode ? 0 : 1, filter: isPrivacyMode ? "blur(10px)" : "none", pointerEvents: isPrivacyMode ? "none" : "auto" }}
          transition={{ duration: 0.5 }}
        >
          {/* Content */}
          {/* Wealth Cards (Investments/Savings) */}
          {loading ? (
            <Skeleton className="w-full max-w-md h-40 rounded-2xl bg-white/10 mx-4" />
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full px-4 mb-4">
              {/* Investments Card (Rocket) - Aggregated */}
              {assets.some(g => g.type === 'stock') && (
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
              {assets.some(g => g.type === 'cash') && (
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
        </motion.div>

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

        {/* Category Breakdown Widget */}
        <div className="w-full max-w-md px-4">
          <CategoryBreakdown transactions={transactions} />
        </div>

        {/* Partner/Gender Breakdown Widget */}
        <PartnerStats
          transactions={transactions}
          subscriptions={subscriptions}
          monthlyBudget={profile?.budget || 20000}
        />

        {/* Transactions */}
        <LayoutGroup>
          <TransactionList
            transactions={filteredTransactions}
            subscriptions={subscriptions}
            onRefresh={fetchData}
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
