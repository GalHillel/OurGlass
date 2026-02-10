"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ThermometerSnowflake, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeepFreezeDialogProps {
    isOpen: boolean;
    amount: number;
    itemName: string;
    onFreeze: () => void;
    onBuyAnyway: () => void;
    onCancel: () => void;
}

export const DeepFreezeDialog = ({ isOpen, amount, itemName, onFreeze, onBuyAnyway, onCancel }: DeepFreezeDialogProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onCancel}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900 border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
                    >
                        {/* Ice Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-blue-600/5 pointer-events-none" />

                        <div className="p-6 relative z-10 text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                <ThermometerSnowflake className="w-10 h-10 text-cyan-300" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white leading-tight">
                                    רגע, זה ₪{amount}! 🥶
                                </h2>
                                <p className="text-slate-300 text-sm leading-relaxed px-2">
                                    זו הוצאה גדולה. מחקרים מראים ש-40% מהקניות האימפולסיביות מיותרות.
                                    <br />
                                    אולי נקפיא אותה ל-24 שעות?
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button
                                    onClick={onFreeze}
                                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-900/40 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    <ThermometerSnowflake className="w-5 h-5 ml-2" />
                                    כן, תקפיא לי (Deep Freeze)
                                </Button>

                                <Button
                                    onClick={onBuyAnyway}
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-white hover:bg-white/5 h-12 rounded-xl text-sm"
                                >
                                    לא, אני חייב את זה עכשיו
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
