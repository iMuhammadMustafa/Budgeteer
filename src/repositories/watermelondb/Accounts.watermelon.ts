import { IAccountRepository } from "../interfaces/IAccountRepository";
import { Account } from "../../database/models";
import { Account as AccountType, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { mapAccountFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class AccountWatermelonRepository implements IAccountRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<AccountType | null> {
    try {
      const db = await this.getDb();

      const query = db
        .get("accounts")
        .query(Q.where("id", id), ...(tenantId ? [Q.where("tenant_id", tenantId)] : []), Q.where("is_deleted", false));

      const results = await query;
      const model = results[0] as Account | undefined;
      return model ? mapAccountFromWatermelon(model) : null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(filters?: any, tenantId?: string): Promise<AccountType[]> {
    try {
      const db = await this.getDb();
      const conditions = [];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            conditions.push(Q.where(key, value as any));
          }
        });
      }

      const query = db.get("accounts").query(...conditions);
      const results = await query;
      return (results as Account[]).map(mapAccountFromWatermelon);
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: Inserts<TableNames.Accounts>, tenantId?: string): Promise<AccountType> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const record = await db.get("accounts").create((record: any) => {
          if (!data.id) {
            record.id = crypto.randomUUID();
          }

          if (tenantId) {
            record.tenantId = tenantId;
            record.createdBy = tenantId;
          }

          Object.entries(data).forEach(([key, value]) => {
            if (key !== "id" && value !== undefined) {
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          const now = Date.now();
          record.createdAt = now;
          record.updatedAt = now;
          record.isDeleted = false;
        });

        return mapAccountFromWatermelon(record as Account);
      });
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: Updates<TableNames.Accounts>, tenantId?: string): Promise<AccountType | null> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("accounts").query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          return null;
        }

        const updatedRecord = await record.update((record: any) => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              const dbKey = this.camelToSnake(key);
              record[dbKey] = value;
            }
          });

          record.updatedAt = Date.now();
        });

        return mapAccountFromWatermelon(updatedRecord as Account);
      });
    } catch (error) {
      throw new Error(`Failed to update record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get("accounts").query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.destroyPermanently();
        }
      });
    } catch (error) {
      throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("accounts").query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = true;
            record.updatedAt = Date.now();
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to soft delete record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async restore(id: string, tenantId?: string): Promise<void> {
    try {
      const db = await this.getDb();

      await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        const query = db.get("accounts").query(...conditions);
        const results = await query;
        const record = results[0];

        if (record) {
          await record.update((record: any) => {
            record.isDeleted = false;
            record.updatedAt = Date.now();
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to restore record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Account-specific methods
  async updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", accountid)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("accounts").query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          throw new Error("Account not found");
        }

        const currentBalance = (record as any).balance || 0;
        const newBalance = currentBalance + amount;

        await record.update((record: any) => {
          record.balance = newBalance;
          record.updatedAt = Date.now();
        });

        return newBalance;
      });
    } catch (error) {
      throw new Error(`Failed to update account balance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{ id: string; amount: number }> {
    try {
      const db = await this.getDb();

      const conditions = [
        Q.where("account_id", accountid),
        Q.where("type", "Initial"),
        ...(tenantId ? [Q.where("tenant_id", tenantId)] : []),
        Q.where("is_deleted", false),
      ];

      const query = db.get("transactions").query(...conditions, Q.take(1));
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
      const db = await this.getDb();
      const conditions = [];

      if (tenantId) {
        conditions.push(Q.where("tenant_id", tenantId));
      }

      conditions.push(Q.where("is_deleted", false));

      const query = db.get("accounts").query(...conditions);
      const results = await query;

      const totalBalance = (results as Account[]).reduce((sum, account) => {
        return sum + ((account as any).balance || 0);
      }, 0);

      return { totalbalance: totalBalance };
    } catch (error) {
      throw new Error(
        `Failed to get total account balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
