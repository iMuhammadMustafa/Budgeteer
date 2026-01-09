import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import {
    SearchDistinctTransactions,
    Transaction,
    TransactionsView,
} from "@/src/types/database/Tables.Types";
import { DatabaseContext } from "@/src/types/database/drizzle";
import {
    accounts,
    transactionCategories,
    transactionGroups,
    transactions,
} from "@/src/types/database/drizzle/schema";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { and, desc, eq, like, lte, or, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";

export class TransactionDrizzleRepository
    extends BaseDrizzleRepository<
        typeof transactions,
        TableNames.Transactions,
        Transaction
    >
    implements ITransactionRepository {
    protected table = transactions;
    protected tableName = TableNames.Transactions;

    constructor(dbContext: DatabaseContext) {
        super(dbContext);
    }

    async findAll(
        tenantId: string,
        filters?: TransactionFilters
    ): Promise<TransactionsView[]> {
        if (this.isCloudMode()) {
            let query = this.getSupabase()
                .from(ViewNames.TransactionsView)
                .select("*")
                .eq("tenantid", tenantId);

            if (filters?.accountId) {
                query = query.eq("accountid", filters.accountId);
            }
            if (filters?.categoryId) {
                query = query.eq("categoryid", filters.categoryId);
            }
            if (filters?.startDate) {
                query = query.gte("date", filters.startDate);
            }
            if (filters?.endDate) {
                query = query.lte("date", filters.endDate);
            }
            if (filters?.type) {
                query = query.eq("type", filters.type);
            }

            const { data, error } = await query.order("date", { ascending: false });
            if (error) throw error;
            return data as TransactionsView[];
        }

        // SQLite: Build joined query
        const db = this.getSqliteDb();
        const baseQuery = (db as any)
            .select({
                id: transactions.id,
                name: transactions.name,
                date: transactions.date,
                amount: transactions.amount,
                type: transactions.type,
                payee: transactions.payee,
                isvoid: transactions.isvoid,
                transferid: transactions.transferid,
                transferaccountid: transactions.transferaccountid,
                createdat: transactions.createdat,
                updatedat: transactions.updatedat,
                tenantid: transactions.tenantid,
                categoryid: transactionCategories.id,
                categoryname: transactionCategories.name,
                icon: transactionCategories.icon,
                groupid: transactionGroups.id,
                groupname: transactionGroups.name,
                groupicon: transactionGroups.icon,
                accountid: accounts.id,
                accountname: accounts.name,
                currency: accounts.currency,
                balance: accounts.balance,
            })
            .from(transactions)
            .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
            .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
            .innerJoin(accounts, eq(transactions.accountid, accounts.id));

        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
        ];

        if (filters?.accountId) {
            conditions.push(eq(transactions.accountid, filters.accountId));
        }
        if (filters?.categoryId) {
            conditions.push(eq(transactions.categoryid, filters.categoryId));
        }
        if (filters?.startDate) {
            conditions.push(sql`${transactions.date} >= ${filters.startDate}`);
        }
        if (filters?.endDate) {
            conditions.push(sql`${transactions.date} <= ${filters.endDate}`);
        }
        if (filters?.type) {
            conditions.push(eq(transactions.type, filters.type));
        }

        const results = await baseQuery
            .where(and(...conditions))
            .orderBy(desc(transactions.date), desc(transactions.createdat));

        return results as TransactionsView[];
    }

    async findAllDeleted(
        tenantId: string,
        filters: TransactionFilters
    ): Promise<Transaction[]> {
        if (this.isCloudMode()) {
            let query = this.getSupabase()
                .from(this.tableName)
                .select()
                .eq("tenantid", tenantId)
                .eq("isdeleted", true);

            if (filters?.accountId) {
                query = query.eq("accountid", filters.accountId);
            }

            const { data, error } = await query.order("date", { ascending: false });
            if (error) throw error;
            return data as Transaction[];
        }

        const db = this.getSqliteDb();
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, true),
        ];

        if (filters?.accountId) {
            conditions.push(eq(transactions.accountid, filters.accountId));
        }

        const results = await (db as any)
            .select()
            .from(this.table)
            .where(and(...conditions))
            .orderBy(desc(transactions.date));

        return results as Transaction[];
    }

    async findByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(ViewNames.TransactionsView)
                .select("*")
                .eq("transferid", id)
                .eq("tenantid", tenantId)
                .single();

            if (error) throw error;
            return data as TransactionsView;
        }

        const db = this.getSqliteDb();
        const results = await (db as any)
            .select({
                id: transactions.id,
                name: transactions.name,
                date: transactions.date,
                amount: transactions.amount,
                type: transactions.type,
                payee: transactions.payee,
                isvoid: transactions.isvoid,
                transferid: transactions.transferid,
                transferaccountid: transactions.transferaccountid,
                createdat: transactions.createdat,
                updatedat: transactions.updatedat,
                tenantid: transactions.tenantid,
                categoryid: transactionCategories.id,
                categoryname: transactionCategories.name,
                icon: transactionCategories.icon,
                groupid: transactionGroups.id,
                groupname: transactionGroups.name,
                groupicon: transactionGroups.icon,
                accountid: accounts.id,
                accountname: accounts.name,
                currency: accounts.currency,
                balance: accounts.balance,
            })
            .from(transactions)
            .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
            .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
            .innerJoin(accounts, eq(transactions.accountid, accounts.id))
            .where(
                and(
                    eq(transactions.transferid, id),
                    eq(transactions.tenantid, tenantId),
                    eq(transactions.isdeleted, false)
                )
            )
            .limit(1);

        return results[0] as TransactionsView;
    }

    async findByName(
        text: string,
        tenantId: string
    ): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(ViewNames.SearchDistinctTransactions)
                .select("*")
                .eq("tenantid", tenantId)
                .or(`name.ilike.%${text}%,payee.ilike.%${text}%`)
                .limit(20);

            if (error) throw error;
            return (data ?? []).map((item: any) => ({
                label: item.name || item.payee || "",
                item: item as SearchDistinctTransactions,
            }));
        }

        const db = this.getSqliteDb();
        const results = await (db as any)
            .selectDistinct({
                name: transactions.name,
                payee: transactions.payee,
                categoryid: transactions.categoryid,
                categoryname: transactionCategories.name,
                icon: transactionCategories.icon,
                groupid: transactionGroups.id,
                groupname: transactionGroups.name,
            })
            .from(transactions)
            .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
            .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
            .where(
                and(
                    eq(transactions.tenantid, tenantId),
                    eq(transactions.isdeleted, false),
                    or(
                        like(transactions.name, `%${text}%`),
                        like(transactions.payee, `%${text}%`)
                    )
                )
            )
            .limit(20);

        return results.map((item: any) => ({
            label: item.name || item.payee || "",
            item: item as SearchDistinctTransactions,
        }));
    }

    async updateTransferTransaction(transaction: any): Promise<Transaction> {
        const result = await this.update(
            transaction.id,
            transaction,
            transaction.tenantid
        );
        if (!result) throw new Error("Failed to update transfer transaction");
        return result as unknown as Transaction;
    }

    async getAccountBalanceAtDate(
        accountId: string,
        date: Date,
        tenantId: string
    ): Promise<number> {
        const dateStr = date.toISOString();

        if (this.isCloudMode()) {
            const { data, error } = await this.getSupabase()
                .from(this.tableName)
                .select("amount")
                .eq("accountid", accountId)
                .eq("tenantid", tenantId)
                .eq("isdeleted", false)
                .eq("isvoid", false)
                .lte("date", dateStr);

            if (error) throw error;
            return (data ?? []).reduce((sum, r) => sum + (r.amount || 0), 0);
        }

        const db = this.getSqliteDb();
        const result = await (db as any)
            .select({ sum: sql<number>`sum(${transactions.amount})` })
            .from(transactions)
            .where(
                and(
                    eq(transactions.accountid, accountId),
                    eq(transactions.tenantid, tenantId),
                    eq(transactions.isdeleted, false),
                    eq(transactions.isvoid, false),
                    lte(transactions.date, dateStr)
                )
            );

        return result[0]?.sum || 0;
    }

    async createMultiple(data: any[], tenantId: string): Promise<Transaction[]> {
        const now = this.getNow();
        const results: Transaction[] = [];

        for (const item of data) {
            const insertData = {
                ...item,
                id: item.id || GenerateUuid(),
                tenantid: tenantId,
                isdeleted: false,
                isvoid: item.isvoid ?? false,
                createdat: now,
                updatedat: now,
            };

            if (this.isCloudMode()) {
                const { data: created, error } = await this.getSupabase()
                    .from(this.tableName)
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;
                results.push(created as Transaction);
            } else {
                const db = this.getSqliteDb();
                await (db as any).insert(this.table).values(insertData);
                const created = await this.findById(insertData.id, tenantId);
                if (created) results.push(created as unknown as Transaction);
            }
        }

        return results;
    }
}
