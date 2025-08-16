import { db } from "./BudgeteerDatabase";
import { TransactionsView } from "../../../types/db/Tables.Types";
import { TransactionFilters } from "../../../types/apis/TransactionFilters";
import { withStorageErrorHandling } from "../../storage/errors";

/**
 * Local implementation of TransactionsView equivalent
 * This recreates the complex SQL view logic using IndexedDB queries
 */
export class LocalTransactionsViewService {
  /**
   * Get all transactions with full view data (equivalent to materialized view)
   */
  async getAllTransactionsView(tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            // Get all non-deleted transactions for the tenant
            const transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted)
              .toArray();

            // Fetch related data in parallel for better performance
            const [categories, groups, accounts] = await Promise.all([
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
              db.accounts
                .where("tenantid")
                .equals(tenantId)
                .and(a => !a.isdeleted)
                .toArray(),
            ]);

            // Create lookup maps for performance
            const categoryMap = new Map(categories.map(c => [c.id, c]));
            const groupMap = new Map(groups.map(g => [g.id, g]));
            const accountMap = new Map(accounts.map(a => [a.id, a]));

            // Transform and enrich transactions
            const enrichedTransactions = transactions
              .map(t => {
                const category = categoryMap.get(t.categoryid);
                const group = category ? groupMap.get(category.groupid) : undefined;
                const account = accountMap.get(t.accountid);

                if (!category || !group || !account) {
                  return null; // Skip transactions with missing related data
                }

                return {
                  id: t.id,
                  name: t.name,
                  date: t.date,
                  amount: t.amount,
                  type: t.type,
                  payee: t.payee,
                  isvoid: t.isvoid,
                  transferid: t.transferid,
                  transferaccountid: t.transferaccountid,
                  createdat: t.createdat,
                  updatedat: t.updatedat,
                  categoryid: category.id,
                  categoryname: category.name,
                  icon: category.icon,
                  groupid: group.id,
                  groupname: group.name,
                  groupicon: group.icon,
                  accountid: account.id,
                  accountname: account.name,
                  currency: account.currency,
                  balance: account.balance,
                  runningbalance: 0, // Will be calculated below
                  tenantid: t.tenantid,
                } as TransactionsView;
              })
              .filter(t => t !== null) as TransactionsView[];

            // Calculate running balances for each account
            await this.calculateRunningBalances(enrichedTransactions);

            // Sort by date descending (most recent first)
            enrichedTransactions.sort((a, b) => {
              const dateA = a.date || "";
              const dateB = b.date || "";
              const dateCompare = new Date(dateB).getTime() - new Date(dateA).getTime();
              if (dateCompare !== 0) return dateCompare;

              const createDateA = a.createdat || "";
              const createDateB = b.createdat || "";
              const createDateCompare = new Date(createDateB).getTime() - new Date(createDateA).getTime();
              if (createDateCompare !== 0) return createDateCompare;

              return (b.id || "").localeCompare(a.id || "");
            });

