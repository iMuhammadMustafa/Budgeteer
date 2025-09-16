-- CREATE OR REPLACE FUNCTION SetDefaultValues()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- IF NEW."CreatedBy" IS NULL THEN
--     --     NEW."CreatedBy" = auth.uid();
--     -- END IF;
--     -- IF NEW."CreatedAt" IS NULL THEN
--     --     NEW."CreatedAt" = CURRENT_TIMESTAMP;
--     -- END IF;
--     IF NEW."TenantId" IS NULL THEN
--         NEW."TenantId" = auth.tenantid();
--     END IF;
--     RETURN NEW;
-- END;


CREATE Type AccountTypes AS ENUM ('Asset', 'Liability');

create table AccountCategories
(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,

    Name TEXT NOT NULL, 
    Type AccountTypes NOT NULL DEFAULT 'Asset',

    DisplayOrder INT NOT NULL DEFAULT 0,
    
    Icon TEXT NOT NULL DEFAULT 'Ellipsis'::text,
    Color TEXT NOT NULL DEFAULT 'warning-100',

    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,

    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    TenantId UUID NOT NULL DEFAULT auth.tenantid()
);

Alter table AccountCategories Enable Row Level Security; 
CREATE POLICY "Tenant access" ON AccountCategories as PERMISSIVE for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "AccountCategories_TenantId" ON AccountCategories (TenantId);
CREATE INDEX "AccountCategories_IsDeleted" ON AccountCategories (IsDeleted);
-- CREATE POLICY "Tenant insert" ON AccountCategories FOR INSERT WITH CHECK (TenantId = auth.jwt()->>'tenantid');
-- CREATE TRIGGER SetDefaultValues BEFORE INSERT ON AccountCategories FOR EACH ROW EXECUTE FUNCTION SetDefaultValues();

create table Accounts
(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    

    Balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    Name TEXT NOT NULL,
    Owner TEXT,
    Description TEXT,
    Notes TEXT,
    Currency TEXT NOT NULL DEFAULT 'USD',
    
    Icon TEXT NOT NULL DEFAULT 'Ellipsis'::text,
    Color TEXT NOT NULL DEFAULT 'warning-100',
    DisplayOrder INT NOT NULL DEFAULT 0,
    
    CategoryId UUID NOT NULL,

    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,

    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    TenantId UUID NOT NULL DEFAULT auth.tenantid(),

    FOREIGN KEY (CategoryId) REFERENCES AccountCategories(Id)
);

Alter table Accounts Enable Row Level Security;
CREATE POLICY "Tenant access" ON Accounts as PERMISSIVE  for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "Accounts_TenantId" ON Accounts (TenantId);
CREATE INDEX "Accounts_IsDeleted" ON Accounts (IsDeleted);


CREATE Type TransactionTypes AS ENUM ('Expense', 'Income', 'Transfer', 'Adjustment', 'Initial', 'Refund');

CREATE TABLE TransactionGroups
(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    
    Name TEXT NOT NULL,
    Description TEXT,
    Type TransactionTypes NOT NULL DEFAULT 'Expense',
    
    BudgetAmount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    BudgetFrequency TEXT NOT NULL DEFAULT 'Monthly', 

    Icon TEXT NOT NULL DEFAULT 'Ellipsis'::text,
    Color TEXT NOT NULL DEFAULT 'warning-100',
    DisplayOrder INT NOT NULL DEFAULT 0,
    
    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    TenantId UUID NOT NULL DEFAULT auth.tenantid()
);

Alter table TransactionGroups Enable Row Level Security;
CREATE POLICY "Tenant access" ON TransactionGroups as PERMISSIVE for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "TransactionGroups_TenantId" ON TransactionGroups (TenantId);
CREATE INDEX "TransactionGroups_IsDeleted" ON TransactionGroups (IsDeleted);
-- CREATE TRIGGER SetDefaultValues BEFORE INSERT ON TransactionGroups FOR EACH ROW EXECUTE FUNCTION SetDefaultValues();


CREATE TABLE TransactionCategories(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    
    Name TEXT,
    Description TEXT,
    Type TransactionTypes NOT NULL DEFAULT 'Expense',
    
    BudgetAmount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    BudgetFrequency TEXT NOT NULL DEFAULT 'Monthly',

    GroupId UUID NOT NULL,

    Icon TEXT NOT NULL DEFAULT 'Ellipsis'::text,
    Color TEXT NOT NULL DEFAULT 'warning-100',
    DisplayOrder INT NOT NULL DEFAULT 0,
    
    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    TenantId UUID NOT NULL,

    FOREIGN KEY (GroupId) REFERENCES TransactionGroups(Id)
);

