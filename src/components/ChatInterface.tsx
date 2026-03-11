"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { type UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Send, Sparkles, X, ArrowDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialContext, Transaction } from "@/types";
import { useAppStore } from "@/stores/appStore";
import { hapticConfirm } from "@/utils/haptics";
import { PAYERS } from "@/lib/constants";

interface ChatInterfaceProps {
    context: FinancialContext;
    onClose: () => void;
}

// Generate dynamic suggested questions from actual financial context
function generateSuggestedQuestions(context: FinancialContext): string[] {
    if (!context) return [];

    const transactions = context.transactions || context.recentTransactions || [];
    const { subscriptions, liabilities, budget, wishlist, wealthSnapshot } = context;

    const totalSpent = transactions?.reduce((s: number, t: Transaction) => {
        if ((t.type ?? 'expense') !== 'expense') return s;
        return s + Number(t.amount);
    }, 0) || 0;
    const budgetPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    // Category breakdown for targeted questions
    const cats: Record<string, number> = {};
    transactions?.forEach((t: Transaction) => {
        const cat = t.category || 'אחר';
        cats[cat] = (cats[cat] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    const topCat = sorted[0];

    const questions: string[] = [];

    // Budget-based questions
    if (budgetPct >= 80) questions.push(`איך ${PAYERS.HIM} יכול לחסוך עד סוף החודש?`);
    if (budgetPct <= 30 && totalSpent > 0) questions.push(`יש ל-${PAYERS.HIM} חיסכון יפה — מה כדאי לעשות?`);

    // Category-based
    if (topCat) questions.push(`נתח את ההוצאות של ${PAYERS.HIM} על ${topCat[0]} החודש`);

    // Subscription insights
    if (subscriptions?.length > 3) questions.push(`יש ל-${PAYERS.HIM} ${subscriptions.length} מנויים — איפה אפשר לחסוך?`);

    // Wishlist dreaming
    if (wishlist?.length > 0) questions.push(`כמה זמן ייקח ל-${PAYERS.HIM} להגשים את המשאלה הראשונה?`);

    // Liabilities
    if (liabilities?.length > 0) questions.push(`מתי ${PAYERS.HIM} יסיים לסגור את ההלוואות?`);

    // Wealth
    if (wealthSnapshot) questions.push(`תן סיכום של מצב השווי של ${PAYERS.HIM}`);

    // Fallback
    if (questions.length === 0) questions.push("תן לי סיכום פיננסי של החודש");

    return questions.slice(0, 3);
}

export const ChatInterface = ({ context, onClose }: ChatInterfaceProps) => {
    const { appIdentity, coupleId } = useAppStore();
    const historyKey = `ai_chat_history_${coupleId || 'no_couple'}_${appIdentity || 'default'}`;

    // 1. Unified state for chatId to force fresh AI sessions
    const [chatId, setChatId] = useState(() => crypto.randomUUID());

    // 2. Load history ONCE on initialization
    const [initialMessages] = useState<UIMessage[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem(historyKey);
        if (saved) {
            try { return JSON.parse(saved); } catch { return []; }
        }
        return [];
    });

    const router = useRouter();

    const { messages, setMessages, sendMessage, status, stop } = useChat({
        id: chatId,
        onToolCall({ toolCall }) {
            if (toolCall.toolName === 'MapsToPage' && 'args' in toolCall) {
                const { path } = (toolCall as { args: { path: string } }).args;
                hapticConfirm();
                router.push(path);
            }
        },
    });

    const [input, setInput] = useState('');
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const hasHydrated = useRef(false);

    const isLoading = status === 'streaming' || status === 'submitted';
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const suggestedQuestions = useMemo(() => generateSuggestedQuestions(context), [context]);

    // Track hydration
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Initial history load
    useEffect(() => {
        if (!hasHydrated.current && initialMessages.length > 0) {
            setMessages(initialMessages);
            hasHydrated.current = true;
        }
    }, [initialMessages, setMessages]);

    // Save history to localStorage whenever messages change
    useEffect(() => {
        if (isLoaded) {
            if (messages.length > 0) {
                localStorage.setItem(historyKey, JSON.stringify(messages));
            } else {
                localStorage.removeItem(historyKey);
            }
        }
    }, [messages, isLoaded, historyKey]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    const handleSubmit = (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;
        sendMessage({ text: msg }, { body: { context, chatId } });
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
        hapticConfirm();
        stop();
        setMessages([]);
        localStorage.removeItem(historyKey);
        setChatId(crypto.randomUUID()); // Force new session ID
    };

    if (!isLoaded) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col h-full bg-[#0c0f1a] relative overflow-hidden"
            dir="rtl"
        >
            {/* Premium Header - Analytical Engine Style */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl">
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.08] shadow-inner">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c0f1a] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-[16px] tracking-tight leading-none mb-1">רועי</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.15em]">מנוע ניתוח פיננסי</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <Button aria-label="Clear" variant="ghost" size="icon" onClick={clearHistory} className="w-9 h-9 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                    <Button aria-label="Close" variant="ghost" size="icon" onClick={onClose} className="w-9 h-9 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
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
                {/* Empty State - Professional Executive Assistant */}
                {messages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center px-6"
                    >
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center mb-6 border border-white/[0.06] shadow-2xl">
                            <Sparkles className="w-8 h-8 text-indigo-400/80" />
                        </div>
                        <h4 className="text-white font-black text-xl mb-2 tracking-tight">ערב טוב, במה אוכל לעזור?</h4>
                        <p className="text-white/30 text-[13px] leading-relaxed mb-10 max-w-[280px] font-medium">
                            אני כאן כדי לנתח את הנתונים הפיננסיים שלכם ולספק תובנות אסטרטגיות לניהול ההוצאות והחיסכון.
                        </p>

                        <div className="w-full space-y-3">
                            {suggestedQuestions.map((q, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08 }}
                                    onClick={() => handleSubmit(q)}
                                    className="w-full text-right px-5 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-white/[0.1] text-[13px] font-bold text-white/50 hover:text-white transition-all duration-300 flex items-center gap-3 group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 group-hover:bg-indigo-400 transition-colors" />
                                    <span className="flex-1">{q}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Message Bubbles - Premium Glass Redesign */}
                <AnimatePresence initial={false}>
                    {messages.map((m: UIMessage) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-[1.75rem] px-5 py-4 text-[14px] leading-relaxed shadow-2xl relative group ${m.role === 'user'
                                    ? 'bg-indigo-600/90 text-white rounded-tr-sm border border-white/10'
                                    : 'bg-white/[0.05] backdrop-blur-xl text-white/90 rounded-tl-sm border border-white/[0.08] text-right'
                                    }`}
                            >
                                {m.role !== 'user' && (
                                    <div className="flex items-center gap-2 mb-2 opacity-30">
                                        <Sparkles className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">רועי • ניתוח חכם</span>
                                    </div>
                                )}
                                <div className="font-medium">
                                    {(m.parts ?? []).map((part, partIndex) => {
                                        if (part.type === 'text') {
                                            return (
                                                <span key={partIndex} className="whitespace-pre-wrap">
                                                    {part.text}
                                                </span>
                                            );
                                        }
                                        if (part.type === 'tool-call') {
                                            return (
                                                <motion.div
                                                    key={partIndex}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl w-fit backdrop-blur-md shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                                                >
                                                    <div className="relative">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping absolute inset-0" />
                                                        <div className="w-2 h-2 rounded-full bg-indigo-500 relative" />
                                                    </div>
                                                    <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                                                        ⚡ מבצע פעולה...
                                                    </span>
                                                </motion.div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
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
            <div className="px-6 py-5 border-t border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl">
                <div className="flex items-end gap-3 bg-white/[0.03] rounded-[1.5rem] border border-white/[0.06] px-4 py-3 focus-within:border-indigo-500/40 focus-within:bg-white/[0.06] transition-all duration-300 shadow-inner">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="איך אוכל לסייע?"
                        rows={1}
                        className="flex-1 bg-transparent text-white text-[14px] text-right placeholder:text-white/20 resize-none outline-none min-h-[24px] max-h-[150px] leading-relaxed py-0.5 font-medium"
                        style={{ scrollbarWidth: 'none' }}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isLoading}
                        className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-all hover:bg-indigo-500"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </motion.button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-3 opacity-20 hover:opacity-40 transition-opacity">
                    <div className="h-[1px] w-4 bg-white" />
                    <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">OurGlass Quantum AI</p>
                    <div className="h-[1px] w-4 bg-white" />
                </div>
            </div>
        </motion.div>
    );
};
