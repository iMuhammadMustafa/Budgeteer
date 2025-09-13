-- Consolidate recurring transaction schema
-- Fix column naming to use lowercase (not snake_case) to match Supabase conventions
-- Ensure proper nullable fields for flexible amounts and dates

-- First, rename columns to use lowercase naming convention
ALTER TABLE recurrings RENAME COLUMN interval_months TO intervalmonths;
ALTER TABLE recurrings RENAME COLUMN auto_apply_enabled TO autoapplyenabled;
ALTER TABLE recurrings RENAME COLUMN transfer_account_id TO transferaccountid;
ALTER TABLE recurrings RENAME COLUMN is_amount_flexible TO isamountflexible;
ALTER TABLE recurrings RENAME COLUMN is_date_flexible TO isdateflexible;
ALTER TABLE recurrings RENAME COLUMN recurring_type TO recurringtype;
ALTER TABLE recurrings RENAME COLUMN last_auto_applied_at TO lastautoappliedat;
ALTER TABLE recurrings RENAME COLUMN failed_attempts TO failedattempts;
ALTER TABLE recurrings RENAME COLUMN max_failed_attempts TO maxfailedattempts;

-- Make nextoccurrencedate nullable when date flexible
ALTER TABLE recurrings ALTER COLUMN nextoccurrencedate DROP NOT NULL;

-- Make amount nullable when amount flexible (it should already be nullable)
-- This is just to ensure consistency
ALTER TABLE recurrings ALTER COLUMN amount DROP NOT NULL;

-- Drop old constraints that reference the old column names
DROP INDEX IF EXISTS idx_recurrings_due_auto_apply;
DROP INDEX IF EXISTS idx_recurrings_transfers;
DROP INDEX IF EXISTS idx_recurrings_auto_apply_status;

-- Recreate indexes with new column names
CREATE INDEX idx_recurrings_due_auto_apply 
ON recurrings (nextoccurrencedate, autoapplyenabled, isactive) 
WHERE isdeleted = false;

CREATE INDEX idx_recurrings_transfers 
ON recurrings (recurringtype, transferaccountid) 
WHERE recurringtype = 'Transfer';

CREATE INDEX idx_recurrings_auto_apply_status 
ON recurrings (autoapplyenabled, failedattempts, isactive) 
WHERE isdeleted = false;

-- Drop old constraints and recreate with new column names
ALTER TABLE recurrings DROP CONSTRAINT IF EXISTS check_transfer_account_required;
ALTER TABLE recurrings DROP CONSTRAINT IF EXISTS check_transfer_accounts_different;

-- Recreate constraints with new column names
ALTER TABLE recurrings 
ADD CONSTRAINT check_transfer_account_required 
CHECK (
  (recurringtype != 'Transfer') OR 
  (recurringtype = 'Transfer' AND transferaccountid IS NOT NULL)
);

ALTER TABLE recurrings 
ADD CONSTRAINT check_transfer_accounts_different 
CHECK (
  (recurringtype != 'Transfer') OR 
  (transferaccountid != sourceaccountid)
);

-- Set credit card payments as transfer type with nullable amount
-- Update existing credit card payments to have nullable amount
UPDATE recurrings 
SET amount = NULL 
WHERE recurringtype = 'CreditCardPayment' AND isamountflexible = true;

-- Update comments for documentation
COMMENT ON COLUMN recurrings.intervalmonths IS 'Custom monthly interval (1-24 months)';
COMMENT ON COLUMN recurrings.autoapplyenabled IS 'Whether to automatically apply this recurring transaction on app startup';
COMMENT ON COLUMN recurrings.transferaccountid IS 'Destination account for transfer transactions';
COMMENT ON COLUMN recurrings.isamountflexible IS 'Whether amount can be specified at execution time (can be combined with isdateflexible)';
COMMENT ON COLUMN recurrings.isdateflexible IS 'Whether date can be specified at execution time (can be combined with isamountflexible)';
COMMENT ON COLUMN recurrings.recurringtype IS 'Type of recurring transaction (Standard, Transfer, CreditCardPayment)';
COMMENT ON COLUMN recurrings.lastautoappliedat IS 'Timestamp of last successful auto-application';
COMMENT ON COLUMN recurrings.failedattempts IS 'Number of consecutive failed auto-apply attempts';
COMMENT ON COLUMN recurrings.maxfailedattempts IS 'Maximum failed attempts before disabling auto-apply';
COMMENT ON COLUMN recurrings.nextoccurrencedate IS 'Next occurrence date (nullable when date flexible)';
COMMENT ON COLUMN recurrings.amount IS 'Transaction amount (nullable when amount flexible or for credit card payments)';