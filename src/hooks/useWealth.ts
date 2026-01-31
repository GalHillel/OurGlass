import { Goal } from "@/types";

// DEMO MODE: Static mock data for portfolio demonstration
const MOCK_ASSETS: Goal[] = [
    {
        id: "demo-1",
        name: "Apple Inc.",
        symbol: "AAPL",
        type: "stock",
        quantity: 50,
        current_amount: 350000,
        target_amount: 500000,
        brick_color: "#A855F7",
        investment_type: "stock",
        created_at: new Date().toISOString(),
        growth_rate: 0.12
    },
    {
        id: "demo-2",
        name: "Tesla",
        symbol: "TSLA",
        type: "stock",
        quantity: 100,
        current_amount: 300000,
        target_amount: 400000,
        brick_color: "#10B981",
        investment_type: "stock",
        created_at: new Date().toISOString(),
        growth_rate: 0.15
    },
    {
        id: "demo-3",
        name: "S&P 500 Index",
        symbol: "SPY",
        type: "stock",
        quantity: 20,
        current_amount: 200000,
        target_amount: 300000,
        brick_color: "#3B82F6",
        investment_type: "stock",
        created_at: new Date().toISOString(),
        growth_rate: 0.10
    },
    {
        id: "demo-4",
        name: "חיסכון בבנק",
        type: "cash",
        current_amount: 400000,
        target_amount: 500000,
        brick_color: "#10B981",
        investment_type: "cash",
        created_at: new Date().toISOString(),
        growth_rate: 0.03
    }
];

export const useWealth = () => {
    // Return static impressive demo data immediately
    return {
        netWorth: 1250000,
        investmentsValue: 850000,
        cashValue: 400000,
        assets: MOCK_ASSETS,
        loading: false,
        refetch: () => Promise.resolve()
    };
};
