"use client";

import { useMemo } from "react";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface RiskAnalysisProps {
    investments: any[]; // Replace with specific type if available
    totalWealth: number;
    cash: number;
}

export const RiskAnalysisCard = ({ investments, totalWealth, cash }: RiskAnalysisProps) => {
    const analysis = useMemo(() => {
        if (!totalWealth || totalWealth === 0) return null;

        // 1. Cardio Check: Cash Drag
        const cashRatio = cash / totalWealth;

        // 2. Crypto Exposure (Mock detection based on asset name or type)
        // Assuming 'crypto' type exists, or checking names like BTC, ETH
        const cryptoAssets = investments.filter(i => i.type === 'crypto' || i.name.toLowerCase().includes('btc') || i.name.toLowerCase().includes('eth'));
        const cryptoTotal = cryptoAssets.reduce((sum, i) => sum + Number(i.amount), 0);
        const cryptoRatio = cryptoTotal / totalWealth;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        let messages: string[] = [];

        if (cryptoRatio > 0.2) {
            riskLevel = 'high';
            messages.push(`חשיפה גבוהה לקריפטו (${Math.round(cryptoRatio * 100)}%). מומלץ לאזן.`);
        } else if (cryptoRatio > 0.05) {
            riskLevel = 'medium';
        }

        if (cashRatio > 0.4) {
            messages.push(`יותר מדי מזומן (${Math.round(cashRatio * 100)}%). הכסף נשחק באינפלציה.`);
            if (riskLevel === 'low') riskLevel = 'medium';
        } else if (cashRatio < 0.05) {
            messages.push('כרית הביטחון נמוכה מדי (פחות מ-5% מזומן).');
            riskLevel = 'high'; // Risky to have no cash
        }

        // 3. Concentration Risk (Single Asset > 20% of Portfolio)
        const portfolioValue = totalWealth - cash;
        if (portfolioValue > 0) {
            const biggestAsset = investments.reduce((prev, current) => (Number(prev.amount || prev.current_amount) > Number(current.amount || current.current_amount)) ? prev : current, investments[0]);
            if (biggestAsset) {
                const concentrationRatio = Number(biggestAsset.amount || biggestAsset.current_amount) / portfolioValue;
                if (concentrationRatio > 0.25) {
                    riskLevel = 'medium';
                    messages.push(`תלות גבוהה בנכס בודד: ${biggestAsset.name} (${Math.round(concentrationRatio * 100)}% מהתיק).`);
                }
            }
        }

        return { riskLevel, messages };
    }, [investments, totalWealth, cash]);

    if (!analysis) return null;

    const config = {
        low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle, label: "סיכון מאוזן" },
        medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle, label: "שים לב" },
        high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: Shield, label: "סיכון גבוה" }
    };

    const Theme = config[analysis.riskLevel];
    const Icon = Theme.icon;

    return (
        <div className={`p-4 rounded-2xl border backdrop-blur-sm ${Theme.bg} ${Theme.border}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${Theme.color}`} />
                    <span className={`font-bold text-sm ${Theme.color} opacity-90`}>{Theme.label}</span>
                </div>
                {/* Score bar or gauge could go here */}
            </div>

            <div className="space-y-2">
                {analysis.messages.length > 0 ? (
                    analysis.messages.map((msg, idx) => (
                        <p key={idx} className="text-xs text-white/70 flex items-start gap-1.5 leading-tight">
                            <span className="mt-0.5 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                            {msg}
                        </p>
                    ))
                ) : (
                    <p className="text-xs text-white/50">התיק נראה מאוזן ובריא. כל הכבוד!</p>
                )}
            </div>
        </div>
    );
};
