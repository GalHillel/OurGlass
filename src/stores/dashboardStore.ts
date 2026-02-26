import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetConfig {
    id: string;
    enabled: boolean;
    order: number;
}

export interface NavItemConfig {
    id: string;
    enabled: boolean;
    order: number;
}

export type FeatureKey =
    | 'enableStocks' | 'enableStocksPage' | 'enableWishlist' | 'enableSubscriptions' | 'enableSettlements' | 'enableLounge'
    | 'showSP500Benchmark' | 'showDividendForecast' | 'showRebalancingCoach'
    // Wealth Page Features
    | 'wealthShowHistory' | 'wealthShowInsights' | 'wealthShowAssets' | 'wealthShowPortfolio' | 'wealthShowSummaryCards'
    // Subscriptions Page Features
    | 'subsShowIndicator' | 'subsShowLiabilities' | 'subsShowGhost' | 'subsShowKiller' | 'subsShowSummary'
    // Lounge Page Features
    | 'loungeShowVibe' | 'loungeShowRoulette' | 'loungeShowTinder'
    // Wishlist Page Features
    | 'wishlistShowHarvester'
    | 'homeShowQuickActions';

const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'reactor', enabled: true, order: 0 },
    { id: 'smart-insights', enabled: true, order: 1 },
    { id: 'monthly-roast', enabled: true, order: 2 },
    { id: 'ai-hub', enabled: true, order: 3 },
    { id: 'health', enabled: true, order: 4 },
    { id: 'savings', enabled: true, order: 5 },
    { id: 'investments', enabled: true, order: 6 },
    { id: 'vault', enabled: true, order: 7 },
    { id: 'quick-action', enabled: true, order: 8 },
    { id: 'partner-stats', enabled: true, order: 9 },
    { id: 'calendar', enabled: true, order: 10 },
    { id: 'categories', enabled: true, order: 11 },
    { id: 'subscriptions', enabled: true, order: 12 },
    { id: 'wishlist', enabled: true, order: 13 },
];

const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
    { id: "home", enabled: true, order: 0 },
    { id: "wealth", enabled: true, order: 1 },
    { id: "stocks", enabled: true, order: 2 },
    { id: "lounge", enabled: true, order: 3 },
    { id: "subscriptions", enabled: true, order: 4 },
    { id: "wishlist", enabled: true, order: 5 },
    { id: "settings", enabled: true, order: 6 },
];

const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
    enableStocks: true,
    enableStocksPage: true,
    enableWishlist: true,
    enableSubscriptions: true,
    enableSettlements: false,
    enableLounge: true,
    showSP500Benchmark: true,
    showDividendForecast: true,
    showRebalancingCoach: true,
    // Wealth
    wealthShowHistory: true,
    wealthShowInsights: true,
    wealthShowAssets: true,
    wealthShowPortfolio: true,
    wealthShowSummaryCards: true,
    // Subscriptions
    subsShowIndicator: true,
    subsShowLiabilities: true,
    subsShowGhost: true,
    subsShowKiller: true,
    subsShowSummary: true,
    // Lounge
    loungeShowVibe: true,
    loungeShowRoulette: true,
    loungeShowTinder: true,
    // Wishlist
    wishlistShowHarvester: true,
    homeShowQuickActions: true,
};

interface DashboardState {
    widgets: WidgetConfig[];
    navItems: NavItemConfig[];
    features: Record<FeatureKey, boolean>;
    toggleWidget: (id: string) => void;
    toggleNavItem: (id: string) => void;
    toggleFeature: (key: FeatureKey) => void;
    reorderWidgets: (newOrder: WidgetConfig[]) => void;
    reorderNavItems: (newOrder: NavItemConfig[]) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            widgets: DEFAULT_WIDGETS,
            navItems: DEFAULT_NAV_ITEMS,
            features: DEFAULT_FEATURES,
            toggleWidget: (id) =>
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, enabled: !w.enabled } : w
                    ),
                })),
            toggleNavItem: (id) =>
                set((state) => ({
                    navItems: state.navItems.map((n) =>
                        n.id === id ? { ...n, enabled: !n.enabled } : n
                    ),
                })),
            toggleFeature: (key) =>
                set((state) => ({
                    features: {
                        ...state.features,
                        [key]: !state.features[key],
                    },
                })),
            reorderWidgets: (newOrder) => set({ widgets: newOrder }),
            reorderNavItems: (newOrder) => set({ navItems: newOrder }),
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'ourglass-dashboard-store',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Version 0 was the old state. Let's ensure new segments exist.
                    return {
                        ...persistedState,
                        navItems: DEFAULT_NAV_ITEMS,
                    };
                }
                return persistedState;
            },
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Self-healing: Ensure all default widgets exist in the rehydrated state
                    const currentWidgetIds = (state.widgets || []).map(w => w.id);
                    const missingWidgets = DEFAULT_WIDGETS.filter(w => !currentWidgetIds.includes(w.id));

                    if (missingWidgets.length > 0) {
                        state.widgets = [
                            ...(state.widgets || []),
                            ...missingWidgets.map(w => ({ ...w, order: (state.widgets || []).length + w.order }))
                        ];
                    }

                    // Self-healing: Ensure all default nav items exist and Lounge is ENABLED
                    const currentNavIds = state.navItems?.map(n => n.id) || [];
                    const missingNavItems = DEFAULT_NAV_ITEMS.filter(n => !currentNavIds.includes(n.id));

                    let updatedNavItems = state.navItems || [];
                    if (missingNavItems.length > 0) {
                        updatedNavItems = [...updatedNavItems, ...missingNavItems];
                    }

                    // Explicitly force lounge to be enabled if it's there
                    updatedNavItems = updatedNavItems.map(n =>
                        n.id === 'lounge' ? { ...n, enabled: true } : n
                    );

                    state.navItems = updatedNavItems;

                    // Self-healing: Ensure all default features exist and force active key ones
                    const currentFeatureKeys = Object.keys(state.features || {});
                    const missingFeatures = (Object.keys(DEFAULT_FEATURES) as FeatureKey[])
                        .filter(key => !currentFeatureKeys.includes(key));

                    if (missingFeatures.length > 0 || !state.features.enableLounge) {
                        state.features = {
                            ...(state.features || {}),
                            ...missingFeatures.reduce((acc, key) => ({
                                ...acc,
                                [key]: DEFAULT_FEATURES[key]
                            }), {}),
                            // Force critical features to be true if they are currently missing or false (recovery)
                            enableLounge: true,
                            enableWishlist: true,
                            enableStocks: true
                        } as Record<FeatureKey, boolean>;
                    }

                    state.setHasHydrated(true);
                }
            }
        }
    )
);

// Helper for easier feature access
export const useFeature = (key: FeatureKey) =>
    useDashboardStore((state) => state.features[key]);
