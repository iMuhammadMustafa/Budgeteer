// =====================================
// TransactionsView - Main transaction view with running balance
// =====================================
export const CREATE_TRANSACTIONSVIEW = `
CREATE VIEW IF NOT EXISTS transactionsview AS
SELECT 
  t.id,
  t.name,
  t.date,
  t.amount,
  t.type,
  t.payee,
  t.isvoid,
  t.transferid,
  t.transferaccountid,
  t.createdat,
  t.updatedat,
  t.tenantid,
  t.isdeleted,

  tc.id AS categoryid,
  tc.name AS categoryname,
  tc.icon,
  
  tg.id AS groupid,
  tg.name AS groupname,
  tg.icon AS groupicon,

  a.id AS accountid,
  a.name AS accountname,
  a.currency,
  a.balance,
  
  -- Running balance using window function (SQLite 3.25+)
  SUM(
    CASE
      WHEN t.isvoid = 0 AND t.isdeleted = 0 THEN t.amount
      ELSE 0
    END
  ) OVER (
    PARTITION BY t.accountid 
    ORDER BY t.date, t.createdat, t.updatedat, t.type, t.id 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS runningbalance

FROM transactions t
  INNER JOIN transactioncategories tc ON t.categoryid = tc.id AND t.tenantid = tc.tenantid
  INNER JOIN transactiongroups tg ON tc.groupid = tg.id AND tc.tenantid = tg.tenantid
  INNER JOIN accounts a ON t.accountid = a.id AND t.tenantid = a.tenantid
WHERE t.isdeleted = 0 AND tc.isdeleted = 0 AND a.isdeleted = 0;
`;

// =====================================
// Search View - Distinct transactions for autocomplete
// =====================================
export const CREATE_SEARCH_DISTINCTTRANSACTIONS = `
CREATE VIEW IF NOT EXISTS search_distincttransactions AS
SELECT DISTINCT
  t.name,
  t.amount,
  t.payee,
  t.type,
  t.isvoid,
  t.description,
  t.notes,
  t.categoryid,
  t.accountid,
  t.transferid,
  t.transferaccountid,
  t.tenantid
FROM transactions t
WHERE t.isdeleted = 0
  AND t.type IN ('Expense', 'Income', 'Transfer')
GROUP BY t.name
ORDER BY MAX(t.date) DESC;
`;

// =====================================
// Accounts with Running Balance
// =====================================
export const CREATE_VIEW_ACCOUNTS_WITH_RUNNINGBALANCE = `
CREATE VIEW IF NOT EXISTS view_accounts_with_runningbalance AS
SELECT
  acc.*,
  COALESCE(latest_rb.runningbalance, 0) as runningbalance
FROM accounts acc
LEFT JOIN (
  SELECT 
    tv.accountid,
    tv.runningbalance,
    ROW_NUMBER() OVER (
      PARTITION BY tv.accountid 
      ORDER BY tv.date DESC, tv.createdat DESC, tv.updatedat DESC, tv.type DESC, tv.id DESC
    ) as rn
  FROM transactionsview tv
) latest_rb ON acc.id = latest_rb.accountid AND latest_rb.rn = 1;
`;

// =====================================
// Stats Views
// =====================================

export const CREATE_STATS_DAILYTRANSACTIONS = `
CREATE VIEW IF NOT EXISTS stats_dailytransactions AS
SELECT 
  t.type,
  date(t.date) AS date,
  SUM(t.amount) AS sum,
  t.tenantid
FROM transactions t
WHERE t.isdeleted = 0 AND t.isvoid = 0
GROUP BY 
  t.type, 
  t.tenantid,
  date(t.date);
`;

export const CREATE_STATS_MONTHLYTRANSACTIONSTYPES = `
CREATE VIEW IF NOT EXISTS stats_monthlytransactionstypes AS
SELECT 
  type,
  date(date, 'start of month') as date,
  COALESCE(SUM(amount), 0) as sum,
  tenantid
FROM transactions
WHERE isdeleted = 0 AND isvoid = 0
GROUP BY
  type,
  date(date, 'start of month'),
  tenantid
ORDER BY date(date, 'start of month');
`;

export const CREATE_STATS_MONTHLYACCOUNTSTRANSACTIONS = `
CREATE VIEW IF NOT EXISTS stats_monthlyaccountstransactions AS
SELECT 
  t.accountid,
  a.name as account,
  date(t.date, 'start of month') as date,
  COALESCE(SUM(t.amount), 0) as sum,
  t.tenantid
FROM transactions t 
LEFT OUTER JOIN accounts a ON t.accountid = a.id AND t.tenantid = a.tenantid
WHERE t.isdeleted = 0 AND t.isvoid = 0
GROUP BY
  t.accountid, 
  a.name,
  t.tenantid,
  date(t.date, 'start of month')
ORDER BY date(t.date, 'start of month');
`;

