import { TableNames } from "@/src/types/database/TableNames";
import { Account as AccountType } from "@/src/types/database/Tables.Types";
import { getWatermelonDB } from "@/src/types/database/watermelon";
import { Account, Transaction } from "@/src/types/database/watermelon/models";
import { Q } from "@nozbe/watermelondb";
import { BaseWatermelonRepository } from "../BaseWatermelonRepository";
import { IAccountRepository } from "../interfaces/IAccountRepository";
import { mapAccountFromWatermelon } from "./TypeMappers";

export class AccountWatermelonRepository
  extends BaseWatermelonRepository<Account, TableNames.Accounts, AccountType>
  implements IAccountRepository
{
  protected orderByField?: string | undefined;
  protected tableName = TableNames.Accounts;

  protected override mapFromWatermelon(model: Account): AccountType {
    return mapAccountFromWatermelon(model);
  }

  override async findAll(tenantId: string, filters?: any): Promise<AccountType[]> {
    const db = await this.getDb();
    const conditions = [];

    conditions.push(Q.where("tenantid", tenantId));
    conditions.push(Q.where("isdeleted", false));
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          conditions.push(Q.where(key, value as any));
        }
      });
    }

    const results = await db.get(this.tableName).query(...conditions);

    const accountsWithCategories: AccountType[] = [];

    for (const account of results as Account[]) {
      const categoryResults = await db
        .get(TableNames.AccountCategories)
        .query(Q.where("id", account.categoryid), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

      const mappedAccount = mapAccountFromWatermelon(account as any, categoryResults[0] as any);

      accountsWithCategories.push(mappedAccount);
    }

    return accountsWithCategories;
  }

  // Override findById to include category relationship and running balance (matching Supabase view logic)
  override async findById(id: string, tenantId: string): Promise<(AccountType & { runningbalance: number }) | null> {
    const db = await this.getDb();

    const query = db
      .get(this.tableName)
      .query(Q.where("id", id), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const model = (await query)[0] as Account;
    if (!model) return null;

    // Fetch all transactions for this account (not deleted, not void)
    const transactions = await db
      .get(TableNames.Transactions)
      .query(
        Q.where("accountid", id),
        Q.where("isdeleted", false),
        Q.where("tenantid", tenantId),
        Q.where("isvoid", false),
      );

    // Sort transactions ASC (for running sum)
    const sortedAsc = [...transactions].sort((a, b) => sortTransactionCallBack(a, b));

    // Calculate running balances for each transaction
    let running = 0;
    const runningBalances: { [txid: string]: number } = {};
    for (const tx of sortedAsc) {
      const t = tx as Transaction;
      running += t.amount;
      runningBalances[t.id] = running;
    }

    // Find the latest transaction (DESC order)
    const sortedDesc = [...transactions].sort((a, b) => sortTransactionCallBack(b, a));
    let runningbalance: number;
    if (sortedDesc.length > 0) {
      const latestTx = sortedDesc[0];
      runningbalance = runningBalances[latestTx.id] ?? 0;
    } else {
      runningbalance = model.balance;
    }

    const categoryQuery = await db
      .get(TableNames.AccountCategories)
      .query(Q.where("id", model.categoryid), Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const mappedAccount = mapAccountFromWatermelon(model, categoryQuery[0] as any);

    return { ...mappedAccount, runningbalance };
  }

  async updateAccountBalance(accountid: string, amount: number, tenantId: string): Promise<number> {
    const db = await getWatermelonDB();

    return await db.write(async () => {
      const query = await db
        .get(TableNames.Accounts)
        .query(Q.where("id", accountid), Q.where("tenantid", tenantId), Q.where("isdeleted", false));
      const record = query[0];

      if (!record) {
        throw new Error("Account not found");
      }
      if (typeof amount !== "number" || isNaN(amount)) {
        throw new Error("Amount must be a valid number");
      }

      let newBalance = (record as Account).balance + amount;
      await record.update(rec => {
        (rec as Account).balance = newBalance;
        (rec as Account).updatedat = new Date().toISOString();
      });
      return newBalance;
    });
  }

  async getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<{ id: string; amount: number }> {
    const db = await getWatermelonDB();

    const query = await db
      .get(TableNames.Transactions)
      .query(
        Q.where("accountid", accountid),
        Q.where("type", "Initial"),
        Q.where("tenantid", tenantId),
        Q.where("isdeleted", false),
        Q.take(1),
      );
    const transaction = query[0];

    if (!transaction) {
      throw new Error("Account opening transaction not found");
    }

    return {
      id: transaction.id,
      amount: (transaction as Transaction).amount,
    };
  }

  async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
    const db = await getWatermelonDB();

    const results = await db.get(TableNames.Accounts).query(Q.where("tenantid", tenantId), Q.where("isdeleted", false));

    const totalBalance = results.reduce((sum, account) => {
      return sum + (account as Account).balance;
    }, 0);

    return { totalbalance: totalBalance };
  }

  async getAccountRunningBalance(accountid: string, tenantId: string): Promise<{ runningbalance: number } | null> {
    const db = await getWatermelonDB();

    const query = await db
      .get(TableNames.Accounts)
      .query(Q.where("id", accountid), Q.where("tenantid", tenantId), Q.where("isdeleted", false));
    const account = query[0];

    if (!account) {
      throw new Error("Account not found");
    }

    // Fetch all transactions for this account (not deleted, not void) to calcualte the open balance
    const transactions = await db
      .get(TableNames.Transactions)
      .query(
        Q.where("accountid", accountid),
        Q.where("isdeleted", false),
        Q.where("tenantid", tenantId),
        Q.where("isvoid", false),
      );

    // Sort transactions ASC (for running sum)
    const sortedAsc = [...transactions].sort((a, b) => sortTransactionCallBack(a, b));
    // Calculate running balances for each transaction
    let running = 0;
    const runningBalances: { [txid: string]: number } = {};
    for (const tx of sortedAsc) {
      const t = tx as Transaction;
      running += t.amount;
      runningBalances[t.id] = running;
    }
    // Find the latest transaction (DESC order)
    const sortedDesc = [...transactions].sort((a, b) => sortTransactionCallBack(b, a));
    let runningbalance: number;

    if (sortedDesc.length > 0) {
      const latestTx = sortedDesc[0];
      runningbalance = runningBalances[latestTx.id] ?? 0;
    } else {
      runningbalance = mapAccountFromWatermelon(account as any).balance;
    }

    return { runningbalance };
  }
}
function sortTransactionCallBack(a: any, b: any): number {
  const ta = a as Transaction;
  const tb = b as Transaction;
  const da = new Date(ta.date).getTime() - new Date(tb.date).getTime();
  if (da !== 0) return da;
  const ca = new Date(ta.createdat).getTime() - new Date(tb.createdat).getTime();
  if (ca !== 0) return ca;
  if (ta.updatedat && tb.updatedat) {
    const ua = new Date(ta.updatedat).getTime() - new Date(tb.updatedat).getTime();
    if (ua !== 0) return ua;
  }
  if ((ta.type || "") !== (tb.type || "")) return (ta.type || "").localeCompare(tb.type || "");
  return (ta.id || "").localeCompare(tb.id || "");
}
