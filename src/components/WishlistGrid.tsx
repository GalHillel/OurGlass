import React, { memo } from 'react';
import { WishlistCard } from "./WishlistCard";
import { WishlistItem } from "@/types";

interface WishlistGridProps {
    items: WishlistItem[];
    onDelete: (id: string) => void;
    onDeposit: (item: WishlistItem, amount: number) => void;
    onWithdraw: (item: WishlistItem, amount: number) => void;
    onPurchase: (item: WishlistItem) => void;
}

export const WishlistGrid = memo(({ items, onDelete, onDeposit, onWithdraw, onPurchase }: WishlistGridProps) => {
    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-none mx-auto px-4">
            {items.map((item) => (
                <div key={item.id} className="w-full">
                    <WishlistCard
                        item={item}
                        onDelete={onDelete}
                        onDeposit={onDeposit}
                        onWithdraw={onWithdraw}
                        onPurchase={onPurchase}
                    />
                </div>
            ))}
        </div>
    );
});

WishlistGrid.displayName = "WishlistGrid";
