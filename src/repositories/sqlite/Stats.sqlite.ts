import { ViewNames } from "@/src/types/database/TableNames";
import {
    StatsDailyTransactions,
    StatsMonthlyAccountsTransactions,
    StatsMonthlyCategoriesTransactions,
    StatsMonthlyTransactionsTypes,
    StatsNetWorthGrowth,
    TransactionType,
} from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { IStatsRepository } from "../interfaces/IStatsRepository";

export class StatsSqliteRepository implements IStatsRepository {
    async getStatsDailyTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string,
        type?: TransactionType
    ): Promise<StatsDailyTransactions[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.StatsDailyTransactions} WHERE tenantid = ?`;
        const params: unknown[] = [tenantId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }
        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        query += ` ORDER BY date ASC`;

        const rows = await db.getAllAsync<StatsDailyTransactions>(query, params);
        return rows;
    }

    async getStatsMonthlyTransactionsTypes(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyTransactionsTypes[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.StatsMonthlyTransactionsTypes} WHERE tenantid = ?`;
        const params: unknown[] = [tenantId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY date ASC`;

        const rows = await db.getAllAsync<StatsMonthlyTransactionsTypes>(query, params);
        return rows;
    }

    async getStatsMonthlyCategoriesTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyCategoriesTransactions[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.StatsMonthlyCategoriesTransactions} WHERE tenantid = ?`;
        const params: unknown[] = [tenantId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY date ASC, categorydisplayorder DESC`;

        const rows = await db.getAllAsync<StatsMonthlyCategoriesTransactions>(query, params);
        return rows;
    }

    async getStatsMonthlyAccountsTransactions(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsMonthlyAccountsTransactions[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.StatsMonthlyAccountsTransactions} WHERE tenantid = ?`;
        const params: unknown[] = [tenantId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY date ASC`;

        const rows = await db.getAllAsync<StatsMonthlyAccountsTransactions>(query, params);
        return rows;
    }

    async getStatsNetWorthGrowth(
        tenantId: string,
        startDate?: string,
        endDate?: string
    ): Promise<StatsNetWorthGrowth[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.StatsNetWorthGrowth} WHERE tenantid = ?`;
        const params: unknown[] = [tenantId];

        if (startDate) {
            query += ` AND month >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND month <= ?`;
            params.push(endDate);
        }

        query += ` ORDER BY month ASC`;

        const rows = await db.getAllAsync<StatsNetWorthGrowth>(query, params);
        return rows;
    }
}
