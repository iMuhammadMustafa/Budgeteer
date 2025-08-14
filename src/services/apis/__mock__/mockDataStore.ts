// Shared in-memory mock data store for demo mode

import {
  Account,
  AccountCategory,
  Configuration,
  Transaction,
  TransactionCategory,
  TransactionGroup,
} from "@/src/types/db/Tables.Types";

// Account Categories
export const accountCategories: AccountCategory[] = [
  {
    id: "cat-1",
    name: "Cash",
    color: "#4CAF50",
    icon: "cash",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-2",
    name: "Credit Card",
    color: "#F44336",
    icon: "credit-card",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Liability",
  },
  {
    id: "cat-3",
    name: "Savings",
    color: "#2196F3",
    icon: "piggy-bank",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-4",
    name: "Investments",
    color: "#9C27B0",
    icon: "trending-up",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Asset",
  },
  {
    id: "cat-5",
    name: "Loans",
    color: "#FF9800",
    icon: "account-balance",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Liability",
  },
];

export const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Checking Account",
    balance: 2500.75,
    categoryid: "cat-1",
    color: "#4CAF50",
    icon: "bank",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Main checking account",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-2",
    name: "Credit Card",
    balance: -1200.0,
    categoryid: "cat-2",
    color: "#F44336",
    icon: "credit-card",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Visa credit card",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-3",
    name: "Savings Account",
    balance: 8000.0,
    categoryid: "cat-3",
    color: "#2196F3",
    icon: "piggy-bank",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Emergency savings",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-4",
    name: "Investment Account",
    balance: 15000.0,
    categoryid: "cat-4",
    color: "#9C27B0",
    icon: "trending-up",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Stocks and bonds",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-5",
    name: "Loan Account",
    balance: -5000.0,
    categoryid: "cat-5",
    color: "#FF9800",
    icon: "account-balance",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Personal loan",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-6",
    name: "Business Checking",
    balance: 12000.0,
    categoryid: "cat-1",
    color: "#388E3C",
    icon: "business",
    displayorder: 6,
    isdeleted: false,
    createdat: "2025-01-06T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Business account",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-7",
    name: "Travel Savings",
    balance: 3000.0,
    categoryid: "cat-3",
    color: "#1976D2",
    icon: "flight",
    displayorder: 7,
    isdeleted: false,
    createdat: "2025-01-07T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Vacation fund",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-8",
    name: "Mortgage",
    balance: -100000.0,
    categoryid: "cat-5",
    color: "#FFA726",
    icon: "home",
    displayorder: 8,
    isdeleted: false,
    createdat: "2025-01-08T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Home mortgage",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-9",
    name: "Retirement Fund",
    balance: 40000.0,
    categoryid: "cat-4",
    color: "#8E24AA",
    icon: "account-balance-wallet",
    displayorder: 9,
    isdeleted: false,
    createdat: "2025-01-09T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "401k retirement",
    notes: null,
    owner: "demo-user",
  },
  {
    id: "acc-10",
    name: "Petty Cash",
    balance: 200.0,
    categoryid: "cat-1",
    color: "#43A047",
    icon: "attach-money",
    displayorder: 10,
    isdeleted: false,
    createdat: "2025-01-10T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    currency: "USD",
    description: "Office petty cash",
    notes: null,
    owner: "demo-user",
  },
];

