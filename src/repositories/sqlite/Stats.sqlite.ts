import dayjs from "dayjs";
import { eq, and, gte, lte, inArray, sql, desc } from "drizzle-orm";
import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { IStatsRepository } from "../interfaces/IStatsRepository";
import {
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyAccountsTransactions,
  StatsNetWorthGrowth,
  TransactionType,
} from "../../types/db/Tables.Types";
import {
  transactions,
  accounts,
  transactionCategories,
  transactionGroups,
} from "../../types/db/sqllite/schema";
import * as schema from "../../types/db/sqllite/schema";

export class StatsSQLiteRepository extends BaseSQLiteRepository<any, any, any> implements IStatsRepository {
  protected table = transactions; // Stats doesn't really use a single table, but we need this for the base class

  async getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]> {
    try {
      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false),
        eq(transactions.isvoid, false),
      ];

      // Add type filter
      if (type) {
        conditions.push(eq(transactions.type, type));
      } else {
        conditions.push(eq(transactions.type, "Expense"));
      }

      // Add date range filters
      const defaultStartDate = startDate ?? dayjs().startOf("week").toISOString();
      const defaultEndDate = endDate ?? dayjs().endOf("week").toISOString();
      
      conditions.push(gte(transactions.date, defaultStartDate));
      conditions.push(lte(transactions.date, defaultEndDate));

      const db = await this.getDb();
      const result = await db
        .select({
          date: transactions.date,
          sum: sql<number>`sum(${transactions.amount})`.as("sum"),
          tenantid: transactions.tenantid,
          type: transactions.type,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(transactions.date, transactions.type, transactions.tenantid)
        .orderBy(transactions.date);

      return result as StatsDailyTransactions[];
    } catch (error) {
      throw new Error(`Failed to get daily transactions stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    try {
      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false),
        eq(transactions.isvoid, false),
      ];

      // Add date range filters
      const defaultStartDate = startDate ?? dayjs().startOf("week").toISOString();
      const defaultEndDate = endDate ?? dayjs().endOf("week").toISOString();
      
      conditions.push(gte(transactions.date, defaultStartDate));
      conditions.push(lte(transactions.date, defaultEndDate));

      const db = await this.getDb();
      const result = await db
        .select({
          date: sql<string>`strftime('%Y-%m', ${transactions.date})`.as("date"),
          sum: sql<number>`sum(${transactions.amount})`.as("sum"),
          tenantid: transactions.tenantid,
          type: transactions.type,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(sql`strftime('%Y-%m', ${transactions.date})`, transactions.type, transactions.tenantid)
        .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

      return result as StatsMonthlyTransactionsTypes[];
    } catch (error) {
      throw new Error(`Failed to get monthly transactions types stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    try {
      const formattedStartDate = startDate
        ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
        : dayjs().startOf("month").format("YYYY-MM-DD");

      const formattedEndDate = endDate
        ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
        : dayjs().endOf("month").format("YYYY-MM-DD");

      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false),
        eq(transactions.isvoid, false),
        inArray(transactions.type, ["Expense", "Adjustment"]),
        gte(transactions.date, formattedStartDate),
        lte(transactions.date, formattedEndDate),
      ];

      const db = await this.getDb();
      const result = await db
        .select({
          groupid: transactionGroups.id,
          categoryid: transactionCategories.id,
          groupname: transactionGroups.name,
          categoryname: transactionCategories.name,
          sum: sql<number>`sum(${transactions.amount})`.as("sum"),
          type: transactions.type,
          groupicon: transactionGroups.icon,
          categoryicon: transactionCategories.icon,
          groupbudgetamount: transactionGroups.budgetamount,
          categorybudgetamount: transactionCategories.budgetamount,
          date: sql<string>`strftime('%Y-%m', ${transactions.date})`.as("date"),
          categorybudgetfrequency: transactionCategories.budgetfrequency,
          categorycolor: transactionCategories.color,
          categorydisplayorder: transactionCategories.displayorder,
          groupbudgetfrequency: transactionGroups.budgetfrequency,
          groupcolor: transactionGroups.color,
          groupdisplayorder: transactionGroups.displayorder,
          tenantid: transactions.tenantid,
        })
        .from(transactions)
        .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
        .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
        .where(and(...conditions))
        .groupBy(
          transactionGroups.id,
          transactionCategories.id,
          transactionGroups.name,
          transactionCategories.name,
          transactions.type,
          transactionGroups.icon,
          transactionCategories.icon,
          transactionGroups.budgetamount,
          transactionCategories.budgetamount,
          sql`strftime('%Y-%m', ${transactions.date})`,
          transactionCategories.budgetfrequency,
          transactionCategories.color,
          transactionCategories.displayorder,
          transactionGroups.budgetfrequency,
          transactionGroups.color,
          transactionGroups.displayorder,
          transactions.tenantid
        )
        .orderBy(transactionGroups.displayorder, transactionCategories.displayorder);

      return result as StatsMonthlyCategoriesTransactions[];
    } catch (error) {
      throw new Error(`Failed to get monthly categories transactions stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    try {
      const formattedStartDate = startDate
        ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
        : dayjs().startOf("month").format("YYYY-MM-DD");

      const formattedEndDate = endDate
        ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
        : dayjs().endOf("month").format("YYYY-MM-DD");

      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false),
        eq(transactions.isvoid, false),
        gte(transactions.date, formattedStartDate),
        lte(transactions.date, formattedEndDate),
      ];

      const db = await this.getDb();
      const result = await db
        .select({
          account: accounts.name,
          accountid: accounts.id,
          date: sql<string>`strftime('%Y-%m', ${transactions.date})`.as("date"),
          sum: sql<number>`sum(${transactions.amount})`.as("sum"),
          tenantid: transactions.tenantid,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountid, accounts.id))
        .where(and(...conditions))
        .groupBy(
          accounts.name,
          accounts.id,
          sql`strftime('%Y-%m', ${transactions.date})`,
          transactions.tenantid
        )
        .orderBy(sql`strftime('%Y-%m', ${transactions.date})`, accounts.name);

      return result as StatsMonthlyAccountsTransactions[];
    } catch (error) {
      throw new Error(`Failed to get monthly accounts transactions stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStatsNetWorthGrowth(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<StatsNetWorthGrowth[]> {
    try {
      const defaultStartDate = startDate ?? dayjs().startOf("year").format("YYYY-MM-DD");
      const defaultEndDate = endDate ?? dayjs().endOf("year").format("YYYY-MM-DD");

      // This is a complex query that calculates net worth growth over time
      // We need to calculate the cumulative balance changes for each month
      const db = await this.getDb();
      const result = await db
        .select({
          month: sql<string>`strftime('%Y-%m-01', ${transactions.date})`.as("month"),
          total_net_worth: sql<number>`
            sum(
              case 
                when ${accounts.categoryid} in (
                  select id from ${schema.accountCategories} 
                  where type = 'Asset' and tenantid = ${tenantId}
                ) then ${transactions.amount}
                when ${accounts.categoryid} in (
                  select id from ${schema.accountCategories} 
                  where type = 'Liability' and tenantid = ${tenantId}
                ) then -${transactions.amount}
                else 0
              end
            )
          `.as("total_net_worth"),
          tenantid: transactions.tenantid,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountid, accounts.id))
        .innerJoin(schema.accountCategories, eq(accounts.categoryid, schema.accountCategories.id))
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          eq(transactions.isvoid, false),
          gte(transactions.date, defaultStartDate),
          lte(transactions.date, defaultEndDate)
        ))
        .groupBy(sql`strftime('%Y-%m-01', ${transactions.date})`, transactions.tenantid)
        .orderBy(sql`strftime('%Y-%m-01', ${transactions.date})`);

      return result as StatsNetWorthGrowth[];
    } catch (error) {
      throw new Error(`Failed to get net worth growth stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}