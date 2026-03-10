export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₪";
export const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "he-IL";

export const APP_NAME = "OurGlass";

export const PAYERS = {
    HIM: process.env.NEXT_PUBLIC_PARTNER_1_NAME || "בן/בת זוג 1",
    HER: process.env.NEXT_PUBLIC_PARTNER_2_NAME || "בן/בת זוג 2",
    JOINT: "משותף"
} as const;

export const ASSET_TYPES = {
    CASH: "מזומן",
    SAVINGS: "חיסכון",
    FOREIGN_CURRENCY: "מט״ח / דולר",
    STOCK: "מניות",
    REAL_ESTATE: "נדל״ן",
    MONEY_MARKET: "קרן כספית",
    MUTUAL_FUND: "קרן נאמנות",
} as const;

export const TABS = {
    ALL: "הכל",
    CASH: "מזומן",
    SAVINGS: "חיסכון",
    INVESTMENTS: "השקעות",
    FOREIGN_CURRENCY: "מט״ח",
    REAL_ESTATE: "נדל״ן"
} as const;

export const isAssetInvestment = (asset: any): boolean => {
    // Definition: Stocks, Real Estate, Money Market, and Mutual Funds are investments.
    // Everything else (Cash, Savings, Forex) is considered "Cash/Liquid".
    const type = (asset.type || asset.category || "").toLowerCase();
    const invType = (asset.investment_type || "").toLowerCase();

    return (
        type === 'stock' ||
        type === 'money_market' ||
        type === 'mutual_fund' ||
        invType === 'real_estate' ||
        invType === 'stock' ||
        invType === 'mutual_fund'
    );
};
