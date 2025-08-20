import { IAccountRepository } from "../interfaces/IAccountRepository";
import { Account, AccountCategory } from "../../database/models";
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
  protected mapFromWatermelon(model: Account): AccountType {
    return mapAccountFromWatermelon(model);
  }

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

        await record.update((record: any) => {
          record.balance = amount;
          record.updatedat = new Date().toISOString();
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