            return enrichedTransactions;
          },
          "getAllTransactionsView",
          "transactions",
          { tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getAllTransactionsView",
        table: "transactions",
        tenantId,
      },
    );
  }

  /**
   * Get filtered transactions with view data
   */
  async getTransactionsView(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            // Start with all transactions for the tenant
            let transactions = await db.transactions
              .where("tenantid")
              .equals(tenantId)
              .and(t => !t.isdeleted)
              .toArray();

            // Apply filters
            transactions = this.applyFilters(transactions, searchFilters);

            // Get related data
            const [categories, groups, accounts] = await Promise.all([
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
              db.accounts
                .where("tenantid")
                .equals(tenantId)
                .and(a => !a.isdeleted)
                .toArray(),
            ]);

            // Create lookup maps
            const categoryMap = new Map(categories.map(c => [c.id, c]));
            const groupMap = new Map(groups.map(g => [g.id, g]));
            const accountMap = new Map(accounts.map(a => [a.id, a]));

            // Transform transactions
            const enrichedTransactions = transactions
              .map(t => {
                const category = categoryMap.get(t.categoryid);
                const group = category ? groupMap.get(category.groupid) : undefined;
                const account = accountMap.get(t.accountid);

                if (!category || !group || !account) {
                  return null;
                }

                return {
                  id: t.id,
                  name: t.name,
                  date: t.date,
                  amount: t.amount,
                  type: t.type,
                  payee: t.payee,
                  isvoid: t.isvoid,
                  transferid: t.transferid,
                  transferaccountid: t.transferaccountid,
                  createdat: t.createdat,
                  updatedat: t.updatedat,
                  categoryid: category.id,
                  categoryname: category.name,
                  icon: category.icon,
                  groupid: group.id,
                  groupname: group.name,
                  groupicon: group.icon,
                  accountid: account.id,
                  accountname: account.name,
                  currency: account.currency,
                  balance: account.balance,
                  runningbalance: 0,
                  tenantid: t.tenantid,
                } as TransactionsView;
              })
              .filter(t => t !== null) as TransactionsView[];

            // Calculate running balances
            await this.calculateRunningBalances(enrichedTransactions);

            // Apply pagination if specified
            if (searchFilters.startIndex !== undefined && searchFilters.endIndex !== undefined) {
              const startIdx = Math.max(0, searchFilters.startIndex);
              const endIdx = Math.min(enrichedTransactions.length - 1, searchFilters.endIndex);
              return enrichedTransactions.slice(startIdx, endIdx + 1);
            }

            return enrichedTransactions;
          },
          "getTransactionsView",
          "transactions",
          { searchFilters, tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTransactionsView",
        table: "transactions",
        tenantId,
      },
    );
  }

  /**
   * Get single transaction by ID with full view data
   */
  async getTransactionViewById(transactionId: string, tenantId: string): Promise<TransactionsView | null> {
    return withStorageErrorHandling(
      async () => {
        return await db.safeQuery(
          async () => {
            const transaction = await db.transactions
              .where("id")
              .equals(transactionId)
              .and(t => t.tenantid === tenantId && !t.isdeleted)
              .first();

            if (!transaction) {
              return null;
            }

            // Get related data
            const [category, account] = await Promise.all([
              db.transactioncategories.get(transaction.categoryid),
              db.accounts.get(transaction.accountid),
            ]);

            if (!category || !account) {
              return null;
            }

            const group = await db.transactiongroups.get(category.groupid);
            if (!group) {
              return null;
            }

            // Get running balance by calculating all previous transactions for this account
            const runningBalance = await this.calculateRunningBalanceForTransaction(transaction, tenantId);

            return {
              id: transaction.id,
              name: transaction.name,
              date: transaction.date,
              amount: transaction.amount,
              type: transaction.type,
              payee: transaction.payee,
              isvoid: transaction.isvoid,
              transferid: transaction.transferid,
              transferaccountid: transaction.transferaccountid,
              createdat: transaction.createdat,
              updatedat: transaction.updatedat,
              categoryid: category.id,
              categoryname: category.name,
              icon: category.icon,
              groupid: group.id,
              groupname: group.name,
              groupicon: group.icon,
              accountid: account.id,
              accountname: account.name,
              currency: account.currency,
              balance: account.balance,
              runningbalance: runningBalance,
              tenantid: transaction.tenantid,
            } as TransactionsView;
          },
          "getTransactionViewById",
          "transactions",
          { transactionId, tenantId },
        );
      },
      {
        storageMode: "local",
        operation: "getTransactionViewById",
        table: "transactions",
        recordId: transactionId,
        tenantId,
      },
    );
  }

  /**
   * Apply filters to transaction array
   */
  private applyFilters(transactions: any[], filters: TransactionFilters): any[] {
    return transactions.filter(t => {
      // Date range filter
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;

      // Text filters
      if (filters.name && !t.name?.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.description && !t.description?.toLowerCase().includes(filters.description.toLowerCase()))
        return false;

      // Exact match filters
      if (filters.amount && t.amount !== filters.amount) return false;
      if (filters.categoryid && t.categoryid !== filters.categoryid) return false;
      if (filters.accountid && t.accountid !== filters.accountid) return false;
      if (filters.isVoid !== undefined && t.isvoid !== filters.isVoid) return false;
      if (filters.type && t.type !== filters.type) return false;

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!t.tags || !Array.isArray(t.tags)) return false;
        const hasMatchingTag = filters.tags.some(tag => t.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }

  /**
   * Calculate running balances for all transactions
   */
  private async calculateRunningBalances(transactions: TransactionsView[]): Promise<void> {
    // Group transactions by account
    const accountGroups = new Map<string, TransactionsView[]>();

    transactions.forEach(t => {
      const accountId = t.accountid;
      if (!accountId) return; // Skip transactions without account ID

      if (!accountGroups.has(accountId)) {
        accountGroups.set(accountId, []);
      }
      accountGroups.get(accountId)!.push(t);
    });

    // Calculate running balance for each account
    for (const [accountId, accountTransactions] of accountGroups) {
      // Sort by date ascending for running balance calculation
      accountTransactions.sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        const dateCompare = new Date(dateA).getTime() - new Date(dateB).getTime();
        if (dateCompare !== 0) return dateCompare;

        const createDateA = a.createdat || "";
        const createDateB = b.createdat || "";
        const createDateCompare = new Date(createDateA).getTime() - new Date(createDateB).getTime();
        if (createDateCompare !== 0) return createDateCompare;

        return (a.id || "").localeCompare(b.id || "");
      });

      // Get starting balance from account
      let runningBalance = accountTransactions[0]?.balance || 0;

      // Get all prior transactions for this account to establish correct starting point
      const firstTransactionDate = accountTransactions[0]?.date || "";
      const allPriorTransactions = await db.transactions
        .where("accountid")
        .equals(accountId)
        .and(t => !t.isdeleted && !t.isvoid && (t.date || "") < firstTransactionDate)
        .toArray();

      // Subtract all prior transaction amounts to get the balance before our first transaction
      const priorAmount = allPriorTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      runningBalance = (accountTransactions[0]?.balance || 0) - priorAmount;

      // Calculate running balance for each transaction
      accountTransactions.forEach(t => {
        if (!t.isvoid) {
          runningBalance += t.amount || 0;
        }
        t.runningbalance = runningBalance;
      });
    }
  }

  /**
   * Calculate running balance for a single transaction
   */
  private async calculateRunningBalanceForTransaction(transaction: any, tenantId: string): Promise<number> {
    // Get all transactions for this account up to and including this transaction
    const priorTransactions = await db.transactions
      .where("accountid")
      .equals(transaction.accountid)
      .and(
        t =>
          t.tenantid === tenantId &&
          !t.isdeleted &&
          !t.isvoid &&
          (new Date(t.date) < new Date(transaction.date) ||
            (new Date(t.date).getTime() === new Date(transaction.date).getTime() && t.id <= transaction.id)),
      )
      .toArray();

    // Get account starting balance
    const account = await db.accounts.get(transaction.accountid);
    const startingBalance = account?.balance || 0;

    // Calculate total amount of all transactions
    const totalAmount = priorTransactions.reduce((sum, t) => sum + t.amount, 0);

    return (
      startingBalance -
      (priorTransactions.length > 0
        ? priorTransactions.reduce((sum, t) => sum + t.amount, 0) - transaction.amount
        : 0) +
      totalAmount
    );
  }
}

// Export singleton instance
export const localTransactionsViewService = new LocalTransactionsViewService();
