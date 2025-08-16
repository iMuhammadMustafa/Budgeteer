// Mock implementation for Stats API

import {
  StatsDailyTransactions,
  StatsMonthlyTransactionsTypes,
  StatsMonthlyCategoriesTransactions,
  StatsMonthlyAccountsTransactions,
  TransactionType,
} from "@/src/types/db/Tables.Types";
import { IStatsProvider } from "@/src/types/storage/providers/IStatsProvider";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { withStorageErrorHandling } from "../../storage/errors";
import { transactions, accounts, transactionCategories, transactionGroups } from "./mockDataStore";

export class MockStatsProvider implements IStatsProvider {
  readonly mode: StorageMode = StorageMode.Demo;
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async getStatsDailyTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: TransactionType,
  ): Promise<StatsDailyTransactions[]> {
    return withStorageErrorHandling(
      async () => {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const end = endDate ? new Date(endDate) : new Date(); // today
        const transactionType = type ?? "Expense";

        const filteredTransactions = transactions.filter(tr => {
          return (
            (tr.tenantid === tenantId || tenantId === "demo") &&
            !tr.isdeleted &&
            tr.type === transactionType &&
            new Date(tr.date) >= start &&
            new Date(tr.date) <= end
          );
        });

        // Group by date and sum amounts
        const dailyStats = new Map<string, number>();
        filteredTransactions.forEach(tr => {
          const dateKey = tr.date.split("T")[0]; // Get YYYY-MM-DD part
          const current = dailyStats.get(dateKey) || 0;
          dailyStats.set(dateKey, current + (tr.amount || 0));
        });

        return Array.from(dailyStats.entries()).map(([date, amount]) => ({
          date,
          sum: amount,
          tenantid: tenantId,
          type: transactionType,
        }));
      },
      {
        storageMode: "demo",
        operation: "getStatsDailyTransactions",
        table: "statsdailytransactions",
        tenantId,
      },
    );
  }

  async getStatsMonthlyTransactionsTypes(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyTransactionsTypes[]> {
    return withStorageErrorHandling(
      async () => {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const end = endDate ? new Date(endDate) : new Date(); // today

        const filteredTransactions = transactions.filter(tr => {
          return (
            (tr.tenantid === tenantId || tenantId === "demo") &&
            !tr.isdeleted &&
            new Date(tr.date) >= start &&
            new Date(tr.date) <= end
          );
        });

        // Group by month and type
        const monthlyStats = new Map<string, number>();
        filteredTransactions.forEach(tr => {
          const monthKey = `${tr.date.substring(0, 7)}-${tr.type}`; // YYYY-MM-TYPE
          const current = monthlyStats.get(monthKey) || 0;
          monthlyStats.set(monthKey, current + (tr.amount || 0));
        });

        return Array.from(monthlyStats.entries()).map(([key, amount]) => {
          const [dateStr, type] = key
            .split("-")
            .slice(0, -1)
            .join("-")
            .concat("-", key.split("-").slice(-1)[0])
            .split("-");
          const month = `${dateStr.substring(0, 7)}-01`; // First day of month
          return {
            date: month,
            sum: amount,
            tenantid: tenantId,
            type: type as TransactionType,
          };
        });
      },
      {
        storageMode: "demo",
        operation: "getStatsMonthlyTransactionsTypes",
        table: "statsmonthlytransactionstypes",
        tenantId,
      },
    );
  }

  async getStatsMonthlyCategoriesTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyCategoriesTransactions[]> {
    return withStorageErrorHandling(
      async () => {
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of month
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // End of month

        const filteredTransactions = transactions.filter(tr => {
          return (
            (tr.tenantid === tenantId || tenantId === "demo") &&
            !tr.isdeleted &&
            (tr.type === "Expense" || tr.type === "Adjustment") &&
            new Date(tr.date) >= start &&
            new Date(tr.date) <= end
          );
        });

        // Group by month and category
        const categoriesStats = new Map<
          string,
          { amount: number; categoryid: string; categoryname: string; groupid: string | null; groupname: string | null }
        >();

        filteredTransactions.forEach(tr => {
          const month = tr.date.substring(0, 7) + "-01"; // YYYY-MM-01
          const category = transactionCategories.find(cat => cat.id === tr.categoryid);
          const group = category?.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;

          const key = `${month}-${tr.categoryid}`;
          const current = categoriesStats.get(key);

          if (current) {
            current.amount += tr.amount || 0;
          } else {
            categoriesStats.set(key, {
              amount: tr.amount || 0,
              categoryid: tr.categoryid || "",
              categoryname: category?.name || "",
              groupid: group?.id || null,
              groupname: group?.name || null,
            });
          }
        });

        return Array.from(categoriesStats.entries()).map(([key, stats]) => {
          const month = key.split("-").slice(0, 3).join("-"); // Extract YYYY-MM-DD
          const category = transactionCategories.find(cat => cat.id === stats.categoryid);
          const group = category?.groupid ? transactionGroups.find(g => g.id === category.groupid) : null;

          return {
            date: month,
            sum: stats.amount,
            tenantid: tenantId,
            categoryid: stats.categoryid,
            categoryname: stats.categoryname,
            categorycolor: category?.color || null,
            categoryicon: category?.icon || null,
            categorydisplayorder: category?.displayorder || null,
            categorybudgetamount: null, // Would come from budget data
            categorybudgetfrequency: null, // Would come from budget data
            groupid: stats.groupid,
            groupname: stats.groupname,
            groupcolor: group?.color || null,
            groupicon: group?.icon || null,
            groupdisplayorder: group?.displayorder || null,
            groupbudgetamount: null, // Would come from budget data
            groupbudgetfrequency: null, // Would come from budget data
            type: "Expense" as TransactionType,
          };
        });
      },
      {
        storageMode: "demo",
        operation: "getStatsMonthlyCategoriesTransactions",
        table: "statsmonthlycategoriestransactions",
        tenantId,
      },
    );
  }

  async getStatsMonthlyAccountsTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatsMonthlyAccountsTransactions[]> {
    return withStorageErrorHandling(
      async () => {
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of month
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // End of month

        const filteredTransactions = transactions.filter(tr => {
          return (
            (tr.tenantid === tenantId || tenantId === "demo") &&
            !tr.isdeleted &&
            new Date(tr.date) >= start &&
            new Date(tr.date) <= end
          );
        });

        // Group by month and account
        const accountsStats = new Map<string, { amount: number; accountid: string; accountname: string }>();

        filteredTransactions.forEach(tr => {
          const month = tr.date.substring(0, 7) + "-01"; // YYYY-MM-01
          const account = accounts.find(acc => acc.id === tr.accountid);

          const key = `${month}-${tr.accountid}`;
          const current = accountsStats.get(key);

          if (current) {
            current.amount += tr.amount || 0;
          } else {
            accountsStats.set(key, {
              amount: tr.amount || 0,
              accountid: tr.accountid || "",
              accountname: account?.name || "",
            });
          }
        });

        return Array.from(accountsStats.entries()).map(([key, stats]) => {
          const month = key.split("-").slice(0, 3).join("-"); // Extract YYYY-MM-DD
          return {
            date: month,
            sum: stats.amount,
            tenantid: tenantId,
            accountid: stats.accountid,
            account: stats.accountname,
          };
        });
      },
      {
        storageMode: "demo",
        operation: "getStatsMonthlyAccountsTransactions",
        table: "statsmonthlyaccountstransactions",
        tenantId,
      },
    );
  }

  async getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<any[]> {
    return withStorageErrorHandling(
      async () => {
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Start of year
        const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), 11, 31); // End of year

        // Calculate net worth by month based on account balances and transaction history
        const netWorthData = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
          const monthStr = currentDate.toISOString().substring(0, 7) + "-01";

          // Calculate net worth for this month
          // In a real implementation, this would involve complex calculations
          // For demo, we'll use a simplified approach based on current account balances
          const totalAssets = accounts
            .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
            .reduce((sum, acc) => {
              // Get account category to determine if it's an asset or liability
              const category = acc.categoryid
                ? require("./mockDataStore").accountCategories.find((cat: any) => cat.id === acc.categoryid)
                : null;

              if (category?.type === "Asset") {
                return sum + (acc.balance || 0);
              }
              return sum;
            }, 0);

          const totalLiabilities = accounts
            .filter(acc => (acc.tenantid === tenantId || tenantId === "demo") && !acc.isdeleted)
            .reduce((sum, acc) => {
              const category = acc.categoryid
                ? require("./mockDataStore").accountCategories.find((cat: any) => cat.id === acc.categoryid)
                : null;

              if (category?.type === "Liability") {
                return sum + Math.abs(acc.balance || 0); // Liabilities are positive in net worth calc
              }
              return sum;
            }, 0);

          netWorthData.push({
            month: monthStr,
            assets: totalAssets,
            liabilities: totalLiabilities,
            networth: totalAssets - totalLiabilities,
            tenantid: tenantId,
          });

          currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return netWorthData;
      },
      {
        storageMode: "demo",
        operation: "getStatsNetWorthGrowth",
        table: "statsnetworthgrowth",
        tenantId,
      },
    );
  }
}

// Export provider instance
export const mockStatsProvider = new MockStatsProvider();

// Legacy function exports for backward compatibility
export const getStatsDailyTransactions = (
  tenantId: string,
  startDate?: string,
  endDate?: string,
  type?: TransactionType,
) => mockStatsProvider.getStatsDailyTransactions(tenantId, startDate, endDate, type);

export const getStatsMonthlyTransactionsTypes = (tenantId: string, startDate?: string, endDate?: string) =>
  mockStatsProvider.getStatsMonthlyTransactionsTypes(tenantId, startDate, endDate);

export const getStatsMonthlyCategoriesTransactions = (tenantId: string, startDate?: string, endDate?: string) =>
  mockStatsProvider.getStatsMonthlyCategoriesTransactions(tenantId, startDate, endDate);

export const getStatsMonthlyAccountsTransactions = (tenantId: string, startDate?: string, endDate?: string) =>
  mockStatsProvider.getStatsMonthlyAccountsTransactions(tenantId, startDate, endDate);

export const getStatsNetWorthGrowth = (tenantId: string, startDate?: string, endDate?: string) =>
  mockStatsProvider.getStatsNetWorthGrowth(tenantId, startDate, endDate);