Alter table TransactionCategories Enable Row Level Security;
CREATE POLICY "Tenant access" ON TransactionCategories as PERMISSIVE for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "TransactionCategories_TenantId" ON TransactionCategories (TenantId);
CREATE INDEX "TransactionCategories_IsDeleted" ON TransactionCategories (IsDeleted);
-- CREATE TRIGGER SetDefaultValues BEFORE INSERT ON TransactionCategories FOR EACH ROW EXECUTE FUNCTION SetDefaultValues();


CREATE Type TransactionStatuses AS ENUM ('Clear', 'Void');

CREATE TABLE Transactions
(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,

    Name TEXT NOT NULL,
    Date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    -- RunningBalance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    Type TransactionTypes NOT NULL DEFAULT 'Expense',
    Payee TEXT,
    
    Description TEXT,
    IsVoid BOOLEAN NOT NULL DEFAULT FALSE,
    Notes TEXT,
    Tags TEXT[],

    CategoryId UUID NOT NULL,
    AccountId UUID NOT NULL,
    TransferId UUID,
    TransferAccountId UUID,

        
    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    TenantId UUID NOT NULL DEFAULT auth.tenantid(),

    FOREIGN KEY (AccountId) REFERENCES Accounts(Id),
    FOREIGN KEY (CategoryId) REFERENCES TransactionCategories(Id),
    FOREIGN KEY (TransferId) REFERENCES Transactions(Id),
    FOREIGN KEY (TransferAccountId) REFERENCES Accounts(Id)
);

Alter table Transactions Enable Row Level Security;
CREATE POLICY "Tenant access" ON Transactions as PERMISSIVE  for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "Transactions_TenantId" ON Transactions (TenantId);
CREATE INDEX "Transactions_IsDeleted" ON Transactions (IsDeleted);
CREATE INDEX "Transactions_Accountid_Date" ON transactions (accountid, date, id) WHERE IsDeleted = false AND IsVoid = false;;
-- CREATE INDEX "Transactions_Accountid_Date" ON transactions (accountid, date, createdat, updatedat, type, id);


CREATE TABLE Configruations
(
    Id UUID DEFAULT uuid_generate_v7() PRIMARY KEY,
    
    TableName TEXT NOT NULL,
    "type" TEXT NOT NULL,
    KEY TEXT NOT NULL,
    Value TEXT NOT NULL,
    
    
    CreatedBy UUID DEFAULT auth.uid(),
    CreatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedBy UUID DEFAULT auth.uid(),
    UpdatedAt TIMESTAMPTZ,
    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    TenantId UUID DEFAULT auth.tenantid()
);
ALTER TABLE Configruations Enable Row Level Security;
CREATE POLICY "Tenant access" ON Configruations as PERMISSIVE for ALL USING (TenantId = auth.tenantid());
CREATE INDEX "Configruations_TenantId" ON Configruations (TenantId);
CREATE INDEX "Configruations_IsDeleted" ON Configruations (IsDeleted);

-- Add Recurrings Table
CREATE TABLE IF NOT EXISTS recurrings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    createdby uuid REFERENCES auth.users(id),
    createdat timestamptz DEFAULT now(),
    updatedby uuid REFERENCES auth.users(id),
    updatedat timestamptz DEFAULT now(),
    isdeleted boolean DEFAULT false,
    tenantid uuid NOT NULL,
    name text NOT NULL,
    description text,
    Type TransactionTypes NOT NULL DEFAULT 'Expense',
    nextoccurrencedate date NOT NULL,
    recurrencerule text NOT NULL, -- e.g., 'FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15'
    enddate date,
    amount numeric(12, 2),
    currencycode char(3) NOT NULL DEFAULT 'USD',
    sourceaccountid uuid NOT NULL REFERENCES accounts(id),
    categoryid uuid NOT NULL REFERENCES TransactionCategories(id),
    payeename text,
    notes text,
    isactive boolean DEFAULT true,
    lastexecutedat timestamptz

    FOREIGN KEY (sourceaccountid) REFERENCES accounts(id),
    FOREIGN KEY (categoryid) REFERENCES TransactionCategories(id)

);

-- RLS Policies for Recurrings Table
Alter table recurrings Enable Row Level Security;
-- Note: The RLS policy references TenantId. If tenant_id was renamed to tenantId,
-- this policy might need to be updated if it was created before the rename.
-- However, if the RENAME happens before this policy is applied in a fresh setup, it should use the new name.
-- For existing databases, ensure the policy condition uses the new column name if it was already created.
CREATE POLICY "Tenant access" ON recurrings as PERMISSIVE  for ALL USING (tenantId = auth.tenantid()); -- Assuming tenantId is the new name
CREATE INDEX IF NOT EXISTS "Recurrings_TenantId" ON Recurrings (tenantId); -- Assuming tenantId is the new name
CREATE INDEX IF NOT EXISTS "Recurrings_IsDeleted" ON Recurrings (isDeleted); -- Assuming isDeleted is the new name
