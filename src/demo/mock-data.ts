import { Transaction, Subscription, Liability, Goal, WishlistItem, Profile, WealthSnapshot } from "@/types";

export const MOCK_COUPLE_ID = "demo-couple-123";
export const MOCK_USER_ID_GAL = "user-gal-123";
export const MOCK_USER_ID_MAYA = "user-maya-456";

export const MOCK_PROFILE: Profile = {
    id: MOCK_USER_ID_GAL,
    name: "גל ומאיה",
    avatar_url: null,
    hourly_wage: 100,
    budget: 20000,
    monthly_income: 18500,
    joint_account: true,
    couple_id: MOCK_COUPLE_ID,
    partner_id: MOCK_USER_ID_MAYA,
    pocket_him: 1500,
    pocket_her: 1500,
    income_split_ratio: 0.56,
    onboarding_completed: true,
    role: 'user',
    created_at: "2024-01-01T00:00:00Z",
    dashboard_config: {
        widgets: [
            { id: 'reactor', enabled: true, order: 0 },
            { id: 'smart-insights', enabled: true, order: 1 },
            { id: 'monthly-roast', enabled: true, order: 2 },
            { id: 'ai-hub', enabled: true, order: 3 },
            { id: 'health', enabled: true, order: 4 },
            { id: 'savings', enabled: true, order: 5 },
            { id: 'investments', enabled: true, order: 6 },
            { id: 'vault', enabled: true, order: 7 },
        ],
        navItems: [
            { id: "home", enabled: true, order: 0 },
            { id: "wealth", enabled: true, order: 1 },
            { id: "stocks", enabled: true, order: 2 },
            { id: "subscriptions", enabled: true, order: 3 },
            { id: "wishlist", enabled: true, order: 4 },
            { id: "settings", enabled: true, order: 5 },
        ],
        features: {
            enableStocks: true,
            enableStocksPage: true,
            enableWishlist: true,
            enableSubscriptions: true,
            enableSettlements: true,
            enableLounge: true,
            showSP500Benchmark: true,
            showPortfolioAllocation: true,
            showRebalancingCoach: true,
            showDividendForecast: true,
            wealthShowHistory: true,
            wealthShowInsights: true,
            wealthShowAssets: true,
            wealthShowPortfolio: true,
            wealthShowSummaryCards: true,
            subsShowIndicator: true,
            subsShowLiabilities: true,
            subsShowGhost: true,
            subsShowKiller: true,
            subsShowSummary: true,
            loungeShowVibe: true,
            loungeShowRoulette: true,
            loungeShowTinder: true,
            wishlistShowHarvester: true,
            homeShowQuickActions: true,
        }
    }
};

