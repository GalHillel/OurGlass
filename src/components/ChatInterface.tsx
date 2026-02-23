"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { Button } from "@/components/ui/button";
import { Send, Sparkles, X, ArrowDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialContext, Transaction } from "@/types";

interface ChatInterfaceProps {
    context: FinancialContext;
    onClose: () => void;
}

// Generate dynamic suggested questions from actual financial context
function generateSuggestedQuestions(context: FinancialContext): string[] {
    if (!context) return [];

    const { recentTransactions, subscriptions, liabilities, budget, wishlist, wealthSnapshot } = context;

    const totalSpent = recentTransactions?.reduce((s: number, t: Transaction) => s + Number(t.amount), 0) || 0;
    const budgetPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    // Category breakdown for targeted questions
    const cats: Record<string, number> = {};
    recentTransactions?.forEach((t: Transaction) => {
        const cat = t.category || 'אחר';
        cats[cat] = (cats[cat] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    const topCat = sorted[0];

    const questions: string[] = [];

    // Budget-based questions
    if (budgetPct >= 80) questions.push("איך אני יכול לחסוך עד סוף החודש?");
    if (budgetPct <= 30 && totalSpent > 0) questions.push("יש לי חיסכון יפה — מה כדאי לעשות?");

    // Category-based
    if (topCat) questions.push(`נתח את ההוצאות שלי על ${topCat[0]} החודש`);

    // Subscription insights
    if (subscriptions?.length > 3) questions.push(`יש לי ${subscriptions.length} מנויים — איפה אפשר לחסוך?`);

    // Wishlist dreaming
    if (wishlist?.length > 0) questions.push("כמה זמן ייקח לי להגשים את המשאלה הראשונה?");

    // Liabilities
    if (liabilities?.length > 0) questions.push("מתי אסיים לסגור את ההלוואות שלי?");

    // Wealth
    if (wealthSnapshot) questions.push("תן סיכום של מצב השווי שלי");

    // Fallback
    if (questions.length === 0) questions.push("תן לי סיכום פיננסי של החודש");

    return questions.slice(0, 3);
}

export const ChatInterface = ({ context, onClose }: ChatInterfaceProps) => {
    const [initialMessages] = useState<UIMessage[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('ai_chat_history');
        if (saved) {
            try { return JSON.parse(saved); } catch { return []; }
        }
        return [];
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) return null;
    return <ChatInterfaceInner initialMessages={initialMessages} context={context} onClose={onClose} />;
};

const ChatInterfaceInner = ({ initialMessages, context, onClose }: { initialMessages: UIMessage[], context: FinancialContext, onClose: () => void }) => {
    // Context is used globally by the AI prompt
    const { messages, setMessages, sendMessage, status } = useChat();
    const [input, setInput] = useState('');
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const isLoading = status === 'streaming' || status === 'submitted';
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestedQuestions = useMemo(() => generateSuggestedQuestions(context), [context]);

    useEffect(() => {
        if (initialMessages.length > 0 && messages.length === 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, messages.length, setMessages]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('ai_chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    // Track scroll position for "scroll to bottom" button
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    // Auto-grow textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    const handleSubmit = (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;
        sendMessage({ text: msg }, { body: { context } });
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem('ai_chat_history');
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0f1a] relative overflow-hidden">
            {/* Premium Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0c0f1a]/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.06]">
                        <Sparkles className="w-4.5 h-4.5 text-violet-400" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0c0f1a]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-[15px] leading-tight">רועי</h3>
                        <p className="text-[11px] text-emerald-400/80 font-medium">פסיכולוג פיננסי • AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                        <Button variant="ghost" size="icon" onClick={clearHistory} className="w-8 h-8 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="w-8 h-8 text-white/30 hover:text-white hover:bg-white/5 rounded-xl">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scroll-smooth"
                style={{ scrollbarWidth: 'none' }}
            >
                {/* Empty State with Dynamic Suggestions */}
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center px-4"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center mb-4 border border-white/[0.04]">
                            <Sparkles className="w-7 h-7 text-violet-400/80" />
                        </div>
                        <h4 className="text-white/90 font-semibold text-base mb-1">היי, אני רועי 👋</h4>
                        <p className="text-white/40 text-[13px] leading-relaxed mb-6 max-w-[260px]">
                            הפסיכולוג הפיננסי שלך. שאל אותי כל שאלה על ההוצאות, החיסכון, או התקציב שלך.
                        </p>

                        {/* Dynamic Suggested Questions */}
                        <div className="w-full space-y-2">
                            {suggestedQuestions.map((q, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    onClick={() => handleSubmit(q)}
                                    className="w-full text-right px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-[13px] text-white/70 hover:text-white/90 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
                                    <span className="flex-1">{q}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Message Bubbles */}
                <AnimatePresence initial={false}>
                    {messages.map((m: UIMessage) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${m.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/10'
                                    : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10'
                                    }`}
                            >
                                {m.role === 'user' ? (
                                    <span className="text-xs">👤</span>
                                ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                )}
                            </div>

                            {/* Bubble */}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${m.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-md shadow-[0_2px_12px_rgba(37,99,235,0.25)]'
                                    : 'bg-white/[0.06] text-white/90 rounded-tl-md border border-white/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.15)]'
                                    }`}
                            >
                                {m.parts?.filter((p) => p.type === 'text').map((p, i) => (
                                    <span key={i} className="whitespace-pre-wrap">{(p as { text: string }).text}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2.5"
                        >
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-violet-500/10">
                                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <div className="bg-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3 border border-white/[0.06]">
                                <div className="flex gap-1.5 items-center h-5">
                                    {[0, 1, 2].map(i => (
                                        <motion.span
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-violet-400/70"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scroll to bottom FAB */}
            <AnimatePresence>
                {showScrollBtn && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
                    >
                        <ArrowDown className="w-3.5 h-3.5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Premium Input Area */}
            <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0c0f1a]/80 backdrop-blur-xl">
                <div className="flex items-end gap-2 bg-white/[0.04] rounded-2xl border border-white/[0.06] px-3.5 py-2 focus-within:border-violet-500/30 focus-within:bg-white/[0.06] transition-all duration-200">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="שאל את רועי..."
                        rows={1}
                        className="flex-1 bg-transparent text-white text-[14px] text-right placeholder:text-white/25 resize-none outline-none min-h-[24px] max-h-[120px] leading-relaxed py-0.5"
                        style={{ scrollbarWidth: 'none' }}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isLoading}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(124,58,237,0.3)] transition-opacity"
                    >
                        <Send className="w-3.5 h-3.5 text-white" />
                    </motion.button>
                </div>
                <p className="text-[10px] text-white/15 text-center mt-1.5">Powered by Gemini AI</p>
            </div>
        </div>
    );
};
