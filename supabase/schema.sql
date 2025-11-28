-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  avatar_url text,
  hourly_wage numeric,
  budget numeric default 20000,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text,
  color text,
  type text check (type in ('fixed', 'variable')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  amount numeric not null,
  category_id uuid references public.categories(id),
  user_id uuid references public.profiles(id),
  description text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  is_surprise boolean default false,
  surprise_reveal_date timestamp with time zone,
  location_lat numeric,
  location_lng numeric,
  mood_rating integer check (mood_rating between 1 and 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  amount numeric not null,
  billing_day integer check (billing_day between 1 and 31),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goals (Brick Wall)
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  brick_color text,
  type text check (type in ('cash', 'stock', 'pocket_him', 'pocket_her')) default 'cash',
  growth_rate numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wishlist
create table public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  link text,
  status text check (status in ('pending', 'approved', 'purchased')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.wishlist enable row level security;

-- Allow read/write for authenticated users (simplified for couple app)
create policy "Allow all for authenticated" on public.profiles for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.transactions for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.categories for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.subscriptions for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.goals for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on public.wishlist for all using (auth.role() = 'authenticated');
