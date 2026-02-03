import { Transaction } from "@/types";

// 1. FREEZE TIME: Fixed date (Oct 15, 2025)
const FIXED_NOW = new Date("2025-10-15T12:00:00");

export const getDemoDate = (daysOffset: number = 0): string => {
    const d = new Date(FIXED_NOW);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString();
};

// 2. USER & BUDGET (30k)
export const DEMO_USER = {
    id: 'demo-user',
    name: "משתמש דמו",
    email: "demo@ourglass.app",
    budget: 30000,
    income: 35000,
    currency: "ILS"
};

export const USD_TO_ILS = 3.65;

// 3. RICH ASSETS (Stocks + Cash)
export const DEMO_ASSETS = [
    { id: 's1', type: 'stock', symbol: 'NVDA', name: 'NVIDIA', quantity: 40, currentPrice: 485.50, changePercent: 2.4, calculatedValue: 40 * 485.50 * 3.65 },
    { id: 's2', type: 'stock', symbol: 'AAPL', name: 'Apple', quantity: 120, currentPrice: 190.00, changePercent: 1.1, calculatedValue: 120 * 190.00 * 3.65 },
    { id: 's3', type: 'stock', symbol: 'TSLA', name: 'Tesla', quantity: 25, currentPrice: 240.00, changePercent: -0.8, calculatedValue: 25 * 240.00 * 3.65 },
    { id: 'c1', type: 'cash', name: 'עובר ושב', current_amount: 42000, calculatedValue: 42000, brick_color: '#3B82F6' },
    { id: 'c2', type: 'cash', name: 'קרן חירום', current_amount: 150000, calculatedValue: 150000, brick_color: '#10B981' },
];

// 4. TICKER DATA (To fix the crash)
export const DEMO_TICKER_DATA = [
    { symbol: "S&P 500", price: 4780.25, changePercent: 0.85 },
    { symbol: "NASDAQ", price: 15055.60, changePercent: 1.2 },
    { symbol: "BTC", price: 64200.00, changePercent: -1.5 },
    { symbol: "ETH", price: 3450.00, changePercent: -0.9 },
    { symbol: "NVDA", price: 485.50, changePercent: 2.4 },
    { symbol: "AAPL", price: 190.00, changePercent: 1.1 },
];

// 5. TRANSACTIONS (Diverse & Hebrew)
export const DEMO_TRANSACTIONS: any[] = [
    { id: 't1', description: 'קניות בסופר', amount: -850, date: getDemoDate(-1), category_id: 'food', payer: 'joint' },
    { id: 't2', description: 'תדלוק רכב', amount: -320, date: getDemoDate(-2), category_id: 'transport', payer: 'him' },
    { id: 't3', description: 'משכורת', amount: 18000, date: getDemoDate(-5), category_id: 'salary', payer: 'him' },
    { id: 't4', description: 'מסעדה איטלקית', amount: -450, date: getDemoDate(-3), category_id: 'fun', payer: 'joint' },
    { id: 't5', description: 'נטפליקס', amount: -55, date: getDemoDate(-10), category_id: 'bills', payer: 'her' },
    { id: 't6', description: 'קניון עזריאלי', amount: -600, date: getDemoDate(-4), category_id: 'shopping', payer: 'her' },
    { id: 't7', description: 'ביטוח רכב', amount: -1200, date: getDemoDate(-8), category_id: 'bills', payer: 'joint' },
    { id: 't8', description: 'קפה בבוקר', amount: -35, date: getDemoDate(-1), category_id: 'food', payer: 'him' },
    { id: 't9', description: 'משכורת', amount: 17000, date: getDemoDate(-5), category_id: 'salary', payer: 'her' },
    { id: 't10', description: 'ספא', amount: -380, date: getDemoDate(-6), category_id: 'fun', payer: 'her' },
];

// 6. SUBSCRIPTIONS (Hebrew)
export const DEMO_SUBSCRIPTIONS = [
    { id: 'sub1', name: 'נטפליקס פרימיום', amount: 55, billing_day: 10, owner: 'joint', category: 'בידור' },
    { id: 'sub2', name: 'ספוטיפיי משפחה', amount: 30, billing_day: 15, owner: 'him', category: 'מוזיקה' },
    { id: 'sub3', name: 'חדר כושר הולמס פלייס', amount: 250, billing_day: 1, owner: 'her', category: 'ספורט' },
    { id: 'sub4', name: 'אפל וואן', amount: 85, billing_day: 5, owner: 'joint', category: 'טכנולוגיה' },
    { id: 'sub5', name: 'יוטיוב פרימיום', amount: 40, billing_day: 20, owner: 'him', category: 'בידור' },
    { id: 'sub6', name: 'אמזון פריים', amount: 25, billing_day: 12, owner: 'joint', category: 'קניות' },
];

// 7. WISHLIST (Hebrew)
export const DEMO_WISHLIST = [
    { id: 'w1', name: 'חופשה בתאילנד 🏝️', price: 15000, saved_amount: 5000, status: 'pending' as const, emoji: '✈️', description: '10 ימים בפוקט ובנגקוק', link: null, created_at: getDemoDate(-30) },
    { id: 'w2', name: 'אייפון 16 פרו מקס', price: 5000, saved_amount: 5000, status: 'purchased' as const, emoji: '📱', description: '256GB - טיטניום שחור', link: null, created_at: getDemoDate(-60) },
    { id: 'w3', name: 'מחשב נייד MacBook Pro', price: 12000, saved_amount: 3500, status: 'pending' as const, emoji: '💻', description: 'M3 Max, 16GB RAM', link: null, created_at: getDemoDate(-45) },
    { id: 'w4', name: 'רכב חדש טסלה מודל 3', price: 180000, saved_amount: 45000, status: 'pending' as const, emoji: '🚗', description: 'Long Range - כחול', link: null, created_at: getDemoDate(-90) },
    { id: 'w5', name: 'מצלמה סוני A7IV', price: 8500, saved_amount: 8500, status: 'purchased' as const, emoji: '📷', description: 'עדשה 24-70mm', link: null, created_at: getDemoDate(-120) },
    { id: 'w6', name: 'ריהוט לסלון', price: 25000, saved_amount: 12000, status: 'pending' as const, emoji: '🛋️', description: 'ספה + שולחן + מזנון', link: null, created_at: getDemoDate(-15) },
];

// 8. TOTALS
export const DEMO_NET_WORTH = DEMO_ASSETS.reduce((sum, a) => sum + a.calculatedValue, 0);
export const DEMO_INVESTMENTS = DEMO_ASSETS.filter(a => a.type === 'stock').reduce((sum, a) => sum + a.calculatedValue, 0);
export const DEMO_CASH = DEMO_ASSETS.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.calculatedValue, 0);