export const MOCK_ASSETS: Goal[] = [
    {
        id: "a1",
        couple_id: MOCK_COUPLE_ID,
        name: "💰 עו״ש וחסכונות",
        type: "cash",
        investment_type: "cash",
        current_amount: 125000,
        target_amount: 200000,
        brick_color: "blue",
        growth_rate: 0,
        deep_freeze: false,
        initial_amount: 100000,
        start_date: "2024-01-01",
        target_date: "2026-01-01",
        annual_interest_percent: 0,
        tax_rate_percent: 0,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a2",
        couple_id: MOCK_COUPLE_ID,
        name: "🍏 Apple (AAPL)",
        type: "stock",
        investment_type: "stock",
        current_amount: 14500,
        target_amount: 30000,
        brick_color: "green",
        growth_rate: 0.12,
        deep_freeze: false,
        initial_amount: 10000,
        start_date: "2024-01-01",
        target_date: "2027-01-01",
        annual_interest_percent: 12,
        tax_rate_percent: 25,
        symbol: "AAPL",
        quantity: 76,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a2_msft",
        couple_id: MOCK_COUPLE_ID,
        name: "💻 Microsoft (MSFT)",
        type: "stock",
        investment_type: "stock",
        current_amount: 18200,
        target_amount: 40000,
        brick_color: "blue",
        growth_rate: 0.10,
        deep_freeze: false,
        initial_amount: 15000,
        start_date: "2024-01-01",
        target_date: "2027-01-01",
        annual_interest_percent: 10,
        tax_rate_percent: 25,
        symbol: "MSFT",
        quantity: 44,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a2_nvda",
        couple_id: MOCK_COUPLE_ID,
        name: "🤖 NVIDIA (NVDA)",
        type: "stock",
        investment_type: "stock",
        current_amount: 22400,
        target_amount: 50000,
        brick_color: "green",
        growth_rate: 0.25,
        deep_freeze: false,
        initial_amount: 5000,
        start_date: "2024-01-01",
        target_date: "2027-01-01",
        annual_interest_percent: 25,
        tax_rate_percent: 25,
        symbol: "NVDA",
        quantity: 24,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a3",
        couple_id: MOCK_COUPLE_ID,
        name: "🛡️ קרן השתלמות",
        type: "money_market",
        investment_type: "money_market",
        current_amount: 84000,
        target_amount: 120000,
        brick_color: "purple",
        growth_rate: 0.05,
        deep_freeze: true,
        initial_amount: 60000,
        start_date: "2024-01-01",
        target_date: "2030-01-01",
        annual_interest_percent: 5,
        tax_rate_percent: 0,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a4",
        couple_id: MOCK_COUPLE_ID,
        name: "👴 פנסיה",
        type: "money_market",
        investment_type: "money_market",
        current_amount: 210000,
        target_amount: 1000000,
        brick_color: "orange",
        growth_rate: 0.07,
        deep_freeze: true,
        initial_amount: 150000,
        start_date: "2024-01-01",
        target_date: "2045-01-01",
        annual_interest_percent: 7,
        tax_rate_percent: 0,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a5",
        couple_id: MOCK_COUPLE_ID,
        name: "₿ קריפטו (BTC)",
        type: "stock",
        investment_type: "stock",
        current_amount: 15500,
        target_amount: 100000,
        brick_color: "yellow",
        growth_rate: 0.30,
        deep_freeze: false,
        initial_amount: 8000,
        start_date: "2024-01-01",
        target_date: "2026-06-01",
        annual_interest_percent: 30,
        tax_rate_percent: 25,
        symbol: "BTC",
        quantity: 0.2,
        exit_dates: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "a6",
        couple_id: MOCK_COUPLE_ID,
        name: "🏠 קרן לדירה (S&P 500)",
        type: "stock",
        investment_type: "stock",
        current_amount: 350000,
        target_amount: 1000000,
        brick_color: "blue",
        growth_rate: 0.10,
        deep_freeze: false,
        initial_amount: 250000,
        start_date: "2023-01-01",
        target_date: "2030-01-01",
        annual_interest_percent: 10,
        tax_rate_percent: 25,
        symbol: "VOO",
        quantity: 850,
        exit_dates: null,
        created_at: "2023-01-01T00:00:00Z"
    },
    {
        id: "a7",
        couple_id: MOCK_COUPLE_ID,
        name: "💵 דולרים במזומן",
        type: "foreign_currency",
        investment_type: "foreign_currency",
        current_amount: 5000,
        target_amount: 10000,
        brick_color: "emerald",
        growth_rate: 0,
        deep_freeze: false,
        initial_amount: 5000,
        start_date: "2024-06-01",
        target_date: "2026-06-01",
        annual_interest_percent: 0,
        tax_rate_percent: 0,
        currency: "USD",
        exit_dates: null,
        created_at: "2024-06-01T00:00:00Z"
    }
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
    {
        id: "sub1",
        couple_id: MOCK_COUPLE_ID,
        name: "🎬 Netflix",
        amount: 69,
        billing_day: 15,
        owner: "joint",
        category: "בילויים",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub2",
        couple_id: MOCK_COUPLE_ID,
        name: "🎵 Spotify",
        amount: 25,
        billing_day: 1,
        owner: "him",
        category: "בילויים",
        active: true,
        usage_rating: 4,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub3",
        couple_id: MOCK_COUPLE_ID,
        name: "🤖 ChatGPT Plus",
        amount: 75,
        billing_day: 10,
        owner: "him",
        category: "עבודה",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub4",
        couple_id: MOCK_COUPLE_ID,
        name: "💪 חדר כושר",
        amount: 250,
        billing_day: 1,
        owner: "her",
        category: "בריאות",
        active: true,
        usage_rating: 3,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub5",
        couple_id: MOCK_COUPLE_ID,
        name: "☁️ iCloud",
        amount: 11.9,
        billing_day: 12,
        owner: "her",
        category: "דיגיטל",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub6",
        couple_id: MOCK_COUPLE_ID,
        name: "🏢 ארנונה",
        amount: 850,
        billing_day: 1,
        owner: "joint",
        category: "חשבונות",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub7",
        couple_id: MOCK_COUPLE_ID,
        name: "🚗 ביטוח רכב",
        amount: 450,
        billing_day: 10,
        owner: "joint",
        category: "רכב",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    },
    {
        id: "sub8",
        couple_id: MOCK_COUPLE_ID,
        name: "🏥 ביטוח בריאות",
        amount: 180,
        billing_day: 20,
        owner: "joint",
        category: "בריאות",
        active: true,
        usage_rating: 5,
        last_auto_transaction: null,
        created_at: "2024-01-01T00:00:00Z"
    }
];

