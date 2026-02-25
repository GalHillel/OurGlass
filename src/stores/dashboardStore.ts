import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetConfig {
    id: string;
    enabled: boolean;
    order: number;
}

export type FeatureKey =
    | 'enableStocks' | 'enableStocksPage' | 'enableWishlist' | 'enableSubscriptions' | 'enableSettlements' | 'enableLounge'
    | 'showSP500Benchmark' | 'showDividendForecast' | 'showRebalancingCoach' | 'showMonthlyRoast' | 'showSmartInsights'
    // Wealth Page Features
    | 'wealthShowHistory' | 'wealthShowInsights' | 'wealthShowAssets' | 'wealthShowPortfolio' | 'wealthShowSummaryCards'
    // Subscriptions Page Features
    | 'subsShowIndicator' | 'subsShowLiabilities' | 'subsShowGhost' | 'subsShowKiller' | 'subsShowSummary'
    // Lounge Page Features
    | 'loungeShowVibe' | 'loungeShowRoulette' | 'loungeShowTinder'
    // Wishlist Page Features
    | 'wishlistShowHarvester';

const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'reactor', enabled: true, order: 0 },
    { id: 'ai-hub', enabled: true, order: 1 },
    { id: 'health', enabled: true, order: 2 },
    { id: 'savings', enabled: true, order: 3 },
    { id: 'investments', enabled: true, order: 4 },
    { id: 'vault', enabled: true, order: 5 },
    { id: 'partner-stats', enabled: true, order: 6 },
    { id: 'calendar', enabled: true, order: 7 },
    { id: 'categories', enabled: true, order: 8 },
    { id: 'subscriptions', enabled: true, order: 9 },
    { id: 'wishlist', enabled: true, order: 10 },
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
    showMonthlyRoast: true,
    showSmartInsights: true,
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
};

interface DashboardState {
    widgets: WidgetConfig[];
    features: Record<FeatureKey, boolean>;
    toggleWidget: (id: string) => void;
    toggleFeature: (key: FeatureKey) => void;
    reorderWidgets: (newOrder: WidgetConfig[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            widgets: DEFAULT_WIDGETS,
            features: DEFAULT_FEATURES,
            toggleWidget: (id) =>
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, enabled: !w.enabled } : w
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
        }),
        {
            name: 'ourglass-dashboard-store',
        }
    )
);

// Helper for easier feature access
export const useFeature = (key: FeatureKey) =>
    useDashboardStore((state) => state.features[key]);