export const transactionCategories: TransactionCategory[] = [
  {
    id: "tc-1",
    name: "Groceries",
    color: "#4CAF50",
    icon: "shopping-cart",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-1",
    budgetamount: 500,
    budgetfrequency: "Monthly",
    description: "Food and groceries",
  },
  {
    id: "tc-2",
    name: "Salary",
    color: "#2196F3",
    icon: "briefcase",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    groupid: "tg-2",
    budgetamount: 3000,
    budgetfrequency: "Monthly",
    description: "Monthly salary",
  },
  {
    id: "tc-3",
    name: "Dining Out",
    color: "#FF9800",
    icon: "restaurant",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-3",
    budgetamount: 200,
    budgetfrequency: "Monthly",
    description: "Restaurants and cafes",
  },
  {
    id: "tc-4",
    name: "Electricity",
    color: "#607D8B",
    icon: "flash-on",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 100,
    budgetfrequency: "Monthly",
    description: "Electricity bills",
  },
  {
    id: "tc-5",
    name: "Doctor Visits",
    color: "#E91E63",
    icon: "local-hospital",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-5",
    budgetamount: 150,
    budgetfrequency: "Monthly",
    description: "Medical expenses",
  },
  {
    id: "tc-6",
    name: "Internet",
    color: "#03A9F4",
    icon: "wifi",
    displayorder: 6,
    isdeleted: false,
    createdat: "2025-01-06T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 60,
    budgetfrequency: "Monthly",
    description: "Internet bills",
  },
  {
    id: "tc-7",
    name: "Games",
    color: "#8BC34A",
    icon: "sports-esports",
    displayorder: 7,
    isdeleted: false,
    createdat: "2025-01-07T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-3",
    budgetamount: 100,
    budgetfrequency: "Monthly",
    description: "Video games and entertainment",
  },
  {
    id: "tc-8",
    name: "Water",
    color: "#2196F3",
    icon: "opacity",
    displayorder: 8,
    isdeleted: false,
    createdat: "2025-01-08T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-4",
    budgetamount: 40,
    budgetfrequency: "Monthly",
    description: "Water bills",
  },
  {
    id: "tc-9",
    name: "Pharmacy",
    color: "#F06292",
    icon: "local-pharmacy",
    displayorder: 9,
    isdeleted: false,
    createdat: "2025-01-09T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    groupid: "tg-5",
    budgetamount: 80,
    budgetfrequency: "Monthly",
    description: "Medicines and pharmacy",
  },
  {
    id: "tc-10",
    name: "Freelance Income",
    color: "#4CAF50",
    icon: "work",
    displayorder: 10,
    isdeleted: false,
    createdat: "2025-01-10T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    groupid: "tg-2",
    budgetamount: 1200,
    budgetfrequency: "Monthly",
    description: "Freelance projects",
  },
];

export const transactionGroups: TransactionGroup[] = [
  {
    id: "tg-1",
    name: "Essentials",
    color: "#FF9800",
    icon: "home",
    displayorder: 1,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 1000,
    budgetfrequency: "Monthly",
    description: "Essential expenses",
  },
  {
    id: "tg-2",
    name: "Income",
    color: "#4CAF50",
    icon: "attach-money",
    displayorder: 2,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Income",
    budgetamount: 3000,
    budgetfrequency: "Monthly",
    description: "All income sources",
  },
  {
    id: "tg-3",
    name: "Leisure",
    color: "#03A9F4",
    icon: "sports-esports",
    displayorder: 3,
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 500,
    budgetfrequency: "Monthly",
    description: "Leisure and entertainment",
  },
  {
    id: "tg-4",
    name: "Utilities",
    color: "#607D8B",
    icon: "flash-on",
    displayorder: 4,
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 400,
    budgetfrequency: "Monthly",
    description: "Utility bills",
  },
  {
    id: "tg-5",
    name: "Healthcare",
    color: "#E91E63",
    icon: "local-hospital",
    displayorder: 5,
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    type: "Expense",
    budgetamount: 300,
    budgetfrequency: "Monthly",
    description: "Medical and healthcare",
  },
];