export const MOCK_WISHLIST: WishlistItem[] = [
    {
        id: "w1",
        couple_id: MOCK_COUPLE_ID,
        name: "🇯🇵 טיול ליפן",
        price: 35000,
        saved_amount: 12500,
        status: "pending",
        priority: 1,
        requested_by: MOCK_USER_ID_MAYA,
        approved_by: null,
        link: null,
        description: "טיול חלומי לשבועיים בטוקיו, קיוטו ואוסקה",
        created_at: "2024-09-01T00:00:00Z"
    },
    {
        id: "w2",
        couple_id: MOCK_COUPLE_ID,
        name: "💻 מחשב חדש לזוג",
        price: 12000,
        saved_amount: 4800,
        status: "pending",
        priority: 2,
        requested_by: MOCK_USER_ID_GAL,
        approved_by: null,
        link: null,
        description: "MacBook Pro M3 Max לעבודה אינטנסיבית",
        created_at: "2024-11-15T00:00:00Z"
    },
    {
        id: "w3",
        couple_id: MOCK_COUPLE_ID,
        name: "🛋️ ספה לסלון",
        price: 7500,
        saved_amount: 7500,
        status: "purchased",
        priority: 3,
        requested_by: MOCK_USER_ID_MAYA,
        approved_by: MOCK_USER_ID_GAL,
        link: null,
        description: "ספה פינתית מפנקת - קנינו!",
        created_at: "2024-08-01T00:00:00Z"
    },
    {
        id: "w4",
        couple_id: MOCK_COUPLE_ID,
        name: "📷 מצלמה חדשה",
        price: 5500,
        saved_amount: 800,
        status: "pending",
        priority: 4,
        requested_by: MOCK_USER_ID_GAL,
        approved_by: null,
        link: null,
        description: "Sony Alpha 7cII לצילומי הטיול",
        created_at: "2025-01-10T00:00:00Z"
    }
];

export const MOCK_LIABILITIES: Liability[] = [
    {
        id: "L1",
        couple_id: MOCK_COUPLE_ID,
        name: "🚗 הלוואה לרכב (Tesla)",
        category: "תחבורה",
        total_amount: 150000,
        remaining_amount: 84000,
        monthly_payment: 2800,
        interest_rate: 5.2,
        start_date: "2023-01-01",
        end_date: "2026-12-01",
        owner: "joint",
        created_at: "2023-01-01T00:00:00Z"
    }
];

