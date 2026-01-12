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
import dayjs from "dayjs";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
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
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));
        if (type) conditions.push(eq(transactions.type, type));

        const results = await (db as any)
            .select({
                type: transactions.type,
                date: sql<string>`date(${transactions.date})`,
                sum: sql<number>`sum(${transactions.amount})`,
            })
            .from(transactions)
            .where(and(...conditions))
            .groupBy(transactions.type, sql`date(${transactions.date})`)
            .orderBy(sql`date(${transactions.date})`);

        return results.map((r: any) => ({
            type: r.type,
            date: r.date,
            sum: r.sum || 0,
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

            if (startDate) query = query.gte("date", dayjs(startDate).startOf("month").format("YYYY-MM-DD"));
            if (endDate) query = query.lte("date", dayjs(endDate).endOf("month").format("YYYY-MM-DD"));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsMonthlyTransactionsTypes[];
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
                date: sql<string>`date(${transactions.date}, 'start of month')`,
                type: transactions.type,
                sum: sql<number>`sum(${transactions.amount})`,
            })
            .from(transactions)
            .where(and(...conditions))
            .groupBy(sql`date(${transactions.date}, 'start of month')`, transactions.type)
            .orderBy(sql`date(${transactions.date}, 'start of month')`);

        return results.map((r: any) => ({
            date: r.date,
            type: r.type,
            sum: r.sum || 0,
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
                .eq("tenantid", tenantId)
                .in("type", ["Expense", "Adjustment"]);

            if (startDate) query = query.gte("date", dayjs(startDate).startOf("month").format("YYYY-MM-DD"));
            if (endDate) query = query.lte("date", dayjs(endDate).endOf("month").format("YYYY-MM-DD"));

            const { data, error } = await query;
            if (error) throw error;
            return data as StatsMonthlyCategoriesTransactions[];
        }

        const db = this.dbContext.sqlite!;
        const conditions: any[] = [
            eq(transactions.tenantid, tenantId),
            eq(transactions.isdeleted, false),
            eq(transactions.isvoid, false),
            inArray(transactions.type, ["Expense", "Adjustment"]),
        ];

        if (startDate) conditions.push(gte(transactions.date, startDate));
        if (endDate) conditions.push(lte(transactions.date, endDate));

        const results = await (db as any)
            .select({
                date: sql<string>`date(${transactions.date}, 'start of month')`,
                categoryid: transactionCategories.id,
                categoryname: transactionCategories.name,
                categorybudgetamount: transactionCategories.budgetamount,
                categorybudgetfrequency: transactionCategories.budgetfrequency,
                categoryicon: transactionCategories.icon,
                categorycolor: transactionCategories.color,
                categorydisplayorder: transactionCategories.displayorder,
                groupid: transactionGroups.id,
                groupname: transactionGroups.name,
                groupbudgetamount: transactionGroups.budgetamount,
                groupbudgetfrequency: transactionGroups.budgetfrequency,
                groupicon: transactionGroups.icon,
                groupcolor: transactionGroups.color,
                groupdisplayorder: transactionGroups.displayorder,
                type: transactions.type,
                sum: sql<number>`sum(${transactions.amount})`,
            })
            .from(transactions)
            .innerJoin(transactionCategories, eq(transactions.categoryid, transactionCategories.id))
            .innerJoin(transactionGroups, eq(transactionCategories.groupid, transactionGroups.id))
            .where(and(...conditions))
            .groupBy(
                sql`date(${transactions.date}, 'start of month')`,
                transactionCategories.id,
                transactionCategories.name,
                transactionCategories.budgetamount,
                transactionCategories.budgetfrequency,
                transactionCategories.icon,
                transactionCategories.color,
                transactionCategories.displayorder,
                transactionGroups.id,
                transactionGroups.name,
                transactionGroups.budgetamount,
                transactionGroups.budgetfrequency,
                transactionGroups.icon,
                transactionGroups.color,
                transactionGroups.displayorder,
                transactions.type
            )
            .orderBy(sql`date(${transactions.date}, 'start of month')`);

        return results.map((r: any) => ({
            date: r.date,
            categoryid: r.categoryid,
            categoryname: r.categoryname,
            categorybudgetamount: r.categorybudgetamount,
            categorybudgetfrequency: r.categorybudgetfrequency,
            categoryicon: r.categoryicon,
            categorycolor: r.categorycolor,
            categorydisplayorder: r.categorydisplayorder,
            groupid: r.groupid,
            groupname: r.groupname,
            groupbudgetamount: r.groupbudgetamount,
            groupbudgetfrequency: r.groupbudgetfrequency,
            groupicon: r.groupicon,
            groupcolor: r.groupcolor,
            groupdisplayorder: r.groupdisplayorder,
            type: r.type,
            sum: r.sum || 0,
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

            if (startDate) query = query.gte("date", dayjs(startDate).startOf("month").format("YYYY-MM-DD"));
            if (endDate) query = query.lte("date", dayjs(endDate).endOf("month").format("YYYY-MM-DD"));

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
                date: sql<string>`date(${transactions.date}, 'start of month')`,
                accountid: accounts.id,
                account: accounts.name,
                sum: sql<number>`sum(${transactions.amount})`,
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountid, accounts.id))
            .where(and(...conditions))
            .groupBy(
                sql`date(${transactions.date}, 'start of month')`,
                accounts.id,
                accounts.name
            )
            .orderBy(sql`date(${transactions.date}, 'start of month')`);

        return results.map((r: any) => ({
            date: r.date,
            accountid: r.accountid,
            account: r.account,
            sum: r.sum || 0,
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

            if (startDate) query = query.gte("month", dayjs(startDate).startOf("month").format("YYYY-MM-DD"));
            if (endDate) query = query.lte("month", dayjs(endDate).endOf("month").format("YYYY-MM-DD"));

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
                total_net_worth: runningTotal,
                tenantid: tenantId,
            };
        });
    }
}
