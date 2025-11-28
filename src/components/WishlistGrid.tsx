import React, { memo } from 'react';
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/types";

interface WishlistGridProps {
    items: WishlistItem[];
    onDelete: (id: string) => void;
    onCheckOracle: (item: WishlistItem) => void;
}

export const WishlistGrid = memo(({ items, onDelete, onCheckOracle }: WishlistGridProps) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="glass p-4 rounded-3xl flex flex-col justify-between gap-4 group relative overflow-hidden border border-white/10 shadow-xl shadow-black/5 active:scale-95 transition-transform duration-200"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                            }}
                            className="p-2 rounded-full bg-black/20 hover:bg-red-500/20 text-white/50 hover:text-red-400 backdrop-blur-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-start mb-2 pl-8">
                            <h3 className="font-bold text-white leading-tight">{item.name}</h3>
                            {item.link && (
                                <a href={item.link} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white/90">₪{item.price}</p>
                    </div>

                    <Button
                        onClick={() => onCheckOracle(item)}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs h-8 rounded-xl active:scale-95 transition-transform"
                    >
                        האם אפשר?
                    </Button>
                </div>
            ))}
        </div>
    );
});

WishlistGrid.displayName = "WishlistGrid";
