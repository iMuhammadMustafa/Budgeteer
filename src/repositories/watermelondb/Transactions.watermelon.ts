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
  protected tableName = TableNames.Transactions;
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

      // Fetch all accounts, categories, and groups for the tenant
      const [accounts, categories, groups] = await Promise.all([
        db.get("accounts").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
        db.get("transactioncategories").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
        db.get("transactiongroups").query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
      ]);

      // Build lookup maps
      const accountMap = new Map();
      for (const acc of accounts) accountMap.set(acc.id, acc);
      const categoryMap = new Map();
      for (const cat of categories) categoryMap.set(cat.id, cat);
      const groupMap = new Map();
      for (const grp of groups) groupMap.set(grp.id, grp);

      // Fetch and sort transactions by account/date/createdat/updatedat/type/id
      const query = db.get(this.tableName).query(...conditions);
      const results = await query;
      const transactions = results as Transaction[];

      // Group transactions by accountid for running balance calculation
      const transactionsByAccount: Record<string, Transaction[]> = {};
      for (const tx of transactions) {
        if (!transactionsByAccount[tx.accountid]) transactionsByAccount[tx.accountid] = [];
        transactionsByAccount[tx.accountid].push(tx);
      }

      // For each account, sort and calculate running balance
      const runningBalances: Record<string, Record<string, number>> = {}; // accountid -> txid -> runningbalance
      for (const [accountid, txs] of Object.entries(transactionsByAccount)) {
        // Sort as in SQL: date, createdat, updatedat, type, id
        txs.sort((a, b) => {
          const da = new Date(a.date).getTime(),
            dbt = new Date(b.date).getTime();
          if (da !== dbt) return da - dbt;
          const ca = new Date(a.createdat).getTime(),
            cb = new Date(b.createdat).getTime();
          if (ca !== cb) return ca - cb;
          const ua = new Date(a.updatedat).getTime(),
            ub = new Date(b.updatedat).getTime();
          if (ua !== ub) return ua - ub;
          if (a.type !== b.type) return (a.type || "").localeCompare(b.type || "");
          return (a.id || "").localeCompare(b.id || "");
        });
        let running = 0;
        runningBalances[accountid] = {};
        for (const tx of txs) {
          // Only count if not void and not deleted
          if (!tx.isvoid && !tx.isdeleted) {
            running += tx.amount;
          }
          runningBalances[accountid][tx.id] = running;
        }
      }

      // Build TransactionsView array
      return transactions.map(transaction => {
        const mapped = this.mapFromWatermelon(transaction);
        const account = accountMap.get(mapped.accountid);
        const category = categoryMap.get(mapped.categoryid);
        const group = category ? groupMap.get(category.groupid) : null;

        return {
          accountid: mapped.accountid,
          accountname: account ? account.name : null,
          amount: mapped.amount,
          balance: account ? account.balance : null,
          categoryid: mapped.categoryid,
          categoryname: category ? category.name : null,
          createdat: mapped.createdat,
          currency: account ? account.currency : null,
          date: mapped.date,
          groupicon: group ? group.icon : null,
          groupid: group ? group.id : null,
          groupname: group ? group.name : null,
          icon: category ? category.icon : null,
          id: mapped.id,
          isvoid: mapped.isvoid,
          name: mapped.name,
          payee: mapped.payee,
          runningbalance: runningBalances[mapped.accountid]?.[mapped.id] ?? null,
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

      // Deduplicate by name, pick the latest transaction by date DESC
      const latestByName = new Map<string, { tx: SearchDistinctTransactions; date: string }>();
      (results as Transaction[]).forEach(transaction => {
        const mapped = this.mapFromWatermelon(transaction);
        const key = mapped.name;
        if (!key) return;
        const prev = latestByName.get(key);
        if (!prev || new Date(mapped.date).getTime() > new Date(prev.date).getTime()) {
          latestByName.set(key, {
            tx: {
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
            },
            date: mapped.date,
          });
        }
      });

      return Array.from(latestByName.entries()).map(([label, obj]) => ({
        label,
        item: obj.tx,
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
