import { DEMO_ASSETS, DEMO_NET_WORTH, DEMO_INVESTMENTS, DEMO_CASH } from "@/lib/demoData";

export const useWealth = () => {
    return {
        netWorth: DEMO_NET_WORTH,
        investmentsValue: DEMO_INVESTMENTS,
        cashValue: DEMO_CASH,
        assets: DEMO_ASSETS,
        loading: false,
        refetch: () => { }
    };
};
