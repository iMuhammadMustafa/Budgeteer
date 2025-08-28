-- Test data for Enhanced Recurring Transactions Migration
-- This script inserts sample data to test all enhanced recurring transaction features

-- Insert test data

INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  'ec6ee1c0-27dc-422e-9288-0b78b4b2e84d',
  'Monthly Rent Payment',
  '0ccc1e5b-7f84-4aa0-9e08-461e9c148398',
  '883f1486-bb0c-4af6-bde4-8dc45495d3ba',
  1200,
  'Expense',
  'Monthly rent payment',
  'USD',
  'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1',
  '2025-02-01',
  true,
  1,
  true,
  NULL,
  false,
  false,
  'Standard',
  NULL,
  0,
  3,
  'a6451801-a930-43ec-bd39-7db57b16cd4f',
  false,
  '2025-01-01T00:00:00.000Z'
);
INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  'f8a26a2e-44e2-4b04-934e-1ff4e5d3413a',
  'Monthly Savings Transfer',
  '0ccc1e5b-7f84-4aa0-9e08-461e9c148398',
  NULL,
  500,
  'Transfer',
  'Transfer to savings account',
  'USD',
  'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15',
  '2025-02-15',
  true,
  1,
  false,
  'b047cac2-1a4b-4fa2-9e86-d058ee81285b',
  false,
  false,
  'Transfer',
  NULL,
  0,
  3,
  'a6451801-a930-43ec-bd39-7db57b16cd4f',
  false,
  '2025-01-01T00:00:00.000Z'
);
INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  '4e364fd1-a7fb-4c92-ab8e-9f4e2e15b28b',
  'Credit Card Statement Payment',
  '0ccc1e5b-7f84-4aa0-9e08-461e9c148398',
  '883f1486-bb0c-4af6-bde4-8dc45495d3ba',
  NULL,
  'Expense',
  'Pay credit card statement balance',
  'USD',
  'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=25',
  '2025-02-25',
  true,
  1,
  true,
  'b047cac2-1a4b-4fa2-9e86-d058ee81285b',
  true,
  false,
  'CreditCardPayment',
  NULL,
  0,
  5,
  'a6451801-a930-43ec-bd39-7db57b16cd4f',
  false,
  '2025-01-01T00:00:00.000Z'
);
INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  'd0511737-063d-4b53-b9a1-3f879be37fcb',
  'Quarterly Insurance Payment',
  '0ccc1e5b-7f84-4aa0-9e08-461e9c148398',
  '883f1486-bb0c-4af6-bde4-8dc45495d3ba',
  450,
  'Expense',
  'Quarterly insurance premium',
  'USD',
  'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1',
  '2025-04-01',
  true,
  3,
  false,
  NULL,
  false,
  false,
  'Standard',
  NULL,
  0,
  3,
  'a6451801-a930-43ec-bd39-7db57b16cd4f',
  false,
  '2025-01-01T00:00:00.000Z'
);
INSERT INTO recurrings (
  id, name, sourceaccountid, categoryid, amount, type, description, 
  currencycode, recurrencerule, nextoccurrencedate, isactive,
  interval_months, auto_apply_enabled, transfer_account_id, 
  is_amount_flexible, is_date_flexible, recurring_type,
  last_auto_applied_at, failed_attempts, max_failed_attempts,
  tenantid, isdeleted, createdat
) VALUES (
  '8c4664b5-735c-4453-a71d-690da1fe5384',
  'Variable Utility Payment',
  '0ccc1e5b-7f84-4aa0-9e08-461e9c148398',
  '883f1486-bb0c-4af6-bde4-8dc45495d3ba',
  NULL,
  'Expense',
  'Monthly utility bill (amount varies)',
  'USD',
  'FREQ=MONTHLY;INTERVAL=1',
  NULL,
  true,
  1,
  false,
  NULL,
  true,
  true,
  'Standard',
  NULL,
  0,
  3,
  'a6451801-a930-43ec-bd39-7db57b16cd4f',
  false,
  '2025-01-01T00:00:00.000Z'
);

-- Validation queries to test the migration
SELECT 
  name,
  recurring_type,
  interval_months,
  auto_apply_enabled,
  is_amount_flexible,
  is_date_flexible,
  failed_attempts
FROM recurrings 
WHERE isdeleted = false
ORDER BY name;

-- Test due transactions query (should use the new index)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM recurrings 
WHERE nextoccurrencedate <= CURRENT_DATE 
  AND auto_apply_enabled = true 
  AND isactive = true 
  AND isdeleted = false;

-- Test transfer transactions query
SELECT 
  name,
  sourceaccountid,
  transfer_account_id,
  recurring_type
FROM recurrings 
WHERE recurring_type = 'Transfer' 
  AND isdeleted = false;
