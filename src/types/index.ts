export interface Profile {
    id: string;
    name: string | null;
    avatar_url: string | null;
    hourly_wage: number | null;
    budget: number | null;
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

export interface Transaction {
    id: string;
    amount: number;
    category_id: string | null;
    user_id: string | null;
    description: string | null;
    date: string;
    is_surprise: boolean;
    surprise_reveal_date: string | null;
    location_lat: number | null;
    location_lng: number | null;
    mood_rating: number | null;
    created_at: string;
}

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    billing_day: number | null;
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
}

export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    link: string | null;
    status: 'pending' | 'approved' | 'purchased';
    created_at: string;
}
