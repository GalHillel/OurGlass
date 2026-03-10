-- Add dashboard_config JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dashboard_config JSONB DEFAULT NULL;

-- Description of the column:
-- dashboard_config stores the user's layout preferences, including:
-- {
--   "widgets": [{"id": String, "enabled": Boolean, "order": Number}],
--   "navItems": [{"id": String, "enabled": Boolean, "order": Number}],
--   "features": { "featureKey": Boolean }
-- }
