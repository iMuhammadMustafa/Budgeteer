-- Add statement date tracking for credit card categories
-- This enables accurate balance calculation between statement dates

-- Add statement date field to account categories
ALTER TABLE accountcategories 
ADD COLUMN statementdate INTEGER;

-- Add constraint to ensure statement date is valid (1-31)
ALTER TABLE accountcategories 
ADD CONSTRAINT check_statement_date_range 
CHECK (
  statementdate IS NULL OR 
  (statementdate >= 1 AND statementdate <= 31)
);

-- Add comment for documentation
COMMENT ON COLUMN accountcategories.statementdate IS 'Day of month (1-31) when credit card statement closes. Only applicable for Liability type categories.';

-- Create index for efficient queries on liability categories with statement dates
CREATE INDEX idx_accountcategories_liability_statement 
ON accountcategories (type, statementdate) 
WHERE type = 'Liability' AND statementdate IS NOT NULL;