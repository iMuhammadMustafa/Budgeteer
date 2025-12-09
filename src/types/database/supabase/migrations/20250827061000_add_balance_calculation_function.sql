-- Create RPC function for efficient account balance calculation at a specific date
-- This function is used by the statement balance calculation feature

CREATE OR REPLACE FUNCTION get_account_balance_at_date(
  p_account_id UUID,
  p_date TIMESTAMPTZ,
  p_tenant_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance_result NUMERIC;
BEGIN
  -- Calculate the sum of all transactions for the account up to the specified date
  SELECT COALESCE(SUM(amount), 0)
  INTO balance_result
  FROM transactions
  WHERE accountid = p_account_id
    AND tenantid = p_tenant_id
    AND isdeleted = false
    AND date <= p_date;
  
  RETURN balance_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_account_balance_at_date(UUID, TIMESTAMPTZ, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_account_balance_at_date(UUID, TIMESTAMPTZ, UUID) IS 'Calculates the account balance at a specific date by summing all transactions up to that date. Used for credit card statement balance calculations.';