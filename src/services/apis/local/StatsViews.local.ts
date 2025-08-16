import { db } from "./BudgeteerDatabase";
import { withStorageErrorHandling } from "../../storage/errors";

/**
 * Local implementation of Stats views equivalent to Supabase materialized views
 */
export class LocalStatsService {
  /**
   * Stats_DailyTransactions view equivalent
   */
  async getDailyTransactions(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted && !t.isvoid)
              .toArray();

            // Group by type and date (day)
            const groupedData = new Map<string, { type: string; date: string; sum: number; tenantid: string }>();

            transactions.forEach(t => {
              const date = new Date(t.date || "").toISOString().split("T")[0]; // Get YYYY-MM-DD
              const key = `${t.type}_${date}`;

              if (!groupedData.has(key)) {
                groupedData.set(key, {
                  type: t.type || "Expense",
                  date,
                  sum: 0,
                  tenantid: t.tenantid,
                });
              }

              groupedData.get(key)!.sum += t.amount || 0;
            });

            return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
          },
          "getDailyTransactions",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getDailyTransactions",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Stats_MonthlyTransactionsTypes view equivalent
   */
  async getMonthlyTransactionsTypes(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted && !t.isvoid)
              .toArray();

            // Group by type and month
            const groupedData = new Map<string, { type: string; date: string; sum: number; tenantid: string }>();

            transactions.forEach(t => {
              const date = new Date(t.date || "");
              const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
              const key = `${t.type}_${monthYear}`;

              if (!groupedData.has(key)) {
                groupedData.set(key, {
                  type: t.type || "Expense",
                  date: monthYear,
                  sum: 0,
                  tenantid: t.tenantid,
                });
              }

              groupedData.get(key)!.sum += t.amount || 0;
            });

            return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
          },
          "getMonthlyTransactionsTypes",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getMonthlyTransactionsTypes",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Stats_MonthlyAccountsTransactions view equivalent
   */
  async getMonthlyAccountsTransactions(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const [transactions, accounts] = await Promise.all([
              db.transactions
                .where("tenantid")
                .equals(tenantId)
                .and(t => !t.isdeleted && !t.isvoid)
                .toArray(),
              db.accounts
                .where("tenantid")
                .equals(tenantId)
                .and(a => !a.isdeleted)
                .toArray(),
            ]);

            const accountMap = new Map(accounts.map(a => [a.id, a.name]));

            // Group by account and month
            const groupedData = new Map<string, any>();

            transactions.forEach(t => {
              const date = new Date(t.date || "");
              const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
              const key = `${t.accountid}_${monthYear}`;

              if (!groupedData.has(key)) {
                groupedData.set(key, {
                  accountid: t.accountid,
                  account: accountMap.get(t.accountid) || "",
                  tenantid: t.tenantid,
                  date: monthYear,
                  sum: 0,
                });
              }

              groupedData.get(key)!.sum += t.amount || 0;
            });

            return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
          },
          "getMonthlyAccountsTransactions",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getMonthlyAccountsTransactions",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Stats_MonthlyCategoriesTransactions view equivalent
   */
  async getMonthlyCategoriesTransactions(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const [transactions, categories, groups] = await Promise.all([
              db.transactions
                .where("tenantid")
                .equals(tenantId)
                .and(t => !t.isdeleted && !t.isvoid)
                .toArray(),
              db.transactioncategories
                .where("tenantid")
                .equals(tenantId)
                .and(tc => !tc.isdeleted)
                .toArray(),
              db.transactiongroups
                .where("tenantid")
                .equals(tenantId)
                .and(tg => !tg.isdeleted)
                .toArray(),
            ]);

            const categoryMap = new Map(categories.map(c => [c.id, c]));
            const groupMap = new Map(groups.map(g => [g.id, g]));

            // Group by category/group and month
            const groupedData = new Map<string, any>();

            transactions.forEach(t => {
              const category = categoryMap.get(t.categoryid);
              if (!category) return;

              const group = groupMap.get(category.groupid);
              if (!group) return;

              const date = new Date(t.date || "");
              const monthYear = date.toISOString().substring(0, 7) + "-01"; // YYYY-MM-01
              const key = `${group.id}_${category.id}_${monthYear}`;

              if (!groupedData.has(key)) {
                groupedData.set(key, {
                  groupid: group.id,
                  categoryid: category.id,
                  groupname: group.name,
                  type: t.type,
                  groupbudgetamount: group.budgetamount,
                  groupbudgetfrequency: group.budgetfrequency,
                  groupicon: group.icon,
                  groupcolor: group.color,
                  groupdisplayorder: group.displayorder,
                  categoryname: category.name,
                  categorybudgetamount: category.budgetamount,
                  categorybudgetfrequency: category.budgetfrequency,
                  categoryicon: category.icon,
                  categorycolor: category.color,
                  categorydisplayorder: category.displayorder,
                  date: monthYear,
                  sum: 0,
                  tenantid: t.tenantid,
                });
              }

              groupedData.get(key)!.sum += t.amount || 0;
            });

            return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
          },
          "getMonthlyCategoriesTransactions",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getMonthlyCategoriesTransactions",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Stats_NetWorthGrowth view equivalent
   */
  async getNetWorthGrowth(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted && !t.isvoid)
              .toArray();

            // Group transactions by month and account to get latest balance per account per month
            const monthlyAccountBalances = new Map<string, Map<string, number>>();

            // Get unique months from transactions
            const months = new Set<string>();
            transactions.forEach(t => {
              const date = new Date(t.date || "");
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
              months.add(monthKey);
            });

            // For each month, calculate the latest running balance per account
            for (const month of Array.from(months).sort()) {
              const monthDate = new Date(`${month}-01`);
              const nextMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

              // Get all transactions up to end of this month, grouped by account
              const accountBalances = new Map<string, number>();

              const relevantTransactions = transactions
                .filter(t => new Date(t.date || "") < nextMonthDate)
                .sort((a, b) => new Date(a.date || "").getTime() - new Date(b.date || "").getTime());

              // Calculate running balance for each account
              relevantTransactions.forEach(t => {
                const currentBalance = accountBalances.get(t.accountid) || 0;
                accountBalances.set(t.accountid, currentBalance + (t.amount || 0));
              });

              monthlyAccountBalances.set(month, accountBalances);
            }

            // Calculate total net worth for each month
            const netWorthGrowth: any[] = [];
            for (const [month, accountBalances] of monthlyAccountBalances) {
              const totalNetWorth = Array.from(accountBalances.values()).reduce((sum, balance) => sum + balance, 0);

              netWorthGrowth.push({
                month: `${month}-01`,
                total_net_worth: totalNetWorth,
                tenantid: tenantId,
              });
            }

            return netWorthGrowth.sort((a, b) => a.month.localeCompare(b.month));
          },
          "getNetWorthGrowth",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getNetWorthGrowth",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Stats_TotalAccountBalance view equivalent
   */
  async getTotalAccountBalance(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const accounts = await db.accounts
              .where("tenantid")
              .equals(tenantId)
              .and(a => !a.isdeleted)
              .toArray();

            const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

            return [
              {
                totalbalance: totalBalance,
                tenantid: tenantId,
              },
            ];
          },
          "getTotalAccountBalance",
          "stats",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTotalAccountBalance",
        table: "stats",
        tenantId,
      },
    );
  }

  /**
   * Search_DistinctTransactions view equivalent
   */
  async getDistinctTransactions(tenantId: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted && (t.type === "Expense" || t.type === "Income" || t.type === "Transfer"))
              .toArray();

            // Group by name and get the latest transaction for each name
            const distinctTransactions = new Map<string, any>();

            transactions
              .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
              .forEach(t => {
                if (t.name && !distinctTransactions.has(t.name)) {
                  distinctTransactions.set(t.name, {
                    name: t.name,
                    amount: t.amount,
                    payee: t.payee,
                    type: t.type,
                    isvoid: t.isvoid,
                    description: t.description,
                    notes: t.notes,
                    categoryid: t.categoryid,
                    accountid: t.accountid,
                    transferid: t.transferid,
                    transferaccountid: t.transferaccountid,
                    tenantid: t.tenantid,
                  });
                }
              });

            return Array.from(distinctTransactions.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          },
          "getDistinctTransactions",
          "search",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getDistinctTransactions",
        table: "search",
        tenantId,
      },
    );
  }
}

// Export singleton instance
export const localStatsService = new LocalStatsService();
