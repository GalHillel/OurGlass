import { useState, useCallback } from 'react';

interface UseDeepFreezeProps {
    threshold?: number;
    onFreezeConfirmed: () => void;
    onBuyAnywayConfirmed: () => void;
}

export const useDeepFreeze = ({
    threshold = 500,
    onFreezeConfirmed,
    onBuyAnywayConfirmed
}: UseDeepFreezeProps) => {
    const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);
    const [pendingAmount, setPendingAmount] = useState<number>(0);
    const [pendingItemName, setPendingItemName] = useState<string>("");

    const checkTransaction = useCallback((amount: number, itemName: string) => {
        if (amount >= threshold) {
            setPendingAmount(amount);
            setPendingItemName(itemName);
            setIsFreezeDialogOpen(true);
            return true; // Intercepted
        }
        return false; // Safe to proceed
    }, [threshold]);

    const handleFreeze = useCallback(() => {
        setIsFreezeDialogOpen(false);
        onFreezeConfirmed();
    }, [onFreezeConfirmed]);

    const handleBuyAnyway = useCallback(() => {
        setIsFreezeDialogOpen(false);
        onBuyAnywayConfirmed();
    }, [onBuyAnywayConfirmed]);

    return {
        isFreezeDialogOpen,
        pendingAmount,
        pendingItemName,
        checkTransaction,
        handleFreeze,
        handleBuyAnyway,
        closeDialog: () => setIsFreezeDialogOpen(false)
    };
};
