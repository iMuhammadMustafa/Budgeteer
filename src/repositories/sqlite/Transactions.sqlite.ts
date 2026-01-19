import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import {
    Inserts,
    SearchDistinctTransactions,
    Transaction,
    TransactionsView,
    Updates,
} from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { getCurrentTimestamp } from "@/src/types/database/sqlite/constants";
import { SQLiteBindValue } from "expo-sqlite";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { ITransactionRepository } from "../interfaces/ITransactionRepository";

export class TransactionSqliteRepository
    extends BaseSqliteRepository<Transaction, TableNames.Transactions>
    implements ITransactionRepository {
    protected tableName = TableNames.Transactions;
    protected orderByField = "date";
    protected orderDirection: "ASC" | "DESC" = "DESC";

    /**
     * Find all transactions from view with enriched data and running balance
     */
    async findAllFromView(
        tenantId: string,
        filters: TransactionFilters
    ): Promise<TransactionsView[]> {
        const db = await getSqliteDB();

        let query = `SELECT * FROM ${ViewNames.TransactionsView} WHERE tenantid = ?`;
        const params: SQLiteBindValue[] = [tenantId];

        // Date range filters
        if (filters.startDate) {
            query += ` AND date >= ?`;
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            query += ` AND date <= ?`;
            params.push(filters.endDate);
        }

        // Account filter
        if (filters.accountid) {
            query += ` AND accountid = ?`;
            params.push(filters.accountid);
        }

        // Category filter
        if (filters.categoryid) {
            query += ` AND categoryid = ?`;
            params.push(filters.categoryid);
        }

        // Group filter
        if (filters.groupid) {
            query += ` AND groupid = ?`;
            params.push(filters.groupid);
        }

        // Type filter
        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }

        // Void filter
        if (filters.isVoid !== undefined) {
            query += ` AND isvoid = ?`;
            params.push(filters.isVoid === "true" ? 1 : 0);
        }

        // Search by name
        if (filters.name) {
            query += ` AND (name LIKE ? OR payee LIKE ? OR description LIKE ?)`;
            const searchTerm = `%${filters.name}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Order by date DESC, createdat DESC for deterministic ordering
        query += ` ORDER BY date DESC, createdat DESC, id DESC`;

        // Pagination
        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }
        if (filters.offset) {
            query += ` OFFSET ?`;
            params.push(filters.offset);
        }

        const rows = await db.getAllAsync<Record<string, unknown>>(query, params);

        return rows.map((row) => {
            // Convert SQLite integers to booleans
            return {
                ...row,
                isvoid: row.isvoid === 1 || row.isvoid === true,
            } as TransactionsView;
        });
    }

    async findByTransferId(id: string, tenantId: string): Promise<TransactionsView> {
        const db = await getSqliteDB();

        const row = await db.getFirstAsync<Record<string, unknown>>(
            `SELECT * FROM ${ViewNames.TransactionsView} WHERE transferid = ? AND tenantid = ?`,
            [id, tenantId]
        );

        if (!row) {
            throw new Error("Transfer transaction not found");
        }

        return {
            ...row,
            isvoid: row.isvoid === 1 || row.isvoid === true,
        } as TransactionsView;
    }

    async findByName(
        text: string,
        tenantId: string
    ): Promise<{ label: string; item: SearchDistinctTransactions }[]> {
        const db = await getSqliteDB();

        const rows = await db.getAllAsync<Record<string, unknown>>(
            `SELECT * FROM ${ViewNames.SearchDistinctTransactions} 
       WHERE tenantid = ? AND (name LIKE ? OR payee LIKE ? OR description LIKE ?)
       LIMIT 20`,
            [tenantId, `%${text}%`, `%${text}%`, `%${text}%`]
        );

        return rows.map((row) => ({
            label: (row.name as string) || (row.payee as string) || (row.description as string) || "",
            item: {
                ...row,
                isvoid: row.isvoid === 1 || row.isvoid === true,
            } as SearchDistinctTransactions,
        }));
    }

    async updateTransferTransaction(
        transaction: Updates<TableNames.Transactions>
    ): Promise<Transaction> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();

        if (!transaction.id) {
            throw new Error("Transaction ID is required");
        }

        // Get the transaction to find tenantid
        const existing = await db.getFirstAsync<{ tenantid: string }>(
            `SELECT tenantid FROM ${TableNames.Transactions} WHERE id = ?`,
            [transaction.id]
        );

        if (!existing) {
            throw new Error("Transaction not found");
        }

        const updated = await this.update(transaction.id, transaction, existing.tenantid);
        if (!updated) {
            throw new Error("Failed to update transfer transaction");
        }

        return updated;
    }

    async findAllDeleted(
        tenantId: string,
        filters: TransactionFilters
    ): Promise<Transaction[]> {
        return this.findAll(tenantId, { ...filters, isDeleted: true });
    }

    async getAccountBalanceAtDate(
        accountId: string,
        date: Date,
        tenantId: string
    ): Promise<number> {
        const db = await getSqliteDB();
        const dateStr = date.toISOString().split("T")[0];

        const result = await db.getFirstAsync<{ balance: number }>(
            `SELECT COALESCE(SUM(amount), 0) as balance 
       FROM ${TableNames.Transactions} 
       WHERE accountid = ? AND tenantid = ? AND date <= ? AND isdeleted = 0 AND isvoid = 0`,
            [accountId, tenantId, dateStr]
        );

        return result?.balance ?? 0;
    }

    async createMultiple(
        data: Inserts<TableNames.Transactions>[],
        tenantId: string
    ): Promise<Transaction[]> {
        // Use base class implementation which has schema filtering
        return super.createMultiple(data, tenantId);
    }
}
