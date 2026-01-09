import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// =====================================
// Helper Types
// =====================================

// Enum values (stored as text in SQLite, native enums in Postgres)
export const ACCOUNT_TYPES = ["Asset", "Liability"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = ["Expense", "Income", "Transfer", "Adjustment", "Initial", "Refund"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const RECURRING_TYPES = ["Standard", "Transfer", "CreditCardPayment"] as const;
export type RecurringType = (typeof RECURRING_TYPES)[number];

// =====================================
// Tables
// =====================================

/**
 * Account Categories (e.g., Checking, Savings, Credit Cards)
 */
export const accountCategories = sqliteTable("accountcategories", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").$type<AccountType>().notNull().default("Asset"),
    displayorder: integer("displayorder").notNull().default(0),
    icon: text("icon").notNull().default("Ellipsis"),
    color: text("color").notNull().default("warning-100"),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Accounts (individual bank accounts, credit cards, etc.)
 */
export const accounts = sqliteTable("accounts", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    balance: real("balance").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    owner: text("owner"),
    description: text("description"),
    notes: text("notes"),
    icon: text("icon").notNull().default("Ellipsis"),
    color: text("color").notNull().default("warning-100"),
    displayorder: integer("displayorder").notNull().default(0),
    statementdate: integer("statementdate"),

    categoryid: text("categoryid").notNull().references(() => accountCategories.id),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Transaction Groups (high-level categories like Food, Entertainment)
 */
export const transactionGroups = sqliteTable("transactiongroups", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").$type<TransactionType>().notNull().default("Expense"),
    budgetamount: real("budgetamount").notNull().default(0),
    budgetfrequency: text("budgetfrequency").notNull().default("Monthly"),
    icon: text("icon").notNull().default("Ellipsis"),
    color: text("color").notNull().default("warning-100"),
    displayorder: integer("displayorder").notNull().default(0),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Transaction Categories (sub-categories like Groceries, Dining Out)
 */
export const transactionCategories = sqliteTable("transactioncategories", {
    id: text("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    type: text("type").$type<TransactionType>().notNull().default("Expense"),
    budgetamount: real("budgetamount").notNull().default(0),
    budgetfrequency: text("budgetfrequency").notNull().default("Monthly"),
    icon: text("icon").notNull().default("Ellipsis"),
    color: text("color").notNull().default("warning-100"),
    displayorder: integer("displayorder").notNull().default(0),

    groupid: text("groupid").notNull().references(() => transactionGroups.id),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Transactions
 */
export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey(),
    name: text("name"),
    date: text("date").notNull(),
    amount: real("amount").notNull().default(0),
    type: text("type").$type<TransactionType>().notNull().default("Expense"),
    payee: text("payee"),
    description: text("description"),
    notes: text("notes"),
    tags: text("tags"), // JSON-serialized array in SQLite
    isvoid: integer("isvoid", { mode: "boolean" }).notNull().default(false),

    categoryid: text("categoryid").notNull().references(() => transactionCategories.id),
    accountid: text("accountid").notNull().references(() => accounts.id),
    transferid: text("transferid"),
    transferaccountid: text("transferaccountid").references(() => accounts.id),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Configurations (app settings)
 */
export const configurations = sqliteTable("configurations", {
    id: text("id").primaryKey(),
    tablename: text("tablename").notNull(),
    type: text("type").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),

    tenantid: text("tenantid"),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").notNull().default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Recurring Transactions
 */
export const recurrings = sqliteTable("recurrings", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").$type<TransactionType>().notNull().default("Expense"),
    recurringtype: text("recurringtype").$type<RecurringType>(),
    amount: real("amount"),
    currencycode: text("currencycode").notNull().default("USD"),

    recurrencerule: text("recurrencerule").notNull(),
    nextoccurrencedate: text("nextoccurrencedate"),
    enddate: text("enddate"),
    intervalmonths: integer("intervalmonths"),

    isactive: integer("isactive", { mode: "boolean" }).notNull().default(true),
    isamountflexible: integer("isamountflexible", { mode: "boolean" }).notNull().default(false),
    isdateflexible: integer("isdateflexible", { mode: "boolean" }).notNull().default(false),
    autoapplyenabled: integer("autoapplyenabled", { mode: "boolean" }),

    lastexecutedat: text("lastexecutedat"),
    lastautoappliedat: text("lastautoappliedat"),
    failedattempts: integer("failedattempts"),
    maxfailedattempts: integer("maxfailedattempts"),

    payeename: text("payeename"),
    notes: text("notes"),

    sourceaccountid: text("sourceaccountid").notNull().references(() => accounts.id),
    categoryid: text("categoryid").notNull().references(() => transactionCategories.id),
    transferaccountid: text("transferaccountid").references(() => accounts.id),

    tenantid: text("tenantid").notNull(),
    isdeleted: integer("isdeleted", { mode: "boolean" }).notNull().default(false),
    createdat: text("createdat").default(sql`(datetime('now'))`),
    createdby: text("createdby"),
    updatedat: text("updatedat"),
    updatedby: text("updatedby"),
});

/**
 * Profiles (user profiles)
 */
export const profiles = sqliteTable("profiles", {
    id: text("id").primaryKey(),
    email: text("email"),
    full_name: text("full_name"),
    avatar_url: text("avatar_url"),
    timezone: text("timezone"),
    tenantid: text("tenantid"),
    updated_at: text("updated_at"),
});

// =====================================
// Type Exports for Repository Usage
// =====================================

export type AccountCategoryRow = typeof accountCategories.$inferSelect;
export type AccountCategoryInsert = typeof accountCategories.$inferInsert;

export type AccountRow = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;

export type TransactionGroupRow = typeof transactionGroups.$inferSelect;
export type TransactionGroupInsert = typeof transactionGroups.$inferInsert;

export type TransactionCategoryRow = typeof transactionCategories.$inferSelect;
export type TransactionCategoryInsert = typeof transactionCategories.$inferInsert;

export type TransactionRow = typeof transactions.$inferSelect;
export type TransactionInsert = typeof transactions.$inferInsert;

export type ConfigurationRow = typeof configurations.$inferSelect;
export type ConfigurationInsert = typeof configurations.$inferInsert;

export type RecurringRow = typeof recurrings.$inferSelect;
export type RecurringInsert = typeof recurrings.$inferInsert;

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
