import {
  StatsDailyTransactions,
  StatsMonthlyAccountsTransactions,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyTransactionsTypes,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/database/Tables.Types";
import { getWatermelonDB } from "@/src/types/database/watermelon";
import { Q } from "@nozbe/watermelondb";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { IStatsRepository } from "../interfaces/IStatsRepository";
dayjs.extend(utc);

export class StatsWatermelonRepository implements IStatsRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]> {
    const db = await this.getDb();

    const conditions = [
      Q.where("tenantid", tenantId),
      Q.where("isdeleted", false),
      Q.where("isvoid", false),
      Q.where("date", Q.gte(startDate ?? dayjs().startOf("week").format("YYYY-MM-DD"))),
      Q.where("date", Q.lte(endDate ?? dayjs().endOf("week").format("YYYY-MM-DD"))),
    ];

    if (type) {
      conditions.push(Q.where("type", type));
    }

    const transactions = await db.get("transactions").query(...conditions);

    const dailyStats: Record<string, number> = {};
    transactions.forEach((transaction: any) => {
      const date = dayjs(transaction.date).format("YYYY-MM-DD");
      dailyStats[date] = (dailyStats[date] || 0) + transaction.amount;
    });

    return Object.entries(dailyStats).map(([date, sum]) => ({
      date,
      sum,
      type: type ?? "Expense",
      tenantid: tenantId,
    })) as StatsDailyTransactions[];
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    const db = await this.getDb();

    const conditions = [
      Q.where("tenantid", tenantId),
      Q.where("isdeleted", false),
      Q.where("isvoid", false),
      Q.where("date", Q.gte(startDate ?? dayjs().startOf("week").format("YYYY-MM-DD"))),
      Q.where("date", Q.lte(endDate ?? dayjs().endOf("week").format("YYYY-MM-DD"))),
    ];

    const transactions = await db.get("transactions").query(...conditions);

    const monthlyStats: Record<string, Record<string, number>> = {};
    transactions.forEach((transaction: any) => {
      const month = dayjs(transaction.date).format("YYYY-MM-01");
      const type = transaction.type;

      if (!monthlyStats[month]) {
        monthlyStats[month] = {};
      }
      monthlyStats[month][type] = (monthlyStats[month][type] || 0) + transaction.amount;
    });

    const result: StatsMonthlyTransactionsTypes[] = [];
    Object.entries(monthlyStats).forEach(([date, types]) => {
      Object.entries(types).forEach(([type, sum]) => {
        result.push({
          date,
          type: type as TransactionType,
          sum,
          tenantid: tenantId,
        });
      });
    });

    return result;
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    const db = await this.getDb();

    const formattedStartDate = startDate
      ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
      : dayjs().startOf("month").format("YYYY-MM-DD");

    const formattedEndDate = endDate
      ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
      : dayjs().endOf("month").format("YYYY-MM-DD");

