import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames } from "@/src/types/database/TableNames";
import {
  Inserts,
  SearchDistinctTransactions,
  Transaction as TransactionType,
  TransactionsView,
  Updates,
} from "@/src/types/database/Tables.Types";
import { Account, Transaction, TransactionCategory, TransactionGroup } from "@/src/types/database/watermelon/models";
import { Q } from "@nozbe/watermelondb";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";

export class TransactionWatermelonRepository
  extends BaseWatermelonRepository<Transaction, TableNames.Transactions, TransactionType>
  implements ITransactionRepository
{
  protected tableName = TableNames.Transactions;

  protected override mapFieldsForWatermelon(data: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case "amount":
          mapped[key] = Number(value) || 0;
          break;
        case "tags":
          if (Array.isArray(value)) {
            mapped[key] = JSON.stringify(value);
          }
          break;
        default:
          mapped[key] = value;
      }
    });

    return mapped;
  }

  // Implementation of interface method with specific signature (overrides base class method)
  // @ts-ignore - Override base class method with different signature for interface compliance
  override async findAll(tenantId: string, filters: TransactionFilters): Promise<TransactionsView[]> {
    const db = await this.getDb();
    const conditions = [Q.where("tenantid", tenantId), Q.where("isdeleted", false)];

    // Apply search filters
    if (filters.startDate) {
      conditions.push(Q.where("date", Q.gte(filters.startDate)));
    }
    if (filters.endDate) {
      conditions.push(Q.where("date", Q.lte(filters.endDate)));
    }
    if (filters.accountid) {
      conditions.push(Q.where("accountid", filters.accountid));
    }
    if (filters.categoryid) {
      conditions.push(Q.where("categoryid", filters.categoryid));
    }
    if (filters.type) {
      conditions.push(Q.where("type", filters.type));
    }
    if (filters.amount !== undefined) {
      conditions.push(Q.where("amount", filters.amount));
    }
    if (filters.name) {
      conditions.push(Q.where("name", Q.like(`%${filters.name}%`)));
    }
    if (filters.description) {
      conditions.push(Q.where("description", Q.like(`%${filters.description}%`)));
    }

    // Fetch all accounts, categories, and groups for the tenant
    const [accounts, categories, groups] = await Promise.all([
      db.get(TableNames.Accounts).query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
      db.get(TableNames.TransactionCategories).query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
      db.get(TableNames.TransactionGroups).query(Q.where("tenantid", tenantId), Q.where("isdeleted", false)),
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
    const transactions: Transaction[] = results as Transaction[];

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
      const txArr: Transaction[] = txs as Transaction[];
      txArr.sort((a, b) => {
        const da = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (da !== 0) return da;
        const ca = new Date(a.createdat).getTime() - new Date(b.createdat).getTime();
        if (ca !== 0) return ca;
        if (a.updatedat && b.updatedat) {
          const ua = new Date(a.updatedat).getTime() - new Date(b.updatedat).getTime();
          if (ua !== 0) return ua;
        }
        if ((a.type || "") !== (b.type || "")) return (a.type || "").localeCompare(b.type || "");
        return (a.id || "").localeCompare(b.id || "");
      });
      // txArr.sort((a: any, b: any) => {
      //   const da = new Date(b.date).getTime() - new Date(a.date).getTime();
      //   if (da !== 0) return da;
      //   const ca = new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
      //   if (ca !== 0) return ca;
      //   const ua = new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime();
      //   if (ua !== 0) return ua;
      //   if ((a.type || "") !== (b.type || "")) return (b.type || "").localeCompare(a.type || "");
      //   return (b.id || "").localeCompare(a.id || "");
      // });
      let running = 0;
      runningBalances[accountid] = {};
      for (const tx of txArr) {
        // Only count if not void and not deleted
        if (!tx.isvoid && !tx.isdeleted) {
          running += tx.amount;
        }
        runningBalances[accountid][tx.id] = running;
      }
    }

    // Build TransactionsView array
    // Map to TransactionsView, then sort DESC for display
    let views = transactions.map(transaction => {
      const mapped = this.mapFromWatermelon(transaction);
      const account = accountMap.get(mapped.accountid) as Account | undefined;
      const category = categoryMap.get(mapped.categoryid) as TransactionCategory | undefined;
      const group =
        category && category.groupid ? (groupMap.get(category.groupid) as TransactionGroup | undefined) : null;

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
    // Sort DESC by date, createdat, updatedat, type, id
    views.sort((a, b) => {
      const da = new Date(b.date ?? "").getTime() - new Date(a.date ?? "").getTime();
      if (da !== 0) return da;
      const ca = new Date(b.createdat ?? "").getTime() - new Date(a.createdat ?? "").getTime();
      if (ca !== 0) return ca;
      const ua = new Date(b.updatedat ?? "").getTime() - new Date(a.updatedat ?? "").getTime();
      if (ua !== 0) return ua;
      if ((b.type || "") !== (a.type || "")) return (b.type || "").localeCompare(a.type || "");
      return (b.id || "").localeCompare(a.id || "");
    });
    // Pagination: slice the results if offset/limit provided
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? views.length;
    return views.slice(offset, offset + limit);
  }

  async findByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
    const db = await this.getDb();
    const results = await db
      .get(this.tableName)
      .query(Q.where("transferid", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const model = results[0] as Transaction | undefined;

    if (!model) {
      throw new Error(`Transaction with transfer ID ${id} not found`);
    }

    // Fetch related data
    const mapped = this.mapFromWatermelon(model);
    const [account, category] = await Promise.all([
      db.get("accounts").find(mapped.accountid),
      mapped.categoryid ? db.get("transactioncategories").find(mapped.categoryid) : null,
    ]);
    const catTyped = category as any;
    const group = catTyped && catTyped.groupid ? await db.get("transactiongroups").find(catTyped.groupid) : null;

    // Calculate running balance for this transaction
    const txs = await db
      .get(this.tableName)
      .query(
        Q.where("accountid", mapped.accountid),
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
        Q.where("isvoid", false),
      );
    // Sort as in findAll
    txs.sort((a: any, b: any) => {
      const da = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (da !== 0) return da;

      const ca = new Date(b.createdat).getTime() - new Date(a.createdat).getTime();
      if (ca !== 0) return ca;

      const ua = new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime();
      if (ua !== 0) return ua;

      if ((a.type || "") !== (b.type || "")) return (b.type || "").localeCompare(a.type || "");

      return (b.id || "").localeCompare(a.id || "");
    });
    let running = 0;
    let runningbalance = null;
    for (const tx of txs) {
      running += (tx as Transaction).amount;
      if (tx.id === mapped.id) {
        runningbalance = running;
        break;
      }
    }

    return {
      accountid: mapped.accountid,
      accountname: account ? (account as any).name : null,
      amount: mapped.amount,
      balance: account ? (account as any).balance : null,
      categoryid: mapped.categoryid,
      categoryname: category ? (category as any).name : null,
      createdat: mapped.createdat,
      currency: account ? (account as any).currency : null,
      date: mapped.date,
      groupicon: group ? (group as any).icon : null,
      groupid: group ? (group as any).id : null,
      groupname: group ? (group as any).name : null,
      icon: category ? (category as any).icon : null,
      id: mapped.id,
      isvoid: mapped.isvoid,
      name: mapped.name,
      payee: mapped.payee,
      runningbalance,
      tenantid: mapped.tenantid,
      transferaccountid: mapped.transferaccountid,
      transferid: mapped.transferid,
      type: mapped.type,
      updatedat: mapped.updatedat,
    } as TransactionsView;
  }

  async findByName(text: string, tenantId: string): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
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
  }

  async createMultiple(transactions: Inserts<TableNames.Transactions>[]): Promise<TransactionType[]> {
    const mappedTransactions = transactions.map(tx => this.mapFieldsForWatermelon(tx as Record<string, any>));

    const db = await this.getDb();

    return await db.write(async () => {
      const collection = db.get(this.tableName);
      const models = mappedTransactions.map(tx => {
        return collection.prepareCreate(record => {
          Object.entries(tx).forEach(([key, value]) => {
            if (key !== "id" && value !== undefined) {
              // @ts-ignore
              record[key] = value;
            }
            if (key === "id") {
              record._raw.id = value; // Manually set the ID for WatermelonDB
            }
          });
        });
      });

      await db.batch(...models);

      return models.map(model => this.mapFromWatermelon(model as Transaction));
    });
  }

  //TODO : Fix this
  async updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<TransactionType> {
    if (!transaction.id) {
      throw new Error("Transaction ID is required for transfer update");
    }

    const result = await this.update(transaction.id, transaction, transaction.tenantid!);
    if (!result) {
      throw new Error(`Transaction with ID ${transaction.id} not found`);
    }

    return result;
  }

  /**
   * Gets the account balance at a specific date
   * Calculates balance by summing all transactions up to that date
   */
  async getAccountBalanceAtDate(accountId: string, date: Date, tenantId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const conditions = [
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
        Q.where("accountid", accountId),
        Q.where("date", Q.lte(date.toISOString())),
      ];

      const query = db.get(this.tableName).query(...conditions);
      const results = await query;
      const transactions = results as Transaction[];

      // Sum all transaction amounts up to the specified date
      let totalAmount = 0;
      for (const transaction of transactions) {
        if (!transaction.isvoid && !transaction.isdeleted) {
          totalAmount += transaction.amount || 0;
        }
      }

      return totalAmount;
    } catch (error) {
      throw new Error(
        `Failed to get account balance at date: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
