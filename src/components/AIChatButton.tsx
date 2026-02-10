"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Sparkles, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from "framer-motion";

export const AIChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<any>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bubbleMessage, setBubbleMessage] = useState<string | null>(null);
    const supabaseRef = useRef(createClientComponentClient());
    const supabase = supabaseRef.current;

    useEffect(() => {
        // Proactive Nudge Logic
        const timer = setTimeout(() => {
            const msgs = [
                "זיהיתי חיסכון יפה החודש! רוצה שננתח אותו?",
                "היי, איך הולך עם היעד לטסלה?",
                "ראיתי הוצאה חריגה אתמול, נדבר על זה?",
                "יש לך ₪400 פנויים, אולי נשקיע אותם?"
            ];
            setBubbleMessage(msgs[Math.floor(Math.random() * msgs.length)]);
        }, 5000); // 5 seconds delay before showing

        return () => clearTimeout(timer);
    }, []);

    // Auto-hide bubble after 8 seconds of appearing
    useEffect(() => {
        if (!bubbleMessage) return;

        const hideTimer = setTimeout(() => {
            setBubbleMessage(null);
        }, 8000);

        return () => clearTimeout(hideTimer);
    }, [bubbleMessage]);

    const fetchContext = async () => {
        setLoading(true);
        setError(false);
        try {
            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .limit(5)
                .order('date', { ascending: false });

            if (txError) throw txError;

            const { data: subs, error: subError } = await supabase.from('subscriptions').select('amount');
            if (subError) throw subError;

            const { data: profile } = await supabase.from('profiles').select('budget').single();

            // Calculate quick balance for context
            const totalFixed = subs?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;

            setContext({
                recentTransactions: txs,
                fixedExpenses: totalFixed,
                budget: profile?.budget || 20000,
                balance: "Dynamic" // This could be calculated if needed, but Context usually enough
            });
        } catch (err) {
            console.error("Failed to fetch context", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && !context) {
            fetchContext();
            setBubbleMessage(null); // Clear bubble when opened
        }
    }, [isOpen]);

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">

                {/* Proactive Bubble */}
                <AnimatePresence>
                    {bubbleMessage && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            className="bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-tr-none shadow-xl border border-white/20 max-w-[200px] relative text-sm font-medium mb-2 mx-1 cursor-pointer"
                            onClick={() => setIsOpen(true)}
                        >
                            {bubbleMessage}
                            <button
                                onClick={(e) => { e.stopPropagation(); setBubbleMessage(null); }}
                                className="absolute -top-2 -left-2 bg-slate-200 rounded-full p-0.5 hover:bg-red-100 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {/* Triangle */}
                            <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-white border-r-[10px] border-r-transparent" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-white/20 hover:scale-110 active:scale-95 transition-all p-0 relative overflow-hidden group animate-bounce-slow"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Bot className="w-7 h-7 text-white relative z-10" />
                    <Sparkles className="w-3 h-3 text-yellow-300 absolute top-3 right-3 animate-pulse" />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md h-[80vh] p-0 gap-0 bg-slate-950/90 border-white/10 overflow-hidden" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">AI Chat Helper</DialogTitle>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-4">
                            <Bot className="w-12 h-12 animate-bounce text-blue-400" />
                            <p>מכין את ההקשר הפיננסי...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-4 p-6 text-center">
                            <X className="w-12 h-12 text-red-400" />
                            <p>אופס, לא הצלחתי לטעון את הנתונים.</p>
                            <Button onClick={fetchContext} variant="outline" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                נסה שוב
                            </Button>
                        </div>
                    ) : (
                        <ChatInterface context={context} onClose={() => setIsOpen(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