const generateTransactions = (): Transaction[] => {
    const txs: Transaction[] = [];
    const months = [
        "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", 
        "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"
    ];
    
    months.forEach((month) => {
        // Rent
        txs.push({
            id: `rent-${month}`,
            type: "expense",
            amount: 7200,
            category_id: "cat-housing",
            category: "דיור",
            user_id: MOCK_USER_ID_GAL,
            couple_id: MOCK_COUPLE_ID,
            description: "🏠 שכר דירה",
            date: `${month}-01`,
            payer: "joint",
            is_surprise: false,
            surprise_reveal_date: null,
            location_lat: null,
            location_lng: null,
            mood_rating: 5,
            receipt_url: null,
            is_auto_generated: true,
            tags: null,
            created_at: `${month}-01T08:00:00Z`
        });

        // Salaries
        txs.push({
            id: `salary-gal-${month}`,
            type: "income",
            amount: 22000,
            category_id: "cat-income",
            category: "עבודה",
            user_id: MOCK_USER_ID_GAL,
            couple_id: MOCK_COUPLE_ID,
            description: "💰 משכורת משותפת (הייטק)",
            date: `${month}-01`,
            payer: "him",
            is_surprise: false,
            surprise_reveal_date: null,
            location_lat: null,
            location_lng: null,
            mood_rating: 5,
            receipt_url: null,
            is_auto_generated: true,
            tags: null,
            created_at: `${month}-01T09:00:00Z`
        });
        txs.push({
            id: `salary-maya-${month}`,
            type: "income",
            amount: 16500,
            category_id: "cat-income",
            category: "עבודה",
            user_id: MOCK_USER_ID_MAYA,
            couple_id: MOCK_COUPLE_ID,
            description: "💸 משכורת מאיה (שיווק)",
            date: `${month}-01`,
            payer: "her",
            is_surprise: false,
            surprise_reveal_date: null,
            location_lat: null,
            location_lng: null,
            mood_rating: 5,
            receipt_url: null,
            is_auto_generated: true,
            tags: null,
            created_at: `${month}-01T09:00:00Z`
        });

        if (month === "2024-12") {
            // Bonus
            txs.push({
                id: `bonus-gal-${month}`,
                type: "income",
                amount: 15000,
                category_id: "cat-income",
                category: "עבודה",
                user_id: MOCK_USER_ID_GAL,
                couple_id: MOCK_COUPLE_ID,
                description: "🎁 בונוס שנתי משותף",
                date: `${month}-25`,
                payer: "him",
                is_surprise: true,
                surprise_reveal_date: `${month}-25`,
                location_lat: null,
                location_lng: null,
                mood_rating: 5,
                receipt_url: null,
                is_auto_generated: false,
                tags: ["בונוס"],
                created_at: `${month}-25T10:00:00Z`
            });
        }

        // Wolt / Restaurants (10-12 per month)
        for (let i = 1; i <= 15; i++) {
            const places = ["וולט", "ג׳ירף", "ויטרינה", "מזנון", "פיצה", "סושי", "המבורגר", "שווארמה"];
            txs.push({
                id: `wolt-${month}-${i}`,
                type: "expense",
                amount: 60 + Math.floor(Math.random() * 150),
                category_id: "cat-food",
                category: "אוכל",
                user_id: i % 2 === 0 ? MOCK_USER_ID_GAL : MOCK_USER_ID_MAYA,
                couple_id: MOCK_COUPLE_ID,
                description: `🍔 ${places[i % places.length]}`,
                date: `${month}-${String(Math.min(28, 2 + i * 2)).padStart(2, '0')}`,
                payer: i % 3 === 0 ? "joint" : (i % 2 === 0 ? "him" : "her"),
                is_surprise: false,
                surprise_reveal_date: null,
                location_lat: null,
                location_lng: null,
                mood_rating: 4,
                receipt_url: null,
                is_auto_generated: false,
                tags: null,
                created_at: `${month}-${String(Math.min(28, 2 + i * 2)).padStart(2, '0')}T20:00:00Z`
            });
        }

        // Supermarket (Weekly)
        for (let i = 1; i <= 5; i++) {
            const places = ["שופרסל", "רמי לוי", "טיב טעם", "ויקטורי", "אולמארט"];
            txs.push({
                id: `super-${month}-${i}`,
                type: "expense",
                amount: 400 + Math.floor(Math.random() * 500),
                category_id: "cat-groceries",
                category: "קניות",
                user_id: i % 2 === 0 ? MOCK_USER_ID_GAL : MOCK_USER_ID_MAYA,
                couple_id: MOCK_COUPLE_ID,
                description: `🛒 ${places[i-1 % places.length]}`,
                date: `${month}-${String(1 + i * 6).padStart(2, '0')}`,
                payer: "joint",
                is_surprise: false,
                surprise_reveal_date: null,
                location_lat: null,
                location_lng: null,
                mood_rating: 5,
                receipt_url: null,
                is_auto_generated: false,
                tags: null,
                created_at: `${month}-${String(1 + i * 6).padStart(2, '0')}T11:00:00Z`
            });
        }

        // Car / Fuel (3 per month)
        for (let i = 1; i <= 3; i++) {
            txs.push({
                id: `fuel-${month}-${i}`,
                type: "expense",
                amount: 250 + Math.floor(Math.random() * 100),
                category_id: "cat-transport",
                category: "דלק",
                user_id: i % 2 === 0 ? MOCK_USER_ID_GAL : MOCK_USER_ID_MAYA,
                couple_id: MOCK_COUPLE_ID,
                description: "⛽ דלק פז",
                date: `${month}-${String(5 + i * 9).padStart(2, '0')}`,
                payer: i % 2 === 0 ? "him" : "her",
                is_surprise: false,
                surprise_reveal_date: null,
                location_lat: null,
                location_lng: null,
                mood_rating: 3,
                receipt_url: null,
                is_auto_generated: false,
                tags: null,
                created_at: `${month}-${String(5 + i * 9).padStart(2, '0')}T08:30:00Z`
            });
        }

        // Bills
        const bills = [
            { desc: "⚡ חברת החשמל", amt: 450, cat: "חשבונות", day: "10" },
            { desc: "💧 מי אביבים", amt: 120, cat: "חשבונות", day: "12" },
            { desc: "🌐 אינטרנט סיבים", amt: 100, cat: "אינטרנט", day: "05" },
            { desc: "📱 סלקום", amt: 60, cat: "תקשורת", day: "20" }
        ];
        bills.forEach(b => {
             txs.push({
                id: `bill-${month}-${b.desc}`,
                type: "expense",
                amount: b.amt,
                category_id: "cat-bills",
                category: b.cat,
                user_id: MOCK_USER_ID_MAYA,
                couple_id: MOCK_COUPLE_ID,
                description: b.desc,
                date: `${month}-${b.day}`,
                payer: "joint",
                is_surprise: false,
                surprise_reveal_date: null,
                location_lat: null,
                location_lng: null,
                mood_rating: 5,
                receipt_url: null,
                is_auto_generated: true,
                tags: null,
                created_at: `${month}-${b.day}T09:00:00Z`
            });
        });

        // Leisure (5 per month)
        for (let i = 1; i <= 5; i++) {
            const fun = ["קולנוע", "הופעה", "פאב", "באולינג", "מוזיאון"];
            txs.push({
                id: `fun-${month}-${i}`,
                type: "expense",
                amount: 100 + Math.floor(Math.random() * 400),
                category_id: "cat-leisure",
                category: "בילויים",
                user_id: i % 2 === 0 ? MOCK_USER_ID_GAL : MOCK_USER_ID_MAYA,
                couple_id: MOCK_COUPLE_ID,
                description: `🎬 ${fun[i % fun.length]}`,
                date: `${month}-${String(Math.min(28, 4 + i * 5)).padStart(2, '0')}`,
                payer: "joint",
                is_surprise: Math.random() > 0.85,
                surprise_reveal_date: null,
                location_lat: null,
                location_lng: null,
                mood_rating: 5,
                receipt_url: null,
                is_auto_generated: false,
                tags: null,
                created_at: `${month}-${String(Math.min(28, 4 + i * 5)).padStart(2, '0')}T21:00:00Z`
            });
        }
    });

    return txs.sort((a, b) => b.date.localeCompare(a.date));
};

