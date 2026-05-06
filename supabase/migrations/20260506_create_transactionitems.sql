-- Create transaction items table for sub-items within a transaction
CREATE TABLE IF NOT EXISTS transactionitems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transactionid UUID NOT NULL REFERENCES transactions(id),
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    tenantid UUID NOT NULL,
    isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
    createdby TEXT,
    updatedat TIMESTAMPTZ,
    updatedby TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactionitems_transactionid ON transactionitems(transactionid);
CREATE INDEX IF NOT EXISTS idx_transactionitems_tenantid ON transactionitems(tenantid);

-- Enable RLS
ALTER TABLE transactionitems ENABLE ROW LEVEL SECURITY;

-- RLS policies (match existing transaction policies pattern)
CREATE POLICY "Users can view their own transaction items"
    ON transactionitems FOR SELECT
    USING (tenantid = auth.uid());

CREATE POLICY "Users can insert their own transaction items"
    ON transactionitems FOR INSERT
    WITH CHECK (tenantid = auth.uid());

CREATE POLICY "Users can update their own transaction items"
    ON transactionitems FOR UPDATE
    USING (tenantid = auth.uid());

CREATE POLICY "Users can delete their own transaction items"
    ON transactionitems FOR DELETE
    USING (tenantid = auth.uid());
