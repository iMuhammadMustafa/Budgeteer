import { IStatsRepository } from "../interfaces/IStatsRepository";
import {
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyAccountsTransactions,
  StatsNetWorthGrowth,
  TransactionType,
} from "@/src/types/db/Tables.Types";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";
import dayjs from "dayjs";

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
    try {
      const db = await this.getDb();

      const conditions = [
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
        Q.where("type", type ?? "Expense"),
        Q.where("date", Q.gte(startDate ?? dayjs().startOf("week").format("YYYY-MM-DD"))),
        Q.where("date", Q.lte(endDate ?? dayjs().endOf("week").format("YYYY-MM-DD"))),
      ];

      const transactions = await db.get("transactions").query(...conditions);

      // Group transactions by date and calculate daily totals
      const dailyStats: Record<string, number> = {};
      transactions.forEach((transaction: any) => {
        const date = dayjs(transaction.date).format("YYYY-MM-DD");
        dailyStats[date] = (dailyStats[date] || 0) + transaction.amount;
      });

      // Convert to the expected format
      return Object.entries(dailyStats).map(([date, sum]) => ({
        date,
        sum,
        type: type ?? "Expense",
        tenantid: tenantId,
      })) as StatsDailyTransactions[];
    } catch (error) {
      throw new Error(
        `Failed to get daily transaction stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    try {
      const db = await this.getDb();

      const conditions = [
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
        Q.where("date", Q.gte(startDate ?? dayjs().startOf("week").format("YYYY-MM-DD"))),
        Q.where("date", Q.lte(endDate ?? dayjs().endOf("week").format("YYYY-MM-DD"))),
      ];

      const transactions = await db.get("transactions").query(...conditions);

      // Group transactions by month and type
      const monthlyStats: Record<string, Record<string, number>> = {};
      transactions.forEach((transaction: any) => {
        const month = dayjs(transaction.date).format("YYYY-MM-01");
        const type = transaction.type;

        if (!monthlyStats[month]) {
          monthlyStats[month] = {};
        }
        monthlyStats[month][type] = (monthlyStats[month][type] || 0) + transaction.amount;
      });

      // Convert to the expected format
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
    } catch (error) {
      throw new Error(
        `Failed to get monthly transaction type stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    try {
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
      const groups = await db
        .get("transactiongroups")
        .query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));

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
    } catch (error) {
      throw new Error(
        `Failed to get monthly category transaction stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    try {
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
    } catch (error) {
      throw new Error(
        `Failed to get monthly account transaction stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatsTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number }> {
    try {
      const db = await this.getDb();
      const accounts = await db.get("accounts").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));
      const totalBalance = accounts.reduce((sum, account) => sum + ((account as any).balance || 0), 0);
      return { totalbalance: totalBalance };
    } catch (error) {
      throw new Error(
        `Failed to get total account balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<StatsNetWorthGrowth[]> {
    try {
      const db = await this.getDb();

      // Get all accounts for the tenant
      const accounts = await db.get("accounts").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));

      const startMonth = startDate ? dayjs(startDate).startOf("month") : dayjs().startOf("year");
      const endMonth = endDate ? dayjs(endDate).endOf("month") : dayjs().endOf("year");

      const result: StatsNetWorthGrowth[] = [];

      // Generate monthly data points
      let currentMonth = startMonth;
      while (currentMonth.isBefore(endMonth) || currentMonth.isSame(endMonth, "month")) {
        const monthStr = currentMonth.format("YYYY-MM-01");

        // Calculate net worth for this month
        // This is a simplified calculation - in reality you'd need to consider
        // account balances at specific points in time
        let totalAssets = 0;
        let totalLiabilities = 0;

        for (const account of accounts) {
          const balance = (account as any).balance || 0;
          // TODO: Determine if account is asset or liability from category
          // For now, assume positive balances are assets, negative are liabilities
          if (balance >= 0) {
            totalAssets += balance;
          } else {
            totalLiabilities += Math.abs(balance);
          }
        }

        result.push({
          month: monthStr,
          total_net_worth: totalAssets - totalLiabilities,
          tenantid: tenantId,
        });

        currentMonth = currentMonth.add(1, "month");
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to get net worth growth stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
