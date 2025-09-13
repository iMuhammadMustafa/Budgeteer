-- Migration: Change Transactions.Date from TIMESTAMPTZ to TIMESTAMP (no time zone)
ALTER TABLE "Transactions"
    ALTER COLUMN "Date" TYPE TIMESTAMP
    USING "Date" AT TIME ZONE 'UTC';