    // Fetch all categories and groups for the tenant
    const categories = await db
      .get("transactioncategories")
      .query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));
    const groups = await db.get("transactiongroups").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    // Build lookup maps
    const categoryMap = new Map();
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
    }
    const groupMap = new Map();
    for (const grp of groups) {
      groupMap.set(grp.id, grp);
    }

    const conditions = [
      Q.where("tenantid", tenantId),
      Q.where("isdeleted", false),
      Q.where("isvoid", false),
      Q.where("type", Q.oneOf(["Expense", "Adjustment"])),
      Q.where("date", Q.gte(formattedStartDate)),
      Q.where("date", Q.lte(formattedEndDate)),
    ];

    const transactions = await db.get("transactions").query(...conditions);

    // Aggregate by category, group, month, type
    const categoryStats: Record<string, any> = {};
    for (const transaction of transactions) {
      const categoryId = (transaction as any).categoryid;
      const category = categoryMap.get(categoryId);
      const group = category ? groupMap.get(category.groupid) : null;
      const month = dayjs((transaction as any).date).format("YYYY-MM-01");
      const type = (transaction as any).type;
      const key = `${categoryId}-${month}-${type}`;

      if (!categoryStats[key]) {
        categoryStats[key] = {
          groupid: group ? group.id : null,
          categoryid: category ? category.id : null,
          groupname: group ? group.name : null,
          type: type,
          groupbudgetamount: group ? group.budgetamount : null,
          groupbudgetfrequency: group ? group.budgetfrequency : null,
          groupicon: group ? group.icon : null,
          groupcolor: group ? group.color : null,
          groupdisplayorder: group ? group.displayorder : null,
          categoryname: category ? category.name : null,
          categorybudgetamount: category ? category.budgetamount : null,
          categorybudgetfrequency: category ? category.budgetfrequency : null,
          categoryicon: category ? category.icon : null,
          categorycolor: category ? category.color : null,
          categorydisplayorder: category ? category.displayorder : null,
          date: month,
          sum: 0,
          tenantid: tenantId,
        };
      }

      categoryStats[key].sum += (transaction as any).amount;
    }

    return Object.values(categoryStats) as StatsMonthlyCategoriesTransactions[];
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    const db = await this.getDb();

    const formattedStartDate = startDate
      ? dayjs(startDate).startOf("month").format("YYYY-MM-DD")
      : dayjs().startOf("month").format("YYYY-MM-DD");

    const formattedEndDate = endDate
      ? dayjs(endDate).endOf("month").format("YYYY-MM-DD")
      : dayjs().endOf("month").format("YYYY-MM-DD");

    const conditions = [
      Q.where("tenantid", tenantId),
      Q.where("isdeleted", false),
      Q.where("isvoid", false),
      Q.where("date", Q.gte(formattedStartDate)),
      Q.where("date", Q.lte(formattedEndDate)),
    ];

    const transactions = await db.get("transactions").query(...conditions);

    // Group by account and month
    const accountStats: Record<string, any> = {};
    for (const transaction of transactions) {
      const accountId = (transaction as any).accountId;
      const month = dayjs((transaction as any).date).format("YYYY-MM-01");
      const key = `${accountId}-${month}`;

      if (!accountStats[key]) {
        accountStats[key] = {
          accountid: accountId,
          account: null, // TODO: Get from account relation
          sum: 0,
          date: month,
          tenantid: tenantId,
        };
      }

      accountStats[key].sum += (transaction as any).amount;
    }

    return Object.values(accountStats) as StatsMonthlyAccountsTransactions[];
  }

  async getStatsTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number }> {
    const db = await this.getDb();
    const accounts = await db.get("accounts").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));
    const totalBalance = accounts.reduce((sum, account) => sum + ((account as any).balance || 0), 0);
    return { totalbalance: totalBalance };
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<StatsNetWorthGrowth[]> {
    const db = await this.getDb();

    // Load accounts and transactions once to avoid many DB queries.
    const accounts = await db.get("accounts").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));
    const transactions = await db.get("transactions").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    // Treat provided ISO datetimes as local calendar dates: extract YYYY-MM-DD (UTC-normalized)
    // then build local Day.js objects so month boundaries align with local date.
    const startMonth = startDate
      ? dayjs(dayjs.utc(startDate).format("YYYY-MM-DD")).startOf("month")
      : dayjs().startOf("year");
    const endMonth = endDate ? dayjs(dayjs.utc(endDate).format("YYYY-MM-DD")).endOf("month") : dayjs().endOf("year");

    const result: StatsNetWorthGrowth[] = [];

    let currentMonth = startMonth.clone();
    while (currentMonth.isBefore(endMonth) || currentMonth.isSame(endMonth, "month")) {
      const monthStr = currentMonth.format("YYYY-MM-01");
      const monthEnd = currentMonth.endOf("month");

      let totalNetWorth = 0;

      for (const account of accounts) {
        const acc: any = account;
        const currentBalance = acc.balance || 0;

        // Sum of transactions for this account that occur after the month end
        const sumAfter = transactions
          .filter((t: any) => {
            const tAccountId = t.accountid ?? t.accountId;
            if (tAccountId !== acc.id) return false;
            const isVoid = t.isvoid ?? t.isVoid ?? false;
            if (isVoid) return false;
            // Normalize transaction instant to a local calendar date by taking its UTC YYYY-MM-DD
            const tDate = t.date ? dayjs(dayjs.utc(t.date).format("YYYY-MM-DD")) : null;
            if (!tDate) return false;
            return tDate.isAfter(monthEnd, "day");
          })
          .reduce((s: number, t: any) => s + (t.amount || 0), 0);

        // Approximate balance at month end: current balance minus transactions that happened after month end
        const balanceAtMonthEnd = currentBalance - sumAfter;

        totalNetWorth += balanceAtMonthEnd;
      }

      result.push({ month: monthStr, total_net_worth: totalNetWorth, tenantid: tenantId });

      currentMonth = currentMonth.add(1, "month");
    }
    return result;
  }
}
