-- Enhanced Recurring Transactions Migration
-- This migration adds new fields to support enhanced recurring transaction functionality

-- Create new enum for recurring types
CREATE TYPE RecurringTypes AS ENUM ('Standard', 'Transfer', 'CreditCardPayment');

-- Add new columns to existing recurrings table
ALTER TABLE recurrings 
ADD COLUMN interval_months INTEGER DEFAULT 1 CHECK (interval_months >= 1 AND interval_months <= 24),
ADD COLUMN auto_apply_enabled BOOLEAN DEFAULT false,
ADD COLUMN transfer_account_id UUID REFERENCES accounts(id),
ADD COLUMN is_amount_flexible BOOLEAN DEFAULT false,
ADD COLUMN is_date_flexible BOOLEAN DEFAULT false,
ADD COLUMN recurring_type RecurringTypes DEFAULT 'Standard',
ADD COLUMN last_auto_applied_at TIMESTAMPTZ,
ADD COLUMN failed_attempts INTEGER DEFAULT 0,
ADD COLUMN max_failed_attempts INTEGER DEFAULT 3;

-- Create index for efficient due transaction queries
CREATE INDEX idx_recurrings_due_auto_apply 
ON recurrings (nextoccurrencedate, auto_apply_enabled, isactive) 
WHERE isdeleted = false;

-- Create index for transfer queries
CREATE INDEX idx_recurrings_transfers 
ON recurrings (recurring_type, transfer_account_id) 
WHERE recurring_type = 'Transfer';

-- Create index for auto-apply queries
CREATE INDEX idx_recurrings_auto_apply_status 
ON recurrings (auto_apply_enabled, failed_attempts, isactive) 
WHERE isdeleted = false;

-- Add constraint to ensure transfer_account_id is required for Transfer type
ALTER TABLE recurrings 
ADD CONSTRAINT check_transfer_account_required 
CHECK (
  (recurring_type = 'Transfer' AND transfer_account_id IS NOT NULL) OR 
  (recurring_type != 'Transfer')
);

-- Add constraint to ensure transfer accounts are different from source
ALTER TABLE recurrings 
ADD CONSTRAINT check_transfer_accounts_different 
CHECK (
  (recurring_type = 'Transfer' AND transfer_account_id != sourceaccountid) OR 
  (recurring_type != 'Transfer')
);

-- Add constraint to ensure either amount or date is specified (not both flexible)
ALTER TABLE recurrings 
ADD CONSTRAINT check_amount_or_date_specified 
CHECK (NOT (is_amount_flexible = true AND is_date_flexible = true));

-- Update RLS policies to include new fields (existing policy should cover new columns)
-- No additional RLS changes needed as the existing tenant-based policy covers all columns

-- Add comments for documentation
COMMENT ON COLUMN recurrings.interval_months IS 'Custom monthly interval (1-24 months)';
COMMENT ON COLUMN recurrings.auto_apply_enabled IS 'Whether to automatically apply this recurring transaction on app startup';
COMMENT ON COLUMN recurrings.transfer_account_id IS 'Destination account for transfer transactions';
COMMENT ON COLUMN recurrings.is_amount_flexible IS 'Whether amount can be specified at execution time';
COMMENT ON COLUMN recurrings.is_date_flexible IS 'Whether date can be specified at execution time';
COMMENT ON COLUMN recurrings.recurring_type IS 'Type of recurring transaction (Standard, Transfer, CreditCardPayment)';
COMMENT ON COLUMN recurrings.last_auto_applied_at IS 'Timestamp of last successful auto-application';
COMMENT ON COLUMN recurrings.failed_attempts IS 'Number of consecutive failed auto-apply attempts';
COMMENT ON COLUMN recurrings.max_failed_attempts IS 'Maximum failed attempts before disabling auto-apply';