"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Goal } from "@/types";
import { BrickWall } from "@/components/BrickWall";
import { StockRocket } from "@/components/StockRocket";
import { FuelTanks } from "@/components/FuelTanks";
import { MoneyMover } from "@/components/MoneyMover";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { NetWorthHalo } from "@/components/NetWorthHalo";
import { WealthCards } from "@/components/WealthCards";

export default function WealthPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMoverOpen, setIsMoverOpen] = useState(false);
    const supabase = createClientComponentClient();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: goalsData, error: goalsError } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: true });

            if (goalsError) throw goalsError;
            setGoals(goalsData || []);

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name');

            if (profilesError) throw profilesError;
            setProfiles(profilesData || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived state
    const cashGoals = goals.filter(g => g.type === 'cash');
    const stockGoals = goals.filter(g => g.type === 'stock');
    const pocketHim = goals.find(g => g.type === 'pocket_him');
    const pocketHer = goals.find(g => g.type === 'pocket_her');

    const totalCash = cashGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalStock = stockGoals.reduce((sum, g) => sum + g.current_amount, 0);

    // Helper to get name
    const getPocketName = (type: 'pocket_him' | 'pocket_her') => {
        if (profiles.length === 0) return type === 'pocket_him' ? "כיס שלו" : "כיס שלה";

        const himProfile = profiles[0];
        const herProfile = profiles[1];

        if (type === 'pocket_him') return `כיס ${himProfile?.name || 'שלו'}`;
        if (type === 'pocket_her') return `כיס ${herProfile?.name || 'שלה'}`;

        return "כיס";
    };

    return (
        <div className="flex flex-col gap-8 max-w-md mx-auto pt-8 pb-24 px-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">מרכז שליטה</h1>
                <p className="text-white/60">ניהול העושר המשפחתי</p>
            </div>

            <NetWorthHalo totalNetWorth={totalCash + totalStock + (pocketHim?.current_amount || 0) + (pocketHer?.current_amount || 0)} />

            <div className="flex justify-center">
                <Button
                    onClick={() => setIsMoverOpen(true)}
                    className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-8 shadow-[0_0_20px_rgba(255,255,255,0.3)] h-12"
                >
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> הזזת כספים
                </Button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-64 rounded-3xl bg-white/5" />
                    <Skeleton className="h-40 rounded-3xl bg-white/5" />
                    <Skeleton className="h-40 rounded-3xl bg-white/5" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Fuel Tanks (Pockets) */}
                    <FuelTanks
                        himBalance={pocketHim?.current_amount || 0}
                        herBalance={pocketHer?.current_amount || 0}
                        himName={getPocketName('pocket_him')}
                        herName={getPocketName('pocket_her')}
                    />

                    <WealthCards cashGoals={cashGoals} stockGoals={stockGoals} />
                </div>
            )}

            <MoneyMover
                isOpen={isMoverOpen}
                onClose={() => setIsMoverOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}
