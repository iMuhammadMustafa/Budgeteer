import { IAccountRepository } from "../interfaces/IAccountRepository";
import { Model } from "@nozbe/watermelondb";
import { Account, AccountCategory, Transaction } from "../../database/models";
import { Account as AccountType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapAccountFromWatermelon } from "./TypeMappers";
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class AccountWatermelonRepository
  extends BaseWatermelonRepository<Account, Inserts<TableNames.Accounts>, Updates<TableNames.Accounts>, AccountType>
  implements IAccountRepository
{
  protected tableName = TableNames.Accounts;
  protected modelClass = Account;

  // Implementation of the abstract mapping method
  protected mapFieldsForDatabase(data: Record<string, any>): Record<string, any> {
    return {
      ...data,
      balance: Number(data.balance) || 0,
    };
  }
  protected mapFromWatermelon(model: Account): AccountType {
    return mapAccountFromWatermelon(model);
  }

  // Returns all accounts with their latest running balance
  // async findAllWithRunningBalance(tenantId?: string): Promise<(AccountType & { running_balance: number })[]> {
  //   try {
  //     const db = await this.getDb();
  //     const accountConditions = [];
  //     if (tenantId) accountConditions.push(Q.where("tenantid", tenantId));
  //     accountConditions.push(Q.where("isdeleted", false));
  //     const accounts = await db.get(this.tableName).query(...accountConditions);

  //     // Fetch all transactions for these accounts
  //     const accountIds = accounts.map(acc => acc.id);
  //     const txConditions = [Q.where("accountid", Q.oneOf(accountIds)), Q.where("isdeleted", false)];
  //     const transactions = await db.get(TableNames.Transactions).query(...txConditions);

  //     // Group transactions by accountid and sort
  //     const txByAccount: Record<string, Transaction[]> = {};
  //     for (const tx of transactions) {
  //       const t = tx as Transaction;
  //       if (!txByAccount[t.accountid]) txByAccount[t.accountid] = [];
  //       txByAccount[t.accountid].push(t);
  //     }

  //     // For each account, find the latest transaction by date/createdat/updatedat/type/id and get its running balance
  //     const result: (AccountType & { running_balance: number })[] = [];
  //     for (const account of accounts as Account[]) {
  //       const mappedAccount = this.mapFromWatermelon(account);
  //       const txs = txByAccount[account.id] || [];
  //       if (txs.length === 0) {
  //         result.push({ ...mappedAccount, running_balance: mappedAccount.balance });
  //         continue;
  //       }
  //       // Sort as in SQL: date DESC, createdat DESC, updatedat DESC, type DESC, id DESC
  //       txs.sort((a, b) => {
  //         const da = new Date(b.date).getTime() - new Date(a.date).getTime();
  //         if (da !== 0) return da;
  //         const ca = new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
  //         if (ca !== 0) return ca;
  //         const ua = new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime();
  //         if (ua !== 0) return ua;
  //         if ((b.type || "") !== (a.type || "")) return (b.type || "").localeCompare(a.type || "");
  //         return (b.id || "").localeCompare(a.id || "");
  //       });
  //       // Calculate running balance in forward order
  //       txs.sort((a, b) => {
  //         const da = new Date(a.date).getTime() - new Date(b.date).getTime();
  //         if (da !== 0) return da;
  //         const ca = new Date(a.createdat).getTime() - new Date(b.createdat).getTime();
  //         if (ca !== 0) return ca;
  //         const ua = new Date(a.updatedat).getTime() - new Date(b.updatedat).getTime();
  //         if (ua !== 0) return ua;
  //         if ((a.type || "") !== (b.type || "")) return (a.type || "").localeCompare(b.type || "");
  //         return (a.id || "").localeCompare(b.id || "");
  //       });
  //       let running = 0;
  //       let lastTxId = null;
  //       for (const tx of txs) {
  //         if (!tx.isvoid && !tx.isdeleted) {
  //           running += tx.amount;
  //         }
  //         lastTxId = tx.id;
  //       }
  //       result.push({ ...mappedAccount, running_balance: running });
  //     }
  //     return result;
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to get accounts with running balance: ${error instanceof Error ? error.message : "Unknown error"}`,
  //     );
  //   }
  // }

  // Override findAll to include category relationship
  async findAll(filters?: any, tenantId?: string): Promise<AccountType[]> {
    try {
      const db = await this.getDb();
      const conditions = [];
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      // Add tenant filtering if tenantId is provided
      if (tenantId) {
        conditions.push(Q.where(tenantField, tenantId));
      }

      // Add soft delete filtering
      conditions.push(Q.where(softDeleteField, false));

      // Apply additional filters if provided
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any));
          }
        });
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      // Fetch related categories for all accounts
      const accountsWithCategories: AccountType[] = [];
      for (const account of results as Account[]) {
        const categoryQuery = db
          .get(TableNames.AccountCategories)
          .query(Q.where("id", account.categoryid), Q.where("isdeleted", false));
        const categoryResults = await categoryQuery;
        const category = categoryResults[0] as AccountCategory | undefined;

        const mappedAccount = this.mapFromWatermelon(account);
        if (category) {
          // Add category data to the mapped account
          (mappedAccount as any).category = {
            id: category.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            displayorder: category.displayorder,
            tenantid: category.tenantid,
            isdeleted: category.isdeleted,
            createdat: new Date(category.createdat).toISOString(),
            createdby: category.createdby || null,
            updatedat: new Date(category.updatedat).toISOString(),
            updatedby: category.updatedby || null,
          };
        }
        accountsWithCategories.push(mappedAccount);
      }

      return accountsWithCategories;
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Override findById to include category relationship
  async findById(id: string, tenantId?: string): Promise<AccountType | null> {
    try {
      const db = await this.getDb();
      const tenantField = this.getTenantFieldName();
      const softDeleteField = this.getSoftDeleteFieldName();

      const query = db.get(this.tableName).query(
        Q.where("id", id),
        // Add tenant filtering if tenantId is provided
        ...(tenantId ? [Q.where(tenantField, tenantId)] : []),
        // Add soft delete filtering
        Q.where(softDeleteField, false),
      );

      const results = await query;
      const model = results[0] as Account;
      if (!model) return null;

      // Fetch the related category
      const categoryQuery = db
        .get(TableNames.AccountCategories)
        .query(Q.where("id", model.categoryid), Q.where("isdeleted", false));
      const categoryResults = await categoryQuery;
      const category = categoryResults[0] as AccountCategory | undefined;

      const mappedAccount = this.mapFromWatermelon(model);
      if (category) {
        // Add category data to the mapped account
        (mappedAccount as any).category = {
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          displayorder: category.displayorder,
          tenantid: category.tenantid,
          isdeleted: category.isdeleted,
          createdat: new Date(category.createdat).toISOString(),
          createdby: category.createdby || null,
          updatedat: new Date(category.updatedat).toISOString(),
          updatedby: category.updatedby || null,
        };
      }

      return mappedAccount;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Account-specific methods
  async updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number> {
    try {
      const db = await getWatermelonDB();

      return await db.write(async () => {
        const conditions = [Q.where("id", accountid)];

        if (tenantId) {
          conditions.push(Q.where("tenantid", tenantId));
        }

        conditions.push(Q.where("isdeleted", false));

        const query = db.get(TableNames.Accounts).query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          throw new Error("Account not found");
        }

        if (typeof amount !== "number" || isNaN(amount)) {
          throw new Error("Amount must be a valid number");
        }
        await record.update(rec => {
          (rec as Account).balance = Number(amount);
          (rec as Account).updatedat = new Date();
        });
        return amount;
      });
    } catch (error) {
      throw new Error(`Failed to update account balance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }> {
    try {
      const db = await getWatermelonDB();

      const conditions = [
        Q.where("accountid", accountid),
        Q.where("type", "Initial"),
        ...(tenantId ? [Q.where("tenantid", tenantId)] : []),
        Q.where("isdeleted", false),
      ];

      const query = db.get(TableNames.Transactions).query(...conditions, Q.take(1));
      const results = await query;
      const transaction = results[0];

      if (!transaction) {
        throw new Error("Account opening transaction not found");
      }

      return {
        id: transaction.id,
        amount: (transaction as any).amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get account opened transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getTotalAccountBalance(tenantId?: string): Promise<{ totalbalance: number } | null> {
    try {
      const db = await getWatermelonDB();
      const conditions = [];

      if (tenantId) {
        conditions.push(Q.where("tenantid", tenantId));
      }

      conditions.push(Q.where("isdeleted", false));

      const query = db.get(TableNames.Accounts).query(...conditions);
      const results = await query;

      const totalBalance = results.reduce((sum, account) => {
        return sum + ((account as any).balance || 0);
      }, 0);

      return { totalbalance: totalBalance };
    } catch (error) {
      throw new Error(
        `Failed to get total account balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
