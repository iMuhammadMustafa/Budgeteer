import { TableNames, ViewNames } from "../TableNames";

/**
 * SQLite View Definitions
 * These match Supabase views exactly (Supabase is the source of truth)
 */

/**
 * Transactions view with running balance
 * Includes account name, category name, group info, and running balance using window function
 */
export const CREATE_TRANSACTIONS_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.TransactionsView} AS
  SELECT 
    t.id,
    t.name,
    t.amount,
    t.date,
    t.payee,
    t.type,
    t.isvoid,
    t.tenantid,
    t.createdat,
    t.updatedat,
    t.transferaccountid,
    t.transferid,
    t.accountid,
    a.name AS accountname,
    a.balance,
    a.currency,
    t.categoryid,
    tc.name AS categoryname,
    tc.icon,
    tc.groupid,
    tg.name AS groupname,
    tg.icon AS groupicon,
    CASE 
      WHEN t.isvoid = 0 AND t.isdeleted = 0 THEN
        SUM(CASE WHEN t.isvoid = 0 AND t.isdeleted = 0 THEN t.amount ELSE 0 END) OVER (
          PARTITION BY t.accountid 
          ORDER BY t.date ASC, t.createdat ASC, t.id ASC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
      ELSE NULL
    END AS runningbalance
  FROM ${TableNames.Transactions} t
  LEFT JOIN ${TableNames.Accounts} a ON t.accountid = a.id
  LEFT JOIN ${TableNames.TransactionCategories} tc ON t.categoryid = tc.id
  LEFT JOIN ${TableNames.TransactionGroups} tg ON tc.groupid = tg.id
  WHERE t.isdeleted = 0
`;

/**
 * Accounts view with running balance (sum of non-void, non-deleted transactions)
 */
export const CREATE_ACCOUNTS_WITH_RUNNING_BALANCE_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.ViewAccountsWithRunningBalance} AS
  SELECT 
    a.*,
    COALESCE(
      (SELECT SUM(t.amount) 
       FROM ${TableNames.Transactions} t 
       WHERE t.accountid = a.id 
         AND t.isdeleted = 0 
         AND t.isvoid = 0),
      0
    ) AS runningbalance
  FROM ${TableNames.Accounts} a
  WHERE a.isdeleted = 0
`;

/**
 * Search distinct transactions for autocomplete
 */
export const CREATE_SEARCH_DISTINCT_TRANSACTIONS_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.SearchDistinctTransactions} AS
  SELECT DISTINCT
    t.name,
    t.description,
    t.payee,
    t.notes,
    t.amount,
    t.type,
    t.isvoid,
    t.accountid,
    t.categoryid,
    t.transferaccountid,
    t.transferid,
    t.tenantid
  FROM ${TableNames.Transactions} t
  WHERE t.isdeleted = 0
`;

/**
 * Daily transaction totals by type
 */
export const CREATE_STATS_DAILY_TRANSACTIONS_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsDailyTransactions} AS
  SELECT 
    t.date,
    t.type,
    t.tenantid,
    SUM(t.amount) AS sum
  FROM ${TableNames.Transactions} t
  WHERE t.isdeleted = 0 AND t.isvoid = 0
  GROUP BY t.date, t.type, t.tenantid
`;

/**
 * Monthly transaction totals by type
 */
export const CREATE_STATS_MONTHLY_TRANSACTION_TYPES_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsMonthlyTransactionsTypes} AS
  SELECT 
    strftime('%Y-%m-01', t.date) AS date,
    t.type,
    t.tenantid,
    SUM(t.amount) AS sum
  FROM ${TableNames.Transactions} t
  WHERE t.isdeleted = 0 AND t.isvoid = 0
  GROUP BY strftime('%Y-%m-01', t.date), t.type, t.tenantid
