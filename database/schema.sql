-- OurGlass Production Database Schema
-- Last updated: 2026-03-12
-- This schema initializes the core tables, functions, and RLS policies for OurGlass.

-- ───────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ───────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────────────────────────────────────────
-- HELPERS & UTILITIES
-- ───────────────────────────────────────────────────────────────────────────────

-- Get the couple_id for the current authenticated user
create or replace function public.current_couple_id()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return (select couple_id from public.profiles where id = auth.uid());
end;
$$;

-- Alias for current_couple_id
create or replace function public.get_my_couple_id()
returns uuid language sql stable as $$
  select public.current_couple_id();
$$;

-- Automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ───────────────────────────────────────────────────────────────────────────────

-- User Profiles
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  avatar_url text,
  hourly_wage numeric,
  budget numeric default 20000,
  monthly_income numeric,
  joint_account boolean default true,
  couple_id uuid,
  partner_id uuid references public.profiles(id),
  pocket_him numeric default 0,
  pocket_her numeric default 0,
  income_split_ratio numeric default 0.5,
  onboarding_completed boolean default false,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transaction Categories
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  color text,
  type text check (type in ('fixed', 'variable')) not null,
  couple_id uuid,
  budget_limit numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial Transactions
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  user_id uuid references public.profiles(id),
  type text not null check (type in ('expense', 'income', 'transfer', 'adjustment')) default 'expense',
  amount numeric not null check (amount > 0),
  idempotency_key uuid not null default uuid_generate_v4(),
  category_id uuid references public.categories(id),
  category text,
  payer text check (payer in ('him', 'her', 'joint')),
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  is_surprise boolean default false,
  surprise_reveal_date timestamp with time zone,
  mood_rating integer check (mood_rating between 1 and 5),
  receipt_url text,
  location_lat numeric,
  location_lng numeric,
  is_auto_generated boolean default false,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recurring Subscriptions
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  name text not null,
  amount numeric not null check (amount >= 0),
  billing_day integer check (billing_day between 1 and 31),
  owner text check (owner in ('him', 'her', 'joint')),
  category_id uuid references public.categories(id),
  category text,
  active boolean default true,
  status text,
  usage_rating integer,
  last_auto_transaction timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial Goals & Assets
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  name text not null,
  target_amount numeric not null default 0 check (target_amount >= 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  brick_color text,
  type text check (type in ('cash', 'stock', 'pocket_him', 'pocket_her', 'money_market', 'foreign_currency', 'wish')) default 'cash',
  investment_type text,
  growth_rate numeric default 0,
  deep_freeze boolean default false,
  owner text check (owner in ('him', 'her', 'joint')),
  target_date date,
  interest_rate numeric default 0 check (interest_rate >= 0),
  last_accrual_timestamp timestamp with time zone,
  symbol text,
  currency text,
  quantity numeric check (quantity is null or quantity >= 0),
  last_updated timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shared Wishlist
create table if not exists public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  name text not null,
  price numeric not null check (price >= 0),
  link text,
  status text check (status in ('pending', 'approved', 'purchased')) default 'pending',
  requested_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  saved_amount numeric default 0 check (saved_amount >= 0),
  priority integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Liabilities & Loans
create table if not exists public.liabilities (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  name text not null,
  category text,
  total_amount numeric default 0,
  remaining_amount numeric default 0,
  monthly_payment numeric default 0,
  interest_rate numeric default 0,
  start_date date,
  end_date date,
  type text,
  principal numeric,
  current_balance numeric,
  owner text check (owner in ('him', 'her', 'joint')) default 'joint',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wealth History Snapshot
create table if not exists public.wealth_history (
  id uuid default uuid_generate_v4() primary key,
  couple_id uuid not null,
  snapshot_date date not null,
  net_worth numeric not null default 0,
  cash_value numeric not null default 0,
  investments_value numeric not null default 0,
  liabilities_value numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ───────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────────────────────────

create index if not exists profiles_couple_id_idx on public.profiles (couple_id);
create index if not exists categories_couple_id_idx on public.categories (couple_id);
create index if not exists transactions_couple_date_idx on public.transactions (couple_id, date desc);
create unique index if not exists transactions_couple_idempotency_key_uidx on public.transactions (couple_id, idempotency_key);
create index if not exists transactions_category_id_idx on public.transactions (category_id);
create index if not exists subscriptions_couple_idx on public.subscriptions (couple_id);
create index if not exists subscriptions_category_id_idx on public.subscriptions (category_id);
create index if not exists goals_couple_idx on public.goals (couple_id);
create index if not exists wishlist_couple_idx on public.wishlist (couple_id);
create index if not exists liabilities_couple_idx on public.liabilities (couple_id);
create index if not exists wealth_history_couple_date_idx on public.wealth_history (couple_id, snapshot_date desc);

-- ───────────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────────

create trigger handle_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_categories_updated_at before update on public.categories for each row execute procedure public.handle_updated_at();
create trigger handle_transactions_updated_at before update on public.transactions for each row execute procedure public.handle_updated_at();
create trigger handle_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.handle_updated_at();
create trigger handle_goals_updated_at before update on public.goals for each row execute procedure public.handle_updated_at();
create trigger handle_wishlist_updated_at before update on public.wishlist for each row execute procedure public.handle_updated_at();
create trigger handle_liabilities_updated_at before update on public.liabilities for each row execute procedure public.handle_updated_at();
create trigger handle_wealth_history_updated_at before update on public.wealth_history for each row execute procedure public.handle_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS (ROW LEVEL SECURITY)
-- ───────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.wishlist enable row level security;
alter table public.liabilities enable row level security;
alter table public.wealth_history enable row level security;

-- Profiles Policies
create policy "Users can see own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can see partner's profile" on public.profiles for select using (couple_id is not null and couple_id = public.current_couple_id());
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Categories Policies
create policy "Everyone can read categories" on public.categories for select using (auth.role() = 'authenticated' and (couple_id is null or couple_id = public.current_couple_id()));
create policy "Couples can manage their own categories" on public.categories for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update their own categories" on public.categories for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete their own categories" on public.categories for delete using (couple_id = public.current_couple_id());

-- Transaction Policies
create policy "Couples can read transactions" on public.transactions for select using (couple_id = public.current_couple_id());
create policy "Couples can insert transactions" on public.transactions for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update transactions" on public.transactions for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete transactions" on public.transactions for delete using (couple_id = public.current_couple_id());

-- Subscription Policies
create policy "Couples can read subscriptions" on public.subscriptions for select using (couple_id = public.current_couple_id());
create policy "Couples can insert subscriptions" on public.subscriptions for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update subscriptions" on public.subscriptions for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete subscriptions" on public.subscriptions for delete using (couple_id = public.current_couple_id());

-- Goal/Asset Policies
create policy "Couples can read goals" on public.goals for select using (couple_id = public.current_couple_id());
create policy "Couples can insert goals" on public.goals for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update goals" on public.goals for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete goals" on public.goals for delete using (couple_id = public.current_couple_id());

-- Wishlist Policies
create policy "Couples can read wishlist" on public.wishlist for select using (couple_id = public.current_couple_id());
create policy "Couples can insert wishlist" on public.wishlist for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update wishlist" on public.wishlist for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete wishlist" on public.wishlist for delete using (couple_id = public.current_couple_id());

-- Liability Policies
create policy "Couples can read liabilities" on public.liabilities for select using (couple_id = public.current_couple_id());
create policy "Couples can insert liabilities" on public.liabilities for insert with check (couple_id = public.current_couple_id());
create policy "Couples can update liabilities" on public.liabilities for update using (couple_id = public.current_couple_id()) with check (couple_id = public.current_couple_id());
create policy "Couples can delete liabilities" on public.liabilities for delete using (couple_id = public.current_couple_id());

-- Wealth History Policies
create policy "Couples can read wealth history" on public.wealth_history for select using (couple_id = public.current_couple_id());

-- ───────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS & PROCEDURES
-- ───────────────────────────────────────────────────────────────────────────────

-- Accrue yield for a couple's assets
create or replace function public.accrue_yield_for_couple(
  p_couple_id uuid,
  p_min_interval_seconds integer default 3600
)
returns integer
language plpgsql
as $$
declare
  updated_count integer := 0;
  now_utc timestamp with time zone := timezone('utc'::text, now());
  seconds_per_year numeric := 365 * 24 * 60 * 60;
begin
  update public.goals g
  set
    current_amount = g.current_amount * power(
      1 + (g.interest_rate / 100),
      (extract(epoch from (now_utc - coalesce(g.last_accrual_timestamp, g.created_at))) / seconds_per_year)
    ),
    last_accrual_timestamp = now_utc,
    last_updated = now_utc
  where
    g.couple_id = p_couple_id
    and g.interest_rate is not null
    and g.interest_rate > 0
    and g.current_amount is not null
    and g.current_amount >= 0
    and (
      g.last_accrual_timestamp is null
      or extract(epoch from (now_utc - g.last_accrual_timestamp)) >= p_min_interval_seconds
    );

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- Handle user signup and profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_couple_id uuid := uuid_generate_v4();
begin
  insert into public.profiles (id, name, couple_id, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new_couple_id,
    false
  );
  return new;
end;
$$;

-- Signup trigger
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
