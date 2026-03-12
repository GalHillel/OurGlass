-- Add advanced financial tracking columns to goals (assets)
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS annual_interest_percent DECIMAL DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS tax_rate_percent DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS initial_amount DECIMAL,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS exit_dates JSONB DEFAULT '[]';

-- Update existing goals to have a default annual_interest_percent if they had growth_rate
UPDATE goals 
SET annual_interest_percent = COALESCE(growth_rate, 4.5)
WHERE annual_interest_percent IS NULL;
