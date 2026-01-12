import { FunctionNames, TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Account } from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import { accounts, transactions } from "@/src/types/database/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { IAccountRepository } from "../interfaces/IAccountRepository";

export class AccountDrizzleRepository
    extends BaseDrizzleRepository<
        typeof accounts,
        TableNames.Accounts,
        Account
    >
    implements IAccountRepository {
    protected table = accounts;
    protected tableName = TableNames.Accounts;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }

    async updateAccountBalance(
        accountid: string,
        amount: number,
        tenantId: string
    ): Promise<number> {
        if (this.isCloudMode()) {
            // Use Supabase RPC function for atomic update
            const { data, error } = await this.getSupabase().rpc(FunctionNames.UpdateAccountBalance, {
                accountid,
                amount,
            });
            if (error) throw error;
            return data;
        }

        await this.getSqliteDb()
            .update(this.table)
            .set({
                balance: sql`${this.table.balance} + ${amount}`,
                updatedat: this.getNow(),
            })
            .where(and(eq(this.table.id, accountid), eq(this.table.tenantid, tenantId)));

        const result = await this.getSqliteDb()
            .select({ balance: this.table.balance })
            .from(this.table)
            .where(and(eq(this.table.id, accountid), eq(this.table.tenantid, tenantId)))
            .limit(1);

        return result[0]?.balance || 0;
    }

    async getAccountOpenedTransaction(
        accountid: string,
        tenantId: string
    ): Promise<{ id: string; amount: number }> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(TableNames.Transactions)
                .select("id, amount")
                .eq("accountid", accountid)
                .eq("tenantid", tenantId)
                .eq("type", "Initial")
                .eq("isdeleted", false)
                .single();

            if (error) throw error;
            return { id: data.id, amount: data.amount };
        }

        const db = this.getSqliteDb();
        const result = await (db as any)
            .select({ id: transactions.id, amount: transactions.amount })
            .from(transactions)
            .where(
                and(
                    eq(transactions.accountid, accountid),
                    eq(transactions.tenantid, tenantId),
                    eq(transactions.type, "Initial"),
                    eq(transactions.isdeleted, false)
                )
            )
            .limit(1);

        if (!result[0]) throw new Error("No initial transaction found");
        return { id: result[0].id, amount: result[0].amount };
    }

    async getTotalAccountBalance(
        tenantId: string
    ): Promise<{ totalbalance: number } | null> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(ViewNames.StatsTotalAccountBalance)
                .select("totalbalance")
                .eq("tenantid", tenantId)
                .single();

            if (error) {
                if (error.code === "PGRST116") return null;
                throw error;
            }
            return { totalbalance: data.totalbalance || 0 };
        }

        const db = this.getSqliteDb();
        const result = await (db as any)
            .select({ totalbalance: sql<number>`sum(${this.table.balance})` })
            .from(this.table)
            .where(
                and(
                    eq(this.table.tenantid, tenantId),
                    eq(this.table.isdeleted, false)
                )
            );

        return { totalbalance: result[0]?.totalbalance || 0 };
    }

    async getAccountRunningBalance(
        accountid: string,
        tenantId: string
    ): Promise<{ runningbalance: number } | null> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(ViewNames.ViewAccountsWithRunningBalance)
                .select("runningbalance")
                .eq("id", accountid)
                .eq("tenantid", tenantId)
                .single();

            if (error) {
                if (error.code === "PGRST116") return null;
                throw error;
            }
            return { runningbalance: data.runningbalance || 0 };
        }

        const db = this.getSqliteDb();
        const result = await (db as any)
            .select({ sum: sql<number>`sum(${transactions.amount})` })
            .from(transactions)
            .where(
                and(
                    eq(transactions.accountid, accountid),
                    eq(transactions.tenantid, tenantId),
                    eq(transactions.isdeleted, false),
                    eq(transactions.isvoid, false)
                )
            );

        return { runningbalance: result[0]?.sum || 0 };
    }
}
