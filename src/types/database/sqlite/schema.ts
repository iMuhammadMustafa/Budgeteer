import { TableNames } from "../TableNames";

/**
 * SQLite Schema Definitions
 * These match Supabase schema exactly (Supabase is the source of truth)
 */

export const CREATE_ACCOUNT_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.AccountCategories} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Asset', 'Liability')),
    color TEXT NOT NULL DEFAULT 'error-100',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    displayorder INTEGER NOT NULL DEFAULT 0,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  )
`;

export const CREATE_ACCOUNTS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.Accounts} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    color TEXT NOT NULL DEFAULT 'error-100',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    description TEXT,
    notes TEXT,
    owner TEXT,
    displayorder INTEGER NOT NULL DEFAULT 0,
    statementdate INTEGER,
    categoryid TEXT NOT NULL,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT,
    FOREIGN KEY (categoryid) REFERENCES ${TableNames.AccountCategories}(id)
  )
`;

export const CREATE_TRANSACTION_GROUPS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.TransactionGroups} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Expense', 'Income', 'Transfer', 'Adjustment', 'Initial', 'Refund')),
    color TEXT NOT NULL DEFAULT 'error-100',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    description TEXT,
    displayorder INTEGER NOT NULL DEFAULT 0,
    budgetamount REAL NOT NULL DEFAULT 0,
    budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  )
`;

export const CREATE_TRANSACTION_CATEGORIES_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.TransactionCategories} (
    id TEXT PRIMARY KEY,
    name TEXT,
    groupid TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Expense', 'Income', 'Transfer', 'Adjustment', 'Initial', 'Refund')),
    color TEXT NOT NULL DEFAULT 'error-100',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    description TEXT,
    displayorder INTEGER NOT NULL DEFAULT 0,
    budgetamount REAL NOT NULL DEFAULT 0,
    budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT,
    FOREIGN KEY (groupid) REFERENCES ${TableNames.TransactionGroups}(id)
  )
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.Transactions} (
    id TEXT PRIMARY KEY,
    name TEXT,
    amount REAL NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    description TEXT,
    payee TEXT,
    notes TEXT,
    tags TEXT,
    type TEXT NOT NULL CHECK(type IN ('Expense', 'Income', 'Transfer', 'Adjustment', 'Initial', 'Refund')),
    accountid TEXT NOT NULL,
    categoryid TEXT NOT NULL,
    transferaccountid TEXT,
    transferid TEXT,
    isvoid INTEGER NOT NULL DEFAULT 0,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT,
    FOREIGN KEY (accountid) REFERENCES ${TableNames.Accounts}(id),
    FOREIGN KEY (categoryid) REFERENCES ${TableNames.TransactionCategories}(id),
    FOREIGN KEY (transferaccountid) REFERENCES ${TableNames.Accounts}(id),
    FOREIGN KEY (transferid) REFERENCES ${TableNames.Transactions}(id)
  )
`;

export const CREATE_CONFIGURATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.Configurations} (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL,
    "table" TEXT NOT NULL,
    tenantid TEXT,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT
  )
`;

export const CREATE_RECURRINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS ${TableNames.Recurrings} (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL,
    currencycode TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    notes TEXT,
    payeename TEXT,
    type TEXT NOT NULL CHECK(type IN ('Expense', 'Income', 'Transfer', 'Adjustment', 'Initial', 'Refund')),
    recurringtype TEXT CHECK(recurringtype IN ('Standard', 'Transfer', 'CreditCardPayment')),
    recurrencerule TEXT NOT NULL,
    intervalmonths INTEGER,
    nextoccurrencedate TEXT,
    enddate TEXT,
    isactive INTEGER NOT NULL DEFAULT 1,
    isamountflexible INTEGER NOT NULL DEFAULT 0,
    isdateflexible INTEGER NOT NULL DEFAULT 0,
    autoapplyenabled INTEGER DEFAULT 0,
    lastautoappliedat TEXT,
    lastexecutedat TEXT,
    failedattempts INTEGER DEFAULT 0,
    maxfailedattempts INTEGER DEFAULT 3,
    categoryid TEXT NOT NULL,
    sourceaccountid TEXT NOT NULL,
    transferaccountid TEXT,
    tenantid TEXT NOT NULL,
    isdeleted INTEGER NOT NULL DEFAULT 0,
    createdat TEXT,
    createdby TEXT,
    updatedat TEXT,
    updatedby TEXT,
    FOREIGN KEY (categoryid) REFERENCES ${TableNames.TransactionCategories}(id),
    FOREIGN KEY (sourceaccountid) REFERENCES ${TableNames.Accounts}(id),
    FOREIGN KEY (transferaccountid) REFERENCES ${TableNames.Accounts}(id)
  )
`;

/**
 * Index definitions matching Supabase
 */
export const CREATE_INDICES = [
    `CREATE INDEX IF NOT EXISTS idx_accounts_categoryid ON ${TableNames.Accounts}(categoryid)`,
    `CREATE INDEX IF NOT EXISTS idx_accounts_tenantid ON ${TableNames.Accounts}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_accountcategories_tenantid ON ${TableNames.AccountCategories}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactiongroups_tenantid ON ${TableNames.TransactionGroups}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactioncategories_groupid ON ${TableNames.TransactionCategories}(groupid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactioncategories_tenantid ON ${TableNames.TransactionCategories}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_accountid ON ${TableNames.Transactions}(accountid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_categoryid ON ${TableNames.Transactions}(categoryid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_tenantid ON ${TableNames.Transactions}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_date ON ${TableNames.Transactions}(date)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_transferaccountid ON ${TableNames.Transactions}(transferaccountid)`,
    `CREATE INDEX IF NOT EXISTS idx_transactions_transferid ON ${TableNames.Transactions}(transferid)`,
    `CREATE INDEX IF NOT EXISTS idx_recurrings_categoryid ON ${TableNames.Recurrings}(categoryid)`,
    `CREATE INDEX IF NOT EXISTS idx_recurrings_sourceaccountid ON ${TableNames.Recurrings}(sourceaccountid)`,
    `CREATE INDEX IF NOT EXISTS idx_recurrings_tenantid ON ${TableNames.Recurrings}(tenantid)`,
    `CREATE INDEX IF NOT EXISTS idx_configurations_tenantid ON ${TableNames.Configurations}(tenantid)`,
];

/**
 * All table creation statements in dependency order
 */
export const ALL_CREATE_TABLES = [
    CREATE_ACCOUNT_CATEGORIES_TABLE,
    CREATE_ACCOUNTS_TABLE,
    CREATE_TRANSACTION_GROUPS_TABLE,
    CREATE_TRANSACTION_CATEGORIES_TABLE,
    CREATE_TRANSACTIONS_TABLE,
    CREATE_CONFIGURATIONS_TABLE,
    CREATE_RECURRINGS_TABLE,
];
