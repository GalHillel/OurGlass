import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    /** Currently selected billing period month offset (0 = current) */
    monthOffset: number;
    setMonthOffset: (offset: number) => void;

    /** Transaction drawer state */
    isAddTransactionOpen: boolean;
    openAddTransaction: () => void;
    closeAddTransaction: () => void;

    /** Active bottom nav tab */
    activeTab: string;
    setActiveTab: (tab: string) => void;

    /** Deep freeze global toggle */
    deepFreezeEnabled: boolean;
    toggleDeepFreeze: () => void;

    /** Couple info cache */
    coupleId: string | null;
    setCoupleId: (id: string | null) => void;

    /** Persistent Identity (Who is holding the phone?) */
    appIdentity: 'him' | 'her' | null;
    setAppIdentity: (identity: 'him' | 'her' | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            monthOffset: 0,
            setMonthOffset: (offset) => set({ monthOffset: offset }),

            isAddTransactionOpen: false,
            openAddTransaction: () => set({ isAddTransactionOpen: true }),
            closeAddTransaction: () => set({ isAddTransactionOpen: false }),

            activeTab: 'home',
            setActiveTab: (tab) => set({ activeTab: tab }),

            deepFreezeEnabled: true,
            toggleDeepFreeze: () => set((state) => ({ deepFreezeEnabled: !state.deepFreezeEnabled })),

            coupleId: null,
            setCoupleId: (id) => set({ coupleId: id }),

            appIdentity: null,
            setAppIdentity: (identity) => set({ appIdentity: identity }),
        }),
        {
            name: 'ourglass-store', // unique name for localStorage
            partialize: (state) => ({ appIdentity: state.appIdentity, activeTab: state.activeTab }), // only persist these fields
        }
    )
);

export const useAppIdentity = () => useAppStore(state => state.appIdentity);
export const useActiveTab = () => useAppStore(state => state.activeTab);
