import { eq, and, gte, lte, ilike, inArray, desc, sql } from "drizzle-orm";
import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { 
  transactions, 
  accounts, 
  transactionCategories, 
  transactionGroups,
  Transaction, 
  TransactionInsert, 
  TransactionUpdate 
} from "../../types/db/sqllite/schema";
import { TransactionFilters } from "../../types/apis/TransactionFilters";
import dayjs from "dayjs";

// Define the TransactionsView type for SQLite (matching Supabase view structure)
export interface TransactionsView {
  accountid: string | null;
  accountname: string | null;
  amount: number | null;
  balance: number | null;
  categoryid: string | null;
  categoryname: string | null;
  createdat: string | null;
  currency: string | null;
  date: string | null;
  groupicon: string | null;
  groupid: string | null;
  groupname: string | null;
  icon: string | null;
  id: string | null;
  isvoid: boolean | null;
  name: string | null;
  payee: string | null;
  runningbalance: number | null;
  tenantid: string | null;
  transferaccountid: string | null;
  transferid: string | null;
  type: "Expense" | "Income" | "Transfer" | "Adjustment" | "Initial" | "Refund" | null;
  updatedat: string | null;
}

// Define SearchDistinctTransactions type for SQLite
export interface SearchDistinctTransactions {
  name: string;
  amount: number;
  categoryid: string;
  accountid: string;
  type: string;
  tenantid: string;
}

// Define the interface methods that need to be implemented
interface ITransactionRepositoryMethods {
  findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]>;
  getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView>;
  findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]>;
  createMultipleTransactions(transactions: TransactionInsert[]): Promise<Transaction[]>;
  updateTransferTransaction(transaction: TransactionUpdate): Promise<Transaction>;
  findByDate(date: string, tenantId: string): Promise<TransactionsView[]>;
  findByCategory(categoryId: string, type: "category" | "group", tenantId: string): Promise<TransactionsView[]>;
  findByMonth(month: string, tenantId: string): Promise<TransactionsView[]>;
  findByAccountInDateRange(accountId: string, startDate: Date, endDate: Date, tenantId: string): Promise<TransactionsView[]>;
  getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number>;
}

