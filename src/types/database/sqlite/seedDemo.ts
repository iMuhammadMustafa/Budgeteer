/**
 * SQLite Demo Seeding
 * This file contains demo data seeding for Demo mode
 * Uses SQLITE_DEMO_TENANT_ID for all data
 */

import GenerateUuid from "@/src/utils/uuid.Helper";
import { ConfigurationTypes } from "../Config.Types";
import { TableNames } from "../TableNames";
import {
    SQLITE_DEMO_TENANT_ID,
    SQLITE_DEMO_USER_ID,
    SQLITE_SEEDING_FLAGS,
    getCurrentTimestamp,
} from "./constants";
import { getSqliteDB } from "./index";

// Re-use the same category/group IDs for consistency
const DEMO_IDS = {
    // Transaction Groups
    GROUP_ENTERTAINMENT: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    GROUP_BILLS: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    GROUP_HOUSEHOLD: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
    GROUP_EMPLOYER: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
    GROUP_OTHER: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8",
    GROUP_ACCOUNTS: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
    GROUP_CAR: "56f8e908-644e-4767-bff9-1f37baf49fe4",
    GROUP_GROCERIES: "046e648c-123f-462c-908b-d1e0831e6a11",

    // Account Categories
    CAT_BANK: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    CAT_DEBIT: "b717a537-78a2-4a78-8da9-2598faca1cec",
    CAT_CREDIT: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    CAT_CASH: "5d192f78-41e8-413c-9457-c9d68f9decf1",
    CAT_GIFT: "d9833b85-1523-4a01-8c82-10fbe3c1ad18",
    CAT_LOAN: "bbefb010-bcf9-4552-b41f-c4c3053b4357",

    // Transaction Categories
    TXCAT_ACCOUNT_OPS: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    TXCAT_SALARY: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
    TXCAT_GROCERIES: "61484698-2405-4b17-8e14-71a43a3f91e5",
    TXCAT_RENT: "ef228637-4334-4d7d-8697-84dd19b1e173",
    TXCAT_ELECTRICITY: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca",
    TXCAT_FUEL: "4be2ba14-f8aa-4480-b88e-128ab06002ef",
    TXCAT_DINING: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",

    // Demo Accounts
    ACC_CHECKING: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    ACC_SAVINGS: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
    ACC_CREDIT: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    ACC_CASH: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
};

/**
 * Check if demo data has been seeded using localStorage flag
 */
export const isDemoSeeded = (): boolean => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(SQLITE_SEEDING_FLAGS.DEMO_SEEDED) === "true";
};

/**
 * Set the demo seeded flag in localStorage
 */
export const setDemoSeededFlag = (seeded: boolean): void => {
    if (typeof localStorage === "undefined") return;
    if (seeded) {
        localStorage.setItem(SQLITE_SEEDING_FLAGS.DEMO_SEEDED, "true");
    } else {
        localStorage.removeItem(SQLITE_SEEDING_FLAGS.DEMO_SEEDED);
    }
};

/**
 * Generate demo transactions over the past 2 years
 */
