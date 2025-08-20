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
import { BaseWatermelonRepository } from "./BaseWatermelonRepository";
import { Q } from "@nozbe/watermelondb";

export class TransactionWatermelonRepository
  extends BaseWatermelonRepository<
    Transaction,
    Inserts<TableNames.Transactions>,
    Updates<TableNames.Transactions>,
    TransactionType
  >
  implements ITransactionRepository
{
  protected tableName = "transactions";
  protected modelClass = Transaction;

  // Implementation of the abstract mapping method
  protected mapFromWatermelon(model: Transaction): TransactionType {
    return mapTransactionFromWatermelon(model);
  }

  // Override field mapping only for tags special handling
  protected mapFieldsForDatabase(data: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key === "tags" && Array.isArray(value)) {
        mapped[key] = JSON.stringify(value);
      } else {
        mapped[key] = value;
      }
    });

    return mapped;
  }

  // Implementation of interface method with specific signature (overrides base class method)
  // @ts-ignore - Override base class method with different signature for interface compliance
  override async findAll(searchFilters: TransactionFilters, tenantId: string): Promise<TransactionsView[]> {
    try {
      const db = await this.getDb();
      const conditions = [Q.where("tenantid", tenantId), Q.where("isdeleted", false)];

      // Apply search filters
      if (searchFilters.startDate) {
        conditions.push(Q.where("date", Q.gte(searchFilters.startDate)));
      }
      if (searchFilters.endDate) {
        conditions.push(Q.where("date", Q.lte(searchFilters.endDate)));
      }
      if (searchFilters.accountid) {
        conditions.push(Q.where("accountid", searchFilters.accountid));
      }
      if (searchFilters.categoryid) {
        conditions.push(Q.where("categoryid", searchFilters.categoryid));
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

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      // Convert to TransactionsView format
      // Note: This is a simplified version. The actual TransactionsView includes
      // joined data from accounts, categories, and groups which would need proper relations
      return (results as Transaction[]).map(transaction => {
        const mapped = this.mapFromWatermelon(transaction);
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

  // Specialized method: Get transaction by transfer ID
  async getByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    try {
      const db = await this.getDb();
      const query = db
        .get(this.tableName)
        .query(Q.where("transferid", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

      const results = await query;
      const model = results[0] as Transaction | undefined;

      if (!model) {
        throw new Error(`Transaction with transfer ID ${id} not found`);
      }

      const mapped = this.mapFromWatermelon(model);
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

  // Specialized method: Search transactions by name/payee/description
  async findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
    try {
      const db = await this.getDb();
      const query = db
        .get(this.tableName)
        .query(
          Q.where("tenantid", tenantId),
          Q.where("isdeleted", false),
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
        const mapped = this.mapFromWatermelon(transaction);
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

  // Specialized method: Create multiple transactions in one transaction
  async createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<TransactionType[]> {
    try {
      const db = await this.getDb();

      return await db.write(async () => {
        const results: TransactionType[] = [];

        for (const transactionData of transactions) {
          const createdTransaction = await super.create(transactionData);
          results.push(createdTransaction);
        }

        return results;
      });
    } catch (error) {
      throw new Error(
        `Failed to create multiple transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Specialized method: Update transfer transaction
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

  // Specialized method: Find transactions by date
  async findByDate(date: string, tenantId: string): Promise<TransactionsView[]> {
    const filters: TransactionFilters = {
      startDate: date,
      endDate: date,
    };
    return this.findAll(filters, tenantId);
  }

  // Specialized method: Find transactions by category or group
  async findByCategory(categoryId: string, type: "category" | "group", tenantId: string): Promise<TransactionsView[]> {
    try {
      const db = await this.getDb();
      let conditions = [Q.where("tenantid", tenantId), Q.where("isdeleted", false)];

      if (type === "category") {
        conditions.push(Q.where("categoryid", categoryId));
      } else {
        // For group type, we need to find all categories in the group first
        // This is complex and would require proper relations
        // For now, just return empty array
        // TODO: Implement proper group filtering
        return [];
      }

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;

      return (results as Transaction[]).map(transaction => {
        const mapped = this.mapFromWatermelon(transaction);
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

  // Specialized method: Find transactions by month
  async findByMonth(month: string, tenantId: string): Promise<TransactionsView[]> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Simplified - should use proper month end calculation

    const filters: TransactionFilters = {
      startDate,
      endDate,
    };
    return this.findAll(filters, tenantId);
  }
}
