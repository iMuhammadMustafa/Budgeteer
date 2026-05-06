-- Create savings buckets table
CREATE TABLE IF NOT EXISTS savingsbuckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    targetamount NUMERIC NOT NULL DEFAULT 0,
    currentamount NUMERIC NOT NULL DEFAULT 0,
    accountid UUID NOT NULL REFERENCES accounts(id),
    icon TEXT NOT NULL DEFAULT 'PiggyBank',
    color TEXT NOT NULL DEFAULT 'primary-100',
    displayorder INTEGER NOT NULL DEFAULT 0,
    tenantid UUID NOT NULL,
    isdeleted BOOLEAN NOT NULL DEFAULT false,
    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
    createdby UUID,
    updatedat TIMESTAMPTZ,
    updatedby UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_savingsbuckets_accountid ON savingsbuckets(accountid);
CREATE INDEX IF NOT EXISTS idx_savingsbuckets_tenantid ON savingsbuckets(tenantid);

-- Enable Row Level Security
ALTER TABLE savingsbuckets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (match existing patterns)
CREATE POLICY "Users can view their own savings buckets"
    ON savingsbuckets FOR SELECT
    USING (tenantid = (auth.jwt() -> 'user_metadata' ->> 'tenantid')::UUID);

CREATE POLICY "Users can insert their own savings buckets"
    ON savingsbuckets FOR INSERT
    WITH CHECK (tenantid = (auth.jwt() -> 'user_metadata' ->> 'tenantid')::UUID);

CREATE POLICY "Users can update their own savings buckets"
    ON savingsbuckets FOR UPDATE
    USING (tenantid = (auth.jwt() -> 'user_metadata' ->> 'tenantid')::UUID);

CREATE POLICY "Users can delete their own savings buckets"
    ON savingsbuckets FOR DELETE
    USING (tenantid = (auth.jwt() -> 'user_metadata' ->> 'tenantid')::UUID);
