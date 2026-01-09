import { DatabaseContext } from "@/src/types/database/drizzle";
import {
    accounts,
    transactionCategories,
    transactionGroups,
    transactions,
} from "@/src/types/database/drizzle/schema";
import { ViewNames } from "@/src/types/database/TableNames";
import {
    StatsDailyTransactions,
    StatsMonthlyAccountsTransactions,
    StatsMonthlyCategoriesTransactions,
    StatsMonthlyTransactionsTypes,
    StatsNetWorthGrowth,
    TransactionType,
} from "@/src/types/database/Tables.Types";
import { StorageMode } from "@/src/types/StorageMode";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { IStatsRepository } from "../interfaces/IStatsRepository";

export class StatsDrizzleRepository implements IStatsRepository {
    protected dbContext: DatabaseContext;

    constructor(dbContext: DatabaseContext) {
        this.dbContext = dbContext;
    }

    private isCloudMode(): boolean {
        return this.dbContext.mode === StorageMode.Cloud;
    }

    async getStatsDailyTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string,
        type?: TransactionType
    ): Promise<StatsDailyTransactions[]> {
        if (this.isCloudMode()) {
            let query = this.dbContext.supabase!
                .from(ViewNames.StatsDailyTransactions)
                .select("*")
                .eq("tenantid", tenantId);

            if (startDate) query = query.gte("date", startDate);
            if (endDate) query = query.lte("date", endDate);
            if (type) query = query.eq("type", type);

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsDailyTransactions[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
            ne(transactions.type, "Transfer"),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));
        if (type) conditions.push(eq(transactions.type, type));

        const results = await (db as any)
            .select({
                date: sql<string>`date(${transactions.date})`,
                totalamount: sql<number>`sum(${transactions.amount})`,
                transactioncount: sql<number>`count(*)`,
            })
            .from(transactions)
            .where(and(...conditions))
            .groupBy(sql`date(${transactions.date})`)
            .orderBy(sql`date(${transactions.date})`);

        return results.map((r: any) => ({
            date: r.date,
            totalamount: r.totalamount || 0,
            transactioncount: Number(r.transactioncount) || 0,
            tenantid: tenantId,
        }));
    }

    async getStatsMonthlyTransactionsTypes(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyTransactionsTypes[]> {
        if (this.isCloudMode()) {
            let query = this.dbContext.supabase!
                .from(ViewNames.StatsMonthlyTransactionsTypes)
                .select("*")
                .eq("tenantid", tenantId);

            if (startDate) query = query.gte("month", startDate.substring(0, 7));
            if (endDate) query = query.lte("month", endDate.substring(0, 7));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsMonthlyTransactionsTypes[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
            ne(transactions.type, "Transfer"),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const results = await (db as any)
            .select({
                month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
                type: transactions.type,
                totalamount: sql<number>`sum(${transactions.amount})`,
                transactioncount: sql<number>`count(*)`,
            })
            .from(transactions)
            .where(and(...conditions))
            .groupBy(sql`strftime('%Y-%m', ${transactions.date})`, transactions.type)
            .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

        return results.map((r: any) => ({
            month: r.month,
            type: r.type,
            totalamount: r.totalamount || 0,
            transactioncount: Number(r.transactioncount) || 0,
            tenantid: tenantId,
        }));
    }

    async getStatsMonthlyCategoriesTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyCategoriesTransactions[]> {
        if (this.isCloudMode()) {
            let query = this.dbContext.supabase!
                .from(ViewNames.StatsMonthlyCategoriesTransactions)
                .select("*")
                .eq("tenantid", tenantId);

            if (startDate) query = query.gte("month", startDate.substring(0, 7));
            if (endDate) query = query.lte("month", endDate.substring(0, 7));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsMonthlyCategoriesTransactions[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
            ne(transactions.type, "Transfer"),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const results = await (db as any)
            .select({
                month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
                categoryid: transactionCategories.id,
                categoryname: transactionCategories.name,
                groupid: transactionGroups.id,
                groupname: transactionGroups.name,
                icon: transactionCategories.icon,
                totalamount: sql<number>`sum(${transactions.amount})`,
                transactioncount: sql<number>`count(*)`,
            })
            .from(transactions)
            .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
            .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
            .where(and(...conditions))
            .groupBy(
                sql`strftime('%Y-%m', ${transactions.date})`,
                transactionCategories.id,
                transactionCategories.name,
                transactionGroups.id,
                transactionGroups.name,
                transactionCategories.icon
            )
            .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

        return results.map((r: any) => ({
            month: r.month,
            categoryid: r.categoryid,
            categoryname: r.categoryname,
            groupid: r.groupid,
            groupname: r.groupname,
            icon: r.icon,
            totalamount: r.totalamount || 0,
            transactioncount: Number(r.transactioncount) || 0,
            tenantid: tenantId,
        }));
    }

    async getStatsMonthlyAccountsTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyAccountsTransactions[]> {
        if (this.isCloudMode()) {
            let query = this.dbContext.supabase!
                .from(ViewNames.StatsMonthlyAccountsTransactions)
                .select("*")
                .eq("tenantid", tenantId);

            if (startDate) query = query.gte("month", startDate.substring(0, 7));
            if (endDate) query = query.lte("month", endDate.substring(0, 7));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsMonthlyAccountsTransactions[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const results = await (db as any)
            .select({
                month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
                accountid: accounts.id,
                accountname: accounts.name,
                currency: accounts.currency,
                totalamount: sql<number>`sum(${transactions.amount})`,
                transactioncount: sql<number>`count(*)`,
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountid, accounts.id))
            .where(and(...conditions))
            .groupBy(
                sql`strftime('%Y-%m', ${transactions.date})`,
                accounts.id,
                accounts.name,
                accounts.currency
            )
            .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

        return results.map((r: any) => ({
            month: r.month,
            accountid: r.accountid,
            accountname: r.accountname,
            currency: r.currency,
            totalamount: r.totalamount || 0,
            transactioncount: Number(r.transactioncount) || 0,
            tenantid: tenantId,
        }));
    }

    async getStatsNetWorthGrowth(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsNetWorthGrowth[]> {
        if (this.isCloudMode()) {
            let query = this.dbContext.supabase!
                .from(ViewNames.StatsNetWorthGrowth)
                .select("*")
                .eq("tenantid", tenantId);

            if (startDate) query = query.gte("month", startDate.substring(0, 7));
            if (endDate) query = query.lte("month", endDate.substring(0, 7));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsNetWorthGrowth[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const results = await (db as any)
            .select({
                month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
                totalamount: sql<number>`sum(${transactions.amount})`,
            })
            .from(transactions)
            .where(and(...conditions))
            .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
            .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

        let runningTotal = 0;
        return results.map((r: any) => {
            runningTotal += r.totalamount || 0;
            return {
                month: r.month,
                networth: runningTotal,
                tenantid: tenantId,
            };
        });
    }
}
