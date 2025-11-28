import React, { memo } from 'react';
import { ExternalLink, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";
import { triggerHaptic } from "@/utils/haptics";

interface WishlistGridProps {
    items: WishlistItem[];
    onDelete: (id: string) => void;
    onCheckOracle: (item: WishlistItem) => void;
}

export const WishlistGrid = memo(({ items, onDelete, onCheckOracle }: WishlistGridProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="glass p-5 rounded-[2rem] flex flex-col justify-between gap-4 group relative overflow-hidden border border-white/10 shadow-xl shadow-black/5 active:scale-[0.98] transition-all duration-300 w-full"
                >
                    {/* Hover Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Delete Button */}
                    <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic();
                                onDelete(item.id);
                            }}
                            className="p-3 rounded-full bg-black/20 hover:bg-red-500/20 text-white/50 hover:text-red-400 backdrop-blur-md transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center text-center gap-2 mt-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-1 shadow-inner border border-white/5">
                            <Sparkles className="w-6 h-6 text-yellow-200/70" />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-center gap-2">
                                <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
                                {item.link && (
                                    <a href={item.link} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white transition-colors">
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                            <p className="text-base font-medium text-white/60">₪{item.price.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Progress Bar (Visual Only for now) */}
                    <div className="w-full space-y-1.5">
                        <div className="flex justify-between text-[10px] text-white/40 px-1">
                            <span>התקדמות</span>
                            <span>0%</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 w-[5%]" />
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => {
                            triggerHaptic();
                            onCheckOracle(item);
                        }}
                        className="w-full bg-white text-black hover:bg-white/90 font-bold h-10 rounded-xl text-sm shadow-lg shadow-white/5"
                    >
                        האם אפשר?
                    </Button>
                </div>
            ))}
        </div>
    );
});

WishlistGrid.displayName = "WishlistGrid";
