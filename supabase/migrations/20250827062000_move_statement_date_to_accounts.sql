-- Move statement date from account categories to individual accounts
-- This allows each credit card account to have its own statement date

-- First, add statement date field to accounts table
ALTER TABLE accounts 
ADD COLUMN statementdate INTEGER;

-- Add constraint to ensure statement date is valid (1-31)
ALTER TABLE accounts 
ADD CONSTRAINT check_account_statement_date_range 
CHECK (
  statementdate IS NULL OR 
  (statementdate >= 1 AND statementdate <= 31)
);

-- Migrate existing statement dates from account categories to accounts
-- Only for liability accounts (credit cards)
UPDATE accounts 
SET statementdate = ac.statementdate
FROM accountcategories ac
WHERE accounts.categoryid = ac.id 
  AND ac.type = 'Liability' 
  AND ac.statementdate IS NOT NULL;

-- Remove statement date from account categories (if it exists)
ALTER TABLE accountcategories 
DROP COLUMN IF EXISTS statementdate;

-- Drop the old constraint and index if they exist
ALTER TABLE accountcategories 
DROP CONSTRAINT IF EXISTS check_statement_date_range;

DROP INDEX IF EXISTS idx_accountcategories_liability_statement;

-- Create new index for efficient queries on accounts with statement dates
CREATE INDEX idx_accounts_liability_statement 
ON accounts (categoryid, statementdate) 
WHERE statementdate IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.statementdate IS 'Day of month (1-31) when credit card statement closes. Only applicable for Liability type accounts (credit cards).';