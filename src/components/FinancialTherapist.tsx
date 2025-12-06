"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
    id: string;
    text: string;
    sender: "bot" | "user";
}

export const FinancialTherapist = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initial greeting logic
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setTimeout(() => {
                addBotMessage("היי! אני המטפל הפיננסי שלכם. 🤖");
            }, 500);

            setTimeout(() => {
                // Mock analysis logic
                addBotMessage("שמתי לב שהוצאתם הרבה על מסעדות השבוע... אולי נבשל היום? 🍝");
            }, 1500);
        }
    }, [isOpen]);

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: "bot" }]);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: "user" };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");

        // Simple rule-based response
        setTimeout(() => {
            if (inputValue.includes("כסף") || inputValue.includes("מצב")) {
                addBotMessage("המצב שלכם משתפר! חסכתם 15% יותר מהחודש שעבר. תמשיכו ככה! 🚀");
            } else if (inputValue.includes("עצוב") || inputValue.includes("קשה")) {
                addBotMessage("זה בסדר, כסף זה נושא מלחיץ. בואו נסתכל על חצי הכוס המלאה - ה'קיר' שלכם מתמלא יפה!");
            } else {
                addBotMessage("אני עדיין לומד... אבל אני כאן כדי להקשיב.");
            }
        }, 1000);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg flex items-center justify-center border border-white/20"
            >
                <Bot className="w-8 h-8" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-24 right-4 z-50 w-80 h-96 glass rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/20"
                    >
                        {/* Header */}
                        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-indigo-300" />
                                </div>
                                <span className="font-bold text-white text-sm">המטפל הפיננסי</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === "user"
                                            ? "bg-indigo-500 text-white rounded-br-none"
                                            : "bg-white/10 text-white rounded-bl-none"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="כתוב הודעה..."
                                className="bg-transparent border-none text-white placeholder:text-white/30 focus-visible:ring-0"
                            />
                            <Button size="icon" onClick={handleSend} className="bg-indigo-500 hover:bg-indigo-600 rounded-full w-10 h-10 shrink-0">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