export const MOCK_TRANSACTIONS = generateTransactions();

export const MOCK_WEALTH_HISTORY: WealthSnapshot[] = [
    { id: 'h1', couple_id: MOCK_COUPLE_ID, snapshot_date: "2025-09-01", net_worth: 425000, cash_value: 120000, investments_value: 305000, liabilities_value: 0, created_at: "2025-09-01T00:00:00Z" },
    { id: 'h2', couple_id: MOCK_COUPLE_ID, snapshot_date: "2025-10-01", net_worth: 432000, cash_value: 122000, investments_value: 310000, liabilities_value: 0, created_at: "2025-10-01T00:00:00Z" },
    { id: 'h3', couple_id: MOCK_COUPLE_ID, snapshot_date: "2025-11-01", net_worth: 438500, cash_value: 125000, investments_value: 313500, liabilities_value: 0, created_at: "2025-11-01T00:00:00Z" },
    { id: 'h4', couple_id: MOCK_COUPLE_ID, snapshot_date: "2025-12-01", net_worth: 445000, cash_value: 128000, investments_value: 317000, liabilities_value: 0, created_at: "2025-12-01T00:00:00Z" },
    { id: 'h5', couple_id: MOCK_COUPLE_ID, snapshot_date: "2026-01-01", net_worth: 454000, cash_value: 130000, investments_value: 324000, liabilities_value: 0, created_at: "2026-01-01T00:00:00Z" },
    { id: 'h6', couple_id: MOCK_COUPLE_ID, snapshot_date: "2026-02-01", net_worth: 461000, cash_value: 132000, investments_value: 329000, liabilities_value: 0, created_at: "2026-02-01T00:00:00Z" },
    { id: 'h7', couple_id: MOCK_COUPLE_ID, snapshot_date: "2026-03-01", net_worth: 468000, cash_value: 135000, investments_value: 333000, liabilities_value: 0, created_at: "2026-03-01T00:00:00Z" },
];
