-- Performance indexes for stats views and common query patterns
-- Created: 2025-02-13

-- Composite indexes for common filter patterns on all tables
CREATE INDEX IF NOT EXISTS "AccountCategories_TenantId_IsDeleted" 
  ON AccountCategories (TenantId, IsDeleted);

CREATE INDEX IF NOT EXISTS "Accounts_TenantId_IsDeleted" 
  ON Accounts (TenantId, IsDeleted);

CREATE INDEX IF NOT EXISTS "TransactionGroups_TenantId_IsDeleted" 
  ON TransactionGroups (TenantId, IsDeleted);

CREATE INDEX IF NOT EXISTS "TransactionCategories_TenantId_IsDeleted" 
  ON TransactionCategories (TenantId, IsDeleted);

CREATE INDEX IF NOT EXISTS "Transactions_TenantId_IsDeleted" 
  ON Transactions (TenantId, IsDeleted);

-- Stats-specific indexes for date range and type queries
CREATE INDEX IF NOT EXISTS "Transactions_TenantId_Date_Type" 
  ON Transactions (TenantId, Date, Type) 
  WHERE IsDeleted = false;

CREATE INDEX IF NOT EXISTS "Transactions_Stats_Categories" 
  ON Transactions (TenantId, CategoryId, Date, Type, Amount) 
  WHERE IsDeleted = false;

-- Join performance indexes
CREATE INDEX IF NOT EXISTS "Transactions_CategoryId" 
  ON Transactions (CategoryId) 
  WHERE IsDeleted = false;

CREATE INDEX IF NOT EXISTS "TransactionCategories_GroupId" 
  ON TransactionCategories (GroupId) 
  WHERE IsDeleted = false;
