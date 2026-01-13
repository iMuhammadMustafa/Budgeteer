import GenerateUuid from "@/src/utils/uuid.Helper";
import { getSqliteDb, isSqliteInitialized } from ".";
import { ConfigurationTypes } from "../Config.Types";
import { TableNames } from "../TableNames";
import { DEMO_TENANT_ID, DEMO_USER_ID, getNow, LOCAL_TENANT_ID, LOCAL_USER_ID } from "./constants";
import {
  accountCategories,
  accounts,
  configurations,
  transactionCategories,
  transactionGroups,
  transactions,
} from "./schema";

// =====================================
// Seed Data Arrays
// =====================================

const transactionGroupsData = [
  {
    id: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    name: "Entertainment",
    icon: "Drama",
    color: "error-100",
    type: "Expense",
  },
  { id: "235e6d59-5ecc-4ae3-a01f-83f3c395449c", name: "Bills", icon: "Plug", color: "error-100", type: "Expense" },
  { id: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da", name: "Household", icon: "House", color: "error-100", type: "Expense" },
  {
    id: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
    name: "Employer",
    icon: "BriefcaseBusiness",
    color: "error-100",
    type: "Income",
  },
  { id: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8", name: "Other", icon: "Ellipsis", color: "error-100", type: "Expense" },
  {
    id: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
    name: "Accounts",
    icon: "UserPen",
    color: "error-100",
    type: "Adjustment",
  },
  { id: "56f8e908-644e-4767-bff9-1f37baf49fe4", name: "Car", icon: "Car", color: "error-100", type: "Expense" },
  {
    id: "046e648c-123f-462c-908b-d1e0831e6a11",
    name: "Groceries",
    icon: "ShoppingCart",
    color: "error-100",
    type: "Expense",
  },
];

const transactionCategoriesData = [
  {
    id: "55485de3-113a-42fa-a9a8-68f151b5d233",
    name: "Other",
    icon: "Ellipsis",
    type: "Expense",
    groupid: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8",
  },
  {
    id: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f",
    name: "Clothing",
    icon: "Shirt",
    type: "Expense",
    groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
  },
  {
    id: "4be2ba14-f8aa-4480-b88e-128ab06002ef",
    name: "Fuel",
    icon: "Fuel",
    type: "Expense",
    groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4",
  },
  {
    id: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",
    name: "Dining Out",
    icon: "Pizza",
    type: "Expense",
    groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
  },
  {
    id: "e4211cd6-2485-4728-b646-d47b790d5c78",
    name: "Games",
    icon: "Gamepad2",
    type: "Expense",
    groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
  },
  {
    id: "ef228637-4334-4d7d-8697-84dd19b1e173",
    name: "Rent",
    icon: "House",
    type: "Expense",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
  },
  {
    id: "aad62461-d513-42ed-a478-ddcc8039a349",
    name: "Phone",
    icon: "Phone",
    type: "Expense",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
  },
  {
    id: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca",
    name: "Electricity",
    icon: "PlugZap",
    type: "Expense",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
  },
  {
    id: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
    name: "Salary",
    icon: "BriefcaseBusiness",
    type: "Income",
    groupid: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
  },
  {
    id: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    name: "Account Operations",
    icon: "Wallet",
    type: "Adjustment",
    groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
  },
  {
    id: "775793ad-2dce-4d95-b2f5-afeea47c7bc9",
    name: "Food",
    icon: "Utensils",
    type: "Expense",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
  },
  {
    id: "61484698-2405-4b17-8e14-71a43a3f91e5",
    name: "Groceries",
    icon: "ShoppingCart",
    type: "Expense",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
  },
];

const accountCategoriesData = [
  { id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", name: "Bank", type: "Asset", icon: "PiggyBank", displayorder: 1000 },
  {
    id: "b717a537-78a2-4a78-8da9-2598faca1cec",
    name: "Debit Card",
    type: "Asset",
    icon: "Banknote",
    displayorder: 2000,
  },
  {
    id: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    name: "Credit Card",
    type: "Liability",
    icon: "CreditCard",
    displayorder: 3000,
  },
  { id: "5d192f78-41e8-413c-9457-c9d68f9decf1", name: "Cash", type: "Asset", icon: "Banknote", displayorder: 4000 },
];

const accountsData = [
  {
    id: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    name: "Primary Checking",
    balance: 5000,
    categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    icon: "Wallet",
    color: "info-500",
  },
  {
    id: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
    name: "Savings Account",
    balance: 10000,
    categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    icon: "PiggyBank",
    color: "green-500",
  },
  {
    id: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    name: "Rewards Credit Card",
    balance: -1500,
    categoryid: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    icon: "CreditCard",
    color: "warning-500",
  },
  {
    id: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
    name: "Debit Card",
    balance: 2500,
    categoryid: "b717a537-78a2-4a78-8da9-2598faca1cec",
    icon: "Banknote",
    color: "primary-500",
  },
];

const configurationsData = [
  {
    id: "f2d4f7f6-0e2c-4e5d-9d7f-6c4a3e1b28c3",
    tablename: TableNames.TransactionCategories,
    type: ConfigurationTypes.AccountOpertationsCategory,
    key: "id",
    value: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
  },
  {
    id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    tablename: TableNames.TransactionCategories,
    type: "Other",
    key: "id",
    value: "55485de3-113a-42fa-a9a8-68f151b5d233",
  },
];

// Generate sample transactions for the past year
const generateTransactionsData = () => {
  const txns: any[] = [];
  const now = new Date();

  // Initial balance transactions
  accountsData.forEach((acc, i) => {
    txns.push({
      id: GenerateUuid(),
      name: "Initial Balance",
      date: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      amount: acc.balance > 0 ? acc.balance : 0,
      type: "Initial",
      accountid: acc.id,
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    });
  });

  // Sample recurring transactions (last 6 months)
  for (let month = 0; month < 6; month++) {
    const monthDate = new Date(now);
    monthDate.setMonth(now.getMonth() - month);

    // Salary (first of month)
    monthDate.setDate(1);
    txns.push({
      id: GenerateUuid(),
      name: "Salary",
      date: monthDate.toISOString(),
      amount: 4500,
      type: "Income",
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
    });

    // Rent
    txns.push({
      id: GenerateUuid(),
      name: "Monthly Rent",
      date: monthDate.toISOString(),
      amount: -1500,
      type: "Expense",
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "ef228637-4334-4d7d-8697-84dd19b1e173",
    });

    // Random expenses
    const expenses = [
      { name: "Groceries", amount: -150, categoryid: "61484698-2405-4b17-8e14-71a43a3f91e5" },
      { name: "Gas", amount: -50, categoryid: "4be2ba14-f8aa-4480-b88e-128ab06002ef" },
      { name: "Dining", amount: -75, categoryid: "f32d9c15-c407-46e3-8f3c-99b6859a64b1" },
      { name: "Electric Bill", amount: -100, categoryid: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca" },
    ];

    expenses.forEach((exp, i) => {
      const expDate = new Date(monthDate);
      expDate.setDate(5 + i * 5);
      txns.push({
        id: GenerateUuid(),
        name: exp.name,
        date: expDate.toISOString(),
        amount: exp.amount,
        type: "Expense",
        accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
        categoryid: exp.categoryid,
      });
    });
  }

  return txns;
};

// =====================================
// Seed Functions
// =====================================

/**
 * Seeds the Drizzle database with demo data
 */
export const seedDemoDb = async () => {
  if (!isSqliteInitialized()) {
    throw new Error("Database not initialized");
  }

  const db = getSqliteDb();
  const now = getNow();

  console.log("Seeding demo database...");

  try {
    // Seed Transaction Groups
    const groupsToInsert = transactionGroupsData.map(g => ({
      ...g,
      type: g.type as "Expense" | "Income" | "Transfer",
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
      budgetamount: 0,
      budgetfrequency: "Monthly",
      displayorder: 0,
      description: null,
    }));
    await db.insert(transactionGroups).values(groupsToInsert);
    console.log(`Seeded ${groupsToInsert.length} transaction groups`);

    // Seed Transaction Categories
    const catsToInsert = transactionCategoriesData.map(c => ({
      ...c,
      type: c.type as "Expense" | "Income" | "Transfer",
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
      budgetamount: 0,
      budgetfrequency: "Monthly",
      displayorder: 0,
      description: null,
      color: "error-100",
    }));
    await db.insert(transactionCategories).values(catsToInsert);
    console.log(`Seeded ${catsToInsert.length} transaction categories`);

    // Seed Account Categories
    const accCatsToInsert = accountCategoriesData.map(c => ({
      ...c,
      type: c.type as "Asset" | "Liability",
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
      color: "error-100",
    }));
    await db.insert(accountCategories).values(accCatsToInsert);
    console.log(`Seeded ${accCatsToInsert.length} account categories`);

    // Seed Accounts
    const accsToInsert = accountsData.map(a => ({
      ...a,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
      currency: "USD",
      displayorder: 0,
    }));
    await db.insert(accounts).values(accsToInsert);
    console.log(`Seeded ${accsToInsert.length} accounts`);

    // Seed Configurations
    const configsToInsert = configurationsData.map(c => ({
      ...c,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
    }));
    await db.insert(configurations).values(configsToInsert);
    console.log(`Seeded ${configsToInsert.length} configurations`);

    // Seed Transactions
    const txnsData = generateTransactionsData();
    const txnsToInsert = txnsData.map(t => ({
      ...t,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      createdat: now,
      isdeleted: false,
      isvoid: false,
    }));
    await db.insert(transactions).values(txnsToInsert);
    console.log(`Seeded ${txnsToInsert.length} transactions`);

    console.log("Demo database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed demo database:", error);
    throw error;
  }
};

/**
 * Seeds the Drizzle database with data for Local mode
 * Uses the same data as watermelon seed for consistency
 */
export const seedLocalDb = async () => {
  if (!isSqliteInitialized()) {
    throw new Error("Database not initialized");
  }

  const db = getSqliteDb();
  const now = getNow();

  console.log("Seeding local database...");

  try {
    // Seed Transaction Groups (same data as demo, different tenant)
    const groupsToInsert = transactionGroupsData.map(g => ({
      ...g,
      type: g.type as "Expense" | "Income" | "Transfer",
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      createdat: now,
      isdeleted: false,
      budgetamount: 0,
      budgetfrequency: "Monthly" as const,
      displayorder: 0,
      description: null,
      color: "error-100",
    }));
    await db.insert(transactionGroups).values(groupsToInsert);

    // Seed Transaction Categories
    const catsToInsert = transactionCategoriesData.map(c => ({
      ...c,
      type: c.type as "Expense" | "Income" | "Transfer",
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      createdat: now,
      isdeleted: false,
      budgetamount: 0,
      budgetfrequency: "Monthly" as const,
      displayorder: 0,
      description: null,
      color: "error-100",
    }));
    await db.insert(transactionCategories).values(catsToInsert);

    // Seed Account Categories
    const accCatsToInsert = accountCategoriesData.map(c => ({
      ...c,
      type: c.type as "Asset" | "Liability",
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      createdat: now,
      isdeleted: false,
      color: "error-100",
    }));
    await db.insert(accountCategories).values(accCatsToInsert);

    // Seed Configurations
    const configsToInsert = configurationsData.map(c => ({
      ...c,
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      createdat: now,
      isdeleted: false,
    }));
    await db.insert(configurations).values(configsToInsert);

    console.log("Local database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed local database:", error);
    throw error;
  }
};

export default {
  seedDemoDb,
  seedLocalDb,
};
