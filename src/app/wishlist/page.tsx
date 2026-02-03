"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { WishlistCard } from "@/components/WishlistCard";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { DEMO_WISHLIST } from "@/lib/demoData";
import { SwipeableRow } from "@/components/SwipeableRow";

export default function WishlistPage() {
    const [items] = useState(DEMO_WISHLIST);

    const handleAdd = () => {
        toast.info("מצב דמו: לא ניתן להוסיף פריטים", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleDelete = () => {
        toast.info("מצב דמו: לא ניתן למחוק פריטים", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleAction = () => {
        toast.info("מצב דמו: לא ניתן לבצע פעולות", {
            description: "זוהי גרסת הדגמה עם נתונים קבועים"
        });
    };

    const handleClick = () => {
        toast.info("מצב דמו", {
            description: "זוהי גרסת הדגמה אינטראקטיבית"
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full mx-auto pt-8 pb-32 px-4 shadow-none">
            <AppHeader
                title="רשימת"
                subtitle="משאלות"
                icon={Sparkles}
                iconColor="text-purple-400"
                titleColor="text-purple-500"
            />
            <div className="h-4" />

            <div className="w-full space-y-4">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                            <p>הרשימה ריקה. תתחילו לחלום!</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <SwipeableRow
                                key={item.id}
                                onDelete={handleDelete}
                                deleteMessage="לוותר על החלום הזה?"
                            >
                                <WishlistCard
                                    item={item}
                                    onClick={handleClick}
                                    onAction={handleAction}
                                />
                            </SwipeableRow>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-purple-600 text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] flex items-center justify-center z-50 border border-white/20"
            >
                <Plus className="w-8 h-8" />
            </motion.button>
        </div>
    );
}
