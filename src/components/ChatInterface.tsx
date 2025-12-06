"use client";

// import { useChat } from 'ai/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, X } from "lucide-react";
// import { useEffect, useRef } from 'react';

interface ChatInterfaceProps {
    context: any;
    onClose: () => void;
}

export const ChatInterface = ({ context, onClose }: ChatInterfaceProps) => {
    // Disabled for deployment
    /*
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        body: {
            context
        }
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);
    */

    return (
        <div className="flex flex-col h-full bg-slate-900/95 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">הפסיכולוגית הפיננסית</h3>
                        <p className="text-xs text-white/40">בקרוב...</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Placeholder Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                    <Bot className="w-10 h-10 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">בקרוב!</h3>
                    <p className="text-white/60 mt-2 text-sm leading-relaxed">
                        הפסיכולוגית הפיננסית עדיין בהתלמדות.
                        <br />
                        היא תצטרף אליכם בגרסה הבאה כדי לעזור לכם לנהל את התקציב בחוכמה.
                    </p>
                </div>
            </div>

            {/* Input (Disabled) */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-md opacity-50 pointer-events-none">
                <div className="flex gap-2">
                    <Input
                        placeholder="הצ'אט אינו זמין כרגע..."
                        className="bg-white/5 border-white/10 text-white"
                        disabled
                    />
                    <Button size="icon" disabled className="bg-blue-500/50 shrink-0">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
