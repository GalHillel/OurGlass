import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

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
    | 'showSP500Benchmark' | 'showPortfolioAllocation' | 'showRebalancingCoach'
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
    showPortfolioAllocation: true,
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
    initializeFromProfile: (profile: any) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

const supabase = createClient();

const syncToDB = async (state: Partial<DashboardState>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
        dashboard_config: {
            widgets: state.widgets,
            navItems: state.navItems,
            features: state.features
        }
    }).eq('id', user.id);
};

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            widgets: DEFAULT_WIDGETS,
            navItems: DEFAULT_NAV_ITEMS,
            features: DEFAULT_FEATURES,
            toggleWidget: (id) => {
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, enabled: !w.enabled } : w
                    ),
                }));
                syncToDB(get());
            },
            toggleNavItem: (id) => {
                set((state) => ({
                    navItems: state.navItems.map((n) =>
                        n.id === id ? { ...n, enabled: !n.enabled } : n
                    ),
                }));
                syncToDB(get());
            },
            toggleFeature: (key) => {
                set((state) => ({
                    features: {
                        ...state.features,
                        [key]: !state.features[key],
                    },
                }));
                syncToDB(get());
            },
            reorderWidgets: (newOrder) => {
                set({ widgets: newOrder });
                syncToDB(get());
            },
            reorderNavItems: (newOrder) => {
                set({ navItems: newOrder });
                syncToDB(get());
            },
            initializeFromProfile: (profile) => {
                if (profile?.dashboard_config) {
                    const config = profile.dashboard_config;
                    set({
                        widgets: config.widgets || DEFAULT_WIDGETS,
                        navItems: config.navItems || DEFAULT_NAV_ITEMS,
                        features: config.features || DEFAULT_FEATURES,
                        _hasHydrated: true
                    });
                }
            },
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'ourglass-dashboard-store',
            version: 1,
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const useFeature = (key: FeatureKey) =>
    useDashboardStore((state) => state.features[key]);
