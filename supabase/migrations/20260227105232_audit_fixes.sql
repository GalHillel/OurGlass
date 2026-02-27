-- Migration: Audit Fixes and Improvements
-- Created: 20260227105232

-- 1. Helper function for automated updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- 2. Add missing columns and Foreign Keys
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_partner_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.profiles(id);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_lat numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS location_lng numeric;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.wishlist ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.wealth_history ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Add Performance Indexes
CREATE INDEX IF NOT EXISTS profiles_couple_id_idx ON public.profiles (couple_id);
CREATE INDEX IF NOT EXISTS categories_couple_id_idx ON public.categories (couple_id);
CREATE INDEX IF NOT EXISTS goals_couple_id_idx ON public.goals (couple_id);
CREATE INDEX IF NOT EXISTS transactions_category_id_idx ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS subscriptions_category_id_idx ON public.subscriptions (category_id);

-- 4. Set up updated_at triggers
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_transactions_updated_at ON public.transactions;
CREATE TRIGGER handle_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_goals_updated_at ON public.goals;
CREATE TRIGGER handle_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_wishlist_updated_at ON public.wishlist;
CREATE TRIGGER handle_wishlist_updated_at BEFORE UPDATE ON public.wishlist FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_liabilities_updated_at ON public.liabilities;
CREATE TRIGGER handle_liabilities_updated_at BEFORE UPDATE ON public.liabilities FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_wealth_history_updated_at ON public.wealth_history;
CREATE TRIGGER handle_wealth_history_updated_at BEFORE UPDATE ON public.wealth_history FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
