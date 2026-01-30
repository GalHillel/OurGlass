"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { WishlistItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Minus, Plus, Check, X, Banknote, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface WishlistActionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItem | null;
    mode: 'deposit' | 'withdraw';
    onConfirm: (item: WishlistItem, amount: number) => void;
}

export const WishlistActionDrawer = ({ isOpen, onClose, item, mode, onConfirm }: WishlistActionDrawerProps) => {
    const [amount, setAmount] = useState<number>(0);
    const [sliderValue, setSliderValue] = useState([0]);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setAmount(0);
            setSliderValue([0]);
        }
    }, [isOpen, item]);

    if (!item) return null;

    const saved = item.saved_amount || 0;
    const remaining = Math.max(0, item.price - saved);

    // Limits
    const maxAmount = mode === 'deposit' ? remaining : saved;

    // Handle presets
    const addAmount = (val: number) => {
        triggerHaptic();
        const newAmount = Math.min(amount + val, maxAmount);
        setAmount(newAmount);
        setSliderValue([newAmount]);
    };

    // Handle Slider
    const handleSliderChange = (vals: number[]) => {
        setAmount(vals[0]);
        setSliderValue(vals);
    };

    // Handle Confirm
    const handleConfirm = () => {
        if (amount <= 0) return;
        triggerHaptic();
        onConfirm(item, amount);
        onClose();
    };

    const isDeposit = mode === 'deposit';
    const accentColor = isDeposit ? "text-purple-400" : "text-blue-400";
    const bgColor = isDeposit ? "bg-purple-600" : "bg-blue-600";
    const gradient = isDeposit ? "from-purple-600 to-pink-600" : "from-blue-600 to-cyan-600";

    // Visualize Progress Preview
    const potentialSaved = isDeposit ? saved + amount : saved - amount;
    const progress = Math.min((potentialSaved / item.price) * 100, 100);

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                <Drawer.Content className="bg-slate-950 flex flex-col rounded-t-[2rem] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 outline-none">
                    <div className="p-4 bg-slate-900/50 rounded-t-[2rem] flex-1 flex flex-col gap-6 relative overflow-hidden">
                        {/* Pull Handle */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-2" />

                        {/* Decoration Background */}
                        <div className={cn("absolute top-0 left-0 right-0 h-48 bg-gradient-to-b opacity-20 pointer-events-none", isDeposit ? "from-purple-900" : "from-blue-900")} />

                        {/* Header */}
                        <div className="text-center relative z-10">
                            <Drawer.Title className="text-2xl font-bold text-white mb-1">{isDeposit ? "הפקדה לחלום" : "משיכה מהחיסכון"}</Drawer.Title>
                            <Drawer.Description className="text-white/50 text-sm">{item.name}</Drawer.Description>
                        </div>

                        {/* Big Number Input */}
                        <div className="flex flex-col items-center justify-center py-4 relative z-10">
                            <div className="flex items-center gap-1">
                                <span className="text-4xl text-white/40">₪</span>
                                <input
                                    type="number"
                                    value={amount === 0 ? '' : amount}
                                    onChange={(e) => {
                                        const val = Math.min(Number(e.target.value), maxAmount);
                                        setAmount(val);
                                        setSliderValue([val]);
                                    }}
                                    placeholder="0"
                                    autoFocus
                                    className="bg-transparent text-center text-6xl font-black text-white outline-none w-48 placeholder:text-white/10"
                                    style={{ fontSize: 'clamp(3rem, 15vw, 4rem)' }}
                                />
                            </div>
                            <p className="text-sm text-white/40 mt-2">
                                {isDeposit ? `חסרים ₪${remaining.toLocaleString()}` : `זמינים למשיכה ₪${saved.toLocaleString()}`}
                            </p>
                        </div>

                        {/* Slider */}
                        <div className="px-6 relative z-10 w-full max-w-sm mx-auto">
                            <Slider
                                value={sliderValue}
                                min={0}
                                max={maxAmount}
                                step={10}
                                onValueChange={handleSliderChange}
                                className="py-4 cursor-grab active:cursor-grabbing"
                            />
                        </div>

                        {/* Quick Chips */}
                        <div className="flex justify-center gap-3 relative z-10 flex-wrap">
                            {[50, 100, 200].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => addAmount(val)}
                                    disabled={amount + val > maxAmount}
                                    className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 disabled:opacity-30 transition-all active:scale-95"
                                >
                                    +₪{val}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setAmount(maxAmount);
                                    setSliderValue([maxAmount]);
                                    triggerHaptic();
                                }}
                                className={cn("px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 transition-all active:scale-95", accentColor)}
                            >
                                מקסימום
                            </button>
                        </div>

                        {/* Visual Preview */}
                        <div className="mt-auto px-4 pb-4">
                            <div className="bg-slate-900 rounded-2xl p-4 border border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs text-white/40">מצב החיסכון</span>
                                    <span className={cn("text-lg font-bold transition-colors", accentColor)}>
                                        {progress.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                    {/* Previous Progress */}
                                    <div
                                        className="absolute inset-y-0 left-0 bg-white/20 z-10"
                                        style={{ width: `${Math.min((saved / item.price) * 100, 100)}%` }}
                                    />
                                    {/* Forecast Progress */}
                                    <div
                                        className={cn("absolute inset-y-0 left-0 transition-all duration-300 z-0", bgColor)}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="px-4 pb-8">
                            <Button
                                onClick={handleConfirm}
                                disabled={amount <= 0}
                                className={cn(
                                    "w-full h-16 text-xl font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                                    `bg-gradient-to-r ${gradient}`
                                )}
                            >
                                {isDeposit ? (
                                    <>
                                        <Sparkles className="w-6 h-6 mr-2 animate-pulse" />
                                        הפקד ₪{amount}
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="w-6 h-6 mr-2" />
                                        משוך ₪{amount}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
