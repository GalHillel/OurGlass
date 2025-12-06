"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Goal } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { FuelTanks } from "@/components/FuelTanks";
import { VaultDoor } from "@/components/VaultDoor";
import { MoneyMover } from "@/components/MoneyMover";
import { Building2, Wallet, ArrowRightLeft } from "lucide-react";

export default function WealthPage() {
    const [assets, setAssets] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [himBalance, setHimBalance] = useState(0);
    const [herBalance, setHerBalance] = useState(0);
    const [isMoverOpen, setIsMoverOpen] = useState(false);

    const supabase = createClientComponentClient();
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            const { data } = await supabase.from('goals').select('*');
            if (data) {
                setAssets(data);
                const him = data.find(g => g.type === 'pocket_him');
                const her = data.find(g => g.type === 'pocket_her');

                // Use real data if available, else mock for demo effect
                setHimBalance(him ? him.current_amount : (Math.floor(Math.random() * 2000) + 1000));
                setHerBalance(her ? her.current_amount : (Math.floor(Math.random() * 2000) + 1000));
            }
            setLoading(false);
        };
        loadData();
    }, [supabase]);

    // Calculate total net worth including hard assets and liquid cash
    const totalNetWorth = assets.reduce((sum, a) => sum + a.current_amount, 0);

    return (
        <div className="min-h-screen pb-24 pt-8 text-white selection:bg-yellow-500/50">

            <main className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col gap-6 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Skeleton className="w-48 h-48 rounded-full bg-slate-800" />
                    </div>
                ) : (
                    <>
                        {/* 1. The Vault (Localized) */}
                        <VaultDoor netWorth={totalNetWorth} />

                        {/* 2. Fuel Tanks (Liquid Assets) */}
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-b from-slate-900/50 to-transparent rounded-3xl -z-10 blur-xl" />
                            <FuelTanks himBalance={himBalance} herBalance={herBalance} />
                        </div>

                        {/* 3. Wealth Grid (Glass Cards) */}
                        {/* 3. Wealth Grid (Mega-Glass Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full">
                            {assets
                                .filter(a => a.type === 'stock' || a.type === 'cash')
                                .map((asset) => {
                                    // Visual Configuration based on type
                                    const isStock = asset.type === 'stock';
                                    const colorClass = isStock ? 'purple' : 'emerald';
                                    const Icon = isStock ? Building2 : Wallet;
                                    const glowColor = isStock ? 'rgba(168,85,247,0.4)' : 'rgba(16,185,129,0.4)';

                                    // Calculate fill percentage (mock target logic for drama)
                                    const fillPercent = Math.min((asset.current_amount / asset.target_amount) * 100, 100) || 50;

                                    return (
                                        <div
                                            key={asset.id}
                                            className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 flex flex-col justify-between aspect-[4/5] md:aspect-square transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_50px_var(--glow-color)]"
                                            style={{ '--glow-color': glowColor } as any}
                                        >
                                            {/* Liquid Fill Background */}
                                            <div
                                                className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-${colorClass}-500/20 to-transparent transition-all duration-1000 ease-out`}
                                                style={{ height: `${fillPercent}%` }}
                                            />

                                            {/* Header */}
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div className={`w-14 h-14 rounded-2xl bg-${colorClass}-500/20 flex items-center justify-center border border-${colorClass}-500/30 group-hover:rotate-12 transition-transform duration-500`}>
                                                    <Icon className={`w-7 h-7 text-${colorClass}-400`} />
                                                </div>
                                                <div className={`px-3 py-1 rounded-full bg-${colorClass}-500/10 border border-${colorClass}-500/20 text-${colorClass}-300 text-xs font-bold uppercase tracking-wider`}>
                                                    {isStock ? '+12.5% THIS YEAR' : 'SECURE'}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="relative z-10">
                                                <div className="text-white/60 font-medium text-lg mb-1">{asset.name === 'stock' ? 'תיק השקעות' : asset.name}</div>
                                                <div className="text-5xl font-black text-white tracking-tighter drop-shadow-lg break-all">
                                                    ₪{asset.current_amount.toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Decorative Sparkline/Graph */}
                                            <svg className="absolute bottom-0 right-0 w-full h-32 opacity-20 pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                                                <path d="M0,40 Q25,35 50,20 T100,5 V40 H0 Z" fill={`currentColor`} className={`text-${colorClass}-500`} />
                                            </svg>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
                )}
            </main>

            {/* Floating Command Bar */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
                <button
                    onClick={() => setIsMoverOpen(true)}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all font-bold text-sm"
                >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>בצע פעולה</span>
                </button>
            </div>

            <MoneyMover
                isOpen={isMoverOpen}
                onClose={() => setIsMoverOpen(false)}
                onSuccess={() => { /* Reload Logic could go here */ }}
            />
        </div>
    );
}
