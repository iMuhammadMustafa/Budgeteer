import { ConfigurationTypes } from "../Config.Types";
import { TableNames } from "../TableNames";
import {
    SQLITE_DEFAULT_TENANT_ID,
    SQLITE_DEFAULT_USER_ID,
    SQLITE_SEEDING_FLAGS,
    getCurrentTimestamp,
} from "./constants";
import { getSqliteDB } from "./index";

/**
 * Seed data for transaction groups
 */
const transactionGroupsData = [
    {
        id: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
        name: "Entertainment",
        type: "Expense",
        color: "error-100",
        icon: "Drama",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
        name: "Bills",
        type: "Expense",
        color: "error-100",
        icon: "Plug",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
        name: "Household",
        type: "Expense",
        color: "error-100",
        icon: "House",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
        name: "Employer",
        type: "Income",
        color: "error-100",
        icon: "BriefcaseBusiness",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8",
        name: "Other",
        type: "Expense",
        color: "error-100",
        icon: "Ellipsis",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
        name: "Accounts",
        type: "Adjustment",
        color: "error-100",
        icon: "UserPen",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "56f8e908-644e-4767-bff9-1f37baf49fe4",
        name: "Car",
        type: "Expense",
        color: "error-100",
        icon: "Car",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
    {
        id: "046e648c-123f-462c-908b-d1e0831e6a11",
        name: "Groceries",
        type: "Expense",
        color: "error-100",
        icon: "ShoppingCart",
        description: null,
        displayorder: 0,
        budgetamount: 0,
        budgetfrequency: "monthly",
    },
];

/**
 * Seed data for transaction categories
 */
const transactionCategoriesData = [
    { id: "55485de3-113a-42fa-a9a8-68f151b5d233", name: "Other", groupid: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8", type: "Expense", color: "Ellipsis", icon: "Ellipsis" },
    { id: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f", name: "Clothing", groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da", type: "Expense", color: "House", icon: "Shirt" },
    { id: "43697723-bb6f-4edc-abe7-ea7540595df7", name: "Medicine", groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da", type: "Expense", color: "House", icon: "HeartPulse" },
    { id: "4f036417-a86c-4335-813e-b65e7a3cb909", name: "Home Improvement", groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da", type: "Expense", color: "House", icon: "HousePlus" },
    { id: "4be2ba14-f8aa-4480-b88e-128ab06002ef", name: "Fuel", groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4", type: "Expense", color: "Car", icon: "Fuel" },
    { id: "5b2bd8af-f00c-429d-8351-c42c4c8db97f", name: "Car Insurance", groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4", type: "Expense", color: "Car", icon: "Shield" },
    { id: "f32d9c15-c407-46e3-8f3c-99b6859a64b1", name: "Dining Out", groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb", type: "Expense", color: "Drama", icon: "Pizza" },
    { id: "e4211cd6-2485-4728-b646-d47b790d5c78", name: "Games", groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb", type: "Expense", color: "Drama", icon: "Gamepad2" },
    { id: "34170969-aab7-41aa-b0c1-f1ecd4229c8d", name: "Sweets and Candy", groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb", type: "Expense", color: "Drama", icon: "Lollipop" },
    { id: "ef228637-4334-4d7d-8697-84dd19b1e173", name: "Rent", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "House" },
    { id: "aad62461-d513-42ed-a478-ddcc8039a349", name: "Phone", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "Phone" },
    { id: "9031526c-8069-4110-be4b-2b9c14ccb3ea", name: "Medical Insurance", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "BriefcaseMedical" },
    { id: "36e65ba3-0b60-4a25-a025-188f08dee904", name: "Phone", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "Smartphone" },
    { id: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca", name: "Electricity", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "PlugZap" },
    { id: "5477212e-8409-44bf-8550-5a5fcdea0c32", name: "Student Loan", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "School" },
    { id: "6ffe01d0-e0bf-45da-8384-3c167b6794b0", name: "Water", groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", type: "Expense", color: "Plug", icon: "Droplets" },
    { id: "8be7e399-75fb-4da0-b043-3b7d7e0082ea", name: "Salary", groupid: "a9cfa027-8f5c-489a-8b93-f9b4f5735044", type: "Income", color: "BriefcaseBusiness", icon: "BriefcaseBusiness" },
    { id: "6b06d9fe-b1d3-43b9-81cc-39a986b04380", name: "Bonus", groupid: "a9cfa027-8f5c-489a-8b93-f9b4f5735044", type: "Income", color: "BriefcaseBusiness", icon: "Star" },
    { id: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9", name: "Account Operations", groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b", type: "Adjustment", color: "UserPen", icon: "Wallet" },
    { id: "4b6f723e-dbc5-421d-b69d-6b9a503e23fe", name: "Refund", groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b", type: "Adjustment", color: "UserPen", icon: "TicketSlash" },
    { id: "3e086e05-2998-400a-9574-7ef562c4354e", name: "Car Maintenance", groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4", type: "Expense", color: "Car", icon: "Wrench" },
    { id: "775793ad-2dce-4d95-b2f5-afeea47c7bc9", name: "Food", groupid: "046e648c-123f-462c-908b-d1e0831e6a11", type: "Expense", color: "ShoppingCart", icon: "Utensils" },
    { id: "fa748d7a-072e-4268-82ad-40f7bfdae1ab", name: "Fruit", groupid: "046e648c-123f-462c-908b-d1e0831e6a11", type: "Expense", color: "ShoppingCart", icon: "Apple" },
    { id: "61484698-2405-4b17-8e14-71a43a3f91e5", name: "Groceries", groupid: "046e648c-123f-462c-908b-d1e0831e6a11", type: "Expense", color: "ShoppingCart", icon: "ShoppingCart" },
    { id: "efd3c86c-6266-4b9f-a585-d02f02e8d27d", name: "Snacks", groupid: "046e648c-123f-462c-908b-d1e0831e6a11", type: "Expense", color: "Drama", icon: "Donut" },
];

/**
 * Seed data for account categories
 */
const accountCategoriesData = [
    { id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", name: "Bank", type: "Asset", color: "error-100", icon: "PiggyBank", displayorder: 1000 },
    { id: "b717a537-78a2-4a78-8da9-2598faca1cec", name: "Debit Card", type: "Asset", color: "error-100", icon: "Banknote", displayorder: 2000 },
    { id: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699", name: "Credit Card", type: "Liability", color: "error-100", icon: "CreditCard", displayorder: 3000 },
    { id: "5d192f78-41e8-413c-9457-c9d68f9decf1", name: "Cash", type: "Asset", color: "error-100", icon: "Banknote", displayorder: 4000 },
    { id: "d9833b85-1523-4a01-8c82-10fbe3c1ad18", name: "Gift Card", type: "Asset", color: "error-100", icon: "WalletCards", displayorder: 5000 },
    { id: "bbefb010-bcf9-4552-b41f-c4c3053b4357", name: "Loan", type: "Liability", color: "error-100", icon: "Landmark", displayorder: 6000 },
];

/**
 * Seed data for configurations
 */
const configurationsData = [
    {
        id: "f2d4f7f6-0e2c-4e5d-9d7f-6c4a3e1b28c3",
        table: TableNames.TransactionCategories,
        type: ConfigurationTypes.AccountOpertationsCategory,
        key: "id",
        value: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    },
    {
        id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
        table: TableNames.TransactionCategories,
        type: "Other",
        key: "id",
        value: "55485de3-113a-42fa-a9a8-68f151b5d233",
    },
];

/**
 * Check if the database has been seeded using localStorage flag
 */
export const isLocalSeeded = (): boolean => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(SQLITE_SEEDING_FLAGS.LOCAL_SEEDED) === "true";
};

/**
 * Set the seeded flag in localStorage
 */
export const setLocalSeededFlag = (seeded: boolean): void => {
    if (typeof localStorage === "undefined") return;
    if (seeded) {
        localStorage.setItem(SQLITE_SEEDING_FLAGS.LOCAL_SEEDED, "true");
    } else {
        localStorage.removeItem(SQLITE_SEEDING_FLAGS.LOCAL_SEEDED);
    }
};

/**
 * Seed the SQLite database with initial data for Local mode
 */
export const seedSqliteDB = async (): Promise<void> => {
    // Check localStorage flag first
    if (isLocalSeeded()) {
        console.log("Database already seeded (localStorage flag), skipping...");
        return;
    }

    console.log("Seeding SQLite database...");
    const db = await getSqliteDB();
    const now = getCurrentTimestamp();
    const tenantId = SQLITE_DEFAULT_TENANT_ID;
    const userId = SQLITE_DEFAULT_USER_ID;

    try {
        // Seed Transaction Groups
        console.log("Seeding Transaction Groups...");
        for (const group of transactionGroupsData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.TransactionGroups} 
         (id, name, type, color, icon, description, displayorder, budgetamount, budgetfrequency, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [group.id, group.name, group.type, group.color, group.icon, group.description, group.displayorder, group.budgetamount, group.budgetfrequency, tenantId, now, userId, now]
            );
        }

        // Seed Account Categories
        console.log("Seeding Account Categories...");
        for (const category of accountCategoriesData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.AccountCategories} 
         (id, name, type, color, icon, displayorder, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [category.id, category.name, category.type, category.color, category.icon, category.displayorder, tenantId, now, userId, now]
            );
        }

        // Seed Transaction Categories
        console.log("Seeding Transaction Categories...");
        for (const category of transactionCategoriesData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.TransactionCategories} 
         (id, name, groupid, type, color, icon, displayorder, budgetamount, budgetfrequency, tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'monthly', ?, 0, ?, ?, ?)`,
                [category.id, category.name, category.groupid, category.type, category.color, category.icon, tenantId, now, userId, now]
            );
        }

        // Seed Configurations
        console.log("Seeding Configurations...");
        for (const config of configurationsData) {
            await db.runAsync(
                `INSERT OR IGNORE INTO ${TableNames.Configurations} 
         (id, key, value, type, "table", tenantid, isdeleted, createdat, createdby, updatedat) 
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
                [config.id, config.key, config.value, config.type, config.table, tenantId, now, userId, now]
            );
        }

        // Set the seeded flag
        setLocalSeededFlag(true);
        console.log("SQLite database seeded successfully!");
    } catch (error) {
        console.error("Failed to seed SQLite database:", error);
        throw error;
    }
};

export default {
    seedSqliteDB,
    isLocalSeeded,
    setLocalSeededFlag,
};
