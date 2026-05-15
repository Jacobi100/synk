-- Migration: 20260515000001_squad_checkout_columns.sql
-- Adds checkout-flow columns to transactions table and updates bounty status constraint

-- 1. Add squad_checkout_url column to store the Squad checkout link
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS squad_checkout_url TEXT;

-- 2. The squad_transaction_ref column was created in the original migration,
--    but ensure it exists (safe if already present)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS squad_transaction_ref TEXT;

-- 3. Update bounty status constraint to include 'funded' alias
--    (our code uses 'paid' but adding 'funded' makes the demo language clearer)
DO $$
BEGIN
  ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

ALTER TABLE bounties ADD CONSTRAINT bounties_status_check
  CHECK (status IN ('open', 'in_progress', 'paid', 'funded', 'completed', 'cancelled'));

-- 4. Index for fast webhook matching by transaction ref
CREATE INDEX IF NOT EXISTS idx_transactions_squad_ref
  ON transactions(squad_transaction_ref)
  WHERE squad_transaction_ref IS NOT NULL;

-- 5. Ensure transactions table has the created_at column (should exist, but guard)
ALTER TABLE transactions
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