`;

/**
 * Monthly transaction totals by category with category and group details
 */
export const CREATE_STATS_MONTHLY_CATEGORIES_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsMonthlyCategoriesTransactions} AS
  SELECT 
    strftime('%Y-%m-01', t.date) AS date,
    t.type,
    t.tenantid,
    t.categoryid,
    tc.name AS categoryname,
    tc.icon AS categoryicon,
    tc.color AS categorycolor,
    tc.displayorder AS categorydisplayorder,
    tc.budgetamount AS categorybudgetamount,
    tc.budgetfrequency AS categorybudgetfrequency,
    tc.groupid,
    tg.name AS groupname,
    tg.icon AS groupicon,
    tg.color AS groupcolor,
    tg.displayorder AS groupdisplayorder,
    tg.budgetamount AS groupbudgetamount,
    tg.budgetfrequency AS groupbudgetfrequency,
    SUM(t.amount) AS sum
  FROM ${TableNames.Transactions} t
  LEFT JOIN ${TableNames.TransactionCategories} tc ON t.categoryid = tc.id
  LEFT JOIN ${TableNames.TransactionGroups} tg ON tc.groupid = tg.id
  WHERE t.isdeleted = 0 AND t.isvoid = 0
  GROUP BY strftime('%Y-%m-01', t.date), t.type, t.tenantid, t.categoryid, 
           tc.name, tc.icon, tc.color, tc.displayorder, tc.budgetamount, tc.budgetfrequency,
           tc.groupid, tg.name, tg.icon, tg.color, tg.displayorder, tg.budgetamount, tg.budgetfrequency
`;

/**
 * Monthly transaction totals by account
 */
export const CREATE_STATS_MONTHLY_ACCOUNTS_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsMonthlyAccountsTransactions} AS
  SELECT 
    strftime('%Y-%m-01', t.date) AS date,
    t.tenantid,
    t.accountid,
    a.name AS account,
    SUM(t.amount) AS sum
  FROM ${TableNames.Transactions} t
  LEFT JOIN ${TableNames.Accounts} a ON t.accountid = a.id
  WHERE t.isdeleted = 0 AND t.isvoid = 0
  GROUP BY strftime('%Y-%m-01', t.date), t.tenantid, t.accountid, a.name
`;

/**
 * Net worth growth by month (cumulative sum of all account balances)
 */
export const CREATE_STATS_NET_WORTH_GROWTH_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsNetWorthGrowth} AS
  SELECT 
    strftime('%Y-%m-01', t.date) AS month,
    t.tenantid,
    SUM(t.amount) AS total_net_worth
  FROM ${TableNames.Transactions} t
  WHERE t.isdeleted = 0 AND t.isvoid = 0
  GROUP BY strftime('%Y-%m-01', t.date), t.tenantid
`;

/**
 * Total account balance per tenant
 */
export const CREATE_STATS_TOTAL_ACCOUNT_BALANCE_VIEW = `
  CREATE VIEW IF NOT EXISTS ${ViewNames.StatsTotalAccountBalance} AS
  SELECT 
    a.tenantid,
    SUM(
      COALESCE(
        (SELECT SUM(t.amount) 
         FROM ${TableNames.Transactions} t 
         WHERE t.accountid = a.id 
           AND t.isdeleted = 0 
           AND t.isvoid = 0),
        0
      )
    ) AS totalbalance
  FROM ${TableNames.Accounts} a
  WHERE a.isdeleted = 0
  GROUP BY a.tenantid
`;

/**
 * All view creation statements
 */
export const ALL_CREATE_VIEWS = [
    CREATE_TRANSACTIONS_VIEW,
    CREATE_ACCOUNTS_WITH_RUNNING_BALANCE_VIEW,
    CREATE_SEARCH_DISTINCT_TRANSACTIONS_VIEW,
    CREATE_STATS_DAILY_TRANSACTIONS_VIEW,
    CREATE_STATS_MONTHLY_TRANSACTION_TYPES_VIEW,
    CREATE_STATS_MONTHLY_CATEGORIES_VIEW,
    CREATE_STATS_MONTHLY_ACCOUNTS_VIEW,
    CREATE_STATS_NET_WORTH_GROWTH_VIEW,
    CREATE_STATS_TOTAL_ACCOUNT_BALANCE_VIEW,
];

/**
 * Drop all views (for recreation)
 */
export const ALL_DROP_VIEWS = [
    `DROP VIEW IF EXISTS ${ViewNames.TransactionsView}`,
    `DROP VIEW IF EXISTS ${ViewNames.ViewAccountsWithRunningBalance}`,
    `DROP VIEW IF EXISTS ${ViewNames.SearchDistinctTransactions}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsDailyTransactions}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsMonthlyTransactionsTypes}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsMonthlyCategoriesTransactions}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsMonthlyAccountsTransactions}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsNetWorthGrowth}`,
    `DROP VIEW IF EXISTS ${ViewNames.StatsTotalAccountBalance}`,
];
