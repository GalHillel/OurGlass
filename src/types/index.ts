export interface DashboardConfig {
    widgets: { id: string; enabled: boolean; order: number }[];
    navItems: { id: string; enabled: boolean; order: number }[];
    features: Record<string, boolean>;
}

export interface Profile {
    id: string;
    name: string | null;
    avatar_url: string | null;
    hourly_wage: number | null;
    budget: number | null;
    monthly_income: number | null;
    joint_account: boolean;
    couple_id: string | null;
    partner_id: string | null;
    pocket_him: number | null;
    pocket_her: number | null;
    income_split_ratio: number | null;
    onboarding_completed: boolean;
    role: 'admin' | 'user';
    dashboard_config?: DashboardConfig | null;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: 'fixed' | 'variable';
    couple_id: string | null;
    budget_limit: number | null;
    created_at: string;
}

/** Matches DB: transactions table. category_id is UUID FK to categories.id */
export interface Transaction {
    id: string;
    type: 'expense' | 'income' | 'transfer' | 'adjustment';
    amount: number;
    idempotency_key?: string | null;
    category_id: string | null;   // DB column (uuid)
    category?: string;            // Mapped from categories.name for UI display only
    user_id: string | null;
    couple_id: string | null;
    description: string | null;
    date: string;
    payer?: 'him' | 'her' | 'joint';
    is_surprise: boolean | null;
    surprise_reveal_date: string | null;
    location_lat: number | null;
    location_lng: number | null;
    mood_rating: number | null;
    receipt_url: string | null;
    is_auto_generated: boolean;
    tags: string[] | null;
    created_at: string;
}

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    billing_day: number | null;
    owner?: 'him' | 'her' | 'joint';
    couple_id: string | null;
    category_id?: string | null;
    category?: string;
    active: boolean;
    status?: 'active' | 'to_cancel' | 'processing' | 'saved';
    usage_rating: number | null;
    last_auto_transaction: string | null;
    created_at: string;
}

export interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    brick_color: string | null;
    type: 'cash' | 'stock' | 'pocket_him' | 'pocket_her' | 'money_market' | 'mutual_fund' | 'savings' | 'foreign_currency' | 'wish';
    growth_rate: number;
    couple_id: string | null;
    deep_freeze: boolean;
    owner?: 'him' | 'her' | 'joint';
    target_date: string | null;
    created_at: string;
    // Wealth/Stocks fields
    interest_rate?: number;
    last_interest_calc?: string;
    symbol?: string;
    currency?: string;
    quantity?: number;
    investment_type?: string;
    last_updated?: string;
    calculatedValue?: number;
    initial_amount: number;
    start_date: string;
    annual_interest_percent: number;
    tax_rate_percent: number | null;
    exit_dates: { date: string; amount: number }[] | null;
    last_accrual_timestamp?: string;
}

export type Asset = Goal;

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    link: string | null;
    status: 'pending' | 'approved' | 'purchased';
    couple_id: string | null;
    requested_by: string | null;
    approved_by: string | null;
    saved_amount: number;
    description?: string | null;
    priority: number;
    created_at: string;
}

// ── New Phase 3 Types ──

export type LiabilityType = 'mortgage' | 'car' | 'student' | 'personal' | 'credit_card' | 'other';

export interface Liability {
    id: string;
    couple_id: string;
    name: string;
    category: string;
    total_amount: number;
    amount?: number;
    remaining_amount: number;
    monthly_payment: number;
    interest_rate: number;
    end_date: string | null;
    type?: LiabilityType;
    principal?: number;
    current_balance?: number;
    start_date?: string | null;
    estimated_end_date?: string | null;
    estimated_months_to_payoff?: number;
    owner: 'him' | 'her' | 'joint';
    created_at: string;
}

export interface WealthSnapshot {
    id: string;
    couple_id: string;
    snapshot_date: string;
    net_worth: number;
    cash_value: number;
    investments_value: number;
    liabilities_value: number;
    created_at: string;
}

export interface FinancialContext {
    transactions: Transaction[];
    recentTransactions?: Transaction[];
    burnRate: {
        daily: number;
        weekly: number;
        monthlySpend: number;
        monthProgressPct: number;
    };
    subscriptions: Subscription[];
    liabilities: Liability[];
    debtObligations?: Liability[];
    assets: {
        bankCash: number;
        stocksInvestments: number;
        moneyMarketKaspit: number;
        usdCash: {
            usdAmount: number;
            ilsValue: number;
        };
        totalTrackedAssets: number;
        raw: Goal[];
    };
    wishlist: WishlistItem[];
    wealthSnapshot: WealthSnapshot | null;
    fixedExpenses: number;
    budget: number;
    income: number;
    identityName: string;
    liveNetWorth: number | null;
    currentRoute?: string;
}