export class TransactionSQLiteRepository 
  extends BaseSQLiteRepository<Transaction, TransactionInsert, TransactionUpdate>
  implements ITransactionRepositoryMethods {

  protected table = transactions;

  /**
   * Builds a TransactionsView-like query by joining transactions with related tables
   */
  private async buildTransactionsViewQuery() {
    const db = await this.getDb();
    return db
      .select({
        accountid: transactions.accountid,
        accountname: accounts.name,
        amount: transactions.amount,
        balance: accounts.balance,
        categoryid: transactions.categoryid,
        categoryname: transactionCategories.name,
        createdat: transactions.createdat,
        currency: accounts.currency,
        date: transactions.date,
        groupicon: transactionGroups.icon,
        groupid: transactionGroups.id,
        groupname: transactionGroups.name,
        icon: transactionCategories.icon,
        id: transactions.id,
        isvoid: transactions.isvoid,
        name: transactions.name,
        payee: transactions.payee,
        runningbalance: sql<number>`0`, // Placeholder for running balance calculation
        tenantid: transactions.tenantid,
        transferaccountid: transactions.transferaccountid,
        transferid: transactions.transferid,
        type: transactions.type,
        updatedat: transactions.updatedat,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountid, accounts.id))
      .leftJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
      .leftJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id));
  }

  /**
   * Finds all transactions with filters (implements TransactionsView-like functionality)
   */
  async findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    try {
      let query = await this.buildTransactionsViewQuery();

      // Base conditions
      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false)
      ];

      // Apply search filters
      if (searchFilters.startDate) {
        conditions.push(gte(transactions.date, searchFilters.startDate));
      }
      if (searchFilters.endDate) {
        conditions.push(lte(transactions.date, searchFilters.endDate));
      }
      if (searchFilters.name) {
        conditions.push(ilike(transactions.name, `%${searchFilters.name}%`));
      }
      if (searchFilters.description) {
        conditions.push(ilike(transactions.description, `%${searchFilters.description}%`));
      }
      if (searchFilters.amount !== undefined) {
        conditions.push(eq(transactions.amount, searchFilters.amount));
      }
      if (searchFilters.categoryid) {
        conditions.push(eq(transactions.categoryid, searchFilters.categoryid));
      }
      if (searchFilters.accountid) {
        conditions.push(eq(transactions.accountid, searchFilters.accountid));
      }
      if (searchFilters.isVoid !== undefined) {
        conditions.push(eq(transactions.isvoid, searchFilters.isVoid === 'true'));
      }
      if (searchFilters.type) {
        conditions.push(eq(transactions.type, searchFilters.type));
      }
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        // For SQLite, we'll need to handle JSON array search differently
        // This is a simplified implementation - in production you might want to use JSON functions
        const tagConditions = searchFilters.tags.map(tag => 
          ilike(transactions.tags, `%"${tag}"%`)
        );
        conditions.push(sql`(${tagConditions.join(' OR ')})`);
      }

      query = query.where(and(...conditions)).orderBy(desc(transactions.date));

      // Apply pagination if specified
      if (
        searchFilters.startIndex !== undefined &&
        searchFilters.startIndex >= 0 &&
        searchFilters.endIndex !== undefined &&
        searchFilters.endIndex >= 0
      ) {
        const limit = searchFilters.endIndex - searchFilters.startIndex + 1;
        query = query.limit(limit).offset(searchFilters.startIndex);
      }

      const result = await query;
      return result as TransactionsView[];
    } catch (error) {
      throw new Error(`Failed to find transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a transaction by its transfer ID (interface method)
   */
  async getByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    try {
      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          eq(transactions.transferid, id)
        ))
        .limit(1);

      if (result.length === 0) {
        throw new Error(`No transaction found with transfer ID ${id}`);
      }

      return result[0] as TransactionsView;
    } catch (error) {
      throw new Error(`Failed to get transaction by transfer ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a transaction by its transfer ID (legacy method name)
   */
  async getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    return this.getByTransferId(id, tenantId);
  }

  /**
   * Finds transactions by name for search/autocomplete functionality
   */
  async findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
    try {
      const db = await this.getDb();
      const result = await db
        .selectDistinct({
          name: transactions.name,
          amount: transactions.amount,
          categoryid: transactions.categoryid,
          accountid: transactions.accountid,
          type: transactions.type,
          tenantid: transactions.tenantid,
        })
        .from(transactions)
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          ilike(transactions.name, `%${text}%`)
        ))
        .limit(7);

      return result
        .filter(transaction => transaction.name) // Filter out null names
        .map(transaction => ({
          label: transaction.name!,
          item: {
            name: transaction.name!,
            amount: transaction.amount || 0,
            categoryid: transaction.categoryid!,
            accountid: transaction.accountid!,
            type: transaction.type!,
            tenantid: transaction.tenantid!,
          } as SearchDistinctTransactions,
        }));
    } catch (error) {
      throw new Error(`Failed to find transactions by name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates multiple transactions in a single operation
   */
  async createMultipleTransactions(transactionData: TransactionInsert[]): Promise<Transaction[]> {
    try {
      const db = await this.getDb();
      const result = await db
        .insert(transactions)
        .values(transactionData)
        .returning();

      return result as Transaction[];
    } catch (error) {
      throw new Error(`Failed to create multiple transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates a transfer transaction by its transfer ID
   */
  async updateTransferTransaction(transaction: TransactionUpdate): Promise<Transaction> {
    try {
      if (!transaction.transferid) {
        throw new Error("Transfer ID is required for updating transfer transaction");
      }

      const updateData = { ...transaction };
      delete updateData.transferid; // Remove transferid from update data since it's used in WHERE clause

      // Add update timestamp
      updateData.updatedat = new Date().toISOString();

      const db = await this.getDb();
      const result = await db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.transferid, transaction.transferid))
        .returning();

      if (result.length === 0) {
        throw new Error(`No transaction found with transfer ID ${transaction.transferid}`);
      }

      return result[0] as Transaction;
    } catch (error) {
      throw new Error(`Failed to update transfer transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds transactions by date
   */
  async findByDate(date: string, tenantId: string): Promise<TransactionsView[]> {
    try {
      // Convert the date to local timezone for the start and end of the day
      const startOfDay = dayjs(date).startOf("day").toISOString();
      const endOfDay = dayjs(date).endOf("day").toISOString();

      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          gte(transactions.date, startOfDay),
          lte(transactions.date, endOfDay)
        ))
        .orderBy(desc(transactions.date));

      return result as TransactionsView[];
    } catch (error) {
      throw new Error(`Failed to find transactions by date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds transactions by category or group for the current month
   */
  async findByCategory(categoryId: string, type: "category" | "group", tenantId: string): Promise<TransactionsView[]> {
    try {
      // Get the start and end of the current month in local timezone
      const startOfMonth = dayjs().startOf("month").toISOString();
      const endOfMonth = dayjs().endOf("month").toISOString();

      const conditions = [
        eq(transactions.tenantid, tenantId),
        eq(transactions.isdeleted, false),
        gte(transactions.date, startOfMonth),
        lte(transactions.date, endOfMonth)
      ];

      if (type === "category") {
        conditions.push(eq(transactions.categoryid, categoryId));
      } else {
        conditions.push(eq(transactionGroups.id, categoryId));
      }

      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(...conditions))
        .orderBy(desc(transactions.date));

      return result as TransactionsView[];
    } catch (error) {
      throw new Error(`Failed to find transactions by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds transactions by month
   */
  async findByMonth(month: string, tenantId: string): Promise<TransactionsView[]> {
    try {
      // Convert the month to local timezone for the start and end of the month
      const startOfMonth = dayjs(month).startOf("month").toISOString();
      const endOfMonth = dayjs(month).endOf("month").toISOString();

      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth)
        ))
        .orderBy(desc(transactions.date));

      return result as TransactionsView[];
    } catch (error) {
      throw new Error(`Failed to find transactions by month: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Override findById to return TransactionsView format
   */
  async findById(id: string, tenantId?: string): Promise<TransactionsView | null> {
    try {
      const conditions = [eq(transactions.id, id)];

      if (tenantId) {
        conditions.push(eq(transactions.tenantid, tenantId));
      }

      conditions.push(eq(transactions.isdeleted, false));

      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(...conditions))
        .limit(1);

      return result[0] as TransactionsView || null;
    } catch (error) {
      throw new Error(`Failed to find transaction by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds transactions for a specific account within a date range
   * Used for statement balance calculations
   */
  async findByAccountInDateRange(
    accountId: string, 
    startDate: Date, 
    endDate: Date, 
    tenantId: string
  ): Promise<TransactionsView[]> {
    try {
      const query = await this.buildTransactionsViewQuery();
      const result = await query
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          eq(transactions.accountid, accountId),
          gte(transactions.date, startDate.toISOString()),
          lte(transactions.date, endDate.toISOString())
        ))
        .orderBy(desc(transactions.date));

      return result as TransactionsView[];
    } catch (error) {
      throw new Error(`Failed to find transactions by account in date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the account balance at a specific date
   * Calculates balance by summing all transactions up to that date
   */
  async getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number> {
    try {
      const db = await this.getDb();
      
      // Get all transactions for this account up to the specified date
      const result = await db
        .select({
          totalAmount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
        })
        .from(transactions)
        .where(and(
          eq(transactions.tenantid, tenantId),
          eq(transactions.isdeleted, false),
          eq(transactions.accountid, accountId),
          lte(transactions.date, date.toISOString())
        ));

      return result[0]?.totalAmount || 0;
    } catch (error) {
      throw new Error(`Failed to get account balance at date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}