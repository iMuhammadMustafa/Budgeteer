import { sqliteTable, text, integer, real, AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Enum constants matching Supabase enums
export const AccountTypes = {
  Asset: "Asset",
  Liability: "Liability",
} as const;

export const TransactionTypes = {
  Expense: "Expense",
  Income: "Income",
  Transfer: "Transfer",
  Adjustment: "Adjustment",
  Initial: "Initial",
  Refund: "Refund",
} as const;

export const TransactionStatuses = {
  Clear: "Clear",
  Void: "Void",
} as const;

// Account Categories table
export const accountCategories = sqliteTable("accountcategories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Asset | Liability
  color: text("color").default("info-100"),
  icon: text("icon").default(""),
  displayorder: integer("displayorder").default(0),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Accounts table
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryid: text("categoryid")
    .notNull()
    .references(() => accountCategories.id),
  balance: real("balance").default(0),
  currency: text("currency").default("USD"),
  color: text("color").default("info-100"),
  icon: text("icon").default(""),
  description: text("description"),
  notes: text("notes"),
  owner: text("owner"),
  displayorder: integer("displayorder").default(0),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Transaction Groups table
export const transactionGroups = sqliteTable("transactiongroups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Expense | Income | Transfer | Adjustment | Initial | Refund
  color: text("color").default("info-100"),
  icon: text("icon").default(""),
  description: text("description"),
  displayorder: integer("displayorder").default(0),
  budgetamount: real("budgetamount").default(0),
  budgetfrequency: text("budgetfrequency").default("Monthly"),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Transaction Categories table
export const transactionCategories = sqliteTable("transactioncategories", {
  id: text("id").primaryKey(),
  name: text("name"),
  groupid: text("groupid")
    .notNull()
    .references(() => transactionGroups.id),
  type: text("type").notNull(), // Expense | Income | Transfer | Adjustment | Initial | Refund
  color: text("color").default("info-100"),
  icon: text("icon").default(""),
  description: text("description"),
  displayorder: integer("displayorder").default(0),
  budgetamount: real("budgetamount").default(0),
  budgetfrequency: text("budgetfrequency").default("Monthly"),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  name: text("name"),
  accountid: text("accountid")
    .notNull()
    .references(() => accounts.id),
  categoryid: text("categoryid")
    .notNull()
    .references(() => transactionCategories.id),
  amount: real("amount").default(0),
  date: text("date").notNull(),
  description: text("description"),
  payee: text("payee"),
  notes: text("notes"),
  tags: text("tags"), // JSON string array
  type: text("type").notNull(), // Expense | Income | Transfer | Adjustment | Initial | Refund
  transferaccountid: text("transferaccountid").references(() => accounts.id),
  transferid: text("transferid").references((): AnySQLiteColumn => transactions.id), // Self-reference
  isvoid: integer("isvoid", { mode: "boolean" }).default(false),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Configurations table
export const configurations = sqliteTable("configurations", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  type: text("type").notNull(),
  table: text("table").notNull(),
  tenantid: text("tenantid"),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat").notNull(),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Recurrings table
export const recurrings = sqliteTable("recurrings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sourceaccountid: text("sourceaccountid")
    .notNull()
    .references(() => accounts.id),
  categoryid: text("categoryid").references(() => transactionCategories.id),
  amount: real("amount"),
  type: text("type").notNull(), // Expense | Income | Transfer | Adjustment | Initial | Refund
  description: text("description"),
  payeename: text("payeename"),
  notes: text("notes"),
  currencycode: text("currencycode").default("USD"),
  recurrencerule: text("recurrencerule").notNull(),
  nextoccurrencedate: text("nextoccurrencedate").notNull(),
  enddate: text("enddate"),
  lastexecutedat: text("lastexecutedat"),
  isactive: integer("isactive", { mode: "boolean" }).default(true),
  tenantid: text("tenantid").notNull(),
  isdeleted: integer("isdeleted", { mode: "boolean" }).default(false),
  createdat: text("createdat"),
  createdby: text("createdby"),
  updatedat: text("updatedat"),
  updatedby: text("updatedby"),
});

// Profiles table (for user management)
export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email"),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  timezone: text("timezone"),
  tenantid: text("tenantid"),
  updated_at: text("updated_at"),
});

// Export inferred types for compatibility with existing interfaces
export type SQLiteAccountCategory = typeof accountCategories.$inferSelect;
export type SQLiteAccountCategoryInsert = typeof accountCategories.$inferInsert;
export type SQLiteAccountCategoryUpdate = Partial<SQLiteAccountCategoryInsert>;

export type SQLiteAccount = typeof accounts.$inferSelect;
export type SQLiteAccountInsert = typeof accounts.$inferInsert;
export type SQLiteAccountUpdate = Partial<SQLiteAccountInsert>;

export type SQLiteTransactionGroup = typeof transactionGroups.$inferSelect;
export type SQLiteTransactionGroupInsert = typeof transactionGroups.$inferInsert;
export type SQLiteTransactionGroupUpdate = Partial<SQLiteTransactionGroupInsert>;

export type SQLiteTransactionCategory = typeof transactionCategories.$inferSelect;
export type SQLiteTransactionCategoryInsert = typeof transactionCategories.$inferInsert;
export type SQLiteTransactionCategoryUpdate = Partial<SQLiteTransactionCategoryInsert>;

export type SQLiteTransaction = typeof transactions.$inferSelect;
export type SQLiteTransactionInsert = typeof transactions.$inferInsert;
export type SQLiteTransactionUpdate = Partial<SQLiteTransactionInsert>;

export type SQLiteConfiguration = typeof configurations.$inferSelect;
export type SQLiteConfigurationInsert = typeof configurations.$inferInsert;
export type SQLiteConfigurationUpdate = Partial<SQLiteConfigurationInsert>;

export type SQLiteRecurring = typeof recurrings.$inferSelect;
export type SQLiteRecurringInsert = typeof recurrings.$inferInsert;
export type SQLiteRecurringUpdate = Partial<SQLiteRecurringInsert>;

export type SQLiteProfile = typeof profiles.$inferSelect;
export type SQLiteProfileInsert = typeof profiles.$inferInsert;
export type SQLiteProfileUpdate = Partial<SQLiteProfileInsert>;

// Type aliases for compatibility with existing code
export type AccountCategory = SQLiteAccountCategory;
export type AccountCategoryInsert = SQLiteAccountCategoryInsert;
export type AccountCategoryUpdate = SQLiteAccountCategoryUpdate;

export type Account = SQLiteAccount;
export type AccountInsert = SQLiteAccountInsert;
export type AccountUpdate = SQLiteAccountUpdate;

export type TransactionGroup = SQLiteTransactionGroup;
export type TransactionGroupInsert = SQLiteTransactionGroupInsert;
export type TransactionGroupUpdate = SQLiteTransactionGroupUpdate;

export type TransactionCategory = SQLiteTransactionCategory;
export type TransactionCategoryInsert = SQLiteTransactionCategoryInsert;
export type TransactionCategoryUpdate = SQLiteTransactionCategoryUpdate;

export type Transaction = SQLiteTransaction;
export type TransactionInsert = SQLiteTransactionInsert;
export type TransactionUpdate = SQLiteTransactionUpdate;

export type Configuration = SQLiteConfiguration;
export type ConfigurationInsert = SQLiteConfigurationInsert;
export type ConfigurationUpdate = SQLiteConfigurationUpdate;

export type Recurring = SQLiteRecurring;
export type RecurringInsert = SQLiteRecurringInsert;
export type RecurringUpdate = SQLiteRecurringUpdate;

export type Profile = SQLiteProfile;
export type ProfileInsert = SQLiteProfileInsert;
export type ProfileUpdate = SQLiteProfileUpdate;

// Relations
export const accountCategoriesRelations = relations(accountCategories, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  category: one(accountCategories, {
    fields: [accounts.categoryid],
    references: [accountCategories.id],
  }),
  transactions: many(transactions, { relationName: "accountTransactions" }),
  transferTransactions: many(transactions, { relationName: "transferAccountTransactions" }),
  recurrings: many(recurrings),
}));

export const transactionGroupsRelations = relations(transactionGroups, ({ many }) => ({
  categories: many(transactionCategories),
}));

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
  group: one(transactionGroups, {
    fields: [transactionCategories.groupid],
    references: [transactionGroups.id],
  }),
  transactions: many(transactions),
  recurrings: many(recurrings),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountid],
    references: [accounts.id],
    relationName: "accountTransactions",
  }),
  category: one(transactionCategories, {
    fields: [transactions.categoryid],
    references: [transactionCategories.id],
  }),
  transferAccount: one(accounts, {
    fields: [transactions.transferaccountid],
    references: [accounts.id],
    relationName: "transferAccountTransactions",
  }),
  transferTransaction: one(transactions, {
    fields: [transactions.transferid],
    references: [transactions.id],
    relationName: "transferRelation",
  }),
  linkedTransaction: one(transactions, {
    fields: [transactions.id],
    references: [transactions.transferid],
    relationName: "transferRelation",
  }),
}));

export const recurringsRelations = relations(recurrings, ({ one }) => ({
  sourceAccount: one(accounts, {
    fields: [recurrings.sourceaccountid],
    references: [accounts.id],
  }),
  category: one(transactionCategories, {
    fields: [recurrings.categoryid],
    references: [transactionCategories.id],
  }),
}));
