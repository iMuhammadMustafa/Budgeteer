-- Allow both flexible amount and flexible date simultaneously
-- This removes the constraint that prevented both from being true at the same time

-- Drop the constraint that prevents both flexible amount and date
ALTER TABLE recurrings 
DROP CONSTRAINT IF EXISTS check_amount_or_date_specified;

-- Add comment explaining the change
COMMENT ON COLUMN recurrings.is_amount_flexible IS 'Whether amount can be specified at execution time (can be combined with is_date_flexible)';
COMMENT ON COLUMN recurrings.is_date_flexible IS 'Whether date can be specified at execution time (can be combined with is_amount_flexible)';