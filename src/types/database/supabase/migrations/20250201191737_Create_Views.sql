CREATE OR REPLACE VIEW Stats_MonthlyTransactionsTypes WITH (security_invoker)
  AS
  SELECT 
  type,
  date_trunc('month', COALESCE(date::timestamp, NOW()))::date as date,
  coalesce(sum(amount), 0) as sum,
  tenantid
  FROM transactions
  WHERE isdeleted = false
  AND isvoid = false
  GROUP BY
  type,
  date_trunc('month', COALESCE(date::timestamp, NOW()))::date,
  tenantid
  ORDER BY
  date_trunc('month', COALESCE(date::timestamp, NOW()))::date, type;

CREATE OR REPLACE VIEW Stats_MonthlyAccountsTransactions WITH (security_invoker)
  AS
  SELECT 
  a.id AS accountid, 
  a.name AS account,
  a.tenantid,
  date_trunc('month', COALESCE(t.date::timestamp, NOW()))::date as date,
  coalesce(sum(t.amount), 0) as sum
  FROM Accounts a 
  LEFT OUTER JOIN transactions t ON t.accountid = a.id 
    AND t.isdeleted = false 
    AND t.isvoid = false
  WHERE a.isdeleted = false
  GROUP BY
  a.id, 
  a.name,
  a.tenantid,
  date_trunc('month', COALESCE(t.date::timestamp, NOW()))::date
  ORDER BY
  date_trunc('month', COALESCE(t.date::timestamp, NOW()))::date,
  a.name;

CREATE OR REPLACE VIEW Stats_MonthlyCategoriesTransactions WITH (security_invoker)
  AS
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
  date_trunc('month', t.date::timestamp)::date as date,
  COALESCE(sum(t.amount), 0) as sum,
  t.tenantid
  FROM transactions t
  INNER JOIN transactioncategories tc ON tc.id = t.categoryid AND tc.isdeleted = false
  INNER JOIN transactiongroups tg ON tg.id = tc.groupid AND tg.isdeleted = false
  WHERE t.isdeleted = false
  AND t.isvoid = false
  GROUP BY
  tg.id, tc.id, tg.name, t.type,
  tg.budgetamount, tg.budgetfrequency, tg.icon, tg.color, tg.displayorder,
  tc.name, tc.budgetamount, tc.budgetfrequency, tc.icon, tc.color, tc.displayorder,
  t.tenantid,
  date_trunc('month', t.date::timestamp)::date
  ORDER BY
  date_trunc('month', t.date::timestamp)::date,
  tg.displayorder,
  tc.displayorder;

CREATE OR REPLACE VIEW Stats_DailyTransactions WITH (security_invoker)
  AS
  SELECT 
  t.type,
  date_trunc('day', t.date)::date AS date,
  sum(t.amount) AS sum,
  t.tenantid
  FROM transactions t
  WHERE t.isdeleted = false
  AND t.isvoid = false
  GROUP BY 
  t.type, 
  t.tenantid,
  date_trunc('day', t.date)::date
  ORDER BY date_trunc('day', t.date)::date, t.type;

CREATE OR REPLACE VIEW Search_DistinctTransactions WITH (security_invoker)
AS 
 SELECT DISTINCT ON (transactions.name) transactions.name,
    transactions.amount,
    transactions.payee,
    transactions.type,
    transactions.isvoid,
    transactions.description,
    transactions.notes,
    transactions.categoryid,
    transactions.accountid,
    transactions.transferid,
    transactions.transferaccountid,
    transactions.tenantid
   FROM transactions
  WHERE transactions.isdeleted = false
    AND (transactions.type = ANY (ARRAY['Expense'::TransactionTypes, 'Income'::TransactionTypes, 'Transfer'::TransactionTypes]))
  ORDER BY transactions.name, transactions.date DESC;

DROP MATERIALIZED VIEW IF EXISTS TransactionsView;
CREATE MATERIALIZED VIEW TransactionsView AS
SELECT 
  t.id,
  t.name,
  t.date,
  t.amount,
  t.type,
  t.payee,
  -- t.description,
  -- t.tags,
  -- t.notes,
  t.isvoid,
  t.transferid,
  t.transferaccountid,
  t.createdat,
  t.updatedat,

  tc.id AS categoryid,
  tc.name AS categoryname,
  tc.icon,
  
  tg.id AS groupid,
  tg.name AS groupname,
  tg.icon AS groupicon,

  a.id AS accountid,
  a.name AS accountname,
  -- ta.name AS transferaccountname,
  a.currency,
  a.balance,
  
  sum(
      CASE
          WHEN t.isvoid = false AND t.isdeleted = false THEN t.amount
          ELSE 0::numeric
      END
      ) OVER (PARTITION BY t.accountid ORDER BY t.date, t.createdat, t.updatedat, t.type, t.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS RunningBalance,
  t.tenantid
  
  FROM transactions t
    JOIN transactioncategories tc ON t.categoryid = tc.id
    JOIN transactiongroups tg ON tc.groupid = tg.id
    JOIN accounts a ON t.accountid = a.id
    -- JOIN accounts ta ON t.transferaccountid = ta.id
WHERE t.isdeleted = false AND tc.isdeleted = false AND a.isdeleted = false
ORDER BY 
t.date DESC, 
t.createdat DESC, 
t.updatedat DESC, 
t.type DESC, 
t.id DESC;

CREATE OR REPLACE VIEW view_accounts_with_runningbalance WITH (security_invoker) AS
  SELECT
      acc.*,
      latest_rb.runningbalance
  FROM
      accounts acc
  LEFT JOIN (
      SELECT
          tv.accountid,
          tv.RunningBalance AS runningbalance,
          ROW_NUMBER() OVER (PARTITION BY tv.accountid ORDER BY tv.date DESC, tv.type DESC, tv.id DESC) as rn
      FROM
          TransactionsView tv -- This is the materialized view
  ) latest_rb ON acc.id = latest_rb.accountid AND latest_rb.rn = 1;

CREATE OR REPLACE VIEW Stats_NetWorthGrowth WITH (security_invoker) AS
  WITH calendar AS (
    SELECT DISTINCT date_trunc('month', date) AS month
    FROM TransactionsView
  ),

  latest_per_account_monthly AS (
    SELECT
      date_trunc('month', c.month) AS month,
      t.tenantid,
      t.accountid,
      t.RunningBalance,
      ROW_NUMBER() OVER (
        PARTITION BY c.month, t.tenantid, t.accountid
        ORDER BY t.date DESC, t.createdat DESC, t.updatedat DESC, t.type DESC, t.id DESC
      ) AS rn
    FROM calendar c
    JOIN TransactionsView t
      ON t.date <= c.month + INTERVAL '1 month - 1 day'
  )
  SELECT
    month,
    SUM(RunningBalance) AS total_net_worth,
    tenantid
  FROM latest_per_account_monthly
  WHERE rn = 1
  GROUP BY tenantid, month
  ORDER BY tenantid, month;

CREATE OR REPLACE VIEW Stats_TotalAccountBalance WITH (security_invoker) AS
  SELECT
      SUM(acc.balance) as TotalBalance,
      acc.tenantid
  FROM
      accounts acc
  WHERE acc.isdeleted = false
  GROUP BY
      acc.tenantid;
