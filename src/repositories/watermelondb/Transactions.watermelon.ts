import { ITransactionRepository } from "../interfaces/ITransactionRepository";
import { Transaction } from "../../database/models";
import {
  Transaction as TransactionType,
  TransactionsView,
  SearchDistinctTransactions,
  Inserts,
  Updates,
} from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { mapTransactionFromWatermelon } from "./TypeMappers";
import { getWatermelonDB } from "../../database";
import { Q } from "@nozbe/watermelondb";

export class TransactionWatermelonRepository implements ITransactionRepository {
  private async getDb() {
    return await getWatermelonDB();
  }

  async findById(id: string, tenantId?: string): Promise<TransactionType | null> {
    try {
      const db = await this.getDb();

      const query = db
        .get("transactions")
        .query(Q.where("id", id), ...(tenantId ? [Q.where("tenant_id", tenantId)] : []), Q.where("is_deleted", false));

      const results = await query;
      const model = results[0] as Transaction | undefined;
      return model ? mapTransactionFromWatermelon(model) : null;
    } catch (error) {
      throw new Error(`Failed to find record by ID: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    try {
      const db = await this.getDb();
      const conditions = [Q.where("tenant_id", tenantId), Q.where("is_deleted", false)];

      // Apply search filters
      if (searchFilters.startDate) {
        conditions.push(Q.where("date", Q.gte(searchFilters.startDate)));
      }
      if (searchFilters.endDate) {
        conditions.push(Q.where("date", Q.lte(searchFilters.endDate)));
      }
      if (searchFilters.accountid) {
        conditions.push(Q.where("account_id", searchFilters.accountid));
      }
      if (searchFilters.categoryid) {
        conditions.push(Q.where("category_id", searchFilters.categoryid));
      }
      if (searchFilters.type) {
        conditions.push(Q.where("type", searchFilters.type));
      }
      if (searchFilters.amount !== undefined) {
        conditions.push(Q.where("amount", searchFilters.amount));
      }
      if (searchFilters.name) {
        conditions.push(Q.where("name", Q.like(`%${searchFilters.name}%`)));
      }
      if (searchFilters.description) {
        conditions.push(Q.where("description", Q.like(`%${searchFilters.description}%`)));
      }

      const query = db.get("transactions").query(...conditions);
      const results = await query;

      // Convert to TransactionsView format
      // Note: This is a simplified version. The actual TransactionsView includes
      // joined data from accounts, categories, and groups which would need proper relations
      return (results as Transaction[]).map(transaction => {
        const mapped = mapTransactionFromWatermelon(transaction);
        return {
          accountid: mapped.accountid,
          accountname: null, // TODO: Join with accounts table
          amount: mapped.amount,
          balance: null, // TODO: Calculate running balance
          categoryid: mapped.categoryid,
          categoryname: null, // TODO: Join with categories table
          createdat: mapped.createdat,
          currency: null, // TODO: Join with accounts table
          date: mapped.date,
          groupicon: null, // TODO: Join with groups table
          groupid: null, // TODO: Join through categories table
          groupname: null, // TODO: Join with groups table
          icon: null, // TODO: Join with categories table
          id: mapped.id,
          isvoid: mapped.isvoid,
          name: mapped.name,
          payee: mapped.payee,
          runningbalance: null, // TODO: Calculate running balance
          tenantid: mapped.tenantid,
          transferaccountid: mapped.transferaccountid,
          transferid: mapped.transferid,
          type: mapped.type,
          updatedat: mapped.updatedat,
        } as TransactionsView;
      });
    } catch (error) {
      throw new Error(`Failed to find records: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async create(data: Inserts<TableNames.Transactions>, tenantId?: string): Promise<TransactionType> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const record = await db.get("transactions").create((record: any) => {
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
              if (key === "tags" && Array.isArray(value)) {
                record[dbKey] = JSON.stringify(value);
              } else {
                record[dbKey] = value;
              }
            }
          });

          const now = Date.now();
          record.createdAt = now;
          record.updatedAt = now;
          record.isDeleted = false;
          record.isVoid = false;
        });

