CREATE OR REPLACE VIEW Stats_MonthlyTransactionsTypes WITH (security_invoker)
AS
SELECT 
type,
date_trunc('month', COALESCE(date::timestamp, NOW()))::date as date,
coalesce(sum(amount), 0) as sum

FROM transactions

GROUP BY
type,
date_trunc('month', COALESCE(date::timestamp, NOW()))::date
ORDER BY
date_trunc('month', COALESCE(date::timestamp, NOW()))::date;

CREATE OR REPLACE VIEW Stats_MonthlyAccountsTransactions WITH (security_invoker)
AS
SELECT 
t.accountid accountid, 
a.name account,
date_trunc('month', COALESCE(date::timestamp, NOW()))::date as date,
coalesce(sum(amount), 0) as sum
FROM transactions t LEFT OUTER JOIN Accounts a ON t.accountid = a.id
GROUP BY
t.accountid, 
a.name ,
date_trunc('month', COALESCE(date::timestamp, NOW()))::date
ORDER BY
date_trunc('month', COALESCE(date::timestamp, NOW()))::date;


CREATE OR REPLACE VIEW Stats_MonthlyCategoriesTransactions WITH (security_invoker)
AS
SELECT 
tg.name GroupName,
t.Type,
tc.budgetamount GroupBudgetAmount, 
tc.budgetfrequency GroupBudgetFrequency,
tc.icon GroupIcon, 
tc.color GroupColor,
tc.displayorder GroupDisplayOrder,
tc.name CategoryName, 
tc.budgetamount CategoryBudgetAmount, 
tc.budgetfrequency CategoryBudgetFrequency,
tc.icon CategoryIcon, 
tc.color CategoryColor,
tc.displayorder CategoryDisplayOrder,

date_trunc('month', COALESCE(t.date::timestamp, NOW()))::timestamptz as date,
coalesce(sum(t.amount), 0) as sum

FROM transactiongroups tg 
LEFT JOIN transactioncategories tc ON tg.id = tc.groupid
LEFT JOIN transactions t ON tc.id = t.categoryid

GROUP BY
tg.name,
t.Type,
tc.budgetamount,
tc.budgetfrequency,
tc.icon,
tc.color,
tc.displayorder,
tc.name,
tc.budgetamount,
tc.budgetfrequency,
tc.icon,
tc.color,
tc.displayorder,

date_trunc('month', COALESCE(t.date::timestamp, NOW()))::timestamptz
ORDER BY
date_trunc('month', COALESCE(t.date::timestamp, NOW()))::timestamptz;


CREATE OR REPLACE VIEW Stats_DailyTransactions WITH (security_invoker)
AS
SELECT 
t.type,
date_trunc('day', t.date)::date AS date,
sum(t.amount) AS sum
FROM transactions t
GROUP BY 
t.type, 
date_trunc('day', t.date)::date;


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
    transactions.transferaccountid
   FROM transactions
  WHERE (transactions.type = ANY (ARRAY['Expense'::TransactionTypes, 'Income'::TransactionTypes]))
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


  tc.id AS categoryid,
  tc.name AS categoryname,
  tc.icon,
  
  -- tg.id AS groupid,
  -- tg.name AS groupname,

  a.id AS accountid,
  a.name AS accountname,
  a.currency,
  a.balance,
  
  sum(
      CASE
          WHEN t.isvoid = false AND t.isdeleted = false THEN t.amount
          ELSE 0::numeric
      END
      ) OVER (PARTITION BY t.accountid ORDER BY t.date, t.createdat, t.updatedat, t.type, t.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS RunningBalance
  
  FROM transactions t
    JOIN transactioncategories tc ON t.categoryid = tc.id
    JOIN accounts a ON t.accountid = a.id
WHERE t.isdeleted = false AND tc.isdeleted = false AND a.isdeleted = false
ORDER BY 
t.date DESC, 
t.createdat DESC, 
t.updatedat DESC, 
t.type DESC, 
t.id DESC;



-- -- Old Views ? --



-- CREATE OR REPLACE VIEW TransactionsCategoryDateSum AS
-- SELECT subquery.id, subquery.name, subquery.date, SUM(subquery.amount) 
-- FROM (
--     SELECT cat.id as id, cat.name as name, date_trunc('day', tra.date AT TIME ZONE 'America/Chicago')::date as date, tra.amount
--     FROM categories cat
--     FULL OUTER JOIN transactions tra ON cat.id = tra.categoryid
-- ) AS subquery
-- GROUP BY subquery.id, subquery.name, subquery.date;

-- CREATE OR REPLACE VIEW TransactionsDaySum AS
-- SELECT
--     subquery.date,
--     subquery.type,
--     SUM(subquery.amount) AS sum
-- FROM (
--     SELECT
--         date_trunc('day', transactions.date)::date AS date,
--         transactions.type,
--         amount
--     FROM transactions
-- ) AS subquery
-- GROUP BY subquery.date, subquery.type;

-- CREATE OR REPLACE VIEW TransactionsCategoryTypeDateSum AS
-- SELECT subquery.id, subquery.group, subquery.date, SUM(subquery.amount) 
-- FROM (
--     SELECT cat.id as id, cat.type as group, date_trunc('day', tra.date AT TIME ZONE 'America/Chicago')::date as date, tra.amount
--     FROM categories cat
--     FULL OUTER JOIN transactions tra ON cat.id = tra.categoryid
-- ) AS subquery
-- GROUP BY subquery.id, subquery.group, subquery.date;

-- CREATE OR REPLACE VIEW TransactionsCategoryDateSum AS
-- SELECT subquery.id, subquery.name, subquery.group, subquery.date, SUM(subquery.amount), subquery.type
-- FROM (
--     SELECT cat.id as id, cat.name as name, cat.type as group, date_trunc('day', tra.date AT TIME ZONE 'America/Chicago')::date as date, tra.amount, tra.type as type
--     FROM categories cat
--     INNER JOIN transactions tra ON cat.id = tra.categoryid
-- ) AS subquery
-- GROUP BY subquery.id, subquery.name, subquery.group, subquery.date, subquery.type;

-- -- date_trunc('day', tra.date AT TIME ZONE 'America/New_York')::date as date



-- -- SELECT column_name
-- -- FROM INFORMATION_SCHEMA.COLUMNS
-- -- WHERE TABLE_NAME = N'transactions'



-- CREATE VIEW CategoryGroups AS
-- SELECT 
-- DISTINCT(c.group)
-- from categories c


-- CREATE  VIEW TransactionDistinct AS
-- SELECT 
-- DISTINCT ON (description)  description,
-- -- id
-- amount
-- -- date
-- categoryid
-- tags
-- notes
-- accountid
-- -- createdby
-- -- createdat
-- -- updatedby
-- -- updatedat
-- -- isdeleted
-- -- tenantid
-- type
-- -- description
-- -- transferid
-- status
-- -- transferaccountid
-- FROM transactions
-- WHERE type IN  ('Expense', 'Income')
-- order by description, date desc

-- -- SELECT column_name
-- -- FROM INFORMATION_SCHEMA.COLUMNS
-- -- WHERE TABLE_NAME = N'transactions'



-- CREATE VIEW CategoryGroups AS
-- SELECT 
-- DISTINCT(c.group)
-- from categories c

-- CREATE OR REPLACE VIEW categorygroups AS
-- SELECT DISTINCT c."group", c.groupicon
-- FROM categories c;

