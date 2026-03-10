-- Fix Wealth History Sync: Add Unique Constraint and RLS Policies
-- This enables client-side UPSERT and ensures data security.

-- 1. Add Unique Constraint for UPSERT (onConflict)
-- If it already exists, this will do nothing (or we can use if not exists if supported, but usually we just try to add it)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wealth_history_couple_id_snapshot_date_key'
    ) THEN
        ALTER TABLE public.wealth_history 
        ADD CONSTRAINT wealth_history_couple_id_snapshot_date_key 
        UNIQUE (couple_id, snapshot_date);
    END IF;
END $$;

-- 2. Add RLS Policies for Writes
-- Existing policy only allows SELECT. We need INSERT and UPDATE.

DROP POLICY IF EXISTS "Couples can insert wealth history" ON public.wealth_history;
CREATE POLICY "Couples can insert wealth history" ON public.wealth_history
    FOR INSERT WITH CHECK (couple_id = public.current_couple_id());

DROP POLICY IF EXISTS "Couples can update wealth history" ON public.wealth_history;
CREATE POLICY "Couples can update wealth history" ON public.wealth_history
    FOR UPDATE USING (couple_id = public.current_couple_id())
    WITH CHECK (couple_id = public.current_couple_id());

-- 3. Ensure Index for Performance
CREATE INDEX IF NOT EXISTS wealth_history_couple_snapshot_idx ON public.wealth_history (couple_id, snapshot_date);
