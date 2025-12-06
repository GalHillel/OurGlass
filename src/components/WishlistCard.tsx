import React, { useState } from 'react';
import { differenceInHours } from 'date-fns';
import { ExternalLink, Trash2, Sparkles, Plus, Minus, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface WishlistCardProps {
    item: WishlistItem;
    onDelete: (id: string) => void;
    onDeposit: (item: WishlistItem, amount: number) => void;
    onWithdraw: (item: WishlistItem, amount: number) => void;
    onPurchase: (item: WishlistItem) => void;
}

export const WishlistCard = ({ item, onDelete, onDeposit, onWithdraw, onPurchase }: WishlistCardProps) => {
    const [depositAmount, setDepositAmount] = useState("");
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    // Calculate progress
    const saved = item.saved_amount || 0;
    const progress = Math.min((saved / item.price) * 100, 100);
    const isFullyFunded = saved >= item.price;

    // Phase 5: Cooling Off Logic
    const hoursSinceCreation = differenceInHours(new Date(), new Date(item.created_at));
    const isCoolingOff = item.price > 500 && hoursSinceCreation < 24;
    const hoursLeft = 24 - hoursSinceCreation;

    const handleTransaction = (type: 'deposit' | 'withdraw') => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) return;

        triggerHaptic();
        if (type === 'deposit') {
            onDeposit(item, amount);
            setShowDeposit(false);
        } else {
            onWithdraw(item, amount);
            setShowWithdraw(false);
        }
        setDepositAmount("");
    };

    if (item.status === 'purchased') {
        return (
            <div className="glass p-6 rounded-[2rem] flex flex-col justify-between gap-4 w-full min-h-[250px] relative overflow-hidden border border-green-500/30">
                <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
                <div className="flex flex-col items-center justify-center h-full gap-4 z-10">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white break-words">{item.name}</h3>
                        <p className="text-green-300 font-medium">נרכש בהצלחה!</p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="mt-4 text-white/40 hover:text-white text-sm underline"
                    >
                        הסר מהרשימה
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "glass p-6 md:p-8 rounded-[2.5rem] flex flex-col justify-between gap-6 group relative overflow-hidden border transition-all duration-300 w-full h-auto min-h-[200px]",
            isCoolingOff ? "border-blue-300/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : "border-white/10 shadow-xl shadow-black/5 hover:border-white/20"
        )}>
            {/* Icebox / Cooling Overlay */}
            {isCoolingOff && (
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none z-0" />
            )}

            {/* Hover Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header & Delete */}
            <div className="flex justify-between items-start relative z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic();
                        onDelete(item.id);
                    }}
                    className="p-3 -ml-3 rounded-full hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-6 h-6" />
                </button>

                {isCoolingOff && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
                        <Clock className="w-3.5 h-3.5 text-blue-200" />
                        <span className="text-xs font-bold text-blue-100">{hoursLeft}h</span>
                    </div>
                )}

                {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="p-3 -mr-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <ExternalLink className="w-6 h-6" />
                    </a>
                )}
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center text-center gap-4 relative z-10 flex-1 justify-center">
                <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-2 shadow-inner border transition-transform duration-500 relative",
                    isCoolingOff ? "bg-blue-500/10 border-blue-400/20" : "bg-gradient-to-br from-white/10 to-white/5 border-white/5 group-hover:scale-110"
                )}>
                    {isCoolingOff ? <Clock className="w-10 h-10 text-blue-300" /> : <Sparkles className="w-10 h-10 text-yellow-200/80" />}

                    {/* Visualize Button (AI Stub) */}
                    {!isCoolingOff && (
                        <button
                            className="absolute -right-2 -top-2 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white p-2 rounded-full backdrop-blur-md border border-purple-500/30 transition-all scale-75 hover:scale-100"
                            onClick={(e) => { e.stopPropagation(); triggerHaptic(); /* AI Trigger logic here */ }}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="space-y-2 w-full">
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight break-words px-2">{item.name}</h3>
                    <div className="flex flex-col items-center">
                        <p className="text-xl md:text-2xl font-medium text-white/70">
                            ₪{item.price.toLocaleString()}
                        </p>
                        {/* Time Travel / Opportunity Cost Tag */}
                        {item.price > 100 && !isCoolingOff && (
                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                <span className="bg-red-500/10 text-red-200 px-3 py-1.5 rounded-full text-xs font-bold border border-red-500/10 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    מעכב את החופשה ב-{Math.ceil(item.price / 300)} ימים
                                </span>
                            </div>
                        )}

                        {/* Boost Button */}
                        {!isFullyFunded && !isCoolingOff && (
                            <button
                                className="mt-4 flex items-center gap-2 text-xs font-bold text-yellow-400/80 hover:text-yellow-300 transition-colors uppercase tracking-widest bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20"
                                onClick={(e) => { e.stopPropagation(); onDeposit(item, 100); triggerHaptic(); }}
                            >
                                <Sparkles className="w-3 h-3" />
                                Boost ₪100
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Savings Progress */}
            <div className="space-y-3 w-full relative z-10 mt-auto">
                <div className="flex justify-between items-end px-2">
                    <span className="text-sm text-white/40 font-medium">נחסך עד כה</span>
                    <div className="text-right">
                        <span className="text-lg font-bold text-white">₪{saved.toLocaleString()}</span>
                    </div>
                </div>

                <div className="h-4 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative shadow-inner mt-2">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000 ease-out relative overflow-hidden",
                            isFullyFunded ? "bg-gradient-to-r from-emerald-500 to-green-400" : (isCoolingOff ? "bg-blue-500/50" : "bg-gradient-to-r from-blue-600 to-purple-500")
                        )}
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                </div>

                {/* Controls - Large Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {showDeposit ? (
                        <div className="col-span-2 flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <Input
                                type="number"
                                placeholder="כמה?"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                className="h-14 text-lg bg-slate-900/50 border-white/10 text-white rounded-xl"
                                autoFocus
                            />
                            <Button size="icon" className="h-14 w-14 bg-green-500 hover:bg-green-600 shrink-0 rounded-xl" onClick={() => handleTransaction('deposit')}>
                                <Check className="w-6 h-6" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-14 w-14 text-white/50 hover:text-white shrink-0 rounded-xl" onClick={() => setShowDeposit(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    ) : showWithdraw ? (
                        <div className="col-span-2 flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <Input
                                type="number"
                                placeholder="כמה למשוך?"
                                value={depositAmount}
                                onChange={e => setDepositAmount(e.target.value)}
                                className="h-14 text-lg bg-slate-900/50 border-white/10 text-white rounded-xl"
                                autoFocus
                            />
                            <Button size="icon" className="h-14 w-14 bg-red-500 hover:bg-red-600 shrink-0 rounded-xl" onClick={() => handleTransaction('withdraw')}>
                                <Check className="w-6 h-6" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-14 w-14 text-white/50 hover:text-white shrink-0 rounded-xl" onClick={() => setShowWithdraw(false)}>
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="h-14 text-lg border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-2xl"
                                onClick={() => setShowWithdraw(true)}
                                disabled={saved <= 0}
                            >
                                <Minus className="w-5 h-5 mr-2" />
                                משוך
                            </Button>
                            <Button
                                className={cn("h-14 text-lg text-white font-bold rounded-2xl shadow-lg border-none hover:opacity-90 transition-transform active:scale-95",
                                    isCoolingOff ? "bg-slate-700 text-slate-400" : "bg-white text-black"
                                )}
                                onClick={() => setShowDeposit(true)}
                                disabled={isFullyFunded}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {isCoolingOff ? "בהקפאה" : "הפקד"}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Purchase / Status Bar */}
            {isFullyFunded && !showDeposit && !showWithdraw && (
                <div className="animate-in zoom-in duration-300 space-y-2 relative z-20">
                    {isCoolingOff ? (
                        <div className="flex flex-col gap-3">
                            <Button
                                disabled
                                className="w-full bg-blue-500/20 text-blue-200 border border-blue-500/30 h-16 cursor-not-allowed rounded-2xl text-lg relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                <Clock className="w-5 h-5 mr-2 animate-pulse" />
                                מצננים התלהבות ({hoursLeft} שעות)
                            </Button>
                            <p className="text-xs text-blue-200/50 text-center font-medium">
                                קניות גדולות דורשות לילה של מחשבה.
                                <button
                                    onClick={() => {
                                        triggerHaptic();
                                        onPurchase(item);
                                    }}
                                    className="underline ml-1 hover:text-white transition-colors"
                                >
                                    אני בטוח/ה
                                </button>
                            </p>
                        </div>
                    ) : (
                        <Button
                            onClick={() => {
                                triggerHaptic();
                                onPurchase(item);
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold h-16 text-xl rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.7)] transition-all hover:scale-[1.02]"
                        >
                            קניתי את זה! 🎉
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