const generateDemoTransactions = () => {
    const transactions: Array<{
        id: string;
        name: string;
        amount: number;
        date: string;
        description: string | null;
        payee: string | null;
        notes: string | null;
        tags: string | null;
        type: string;
        isvoid: number;
        accountid: string;
        categoryid: string;
        transferaccountid: string | null;
        transferid: string | null;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    // Opening balances
    const openingDate = new Date(twoYearsAgo);
    openingDate.setDate(openingDate.getDate() - 1);

    transactions.push(
        { id: GenerateUuid(), name: "Opening Balance", amount: 500, date: openingDate.toISOString(), description: "Initial balance", payee: null, notes: null, tags: null, type: "Initial", isvoid: 0, accountid: DEMO_IDS.ACC_CHECKING, categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS, transferaccountid: null, transferid: null },
        { id: GenerateUuid(), name: "Opening Balance", amount: 50000, date: openingDate.toISOString(), description: "Initial balance", payee: null, notes: null, tags: null, type: "Initial", isvoid: 0, accountid: DEMO_IDS.ACC_SAVINGS, categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS, transferaccountid: null, transferid: null },
        { id: GenerateUuid(), name: "Opening Balance", amount: -2000, date: openingDate.toISOString(), description: "Initial balance", payee: null, notes: null, tags: null, type: "Initial", isvoid: 0, accountid: DEMO_IDS.ACC_CREDIT, categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS, transferaccountid: null, transferid: null },
        { id: GenerateUuid(), name: "Opening Balance", amount: 200, date: openingDate.toISOString(), description: "Initial balance", payee: null, notes: null, tags: null, type: "Initial", isvoid: 0, accountid: DEMO_IDS.ACC_CASH, categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS, transferaccountid: null, transferid: null }
    );

    // Generate monthly recurring transactions over 24 months
    for (let month = 0; month < 24; month++) {
        const monthDate = new Date(twoYearsAgo);
        monthDate.setMonth(monthDate.getMonth() + month);

        // Salary (15th of each month)
        const salaryDate = new Date(monthDate);
        salaryDate.setDate(15);
        if (salaryDate <= today) {
            transactions.push({
                id: GenerateUuid(),
                name: "Salary",
                amount: 5000 + Math.random() * 500,
                date: salaryDate.toISOString(),
                description: "Monthly salary",
                payee: "Employer Inc.",
                notes: null,
                tags: JSON.stringify(["income", "salary"]),
                type: "Income",
                isvoid: 0,
                accountid: DEMO_IDS.ACC_CHECKING,
                categoryid: DEMO_IDS.TXCAT_SALARY,
                transferaccountid: null,
                transferid: null,
            });
        }

        // Rent (1st of each month)
        const rentDate = new Date(monthDate);
        rentDate.setDate(1);
        if (rentDate <= today) {
            transactions.push({
                id: GenerateUuid(),
                name: "Rent",
                amount: -1500,
                date: rentDate.toISOString(),
                description: "Monthly rent",
                payee: "Landlord",
                notes: null,
                tags: JSON.stringify(["bills", "housing"]),
                type: "Expense",
                isvoid: 0,
                accountid: DEMO_IDS.ACC_CHECKING,
                categoryid: DEMO_IDS.TXCAT_RENT,
                transferaccountid: null,
                transferid: null,
            });
        }

        // Electricity (5th of each month)
        const elecDate = new Date(monthDate);
        elecDate.setDate(5);
        if (elecDate <= today) {
            transactions.push({
                id: GenerateUuid(),
                name: "Electric Bill",
                amount: -(80 + Math.random() * 60),
                date: elecDate.toISOString(),
                description: "Monthly electricity",
                payee: "Power Company",
                notes: null,
                tags: JSON.stringify(["bills", "utilities"]),
                type: "Expense",
                isvoid: 0,
                accountid: DEMO_IDS.ACC_CHECKING,
                categoryid: DEMO_IDS.TXCAT_ELECTRICITY,
                transferaccountid: null,
                transferid: null,
            });
        }

        // Weekly groceries (4 per month)
        for (let week = 0; week < 4; week++) {
            const groceryDate = new Date(monthDate);
            groceryDate.setDate(7 + week * 7);
            if (groceryDate <= today) {
                transactions.push({
                    id: GenerateUuid(),
                    name: "Groceries",
                    amount: -(100 + Math.random() * 100),
                    date: groceryDate.toISOString(),
                    description: "Weekly groceries",
                    payee: "Grocery Store",
                    notes: null,
                    tags: JSON.stringify(["food", "groceries"]),
                    type: "Expense",
                    isvoid: 0,
                    accountid: DEMO_IDS.ACC_CREDIT,
                    categoryid: DEMO_IDS.TXCAT_GROCERIES,
                    transferaccountid: null,
                    transferid: null,
                });
            }
        }

        // Credit card payment (20th of each month)
        const ccPayDate = new Date(monthDate);
        ccPayDate.setDate(20);
        if (ccPayDate <= today) {
            const txId1 = GenerateUuid();
            const txId2 = GenerateUuid();
            transactions.push(
                {
                    id: txId1,
                    name: "CC Payment",
                    amount: -500,
                    date: ccPayDate.toISOString(),
                    description: "Credit card payment",
                    payee: null,
                    notes: null,
                    tags: null,
                    type: "Transfer",
                    isvoid: 0,
                    accountid: DEMO_IDS.ACC_CHECKING,
                    categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS,
                    transferaccountid: DEMO_IDS.ACC_CREDIT,
                    transferid: txId2,
                },
                {
                    id: txId2,
                    name: "CC Payment",
                    amount: 500,
                    date: ccPayDate.toISOString(),
                    description: "Credit card payment",
                    payee: null,
                    notes: null,
                    tags: null,
                    type: "Transfer",
                    isvoid: 0,
                    accountid: DEMO_IDS.ACC_CREDIT,
                    categoryid: DEMO_IDS.TXCAT_ACCOUNT_OPS,
                    transferaccountid: DEMO_IDS.ACC_CHECKING,
                    transferid: txId1,
                }
            );
        }
    }

    return transactions;
};

/**
 * Seed the SQLite database with demo data
 */
export const seedSqliteDemoDB = async (): Promise<void> => {
    // Check localStorage flag first
    if (isDemoSeeded()) {
        console.log("Demo database already seeded (localStorage flag), skipping...");
        return;
    }

    console.log("Seeding SQLite demo database...");
    const db = await getSqliteDB();
    const now = getCurrentTimestamp();
    const tenantId = SQLITE_DEMO_TENANT_ID;
    const userId = SQLITE_DEMO_USER_ID;

    try {
        // Temporarily disable foreign keys to avoid circular reference issues with transfer transactions
        await db.execAsync("PRAGMA foreign_keys = OFF;");
        // Seed Transaction Groups
        const transactionGroupsData = [
            { id: DEMO_IDS.GROUP_ENTERTAINMENT, name: "Entertainment", type: "Expense", color: "error-100", icon: "Drama" },
            { id: DEMO_IDS.GROUP_BILLS, name: "Bills", type: "Expense", color: "error-100", icon: "Plug" },
            { id: DEMO_IDS.GROUP_HOUSEHOLD, name: "Household", type: "Expense", color: "error-100", icon: "House" },
            { id: DEMO_IDS.GROUP_EMPLOYER, name: "Employer", type: "Income", color: "error-100", icon: "BriefcaseBusiness" },
            { id: DEMO_IDS.GROUP_OTHER, name: "Other", type: "Expense", color: "error-100", icon: "Ellipsis" },
            { id: DEMO_IDS.GROUP_ACCOUNTS, name: "Accounts", type: "Adjustment", color: "error-100", icon: "UserPen" },
            { id: DEMO_IDS.GROUP_CAR, name: "Car", type: "Expense", color: "error-100", icon: "Car" },
            { id: DEMO_IDS.GROUP_GROCERIES, name: "Groceries", type: "Expense", color: "error-100", icon: "ShoppingCart" },
        ];

        console.log("Seeding Transaction Groups...");
        for (const group of transactionGroupsData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.TransactionGroups} 
         (id, name, type, color, icon, displayorder, budgetamount, budgetfrequency, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, 0, 0, 'monthly', ?, 0, ?, ?, ?)`,
                [group.id, group.name, group.type, group.color, group.icon, tenantId, now, userId, now]
            );
        }

        // Seed Account Categories
        const accountCategoriesData = [
            { id: DEMO_IDS.CAT_BANK, name: "Bank", type: "Asset", color: "error-100", icon: "PiggyBank", displayorder: 1000 },
            { id: DEMO_IDS.CAT_DEBIT, name: "Debit Card", type: "Asset", color: "error-100", icon: "Banknote", displayorder: 2000 },
            { id: DEMO_IDS.CAT_CREDIT, name: "Credit Card", type: "Liability", color: "error-100", icon: "CreditCard", displayorder: 3000 },
            { id: DEMO_IDS.CAT_CASH, name: "Cash", type: "Asset", color: "error-100", icon: "Banknote", displayorder: 4000 },
            { id: DEMO_IDS.CAT_GIFT, name: "Gift Card", type: "Asset", color: "error-100", icon: "WalletCards", displayorder: 5000 },
            { id: DEMO_IDS.CAT_LOAN, name: "Loan", type: "Liability", color: "error-100", icon: "Landmark", displayorder: 6000 },
        ];

        console.log("Seeding Account Categories...");
        for (const cat of accountCategoriesData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.AccountCategories} 
         (id, name, type, color, icon, displayorder, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [cat.id, cat.name, cat.type, cat.color, cat.icon, cat.displayorder, tenantId, now, userId, now]
            );
        }

        // Seed Transaction Categories (subset for demo)
        const transactionCategoriesData = [
            { id: DEMO_IDS.TXCAT_ACCOUNT_OPS, name: "Account Operations", groupid: DEMO_IDS.GROUP_ACCOUNTS, type: "Adjustment", color: "UserPen", icon: "Wallet" },
            { id: DEMO_IDS.TXCAT_SALARY, name: "Salary", groupid: DEMO_IDS.GROUP_EMPLOYER, type: "Income", color: "BriefcaseBusiness", icon: "BriefcaseBusiness" },
            { id: DEMO_IDS.TXCAT_GROCERIES, name: "Groceries", groupid: DEMO_IDS.GROUP_GROCERIES, type: "Expense", color: "ShoppingCart", icon: "ShoppingCart" },
            { id: DEMO_IDS.TXCAT_RENT, name: "Rent", groupid: DEMO_IDS.GROUP_BILLS, type: "Expense", color: "Plug", icon: "House" },
            { id: DEMO_IDS.TXCAT_ELECTRICITY, name: "Electricity", groupid: DEMO_IDS.GROUP_BILLS, type: "Expense", color: "Plug", icon: "PlugZap" },
            { id: DEMO_IDS.TXCAT_FUEL, name: "Fuel", groupid: DEMO_IDS.GROUP_CAR, type: "Expense", color: "Car", icon: "Fuel" },
            { id: DEMO_IDS.TXCAT_DINING, name: "Dining Out", groupid: DEMO_IDS.GROUP_ENTERTAINMENT, type: "Expense", color: "Drama", icon: "Pizza" },
        ];

        console.log("Seeding Transaction Categories...");
        for (const cat of transactionCategoriesData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.TransactionCategories} 
         (id, name, groupid, type, color, icon, displayorder, budgetamount, budgetfrequency, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'monthly', ?, 0, ?, ?, ?)`,
                [cat.id, cat.name, cat.groupid, cat.type, cat.color, cat.icon, tenantId, now, userId, now]
            );
        }

        // Seed Configurations
        console.log("Seeding Configurations...");
        await db.runAsync(
            `INSERT OR IGNORE INTO ${TableNames.Configurations} 
       (id, key, value, type, "table", tenantid, isdeleted, createdat, createdby, updatedat) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
            [GenerateUuid(), "id", DEMO_IDS.TXCAT_ACCOUNT_OPS, ConfigurationTypes.AccountOpertationsCategory, TableNames.TransactionCategories, tenantId, now, userId, now]
        );

        // Generate transactions first to calculate balances
        const transactions = generateDemoTransactions();

        // Calculate account balances
        const calculateBalance = (accountId: string) =>
            transactions.filter((t) => t.accountid === accountId).reduce((sum, t) => sum + t.amount, 0);

        // Seed Accounts
        const accountsData = [
            { id: DEMO_IDS.ACC_CHECKING, name: "Primary Checking", balance: calculateBalance(DEMO_IDS.ACC_CHECKING), categoryid: DEMO_IDS.CAT_BANK, color: "info-500", icon: "Wallet" },
            { id: DEMO_IDS.ACC_SAVINGS, name: "Savings Account", balance: calculateBalance(DEMO_IDS.ACC_SAVINGS), categoryid: DEMO_IDS.CAT_BANK, color: "green-500", icon: "PiggyBank" },
            { id: DEMO_IDS.ACC_CREDIT, name: "Rewards Credit Card", balance: calculateBalance(DEMO_IDS.ACC_CREDIT), categoryid: DEMO_IDS.CAT_CREDIT, color: "warning-500", icon: "CreditCard" },
            { id: DEMO_IDS.ACC_CASH, name: "Cash Wallet", balance: calculateBalance(DEMO_IDS.ACC_CASH), categoryid: DEMO_IDS.CAT_CASH, color: "amber-500", icon: "Banknote" },
        ];

        console.log("Seeding Accounts...");
        for (const acc of accountsData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.Accounts} 
         (id, name, balance, currency, color, icon, displayorder, categoryid, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, 'USD', ?, ?, 0, ?, ?, 0, ?, ?, ?)`,
                [acc.id, acc.name, acc.balance, acc.color, acc.icon, acc.categoryid, tenantId, now, userId, now]
            );
        }

        // Seed Transactions
        console.log(`Seeding ${transactions.length} Transactions...`);
        for (const txn of transactions) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.Transactions} 
         (id, name, amount, date, description, payee, notes, tags, type, isvoid, accountid, categoryid, transferaccountid, transferid, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [txn.id, txn.name, txn.amount, txn.date, txn.description, txn.payee, txn.notes, txn.tags, txn.type, txn.isvoid, txn.accountid, txn.categoryid, txn.transferaccountid, txn.transferid, tenantId, now, userId, now]
            );
        }

        // Re-enable foreign keys
        await db.execAsync("PRAGMA foreign_keys = ON;");

        // Set the seeded flag
        setDemoSeededFlag(true);
        console.log("SQLite demo database seeded successfully!");
    } catch (error) {
        // Re-enable foreign keys even on error
        try {
            await db.execAsync("PRAGMA foreign_keys = ON;");
        } catch { }
        console.error("Failed to seed SQLite demo database:", error);
        throw error;
    }
};

export default {
    seedSqliteDemoDB,
    isDemoSeeded,
    setDemoSeededFlag,
};
