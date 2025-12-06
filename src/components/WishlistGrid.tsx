
import React, { memo } from 'react';
import { WishlistCard } from "./WishlistCard";
import { WishlistItem } from "@/types";

interface WishlistGridProps {
    items: WishlistItem[];
    onDelete: (id: string) => void;
    onDeposit: (item: WishlistItem, amount: number) => Promise<void> | void;
    onWithdraw: (item: WishlistItem, amount: number) => Promise<void> | void;
    onPurchase: (item: WishlistItem) => Promise<void> | void;
}

export const WishlistGrid = memo(({ items, onDelete, onDeposit, onWithdraw, onPurchase }: WishlistGridProps) => {
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {items.map((item, index) => (
                <WishlistCard
                    key={item.id}
                    item={item}
                    onDelete={onDelete}
                    onDeposit={onDeposit}
                    onWithdraw={onWithdraw}
                    onPurchase={onPurchase}
                />
            ))}
        </div>
    );
});

WishlistGrid.displayName = "WishlistGrid";
