"use client";

import { ReactorCore } from "@/components/ReactorCore";
import { QuickActions } from "@/components/QuickActions";
import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { MonthlySummary } from "@/components/MonthlySummary";
import { StreakCounter } from "@/components/StreakCounter";
import { FutureSlider } from "@/components/FutureSlider";
import { Confetti } from "@/components/Confetti";
import { TransactionList } from "@/components/TransactionList";
import { StockRocket } from "@/components/StockRocket";
import { ParticleBackground } from "@/components/ParticleBackground"; // Added
import { getDaysRemainingInCycle } from "@/lib/billing"; // Added
import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Transaction, Goal } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { isSameDay } from "date-fns";
import { Shield, Rocket } from "lucide-react";
import CountUp from "react-countup";

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const daysRemaining = getDaysRemainingInCycle();

  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Don't set loading to true here to avoid flickering on refresh
      // Only set it on initial load if data is missing
      if (balance === null) setLoading(true);

      // 1. Fetch Transactions for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startOfMonth.toISOString())
        .order('date', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

      // 2. Calculate "Real Number"
      // Use profile budget or default
      const MONTHLY_BUDGET = profile?.budget || 20000;

      // Fetch subscriptions to subtract fixed costs
      const { data: subscriptions } = await supabase.from('subscriptions').select('amount');
      const totalFixed = subscriptions?.reduce((sum, sub) => sum + Number(sub.amount), 0) || 0;

      const totalExpenses = txData?.reduce((sum, tx: any) => sum + Number(tx.amount), 0) || 0;
      setBalance(MONTHLY_BUDGET - totalFixed - totalExpenses);

      // 3. Fetch Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: true });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

    } catch (error: any) {
      console.warn("API/Supabase Error - Loading Demo Data:", error.message || error);

      // DEMO MODE - Fallback Data
      setBalance(42500); // High balance
      setGoals([
        {
          id: 'demo-1',
          name: 'טסלה מודל S',
          current_amount: 154000,
          target_amount: 400000,
          type: 'stock',
          growth_rate: 12.5,
          brick_color: '#7C3AED',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          name: 'פנטהאוז בתל אביב',
          current_amount: 450000,
          target_amount: 5000000,
          type: 'cash',
          growth_rate: 0,
          brick_color: '#10B981',
          created_at: new Date().toISOString()
        }
      ]);
      setTransactions([
        {
          id: 't1',
          amount: 450,
          description: 'ארוחת ערב\nמסה',
          date: new Date().toISOString(),
          category_id: null,
          user_id: null,
          is_surprise: false,
          surprise_reveal_date: null,
          location_lat: null,
          location_lng: null,
          mood_rating: 5,
          created_at: new Date().toISOString()
        },
        {
          id: 't2',
          amount: 1200,
          description: 'קניות\nטיב טעם',
          date: new Date().toISOString(),
          category_id: null,
          user_id: null,
          is_surprise: false,
          surprise_reveal_date: null,
          location_lat: null,
          location_lng: null,
          mood_rating: null,
          created_at: new Date().toISOString()
        },
        {
          id: 't3',
          amount: 5000,
          description: 'הפקדה\nחיסכון',
          date: new Date().toISOString(),
          category_id: null,
          user_id: null,
          is_surprise: false,
          surprise_reveal_date: null,
          location_lat: null,
          location_lng: null,
          mood_rating: 5,
          created_at: new Date().toISOString()
        },
      ]);

    } finally {
      setLoading(false);
    }
  }, [user, supabase, profile, balance]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickAction = (id: string) => {
    setSelectedCategory(id);
    setIsDrawerOpen(true);
  };

  const handleTransactionAdded = (amount: number) => {
    // Optimistic UI Update
    if (balance !== null) {
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

      <header className="p-6 flex justify-between items-center relative z-10">
        <div /> {/* Spacer for centered/right alignment if needed */}

      </header>

      <main className="flex-1 flex flex-col items-center gap-6 w-full max-w-md mx-auto pb-8">
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

        {/* Action Header & Summary - Floating Glass Card */}
        <div className="w-full px-6 mt-4">
          <div className="glass p-4 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl flex justify-between items-center shadow-2xl">
            <h2 className="text-white/60 text-sm font-medium tracking-wider pl-2">QUICK OPS</h2>
            {balance !== null && (
              <MonthlySummary currentBalance={balance} onRefresh={fetchData} />
            )}
          </div>
        </div>

        {/* Streak Counter */}
        {/* Streak Counter */}
        {/* Streak Counter - Floating Glass */}
        <div className="w-full px-6 mt-4">
          <div className="glass p-1 rounded-2xl border border-white/5 bg-slate-900/30">
            <StreakCounter />
          </div>
        </div>

        <Confetti trigger={goals.some(g => g.current_amount >= g.target_amount)} />

        {/* Quick Actions */}
        <div className="w-full">
          <QuickActions onAction={handleQuickAction} />
        </div>

        {/* Future Slider */}
        <div className="w-full px-4">
          <FutureSlider />
        </div>

        {/* Wealth Cards (Investments/Savings) */}
        {loading ? (
          <Skeleton className="w-full max-w-md h-40 rounded-2xl bg-white/10 mx-4" />
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full px-4">
            {/* Investments Card (Rocket) */}
            {goals.find(g => g.type === 'stock') && (
              <div className="glass p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between min-h-[160px] h-auto border border-white/10 shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">השקעות</h3>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="text-2xl font-black text-white tracking-tight break-all">
                    ₪<CountUp end={goals.find(g => g.type === 'stock')?.current_amount || 0} separator="," duration={2.5} />
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      {goals.find(g => g.type === 'stock')?.growth_rate}% תשואה
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 blur-[30px] rounded-full pointer-events-none" />
              </div>
            )}

            {/* Joint Savings Card (Fortress) */}
            {goals.find(g => g.type === 'cash') && (
              <div className="glass p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between min-h-[160px] h-auto border border-white/10 shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">החסכונות שלנו</h3>
                </div>

                <div className="relative z-10 mt-4">
                  <div className="text-2xl font-black text-white tracking-tight break-all">
                    ₪<CountUp end={goals.find(g => g.type === 'cash')?.current_amount || 0} separator="," duration={2} />
                  </div>
                  <p className="text-white/40 text-[10px] mt-1 truncate">המבצר המשותף</p>
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

        {/* Transactions */}
        <TransactionList
          transactions={filteredTransactions}
          onRefresh={fetchData}
        />
      </main>

      <AddTransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        category={selectedCategory}
        onSuccess={handleTransactionAdded}
      />
    </div >
  );
}
