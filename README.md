# OurGlass 💎 - Couple Finance Tracker

OurGlass is a premium, edge-to-edge finance tracking application designed specifically for couples. It combines real-time market data, AI-driven financial insights, and a sleek "Bento Box" UI to help couples manage their joint and individual finances with elegance and clarity.

## ✨ Key Features

- **Unified Cashflow**: Merges transactions, subscriptions, and debt payments into a single, easy-to-read "Reactor Core" balance.
- **Investment Portfolio**: Real-time stock tracking with live exchange rate conversion (USD/ILS).
- **AI Financial Assistant**: A dedicated chat assistant that analyzes your spending habits and offers personalized advice.
- **Wishlist & Saving Goals**: Collaborative wishlist with a "Saving Oracle" that calculates how many work hours a dream item costs.
- **Full-Bleed UI**: Immersive, glassmorphic design that spans the entire screen height for a native-app feel.
- **Real-time Sync**: Instant updates across devices using Supabase Realtime subscriptions.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **State Management**: [TanStack Query v5](https://tanstack.com/query/latest)
- **AI Integration**: [Google Gemini](https://ai.google.dev/) / [OpenAI](https://openai.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/GalHillel/OurGlass.git
cd OurGlass
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Integration (Gemini is primary)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Market Data (Required for Stocks)
FINNHUB_API_KEY=your_finnhub_key

# PWA & Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
VAPID_EMAIL=mailto:admin@yourdomain.com

# Identity (Optional - Default User)
NEXT_PUBLIC_AUTO_EMAIL=admin@ourglass.app
NEXT_PUBLIC_AUTO_PASSWORD=password123
```

### 4. Run Locally
```bash
npm run dev
```

---

## 🏗 Supabase Database Setup

Run the following SQL in your Supabase SQL Editor to create the necessary tables, buckets, and RLS policies.

```sql
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  avatar_url text,
  hourly_wage numeric,
  budget numeric default 20000,
  monthly_income numeric default 0,
  joint_account boolean default false,
  couple_id uuid,
  partner_id uuid,
  pocket_him numeric default 0,
  pocket_her numeric default 0,
  income_split_ratio numeric default 0.5,
  push_subscription jsonb,
  onboarding_completed boolean default false,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  color text,
  type text check (type in ('fixed', 'variable')) not null,
  couple_id uuid,
  budget_limit numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  amount numeric not null,
  category_id uuid references public.categories(id),
  category text, -- For legacy/simple mapping
  user_id uuid references public.profiles(id),
  couple_id uuid,
  description text,
  date timestamp with time zone default now() not null,
  payer text check (payer in ('him', 'her', 'joint')),
  is_surprise boolean default false,
  surprise_reveal_date timestamp with time zone,
  location_lat numeric,
  location_lng numeric,
  mood_rating integer check (mood_rating between 1 and 5),
  receipt_url text,
  is_auto_generated boolean default false,
  tags text[],
  created_at timestamp with time zone default now() not null
);

-- Subscriptions
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  amount numeric not null,
  billing_day integer check (billing_day between 1 and 31),
  owner text check (owner in ('him', 'her', 'joint')),
  couple_id uuid,
  category_id uuid references public.categories(id),
  active boolean default true,
  usage_rating integer,
  last_auto_transaction timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- Goals (Assets)
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  brick_color text,
  type text default 'cash',
  growth_rate numeric default 0,
  interest_rate numeric default 0,
  last_interest_calc timestamp with time zone default now(),
  investment_type text default 'compound',
  symbol text,
  currency text default 'ILS',
  quantity numeric default 0,
  owner text default 'joint',
  user_id uuid references public.profiles(id),
  couple_id uuid,
  deep_freeze boolean default false,
  freeze_approved_by uuid,
  target_date date,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now() not null
);

-- Liabilities
create table public.liabilities (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  name text not null,
  type text,
  category text,
  principal numeric,
  current_balance numeric,
  total_amount numeric,
  remaining_amount numeric,
  monthly_payment numeric default 0,
  interest_rate numeric default 0,
  start_date date,
  end_date date,
  owner text check (owner in ('him', 'her', 'joint')) default 'joint',
  created_at timestamp with time zone default now() not null
);

-- Wishlist
create table public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  link text,
  status text check (status in ('pending', 'approved', 'purchased')) default 'pending',
  couple_id uuid,
  requested_by uuid,
  approved_by uuid,
  saved_amount numeric default 0,
  priority integer default 0,
  created_at timestamp with time zone default now() not null
);

-- Wealth History
create table public.wealth_history (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  snapshot_date date not null,
  net_worth numeric not null,
  cash_value numeric,
  investments_value numeric,
  liabilities_value numeric,
  created_at timestamp with time zone default now() not null
);

-- Quests
create table public.quests (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  title text not null,
  description text,
  type text,
  target_category_id uuid,
  target_amount numeric,
  start_date date not null,
  end_date date not null,
  completed boolean default false,
  reward_badge text,
  reward_goal_id uuid,
  created_at timestamp with time zone default now() not null
);

-- 3. STORAGE BUCKETS
-- Create buckets: 'avatars' and 'receipts' in the Supabase Dashboard Storage section.
-- Enable Public Access for both if needed, or use the following policies.

-- 4. RLS POLICIES

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.liabilities enable row level security;
alter table public.wishlist enable row level security;
alter table public.wealth_history enable row level security;
alter table public.quests enable row level security;

-- Example Policy (Apply for all tables)
-- Replace "profiles" with table name for each:
create policy "Users can only access their couple's data" on public.profiles
  for all using (
    couple_id = (select couple_id from public.profiles where id = auth.uid())
  );
-- Repeat for other tables...
```

---

## ☁️ Vercel Deployment

1. **Connect GitHub**: Link your repository to a new Vercel project.
2. **Framework Preset**: Vercel should auto-detect **Next.js**.
3. **Environment Variables**: Copy all keys from your `.env.local` to **Project Settings > Environment Variables**.
4. **Deploy**: Hit the deploy button.

### Automation (Cron Jobs)
To enable **Ghost Subscription detection**, add a `vercel.json` file:
```json
{
  "crons": [
    {
      "path": "/api/ghost-subs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 🛡 Security Note
Ensure your Supabase RLS policies are strictly enforced. The primary isolation key is `couple_id`. Never share your `SUPABASE_SERVICE_ROLE_KEY` or AI API keys.

---

Designed with ❤️ for couples who care about their financial future.
