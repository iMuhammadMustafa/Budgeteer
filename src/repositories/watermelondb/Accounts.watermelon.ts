import { IAccountRepository } from "../interfaces/IAccountRepository";
import { Account } from "../../database/models";
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

        const currentBalance = (record as any).balance || 0;
        const newBalance = currentBalance + amount;

        await record.update((record: any) => {
          record.balance = newBalance;
          record.updatedat = new Date().toISOString();
        });

        return newBalance;
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
