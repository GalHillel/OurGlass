import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WidgetConfig {
    id: string;
    enabled: boolean;
    order: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
    { id: 'reactor', enabled: true, order: 0 },
    { id: 'ai-hub', enabled: true, order: 1 },
    { id: 'health', enabled: true, order: 2 },
    { id: 'savings', enabled: true, order: 3 },
    { id: 'investments', enabled: true, order: 4 },
    { id: 'vault', enabled: true, order: 5 },
    { id: 'settlements', enabled: false, order: 6 }, // OFF by default as requested
    { id: 'quick-action', enabled: true, order: 7 },
    { id: 'partner-stats', enabled: true, order: 8 },
    { id: 'calendar', enabled: true, order: 9 },
    { id: 'categories', enabled: true, order: 10 }
];

interface DashboardState {
    widgets: WidgetConfig[];
    toggleWidget: (id: string) => void;
    reorderWidgets: (newOrder: WidgetConfig[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            widgets: DEFAULT_WIDGETS,
            toggleWidget: (id) =>
                set((state) => ({
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, enabled: !w.enabled } : w
                    ),
                })),
            reorderWidgets: (newOrder) => set({ widgets: newOrder }),
        }),
        {
            name: 'ourglass-dashboard-store',
        }
    )
);