        return mapTransactionFromWatermelon(record as Transaction);
      });
    } catch (error) {
      throw new Error(`Failed to create record: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async update(id: string, data: Updates<TableNames.Transactions>, tenantId?: string): Promise<TransactionType | null> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const conditions = [Q.where("id", id)];

        if (tenantId) {
          conditions.push(Q.where("tenant_id", tenantId));
        }

        conditions.push(Q.where("is_deleted", false));

        const query = db.get("transactions").query(...conditions);
        const results = await query;
        const record = results[0];

        if (!record) {
          return null;
        }

        const updatedRecord = await record.update((record: any) => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              const dbKey = this.camelToSnake(key);
              if (key === "tags" && Array.isArray(value)) {
                record[dbKey] = JSON.stringify(value);
              } else {
                record[dbKey] = value;
              }
            }
          });

          record.updatedAt = Date.now();
        });

        return mapTransactionFromWatermelon(updatedRecord as Transaction);
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

        const query = db.get("transactions").query(...conditions);
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

        const query = db.get("transactions").query(...conditions);
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

        const query = db.get("transactions").query(...conditions);
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

  // Specialized methods for TransactionRepository
  async getByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    try {
      const db = await this.getDb();
      const query = db
        .get("transactions")
        .query(Q.where("transfer_id", id), Q.where("tenant_id", tenantId), Q.where("is_deleted", false));

      const results = await query;
      const model = results[0] as Transaction | undefined;

      if (!model) {
        throw new Error(`Transaction with transfer ID ${id} not found`);
      }

      const mapped = mapTransactionFromWatermelon(model);
      return {
        accountid: mapped.accountid,
        accountname: null, // TODO: Join with accounts table
        amount: mapped.amount,
        balance: null, // TODO: Calculate running balance
        categoryid: mapped.categoryid,
        categoryname: null, // TODO: Join with categories table
        createdat: mapped.createdat,
        currency: null, // TODO: Join with accounts table
        date: mapped.date,
        groupicon: null, // TODO: Join with groups table
        groupid: null, // TODO: Join through categories table
        groupname: null, // TODO: Join with groups table
        icon: null, // TODO: Join with categories table
        id: mapped.id,
        isvoid: mapped.isvoid,
        name: mapped.name,
        payee: mapped.payee,
        runningbalance: null, // TODO: Calculate running balance
        tenantid: mapped.tenantid,
        transferaccountid: mapped.transferaccountid,
        transferid: mapped.transferid,
        type: mapped.type,
        updatedat: mapped.updatedat,
      } as TransactionsView;
    } catch (error) {
      throw new Error(
        `Failed to get transaction by transfer ID: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
    try {
      const db = await this.getDb();
      const query = db
        .get("transactions")
        .query(
          Q.where("tenant_id", tenantId),
          Q.where("is_deleted", false),
          Q.or(
            Q.where("name", Q.like(`%${text}%`)),
            Q.where("payee", Q.like(`%${text}%`)),
            Q.where("description", Q.like(`%${text}%`)),
          ),
        );

      const results = await query;

      // Create distinct search results
      const distinctItems = new Map<string, SearchDistinctTransactions>();

      (results as Transaction[]).forEach(transaction => {
        const mapped = mapTransactionFromWatermelon(transaction);
        const key = mapped.name || mapped.payee || mapped.description || "";

        if (key && !distinctItems.has(key)) {
          distinctItems.set(key, {
            name: mapped.name,
            payee: mapped.payee,
            description: mapped.description,
            categoryid: mapped.categoryid,
            accountid: mapped.accountid,
            amount: mapped.amount,
            type: mapped.type,
            tenantid: mapped.tenantid,
            isvoid: mapped.isvoid,
            notes: mapped.notes,
            transferaccountid: mapped.transferaccountid,
            transferid: mapped.transferid,
          });
        }
      });

      return Array.from(distinctItems.entries()).map(([label, item]) => ({
        label,
        item,
      }));
    } catch (error) {
      throw new Error(
        `Failed to search transactions by name: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<TransactionType[]> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const results: TransactionType[] = [];

        for (const transactionData of transactions) {
          const record = await db.get("transactions").create((record: any) => {
            if (!transactionData.id) {
              record.id = crypto.randomUUID();
            }

            Object.entries(transactionData).forEach(([key, value]) => {
              if (key !== "id" && value !== undefined) {
                const dbKey = this.camelToSnake(key);
                if (key === "tags" && Array.isArray(value)) {
                  record[dbKey] = JSON.stringify(value);
                } else {
                  record[dbKey] = value;
                }
              }
            });

            const now = Date.now();
            record.createdAt = now;
            record.updatedAt = now;
            record.isDeleted = false;
            record.isVoid = false;
          });

          results.push(mapTransactionFromWatermelon(record as Transaction));
        }

        return results;
      });
    } catch (error) {
      throw new Error(
        `Failed to create multiple transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<TransactionType> {
    if (!transaction.id) {
      throw new Error("Transaction ID is required for transfer update");
    }

    const result = await this.update(transaction.id, transaction);
    if (!result) {
      throw new Error(`Transaction with ID ${transaction.id} not found`);
    }

    return result;
  }

  async findByDate(date: string, tenantId: string): Promise<TransactionsView[]> {
    const filters: TransactionFilters = {
      startDate: date,
      endDate: date,
    };
    return this.findAll(filters, tenantId);
  }

  async findByCategory(categoryId: string, type: "category" | "group", tenantId: string): Promise<TransactionsView[]> {
    try {
      const db = await this.getDb();
      let conditions = [Q.where("tenant_id", tenantId), Q.where("is_deleted", false)];

      if (type === "category") {
        conditions.push(Q.where("category_id", categoryId));
      } else {
        // For group type, we need to find all categories in the group first
        // This is complex and would require proper relations
        // For now, just return empty array
        // TODO: Implement proper group filtering
        return [];
      }

      const query = db.get("transactions").query(...conditions);
      const results = await query;

      return (results as Transaction[]).map(transaction => {
        const mapped = mapTransactionFromWatermelon(transaction);
        return {
          accountid: mapped.accountid,
          accountname: null, // TODO: Join with accounts table
          amount: mapped.amount,
          balance: null, // TODO: Calculate running balance
          categoryid: mapped.categoryid,
          categoryname: null, // TODO: Join with categories table
          createdat: mapped.createdat,
          currency: null, // TODO: Join with accounts table
          date: mapped.date,
          groupicon: null, // TODO: Join with groups table
          groupid: null, // TODO: Join through categories table
          groupname: null, // TODO: Join with groups table
          icon: null, // TODO: Join with categories table
          id: mapped.id,
          isvoid: mapped.isvoid,
          name: mapped.name,
          payee: mapped.payee,
          runningbalance: null, // TODO: Calculate running balance
          tenantid: mapped.tenantid,
          transferaccountid: mapped.transferaccountid,
          transferid: mapped.transferid,
          type: mapped.type,
          updatedat: mapped.updatedat,
        } as TransactionsView;
      });
    } catch (error) {
      throw new Error(
        `Failed to find transactions by category: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async findByMonth(month: string, tenantId: string): Promise<TransactionsView[]> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Simplified - should use proper month end calculation

    const filters: TransactionFilters = {
      startDate,
      endDate,
    };
    return this.findAll(filters, tenantId);
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
