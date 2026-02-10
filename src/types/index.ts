export interface Profile {
    id: string;
    name: string | null;
    avatar_url: string | null;
    hourly_wage: number | null;
    budget: number | null;
    monthly_income: number | null; // New field
    joint_account: boolean; // New field
    role: 'admin' | 'user';
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: 'fixed' | 'variable';
    created_at: string;
}

/** Matches DB: transactions table. category_id is UUID FK to categories.id */
export interface Transaction {
    id: string;
    amount: number;
    category_id: string | null;   // DB column (uuid)
    category?: string;            // Mapped from categories.name for UI display only
    user_id: string | null;
    description: string | null;
    date: string;
    is_surprise: boolean | null;
    surprise_reveal_date: string | null;
    location_lat: number | null;
    location_lng: number | null;
    mood_rating: number | null;
    created_at: string;
    payer?: 'him' | 'her' | 'joint';
}

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    billing_day: number | null;
    owner?: 'him' | 'her' | 'joint';
    category_id?: string | null;  // Category for fixed expense
    category?: string;            // Mapped category name for UI display
    created_at: string;
}

export interface Goal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    brick_color: string | null;
    type: 'cash' | 'stock' | 'pocket_him' | 'pocket_her';
    growth_rate: number;
    created_at: string;
    // New fields for Wealth/Stocks
    interest_rate?: number; // Annual interest rate (e.g., 0.05 for 5%)
    last_interest_calc?: string; // ISO date
    symbol?: string; // Stock symbol (e.g., TSLA)
    currency?: string; // USD, ILS
    quantity?: number; // Number of shares
    owner?: string; // 'him', 'her', 'joint'
    investment_type?: string;
    last_updated?: string;
}

export type Asset = Goal;

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    link: string | null;
    status: 'pending' | 'approved' | 'purchased';
    saved_amount: number;
    created_at: string;
}