export const CREATE_STATS_MONTHLYCATEGORIESTRANSACTIONS = `
CREATE VIEW IF NOT EXISTS stats_monthlycategoriestransactions AS
SELECT 
  tg.id as groupid,
  tc.id as categoryid,
  tg.name AS groupname,
  t.type,
  tg.budgetamount AS groupbudgetamount,
  tg.budgetfrequency AS groupbudgetfrequency,
  tg.icon AS groupicon,
  tg.color AS groupcolor,
  tg.displayorder AS groupdisplayorder,
  tc.name AS categoryname,
  tc.budgetamount AS categorybudgetamount,
  tc.budgetfrequency AS categorybudgetfrequency,
  tc.icon AS categoryicon,
  tc.color AS categorycolor,
  tc.displayorder AS categorydisplayorder,
  date(t.date, 'start of month') as date,
  COALESCE(SUM(t.amount), 0) as sum,
  t.tenantid
FROM transactiongroups tg 
LEFT JOIN transactioncategories tc ON tg.id = tc.groupid AND tg.tenantid = tc.tenantid
LEFT JOIN transactions t ON tc.id = t.categoryid AND tc.tenantid = t.tenantid
WHERE t.isdeleted = 0 AND t.isvoid = 0
GROUP BY
  tg.id,
  tc.id,
  tg.name,
  t.type,
  tg.budgetamount,
  tg.budgetfrequency,
  tg.icon,
  tg.color,
  tg.displayorder,
  tc.name,
  tc.budgetamount,
  tc.budgetfrequency,
  tc.icon,
  tc.color,
  tc.displayorder,
  t.tenantid,
  date(t.date, 'start of month')
ORDER BY date(t.date, 'start of month');
`;

export const CREATE_STATS_TOTALACCOUNTBALANCE = `
CREATE VIEW IF NOT EXISTS stats_totalaccountbalance AS
SELECT
  SUM(acc.balance) as totalbalance,
  acc.tenantid
FROM accounts acc
WHERE acc.isdeleted = 0
GROUP BY acc.tenantid;
`;

export const CREATE_STATS_NETWORTHGROWTH = `
CREATE VIEW IF NOT EXISTS stats_networthgrowth AS
WITH calendar AS (
  SELECT DISTINCT strftime('%Y-%m', date) AS month
  FROM transactionsview
),
latest_per_account_monthly AS (
  SELECT
    strftime('%Y-%m', c.month) AS month,
    t.tenantid,
    t.accountid,
    t.runningbalance,
    ROW_NUMBER() OVER (
      PARTITION BY c.month, t.tenantid, t.accountid
      ORDER BY t.date DESC, t.createdat DESC, t.id DESC
    ) AS rn
  FROM calendar c
  JOIN transactionsview t ON strftime('%Y-%m', t.date) <= c.month
)
SELECT
  month,
  SUM(runningbalance) AS total_net_worth,
  tenantid
FROM latest_per_account_monthly
WHERE rn = 1
GROUP BY tenantid, month
ORDER BY tenantid, month;
`;

// =====================================
// All Views Combined
// =====================================

export const CREATE_ALL_VIEWS_SQL = `
${CREATE_TRANSACTIONSVIEW}

${CREATE_SEARCH_DISTINCTTRANSACTIONS}

${CREATE_VIEW_ACCOUNTS_WITH_RUNNINGBALANCE}

${CREATE_STATS_DAILYTRANSACTIONS}

${CREATE_STATS_MONTHLYTRANSACTIONSTYPES}

${CREATE_STATS_MONTHLYACCOUNTSTRANSACTIONS}

${CREATE_STATS_MONTHLYCATEGORIESTRANSACTIONS}

${CREATE_STATS_TOTALACCOUNTBALANCE}

${CREATE_STATS_NETWORTHGROWTH}
`;

// Drop views for reset
export const DROP_ALL_VIEWS_SQL = `
DROP VIEW IF EXISTS stats_networthgrowth;
DROP VIEW IF EXISTS stats_totalaccountbalance;
DROP VIEW IF EXISTS stats_monthlycategoriestransactions;
DROP VIEW IF EXISTS stats_monthlyaccountstransactions;
DROP VIEW IF EXISTS stats_monthlytransactionstypes;
DROP VIEW IF EXISTS stats_dailytransactions;
DROP VIEW IF EXISTS view_accounts_with_runningbalance;
DROP VIEW IF EXISTS search_distincttransactions;
DROP VIEW IF EXISTS transactionsview;
`;
