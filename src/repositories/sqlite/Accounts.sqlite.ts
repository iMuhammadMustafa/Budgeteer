import { eq, and, sum } from "drizzle-orm";
import { BaseSQLiteRepository } from "./BaseSQLiteRepository";
import { accounts, transactions, Account, AccountInsert, AccountUpdate } from "../../types/db/sqllite/schema";
import { updateAccountBalance } from "../../types/db/sqllite/functions";

// Define the interface methods that need to be implemented
interface IAccountRepositoryMethods {
  updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number>;
  getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }>;
  getTotalAccountBalance(tenantId?: string): Promise<{ totalbalance: number } | null>;
}

export class AccountSQLiteRepository 
  extends BaseSQLiteRepository<Account, AccountInsert, AccountUpdate>
  implements IAccountRepositoryMethods {

  protected table = accounts;

  /**
   * Updates an account balance by adding the specified amount
   * Uses the database function from the functions module
   */
  async updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number> {
    try {
      const db = await this.getDb();
      return await updateAccountBalance(db, accountid, amount);
    } catch (error) {
      throw new Error(`Failed to update account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the account opening transaction (Initial transaction)
   * Returns the transaction ID and amount for the account's initial transaction
   */
  async getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }> {
    try {
      const conditions = [
        eq(transactions.accountid, accountid),
        eq(transactions.type, "Initial"),
        eq(transactions.isdeleted, false)
      ];

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(eq(transactions.tenantid, tenantId));
      }

      const db = await this.getDb();
      const result = await db
        .select({
          id: transactions.id,
          amount: transactions.amount
        })
        .from(transactions)
        .where(and(...conditions))
        .limit(1);

      if (result.length === 0) {
        throw new Error(`No initial transaction found for account ${accountid}`);
      }

      return {
        id: result[0].id,
        amount: result[0].amount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get account opened transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the total balance across all accounts for a tenant
   * Returns the sum of all account balances
   */
  async getTotalAccountBalance(tenantId?: string): Promise<{ totalbalance: number } | null> {
    try {
      const conditions = [eq(accounts.isdeleted, false)];

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(eq(accounts.tenantid, tenantId));
      }

      const db = await this.getDb();
      const result = await db
        .select({
          totalbalance: sum(accounts.balance)
        })
        .from(accounts)
        .where(and(...conditions));

      // Return the result or default to 0 if no accounts found
      const totalBalance = result[0]?.totalbalance;
      return {
        totalbalance: typeof totalBalance === 'number' ? totalBalance : 0
      };
    } catch (error) {
      throw new Error(`Failed to get total account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}