"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const AIChatButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<any>(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (isOpen) {
            // Fetch context when opening
            const fetchContext = async () => {
                const { data: txs } = await supabase.from('transactions').select('*').limit(10).order('date', { ascending: false });
                const { data: subs } = await supabase.from('subscriptions').select('amount');

                // Calculate quick balance for context (simplified)
                const totalFixed = subs?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                // Note: accurate balance needs user profile budget, here we might just pass transactions

                setContext({
                    recentTransactions: txs,
                    fixedExpenses: totalFixed,
                    // We can add more context if needed
                    balance: "Dynamic" // The AI will just work with what it has
                });
            };
            fetchContext();
        }
    }, [isOpen, supabase]);

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50 animate-bounce-slow">
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-white/20 hover:scale-105 transition-transform p-0 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Bot className="w-7 h-7 text-white relative z-10" />
                    <Sparkles className="w-3 h-3 text-yellow-300 absolute top-3 right-3 animate-pulse" />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md h-[80vh] p-0 gap-0 bg-slate-950/90 border-white/10 overflow-hidden" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">AI Chat Helper</DialogTitle>
                    <ChatInterface context={context} onClose={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};
