import { QueryFilters } from "@/src/types/apis/QueryFilters";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { Account, AccountCategory } from "@/src/types/database/Tables.Types";
import { getSqliteDB } from "@/src/types/database/sqlite";
import { getCurrentTimestamp } from "@/src/types/database/sqlite/constants";
import { BaseSqliteRepository } from "../BaseSqliteRepository";
import { IAccountRepository } from "../interfaces/IAccountRepository";

export class AccountSqliteRepository
    extends BaseSqliteRepository<Account, TableNames.Accounts>
    implements IAccountRepository {
    protected tableName = TableNames.Accounts;
    protected orderByFieldsAsc = ["displayorder"];
    protected orderByFieldsDesc = ["displayorder"];
    protected orderDirection: "ASC" | "DESC" = "DESC";

    async findAllWithCategory(tenantId: string, filters?: QueryFilters): Promise<Account[]> {
        const db = await getSqliteDB();

        let query = `
      SELECT 
        a.*,
        ac.id AS category_id,
        ac.name AS category_name,
        ac.type AS category_type,
        ac.color AS category_color,
        ac.icon AS category_icon,
        ac.displayorder AS category_displayorder
      FROM ${TableNames.Accounts} a
      LEFT JOIN ${TableNames.AccountCategories} ac ON a.categoryid = ac.id
      WHERE a.tenantid = ?
    `;
        const params: unknown[] = [tenantId];

        // isDeleted filter
        if (filters?.isDeleted === null) {
            // No filter
        } else if (filters?.isDeleted === true) {
            query += ` AND a.isdeleted = 1`;
        } else {
            query += ` AND a.isdeleted = 0`;
        }

        query += ` ORDER BY a.displayorder DESC, a.name`;

        const rows = await db.getAllAsync<Record<string, unknown>>(query, params);

        return rows.map((row) => {
            const account = this.mapFromRow(row);

            // Attach category if available
            if (row.category_id) {
                (account as Account).category = {
                    id: row.category_id as string,
                    name: row.category_name as string,
                    type: row.category_type as AccountCategory["type"],
                    color: row.category_color as string,
                    icon: row.category_icon as string,
                    displayorder: row.category_displayorder as number,
                    tenantid: tenantId,
                    isdeleted: false,
                    createdat: "",
                    createdby: null,
                    updatedat: null,
                    updatedby: null,
                };
            }

            return account;
        });
    }

    async findByIdWithBalance(
        id: string,
        tenantId: string
    ): Promise<(Account & { runningbalance: number }) | null> {
        const db = await getSqliteDB();

        // Get account with category
        const accountRow = await db.getFirstAsync<Record<string, unknown>>(
            `
      SELECT 
        a.*,
        ac.id AS category_id,
        ac.name AS category_name,
        ac.type AS category_type,
        ac.color AS category_color,
        ac.icon AS category_icon,
        ac.displayorder AS category_displayorder
      FROM ${TableNames.Accounts} a
      LEFT JOIN ${TableNames.AccountCategories} ac ON a.categoryid = ac.id
      WHERE a.id = ? AND a.tenantid = ? AND a.isdeleted = 0
    `,
            [id, tenantId]
        );

        if (!accountRow) return null;

        const account = this.mapFromRow(accountRow) as Account;

        // Attach category
        if (accountRow.category_id) {
            account.category = {
                id: accountRow.category_id as string,
                name: accountRow.category_name as string,
                type: accountRow.category_type as AccountCategory["type"],
                color: accountRow.category_color as string,
                icon: accountRow.category_icon as string,
                displayorder: accountRow.category_displayorder as number,
                tenantid: tenantId,
                isdeleted: false,
                createdat: "",
                createdby: null,
                updatedat: null,
                updatedby: null,
            };
        }

        // Get running balance from view
        const balanceRow = await db.getFirstAsync<{ runningbalance: number }>(
            `SELECT runningbalance FROM ${ViewNames.ViewAccountsWithRunningBalance} WHERE id = ? AND tenantid = ?`,
            [id, tenantId]
        );

        return {
            ...account,
            runningbalance: balanceRow?.runningbalance ?? account.balance,
        };
    }

    async updateAccountBalance(
        accountid: string,
        amount: number,
        tenantId: string
    ): Promise<number> {
        const db = await getSqliteDB();
        const now = getCurrentTimestamp();

        // Get current balance
        const account = await db.getFirstAsync<{ balance: number }>(
            `SELECT balance FROM ${TableNames.Accounts} WHERE id = ? AND tenantid = ? AND isdeleted = 0`,
            [accountid, tenantId]
        );

        if (!account) {
            throw new Error("Account not found");
        }

        const newBalance = account.balance + amount;

        await db.runAsync(
            `UPDATE ${TableNames.Accounts} SET balance = ?, updatedat = ? WHERE id = ? AND tenantid = ?`,
            [newBalance, now, accountid, tenantId]
        );

        return newBalance;
    }

    async getAccountOpenedTransaction(
        accountid: string,
        tenantId: string
    ): Promise<{ id: string; amount: number }> {
        const db = await getSqliteDB();

        const transaction = await db.getFirstAsync<{ id: string; amount: number }>(
            `SELECT id, amount FROM ${TableNames.Transactions} 
       WHERE accountid = ? AND tenantid = ? AND type = 'Initial' AND isdeleted = 0 
       LIMIT 1`,
            [accountid, tenantId]
        );

        if (!transaction) {
            throw new Error("Account opening transaction not found");
        }

        return transaction;
    }

    async getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null> {
        const db = await getSqliteDB();

        const result = await db.getFirstAsync<{ totalbalance: number }>(
            `SELECT totalbalance FROM ${ViewNames.StatsTotalAccountBalance} WHERE tenantid = ?`,
            [tenantId]
        );

        return result || { totalbalance: 0 };
    }

    async getAccountRunningBalance(
        accountid: string,
        tenantId: string
    ): Promise<{ runningbalance: number } | null> {
        const db = await getSqliteDB();

        const result = await db.getFirstAsync<{ runningbalance: number }>(
            `SELECT runningbalance FROM ${ViewNames.ViewAccountsWithRunningBalance} WHERE id = ? AND tenantid = ?`,
            [accountid, tenantId]
        );

        return result || { runningbalance: 0 };
    }
}
