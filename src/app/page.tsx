"use client";

import { RealNumberDisplay } from "@/components/RealNumberDisplay";
import { QuickActions } from "@/components/QuickActions";
import { AddTransactionDrawer } from "@/components/AddTransactionDrawer";
import { BrickWall } from "@/components/BrickWall";
import { AnalyticsHeatmap } from "@/components/AnalyticsHeatmap";
import { TransactionList } from "@/components/TransactionList";
import { StockRocket } from "@/components/StockRocket";
import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Transaction, Goal } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { isSameDay } from "date-fns";
import { NetWorthHalo } from "@/components/NetWorthHalo";
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

    } catch (error) {
      console.error("Error fetching data:", error);
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
    <div className="flex flex-col min-h-screen pb-20">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">OurGlass</h1>
        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 overflow-hidden">
          {/* Avatar placeholder or user image */}
          {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="User" />}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-8">
        {loading || balance === null ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Skeleton className="w-64 h-64 rounded-full bg-white/10" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 w-full">
            <RealNumberDisplay amount={balance} />

            {/* Net Worth Halo */}
            <div className="w-full flex justify-center -my-4 scale-90">
              <NetWorthHalo
                totalNetWorth={goals.reduce((sum, g) => sum + g.current_amount, 0)}
              />
            </div>
          </div>
        )}

        <div className="w-full">
          <h2 className="text-white/80 text-lg px-6 mb-4 font-medium">פעולות מהירות</h2>
          <QuickActions onAction={handleQuickAction} />
        </div>

        {loading ? (
          <Skeleton className="w-full max-w-md h-40 rounded-2xl bg-white/10 mx-4" />
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full px-4">
            {/* Investments Card (Rocket) */}
            {goals.find(g => g.type === 'stock') && (
              <div className="glass p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">השקעות</h3>
                </div>

                <div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    ₪<CountUp end={goals.find(g => g.type === 'stock')?.current_amount || 0} separator="," duration={2.5} />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded-full">
                      {goals.find(g => g.type === 'stock')?.growth_rate}% תשואה
                    </span>
                  </div>
                </div>

                {/* Background Effect */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 blur-[30px] rounded-full pointer-events-none" />
              </div>
            )}

            {/* Joint Savings Card (Fortress) */}
            {goals.find(g => g.type === 'cash') && (
              <div className="glass p-4 rounded-2xl relative overflow-hidden group flex flex-col justify-between h-40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">החסכונות שלנו</h3>
                </div>

                <div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    ₪<CountUp end={goals.find(g => g.type === 'cash')?.current_amount || 0} separator="," duration={2} />
                  </div>
                  <p className="text-white/40 text-[10px] mt-1">המבצר המשותף</p>
                </div>

                {/* Background Effect */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/20 blur-[30px] rounded-full pointer-events-none" />
              </div>
            )}
          </div>
        )}

        <AnalyticsHeatmap
          transactions={transactions}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />

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
    </div>
  );
}