export const transactions: Transaction[] = [
  // Initial account opening transactions
  {
    id: "tr-initial-1",
    accountid: "acc-1",
    amount: 2500.75,
    categoryid: "tc-2",
    createdat: "2024-12-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2024-12-01",
    description: "Account opening balance",
    isdeleted: false,
    isvoid: false,
    name: "Initial Balance",
    notes: "Opening balance for checking account",
    payee: null,
    tags: ["initial"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Initial",
    updatedat: null,
    updatedby: null,
  },
  // Recent transactions for demo
  {
    id: "tr-1",
    accountid: "acc-1",
    amount: 85.50,
    categoryid: "tc-1",
    createdat: "2025-01-15T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-15",
    description: "Weekly grocery shopping",
    isdeleted: false,
    isvoid: false,
    name: "Groceries",
    notes: "Bought fruits, vegetables, and dairy",
    payee: "Whole Foods",
    tags: ["food", "weekly"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-2",
    accountid: "acc-1",
    amount: 3200,
    categoryid: "tc-2",
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-01",
    description: "Monthly salary deposit",
    isdeleted: false,
    isvoid: false,
    name: "Salary",
    notes: "January 2025 salary",
    payee: "Tech Corp Inc",
    tags: ["income", "salary"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Income",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-3",
    accountid: "acc-2",
    amount: 45.75,
    categoryid: "tc-3",
    createdat: "2025-01-14T19:30:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-14",
    description: "Dinner with friends",
    isdeleted: false,
    isvoid: false,
    name: "Restaurant",
    notes: "Italian restaurant downtown",
    payee: "Mario's Bistro",
    tags: ["dining", "social"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-4",
    accountid: "acc-1",
    amount: 120.00,
    categoryid: "tc-4",
    createdat: "2025-01-10T14:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-10",
    description: "Monthly electricity bill",
    isdeleted: false,
    isvoid: false,
    name: "Electricity",
    notes: "December usage",
    payee: "City Electric Co",
    tags: ["utilities", "monthly"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-5",
    accountid: "acc-1",
    amount: 65.00,
    categoryid: "tc-6",
    createdat: "2025-01-08T12:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-08",
    description: "Internet service",
    isdeleted: false,
    isvoid: false,
    name: "Internet",
    notes: "High-speed internet plan",
    payee: "FastNet ISP",
    tags: ["utilities", "internet"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-6",
    accountid: "acc-1",
    amount: 1200,
    categoryid: "tc-10",
    createdat: "2025-01-05T16:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-05",
    description: "Freelance project payment",
    isdeleted: false,
    isvoid: false,
    name: "Freelance Income",
    notes: "Web development project",
    payee: "StartupXYZ",
    tags: ["income", "freelance"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Income",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-7",
    accountid: "acc-2",
    amount: 29.99,
    categoryid: "tc-7",
    createdat: "2025-01-12T20:15:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-12",
    description: "New video game",
    isdeleted: false,
    isvoid: false,
    name: "Gaming",
    notes: "Steam purchase",
    payee: "Steam Store",
    tags: ["entertainment", "gaming"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-8",
    accountid: "acc-1",
    amount: 35.00,
    categoryid: "tc-8",
    createdat: "2025-01-11T11:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-11",
    description: "Water bill",
    isdeleted: false,
    isvoid: false,
    name: "Water",
    notes: "Monthly water service",
    payee: "City Water Dept",
    tags: ["utilities", "water"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-9",
    accountid: "acc-1",
    amount: 25.50,
    categoryid: "tc-9",
    createdat: "2025-01-13T15:30:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-13",
    description: "Prescription medication",
    isdeleted: false,
    isvoid: false,
    name: "Pharmacy",
    notes: "Monthly prescription refill",
    payee: "CVS Pharmacy",
    tags: ["healthcare", "medication"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: null,
    transferid: null,
    type: "Expense",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-10",
    accountid: "acc-3",
    amount: 500,
    categoryid: "tc-2",
    createdat: "2025-01-02T09:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-02",
    description: "Transfer to savings",
    isdeleted: false,
    isvoid: false,
    name: "Savings Transfer",
    notes: "Monthly savings goal",
    payee: null,
    tags: ["transfer", "savings"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: "acc-1",
    transferid: "tr-10-transfer",
    type: "Transfer",
    updatedat: null,
    updatedby: null,
  },
  {
    id: "tr-10-transfer",
    accountid: "acc-1",
    amount: -500,
    categoryid: "tc-2",
    createdat: "2025-01-02T09:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    date: "2025-01-02",
    description: "Transfer to savings",
    isdeleted: false,
    isvoid: false,
    name: "Savings Transfer",
    notes: "Monthly savings goal",
    payee: null,
    tags: ["transfer", "savings"],
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    transferaccountid: "acc-3",
    transferid: "tr-10",
    type: "Transfer",
    updatedat: null,
    updatedby: null,
  },
];

export const configurations: Configuration[] = [
  {
    id: "conf-1",
    key: "currency",
    value: "USD",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-2",
    key: "theme",
    value: "dark",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-3",
    key: "timezone",
    value: "America/Chicago",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-03T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-4",
    key: "language",
    value: "en-US",
    table: "settings",
    type: "string",
    isdeleted: false,
    createdat: "2025-01-04T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
  {
    id: "conf-5",
    key: "notifications",
    value: "enabled",
    table: "settings",
    type: "boolean",
    isdeleted: false,
    createdat: "2025-01-05T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
  },
];

import { Recurring } from "@/src/types/db/Tables.Types";

export const recurrings: Recurring[] = [
  {
    id: "rec-1",
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    name: "Monthly Rent",
    amount: 1200,
    sourceaccountid: "acc-1",
    categoryid: "tc-1",
    type: "Expense",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-08-01",
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-01T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    currencycode: "USD",
    description: "Monthly rent payment",
    enddate: null,
    lastexecutedat: null,
    notes: "Automatic rent payment",
    payeename: "Landlord",
  },
  {
    id: "rec-2",
    tenantid: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    name: "Salary Deposit",
    amount: 3000,
    sourceaccountid: "acc-1",
    categoryid: "tc-2",
    type: "Income",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    nextoccurrencedate: "2025-09-01",
    isactive: true,
    isdeleted: false,
    createdat: "2025-01-02T10:00:00Z",
    createdby: "0742f34e-7c12-408a-91a2-ed95d355bc87",
    updatedat: null,
    updatedby: null,
    currencycode: "USD",
    description: "Monthly salary",
    enddate: null,
    lastexecutedat: null,
    notes: "Direct deposit",
    payeename: "Employer",
  },
];

// Legacy validation utilities - kept for backward compatibility
// New validation system is in src/services/apis/validation/

export class ReferentialIntegrityError extends Error {
  constructor(table: string, field: string, value: string) {
    super(`Referenced record not found: ${table}.${field} = ${value}`);
    this.name = 'ReferentialIntegrityError';
  }
}

export class ConstraintViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConstraintViolationError';
  }
}

// Legacy validation object - use ValidationService for new implementations
export const validateReferentialIntegrity = {
  // Validate account category exists
  validateAccountCategory: (categoryId: string): void => {
    if (!accountCategories.find(cat => cat.id === categoryId && !cat.isdeleted)) {
      throw new ReferentialIntegrityError('accountcategories', 'id', categoryId);
    }
  },

  // Validate account exists
  validateAccount: (accountId: string): void => {
    if (!accounts.find(acc => acc.id === accountId && !acc.isdeleted)) {
      throw new ReferentialIntegrityError('accounts', 'id', accountId);
    }
  },

  // Validate transaction category exists
  validateTransactionCategory: (categoryId: string): void => {
    if (!transactionCategories.find(cat => cat.id === categoryId && !cat.isdeleted)) {
      throw new ReferentialIntegrityError('transactioncategories', 'id', categoryId);
    }
  },

  // Validate transaction group exists
  validateTransactionGroup: (groupId: string): void => {
    if (!transactionGroups.find(group => group.id === groupId && !group.isdeleted)) {
      throw new ReferentialIntegrityError('transactiongroups', 'id', groupId);
    }
  },

  // Validate transaction exists
  validateTransaction: (transactionId: string): void => {
    if (!transactions.find(tr => tr.id === transactionId && !tr.isdeleted)) {
      throw new ReferentialIntegrityError('transactions', 'id', transactionId);
    }
  },

  // Validate unique constraints
  validateUniqueAccountName: (name: string, tenantId: string, excludeId?: string): void => {
    const existing = accounts.find(acc => 
      acc.name === name && 
      acc.tenantid === tenantId && 
      !acc.isdeleted && 
      acc.id !== excludeId
    );
    if (existing) {
      throw new ConstraintViolationError(`Account name '${name}' already exists`);
    }
  },

  validateUniqueAccountCategoryName: (name: string, tenantId: string, excludeId?: string): void => {
    const existing = accountCategories.find(cat => 
      cat.name === name && 
      cat.tenantid === tenantId && 
      !cat.isdeleted && 
      cat.id !== excludeId
    );
    if (existing) {
      throw new ConstraintViolationError(`Account category name '${name}' already exists`);
    }
  },

  validateUniqueTransactionCategoryName: (name: string, tenantId: string, excludeId?: string): void => {
    const existing = transactionCategories.find(cat => 
      cat.name === name && 
      cat.tenantid === tenantId && 
      !cat.isdeleted && 
      cat.id !== excludeId
    );
    if (existing) {
      throw new ConstraintViolationError(`Transaction category name '${name}' already exists`);
    }
  },

  validateUniqueTransactionGroupName: (name: string, tenantId: string, excludeId?: string): void => {
    const existing = transactionGroups.find(group => 
      group.name === name && 
      group.tenantid === tenantId && 
      !group.isdeleted && 
      group.id !== excludeId
    );
    if (existing) {
      throw new ConstraintViolationError(`Transaction group name '${name}' already exists`);
    }
  },

  validateUniqueConfigurationKey: (key: string, table: string, tenantId: string, excludeId?: string): void => {
    const existing = configurations.find(conf => 
      conf.key === key && 
      conf.table === table && 
      conf.tenantid === tenantId && 
      !conf.isdeleted && 
      conf.id !== excludeId
    );
    if (existing) {
      throw new ConstraintViolationError(`Configuration key '${key}' already exists for table '${table}'`);
    }
  },

  // Check if entity can be deleted (not referenced by other entities)
  canDeleteAccountCategory: (categoryId: string): void => {
    const referencedByAccounts = accounts.some(acc => acc.categoryid === categoryId && !acc.isdeleted);
    if (referencedByAccounts) {
      throw new ConstraintViolationError('Cannot delete: Account category is referenced by accounts');
    }
  },

  canDeleteAccount: (accountId: string): void => {
    const referencedByTransactions = transactions.some(tr => 
      (tr.accountid === accountId || tr.transferaccountid === accountId) && !tr.isdeleted
    );
    const referencedByRecurrings = recurrings.some(rec => rec.sourceaccountid === accountId && !rec.isdeleted);
    if (referencedByTransactions) {
      throw new ConstraintViolationError('Cannot delete: Account is referenced by transactions');
    }
    if (referencedByRecurrings) {
      throw new ConstraintViolationError('Cannot delete: Account is referenced by recurring transactions');
    }
  },

  canDeleteTransactionGroup: (groupId: string): void => {
    const referencedByCategories = transactionCategories.some(cat => cat.groupid === groupId && !cat.isdeleted);
    if (referencedByCategories) {
      throw new ConstraintViolationError('Cannot delete: Transaction group is referenced by transaction categories');
    }
  },

  canDeleteTransactionCategory: (categoryId: string): void => {
    const referencedByTransactions = transactions.some(tr => tr.categoryid === categoryId && !tr.isdeleted);
    const referencedByRecurrings = recurrings.some(rec => rec.categoryid === categoryId && !rec.isdeleted);
    if (referencedByTransactions) {
      throw new ConstraintViolationError('Cannot delete: Transaction category is referenced by transactions');
    }
    if (referencedByRecurrings) {
      throw new ConstraintViolationError('Cannot delete: Transaction category is referenced by recurring transactions');
    }
  },

  canDeleteTransaction: (transactionId: string): void => {
    const referencedByTransfers = transactions.some(tr => tr.transferid === transactionId && !tr.isdeleted);
    if (referencedByTransfers) {
      throw new ConstraintViolationError('Cannot delete: Transaction is referenced by transfer transactions');
    }
  },

  canDeleteTransactionGroup: (groupId: string): void => {
    const referencedByCategories = transactionCategories.some(cat => cat.groupid === groupId && !cat.isdeleted);
    if (referencedByCategories) {
      throw new ConstraintViolationError('Cannot delete: Transaction group is referenced by transaction categories');
    }
  },

  canDeleteTransactionCategory: (categoryId: string): void => {
    const referencedByTransactions = transactions.some(tr => tr.categoryid === categoryId && !tr.isdeleted);
    const referencedByRecurrings = recurrings.some(rec => rec.categoryid === categoryId && !rec.isdeleted);
    if (referencedByTransactions) {
      throw new ConstraintViolationError('Cannot delete: Transaction category is referenced by transactions');
    }
    if (referencedByRecurrings) {
      throw new ConstraintViolationError('Cannot delete: Transaction category is referenced by recurring transactions');
    }
  }
};

// Mock Database Functions
export const mockDatabaseFunctions = {
  // Equivalent to UpdateAccountBalance function
  updateAccountBalance: (accountId: string, amount: number): number => {
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
      throw new Error('Account not found');
    }
    accounts[accountIndex].balance += amount;
    return accounts[accountIndex].balance;
  },

  // Equivalent to apply_recurring_transaction function
  applyRecurringTransaction: (recurringId: string): string => {
    const recurring = recurrings.find(rec => rec.id === recurringId && rec.isactive && !rec.isdeleted);
    if (!recurring) {
      throw new Error('Recurring transaction not found or not active');
    }

    // Create new transaction
    const newTransactionId = `tr-recurring-${Date.now()}`;
    const newTransaction = {
      id: newTransactionId,
      accountid: recurring.sourceaccountid,
      amount: recurring.amount || 0,
      categoryid: recurring.categoryid || '',
      createdat: new Date().toISOString(),
      createdby: recurring.createdby || 'system',
      date: recurring.nextoccurrencedate,
      description: recurring.description || null,
      isdeleted: false,
      isvoid: false,
      name: recurring.name,
      notes: recurring.notes || null,
      payee: recurring.payeename || null,
      tags: null,
      tenantid: recurring.tenantid,
      transferaccountid: null,
      transferid: null,
      type: recurring.type,
      updatedat: null,
      updatedby: null,
    };

    transactions.push(newTransaction);

    // Update recurring next occurrence date
    const currentDate = new Date(recurring.nextoccurrencedate);
    let nextDate: Date;

    // Parse recurrence rule (basic implementation)
    const rule = recurring.recurrencerule;
    if (rule.includes('FREQ=MONTHLY')) {
      const interval = rule.includes('INTERVAL=') ? 
        parseInt(rule.split('INTERVAL=')[1].split(';')[0]) : 1;
      nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + interval);
    } else if (rule.includes('FREQ=WEEKLY')) {
      const interval = rule.includes('INTERVAL=') ? 
        parseInt(rule.split('INTERVAL=')[1].split(';')[0]) : 1;
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + (7 * interval));
    } else if (rule.includes('FREQ=DAILY')) {
      const interval = rule.includes('INTERVAL=') ? 
        parseInt(rule.split('INTERVAL=')[1].split(';')[0]) : 1;
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + interval);
    } else {
      throw new Error('Unsupported recurrence rule');
    }

    // Update recurring
    const recurringIndex = recurrings.findIndex(rec => rec.id === recurringId);
    recurrings[recurringIndex].lastexecutedat = recurring.nextoccurrencedate;
    recurrings[recurringIndex].nextoccurrencedate = nextDate.toISOString().split('T')[0];
    
    // Check if recurring should be deactivated
    if (recurring.enddate && nextDate > new Date(recurring.enddate)) {
      recurrings[recurringIndex].isactive = false;
    }

    return newTransactionId;
  },
};
