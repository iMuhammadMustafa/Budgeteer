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
// DATA DEFINTIONS
// =====================================

const transactionGroupsData = [
  {
    id: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    description: null,
    icon: "Drama",
    color: "error-100",
    name: "Entertainment",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    description: null,
    icon: "Plug",
    color: "error-100",
    name: "Bills",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
    description: null,
    icon: "House",
    color: "error-100",
    name: "Household",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
    description: null,
    icon: "BriefcaseBusiness",
    color: "error-100",
    name: "Employer",
    type: "Income",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8",
    description: null,
    icon: "Ellipsis",
    color: "error-100",
    name: "Other",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
    description: null,
    icon: "UserPen",
    color: "error-100",
    name: "Accounts",
    type: "Adjustment",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "56f8e908-644e-4767-bff9-1f37baf49fe4",
    description: null,
    icon: "Car",
    color: "error-100",
    name: "Car",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "046e648c-123f-462c-908b-d1e0831e6a11",
    description: null,
    icon: "ShoppingCart",
    color: "error-100",
    name: "Groceries",
    type: "Expense",
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
];

const transactionCategoriesData = [
  {
    id: "55485de3-113a-42fa-a9a8-68f151b5d233",
    name: "Other",
    description: null,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    icon: "Ellipsis",
    type: "Expense",
    color: "Ellipsis",
    groupid: "60e285ab-a8fd-4b73-9b6b-e2e6964757e8",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f",
    name: "Clothing",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Shirt",
    type: "Expense",
    color: "House",
    groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "43697723-bb6f-4edc-abe7-ea7540595df7",
    name: "Medicine",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "HeartPulse",
    type: "Expense",
    color: "House",
    groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "4f036417-a86c-4335-813e-b65e7a3cb909",
    name: "Home Improvement",
    description: null,
    createdat: new Date("2025-01-05T20:12:34.066-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-05T20:12:34.066-06:00"),
    isdeleted: false,
    icon: "HousePlus",
    type: "Expense",
    color: "House",
    groupid: "15cbf097-47fa-4df1-ab7e-92ce5a3e32da",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "4be2ba14-f8aa-4480-b88e-128ab06002ef",
    name: "Fuel",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Fuel",
    type: "Expense",
    color: "Car",
    groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "5b2bd8af-f00c-429d-8351-c42c4c8db97f",
    name: "Car Insurance",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Shield",
    type: "Expense",
    color: "Car",
    groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",
    name: "Dining Out",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Pizza",
    type: "Expense",
    color: "Drama",
    groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "e4211cd6-2485-4728-b646-d47b790d5c78",
    name: "Games",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Gamepad2",
    type: "Expense",
    color: "Drama",
    groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "34170969-aab7-41aa-b0c1-f1ecd4229c8d",
    name: "Sweets and Candy",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Lollipop",
    type: "Expense",
    color: "Drama",
    groupid: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "ef228637-4334-4d7d-8697-84dd19b1e173",
    name: "Rent",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "House",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "aad62461-d513-42ed-a478-ddcc8039a349",
    name: "Phone",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Phone",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "9031526c-8069-4110-be4b-2b9c14ccb3ea",
    name: "Medical Insurance",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "BriefcaseMedical",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "36e65ba3-0b60-4a25-a025-188f08dee904",
    name: "Phone",
    description: null,
    createdat: new Date("2024-09-10T17:04:17.938-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-10T17:04:17.938-05:00"),
    isdeleted: false,
    icon: "Smartphone",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca",
    name: "Electricity",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "PlugZap",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "5477212e-8409-44bf-8550-5a5fcdea0c32",
    name: "Student Loan",
    description: null,
    createdat: new Date("2024-09-22T20:55:02.633308-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-22T20:55:02.633308-05:00"),
    isdeleted: false,
    icon: "School",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "6ffe01d0-e0bf-45da-8384-3c167b6794b0",
    name: "Water",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Droplets",
    type: "Expense",
    color: "Plug",
    groupid: "235e6d59-5ecc-4ae3-a01f-83f3c395449c",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
    name: "Salary",
    description: null,
    createdat: new Date("2024-09-08T12:57:01.011229-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:01.011229-05:00"),
    isdeleted: false,
    icon: "BriefcaseBusiness",
    type: "Income",
    color: "BriefcaseBusiness",
    groupid: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "6b06d9fe-b1d3-43b9-81cc-39a986b04380",
    name: "Bonus",
    description: null,
    createdat: new Date("2024-09-08T12:57:36.788949-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:36.788949-05:00"),
    isdeleted: false,
    icon: "Star",
    type: "Income",
    color: "BriefcaseBusiness",
    groupid: "a9cfa027-8f5c-489a-8b93-f9b4f5735044",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    name: "Account Operations",
    description: null,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    icon: "Wallet",
    type: "Adjustment",
    color: "UserPen",
    groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "4b6f723e-dbc5-421d-b69d-6b9a503e23fe",
    name: "Refund",
    description: null,
    createdat: new Date("2024-09-28T18:03:23.525252-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-28T18:03:23.525252-05:00"),
    isdeleted: false,
    icon: "TicketSlash",
    type: "Adjustment",
    color: "UserPen",
    groupid: "2a1caa0e-5767-4b99-8bdd-8a48fc42e72b",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "3e086e05-2998-400a-9574-7ef562c4354e",
    name: "Car Maintenance",
    description: null,
    createdat: new Date("2025-01-08T16:24:43.531759-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-08T16:24:43.531759-06:00"),
    isdeleted: false,
    icon: "Wrench",
    type: "Expense",
    color: "Car",
    groupid: "56f8e908-644e-4767-bff9-1f37baf49fe4",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "775793ad-2dce-4d95-b2f5-afeea47c7bc9",
    name: "Food",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Utensils",
    type: "Expense",
    color: "ShoppingCart",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "fa748d7a-072e-4268-82ad-40f7bfdae1ab",
    name: "Fruit",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Apple",
    type: "Expense",
    color: "ShoppingCart",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "61484698-2405-4b17-8e14-71a43a3f91e5",
    name: "Groceries",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "ShoppingCart",
    type: "Expense",
    color: "ShoppingCart",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
  {
    id: "efd3c86c-6266-4b9f-a585-d02f02e8d27d",
    name: "Snacks",
    description: null,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    icon: "Donut",
    type: "Expense",
    color: "Drama",
    groupid: "046e648c-123f-462c-908b-d1e0831e6a11",
    displayorder: 0,
    budgetamount: 0,
    budgetfrequency: "monthly",
  },
];

const accountCategoriesData = [
  {
    id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    name: "Bank",
    type: "Asset",
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    icon: "PiggyBank",
    displayorder: 1000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "b717a537-78a2-4a78-8da9-2598faca1cec",
    name: "Debit Card",
    type: "Asset",
    createdat: new Date("2025-01-02T15:06:01.929132-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-02T15:06:01.929132-06:00"),
    isdeleted: false,
    icon: "Banknote",
    displayorder: 2000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    name: "Credit Card",
    type: "Liability",
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    icon: "CreditCard",
    displayorder: 3000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "5d192f78-41e8-413c-9457-c9d68f9decf1",
    name: "Cash",
    type: "Asset",
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    icon: "Banknote",
    displayorder: 4000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "d9833b85-1523-4a01-8c82-10fbe3c1ad18",
    name: "Gift Card",
    type: "Asset",
    createdat: new Date("2025-01-02T07:43:37.280129-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-02T07:43:37.280129-06:00"),
    isdeleted: false,
    icon: "WalletCards",
    displayorder: 5000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "bbefb010-bcf9-4552-b41f-c4c3053b4357",
    name: "Loan",
    type: "Liability",
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    icon: "Landmark",
    displayorder: 6000,
    color: "error-100",
    statementdate: null,
  },
];

const configurationsData = [
  {
    id: "f2d4f7f6-0e2c-4e5d-9d7f-6c4a3e1b28c3",
    tablename: TableNames.TransactionCategories,
    type: ConfigurationTypes.AccountOpertationsCategory,
    key: "id",
    value: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
  },
  {
    id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    tablename: TableNames.TransactionCategories,
    type: "Other",
    key: "id",
    value: "55485de3-113a-42fa-a9a8-68f151b5d233",
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
  },
];

// =====================================
// HELPER FUNCTIONS
// =====================================

// Demo Seed Accounts Data
const getAccountsData = (transactions: any[]) => {
  const accountCreationDate = new Date();
  accountCreationDate.setFullYear(accountCreationDate.getFullYear() - 2);
  accountCreationDate.setHours(0, 0, 0, 0);

  // Helper function to calculate balance for an account from all its transactions
  const calculateAccountBalance = (accountId: string) => {
    return transactions.filter(txn => txn.accountid === accountId).reduce((balance, txn) => balance + txn.amount, 0);
  };

  const accountIds = [
    "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b", // 019313ea-448f-7c15-9b2e-7d7d8e9f0a1b
    "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b", // 019313ea-448f-7c15-9b2e-7d2d3e4f5a6b
    "019313ea-448f-7c15-9b2e-7d5d6e7f8a90", // 019313ea-448f-7c15-9b2e-7d5d6e7f8a90
    "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a", // 019313ea-448f-7c15-9b2e-7d1c2d3e4f5a
    "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c", // 019313ea-448f-7c15-9b2e-7d8e9f0a1b2c
    "019313ea-448f-7c15-9b2e-7db8c90d1e2f", // 019313ea-448f-7c15-9b2e-7db8c90d1e2f
    "019313ea-448f-7c15-9b2e-7da1b2c3d4e5", // 019313ea-448f-7c15-9b2e-7da1b2c3d4e5
  ];

  // Calculate balances for all accounts
  const balances = Object.fromEntries(accountIds.map(id => [id, calculateAccountBalance(id)]));

  return [
    // Bank Accounts
    {
      id: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      name: "Primary Checking",
      balance: balances["019313ea-448f-7c15-9b2e-7d7d8e9f0a1b"],
      currency: "USD",
      color: "info-500",
      icon: "Wallet",
      description: "Main checking account for daily transactions",
      notes: null,
      displayorder: 1,
      categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", // Bank category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    {
      id: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      name: "Savings Account",
      balance: balances["019313ea-448f-7c15-9b2e-7d2d3e4f5a6b"],
      currency: "USD",
      color: "green-500",
      icon: "PiggyBank",
      description: "Emergency fund and savings",
      notes: null,
      displayorder: 2,
      categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", // Bank category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    // Credit Card
    {
      id: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      name: "Rewards Credit Card",
      balance: balances["019313ea-448f-7c15-9b2e-7d5d6e7f8a90"],
      currency: "USD",
      color: "warning-500",
      icon: "CreditCard",
      description: "Credit card with 2% cashback",
      notes: "Credit limit: $5000",
      displayorder: 3,
      categoryid: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699", // Credit Card category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    // Cash
    {
      id: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
      name: "Cash Wallet",
      balance: balances["019313ea-448f-7c15-9b2e-7d1c2d3e4f5a"],
      currency: "USD",
      color: "amber-500",
      icon: "Banknote",
      description: "Physical cash on hand",
      notes: null,
      displayorder: 4,
      categoryid: "5d192f78-41e8-413c-9457-c9d68f9decf1", // Cash category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    // Loan
    {
      id: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
      name: "Auto Loan",
      balance: balances["019313ea-448f-7c15-9b2e-7d8e9f0a1b2c"],
      currency: "USD",
      color: "error-500",
      icon: "Car",
      description: "Car loan payment",
      notes: "Monthly payment due on the 1st",
      displayorder: 5,
      categoryid: "bbefb010-bcf9-4552-b41f-c4c3053b4357", // Loan category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    // Gift Cards
    {
      id: "019313ea-448f-7c15-9b2e-7db8c90d1e2f",
      name: "Amazon Gift Card",
      balance: balances["019313ea-448f-7c15-9b2e-7db8c90d1e2f"],
      currency: "USD",
      color: "success-500",
      icon: "Gift",
      description: "Amazon shopping gift card",
      notes: null,
      displayorder: 6,
      categoryid: "d9833b85-1523-4a01-8c82-10fbe3c1ad18", // Gift Card category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
    {
      id: "019313ea-448f-7c15-9b2e-7da1b2c3d4e5",
      name: "Starbucks Gift Card",
      balance: balances["019313ea-448f-7c15-9b2e-7da1b2c3d4e5"],
      currency: "USD",
      color: "teal-500",
      icon: "Coffee",
      description: "Coffee shop gift card",
      notes: null,
      displayorder: 7,
      categoryid: "d9833b85-1523-4a01-8c82-10fbe3c1ad18", // Gift Card category
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      isdeleted: false,
    },
  ];
};

const generateDemoTransactionsData = () => {
  const txnList: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight
  // Use 6 months instead of 2 years to avoid timeout
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - 6);

  const generateId = () => GenerateUuid();

  // 1. Opening Balance Transactions (6 months ago)
  const openingBalanceDate = new Date(startDate);
  openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);

  // Opening balance for Checking Account
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 500,
    date: openingBalanceDate.toISOString(),
    description: "Initial account balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9", // Account Operations category
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Savings Account
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 50000,
    date: openingBalanceDate.toISOString(),
    description: "Initial account balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Credit Card (negative)
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: -2000,
    date: openingBalanceDate.toISOString(),
    description: "Initial credit card balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Cash
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 200,
    date: openingBalanceDate.toISOString(),
    description: "Initial cash balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Loan (negative)
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: -50000,
    date: openingBalanceDate.toISOString(),
    description: "Initial loan balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Amazon Gift Card
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 100,
    date: openingBalanceDate.toISOString(),
    description: "Initial gift card balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7db8c90d1e2f",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Starbucks Gift Card
  txnList.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 50,
    date: openingBalanceDate.toISOString(),
    description: "Initial gift card balance",
    payee: null,
    notes: null,
    tags: null,
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7da1b2c3d4e5",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: DEMO_TENANT_ID,
    isdeleted: false,
    createdby: DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // 2. Bi-weekly Salary Deposits (for last 2 years)
  // Starting from 2 years ago, every 14 days
  const salaryAmount = 2500; // Bi-weekly salary
  let salaryDate = new Date(startDate);

  while (salaryDate <= today) {
    txnList.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: salaryAmount,
      date: salaryDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea", // Salary category
      transferaccountid: null,
      transferid: null,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: salaryDate.toISOString(),
      updatedat: salaryDate.toISOString(),
    });

    salaryDate.setDate(salaryDate.getDate() + 14);
  }

  // 3. Monthly Transfers from Checking to Savings ($200)
  let transferDate = new Date(startDate);
  transferDate.setDate(5); // 5th of each month

  while (transferDate <= today) {
    const transferOutId = generateId();
    const transferInId = generateId();

    // Transfer out from checking
    txnList.push({
      id: transferOutId,
      name: "Transfer to Savings",
      amount: -200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: null,
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      transferid: transferInId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    // Transfer in to savings
    txnList.push({
      id: transferInId,
      name: "Transfer from Checking",
      amount: 200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: transferOutId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    transferDate.setMonth(transferDate.getMonth() + 1);
  }

  // 4. Monthly Credit Card Payments from Checking
  let ccPaymentDate = new Date(startDate);
  ccPaymentDate.setDate(15); // 15th of each month

  while (ccPaymentDate <= today) {
    const paymentAmount = 500 + Math.floor(Math.random() * 300); // $500-800
    const paymentOutId = generateId();
    const paymentInId = generateId();

    // Payment out from checking
    txnList.push({
      id: paymentOutId,
      name: "Credit Card Payment",
      amount: -paymentAmount,
      date: ccPaymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: "Credit Card Company",
      notes: null,
      tags: null,
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      transferid: paymentInId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: ccPaymentDate.toISOString(),
      updatedat: ccPaymentDate.toISOString(),
    });

    // Payment received on credit card (reduces balance)
    txnList.push({
      id: paymentInId,
      name: "Payment Received",
      amount: paymentAmount,
      date: ccPaymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: null,
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: paymentOutId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: ccPaymentDate.toISOString(),
      updatedat: ccPaymentDate.toISOString(),
    });

    ccPaymentDate.setMonth(ccPaymentDate.getMonth() + 1);
  }

  // 4.1 Monthly Auto Loan Payments from Checking -> Auto Loan ($500)
  let loanPaymentDate = new Date(startDate);
  loanPaymentDate.setDate(1); // Pay on the 1st of each month

  while (loanPaymentDate <= today) {
    const loanPaymentOutId = generateId();
    const loanPaymentInId = generateId();
    const loanPaymentAmount = 500; // fixed monthly payment

    // Outgoing transfer from checking (payment)
    txnList.push({
      id: loanPaymentOutId,
      name: "Loan Payment",
      amount: -loanPaymentAmount,
      date: loanPaymentDate.toISOString(),
      description: "Monthly auto loan payment",
      payee: "Auto Loan",
      notes: null,
      tags: null,
      type: "Transfer",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
      transferid: loanPaymentInId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: loanPaymentDate.toISOString(),
      updatedat: loanPaymentDate.toISOString(),
    });

    // Incoming transfer to loan (reduces loan balance)
    txnList.push({
      id: loanPaymentInId,
      name: "Loan Payment Received",
      amount: loanPaymentAmount,
      date: loanPaymentDate.toISOString(),
      description: "Monthly auto loan payment",
      payee: null,
      notes: null,
      tags: null,
      type: "Transfer",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: loanPaymentOutId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: loanPaymentDate.toISOString(),
      updatedat: loanPaymentDate.toISOString(),
    });

    loanPaymentDate.setMonth(loanPaymentDate.getMonth() + 1);
  }

  // 5. Random Cash Deposits from Checking (small amounts)
  // Random 3-5 times per month
  let cashDepositDate = new Date(startDate);

  while (cashDepositDate <= today) {
    const depositsThisMonth = 3 + Math.floor(Math.random() * 3); // 3-5 deposits

    for (let i = 0; i < depositsThisMonth; i++) {
      const dayOfMonth = 1 + Math.floor(Math.random() * 28);
      const depositDate = new Date(cashDepositDate.getFullYear(), cashDepositDate.getMonth(), dayOfMonth);

      if (depositDate > today) break;

      const cashAmount = 20 + Math.floor(Math.random() * 80); // $20-100
      const cashOutId = generateId();
      const cashInId = generateId();

      // Withdrawal from checking
      txnList.push({
        id: cashOutId,
        name: "Cash Withdrawal",
        amount: -cashAmount,
        date: depositDate.toISOString(),
        description: "ATM withdrawal",
        payee: null,
        notes: null,
        tags: null,
        type: "Expense",
        isvoid: false,
        accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
        categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
        transferaccountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
        transferid: cashInId,
        tenantid: DEMO_TENANT_ID,
        isdeleted: false,
        createdby: DEMO_USER_ID,
        updatedby: null,
        createdat: depositDate.toISOString(),
        updatedat: depositDate.toISOString(),
      });

      // Deposit to cash
      txnList.push({
        id: cashInId,
        name: "Cash Deposit",
        amount: cashAmount,
        date: depositDate.toISOString(),
        description: "ATM withdrawal",
        payee: null,
        notes: null,
        tags: null,
        type: "Income",
        isvoid: false,
        accountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
        categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
        transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
        transferid: cashOutId,
        tenantid: DEMO_TENANT_ID,
        isdeleted: false,
        createdby: DEMO_USER_ID,
        updatedby: null,
        createdat: depositDate.toISOString(),
        updatedat: depositDate.toISOString(),
      });
    }

    cashDepositDate.setMonth(cashDepositDate.getMonth() + 1);
  }

  // 6. Expense Transactions - Various categories spread across 2 years

  // Helper for expense categories (using actual category IDs from transactionCategoriesData)
  const expenseCategories = [
    { id: "61484698-2405-4b17-8e14-71a43a3f91e5", name: "Groceries", minAmount: 50, maxAmount: 200, frequency: 8 }, // 8x per month
    { id: "f32d9c15-c407-46e3-8f3c-99b6859a64b1", name: "Dining Out", minAmount: 15, maxAmount: 80, frequency: 6 }, // 6x per month (Restaurants)
    { id: "4be2ba14-f8aa-4480-b88e-128ab06002ef", name: "Fuel", minAmount: 30, maxAmount: 60, frequency: 4 }, // 4x per month (Gas)
    { id: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca", name: "Electricity", minAmount: 80, maxAmount: 150, frequency: 1 }, // Monthly
    { id: "6ffe01d0-e0bf-45da-8384-3c167b6794b0", name: "Water", minAmount: 40, maxAmount: 80, frequency: 1 }, // Monthly
    { id: "aad62461-d513-42ed-a478-ddcc8039a349", name: "Phone", minAmount: 50, maxAmount: 90, frequency: 1 }, // Monthly
    { id: "e4211cd6-2485-4728-b646-d47b790d5c78", name: "Games", minAmount: 15, maxAmount: 60, frequency: 1 }, // Monthly (Streaming/Entertainment)
    {
      id: "34170969-aab7-41aa-b0c1-f1ecd4229c8d",
      name: "Sweets and Candy",
      minAmount: 10,
      maxAmount: 30,
      frequency: 4,
    }, // 4x per month (Snacks)
    { id: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f", name: "Clothing", minAmount: 30, maxAmount: 150, frequency: 2 }, // 2x per month (Shopping)
    { id: "ef228637-4334-4d7d-8697-84dd19b1e173", name: "Rent", minAmount: 1200, maxAmount: 1200, frequency: 1 }, // Monthly
  ];

  let expenseDate = new Date(startDate);

  while (expenseDate <= today) {
    expenseCategories.forEach(category => {
      for (let i = 0; i < category.frequency; i++) {
        const dayOfMonth = Math.floor(Math.random() * 28) + 1;
        const transactionDate = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), dayOfMonth);

        if (transactionDate > today) return;

        const amount = category.minAmount + Math.floor(Math.random() * (category.maxAmount - category.minAmount));

        // Randomly assign to checking, credit card, or cash based on category
        let accountId = "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        if (category.name === "Groceries" || category.name === "Fuel" || category.name === "Clothing") {
          // 70% credit card, 30% checking
          accountId =
            Math.random() < 0.7 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (category.name === "Dining Out" || category.name === "Sweets and Candy") {
          // 50% credit card, 30% checking, 20% cash
          const rand = Math.random();
          if (rand < 0.5) accountId = "019313ea-448f-7c15-9b2e-7d5d6e7f8a90";
          else if (rand < 0.8) accountId = "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
          else accountId = "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a";
        } else if (
          category.name === "Rent" ||
          category.name === "Electricity" ||
          category.name === "Water" ||
          category.name === "Phone"
        ) {
          // Bills paid from checking account
          accountId = "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (category.name === "Games") {
          // Entertainment - mostly credit card
          accountId =
            Math.random() < 0.8 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        }

        txnList.push({
          id: generateId(),
          name: category.name,
          amount: -amount,
          date: transactionDate.toISOString(),
          description: `${category.name} expense`,
          payee: `${category.name} Vendor`,
          notes: null,
          tags: null,
          type: "Expense",
          isvoid: false,
          accountid: accountId,
          categoryid: category.id,
          transferaccountid: null,
          transferid: null,
          tenantid: DEMO_TENANT_ID,
          isdeleted: false,
          createdby: DEMO_USER_ID,
          updatedby: null,
          createdat: transactionDate.toISOString(),
          updatedat: transactionDate.toISOString(),
        });
      }
    });

    expenseDate.setMonth(expenseDate.getMonth() + 1);
  }

  // 7. Current month transactions - consistent daily transactions until end of month
  const currentMonth = new Date(today);
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const currentDay = lastDayOfMonth; // Generate transactions for the entire month

  // Daily/regular expenses that happen throughout the month
  const dailyExpensePatterns = [
    // Groceries - 2-3 times per week
    {
      categoryid: "61484698-2405-4b17-8e14-71a43a3f91e5",
      name: "Grocery Store",
      minAmount: 45,
      maxAmount: 180,
      frequency: [2, 5, 9, 12, 16, 19, 23, 26, 30],
    },
    // Dining Out - 4-6 times per week
    {
      categoryid: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",
      name: "Restaurant",
      minAmount: 25,
      maxAmount: 85,
      frequency: [1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 28, 29],
    },
    // Coffee - almost daily
    {
      categoryid: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",
      name: "Coffee Shop",
      minAmount: 4,
      maxAmount: 12,
      frequency: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30],
    },
    // Gas - twice per week
    {
      categoryid: "4be2ba14-f8aa-4480-b88e-128ab06002ef",
      name: "Gas Station",
      minAmount: 35,
      maxAmount: 65,
      frequency: [2, 6, 9, 13, 16, 20, 23, 27, 30],
    },
    // Snacks/Sweets - 3-4 times per week
    {
      categoryid: "34170969-aab7-41aa-b0c1-f1ecd4229c8d",
      name: "Convenience Store",
      minAmount: 8,
      maxAmount: 25,
      frequency: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28],
    },
    {
      categoryid: "efd3c86c-6266-4b9f-a585-d02f02e8d27d",
      name: "Snack Shop",
      minAmount: 5,
      maxAmount: 18,
      frequency: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30],
    },
    // Fast Food - 2-3 times per week
    {
      categoryid: "f32d9c15-c407-46e3-8f3c-99b6859a64b1",
      name: "Fast Food",
      minAmount: 10,
      maxAmount: 30,
      frequency: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29],
    },
  ];

  dailyExpensePatterns.forEach(pattern => {
    pattern.frequency.forEach(day => {
      if (day <= currentDay) {
        const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const amount = pattern.minAmount + Math.floor(Math.random() * (pattern.maxAmount - pattern.minAmount));

        // Determine account based on transaction type and amount
        let accountId = "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        if (pattern.name.includes("Coffee") && amount < 15) {
          accountId =
            Math.random() < 0.6 ? "019313ea-448f-7c15-9b2e-7da1b2c3d4e5" : "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a";
        } else if (pattern.name === "Fast Food" || pattern.name.includes("Snack")) {
          accountId =
            Math.random() < 0.4
              ? "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a"
              : Math.random() < 0.7
                ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90"
                : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (pattern.name === "Grocery Store" || pattern.name === "Gas Station") {
          accountId =
            Math.random() < 0.8 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (pattern.name === "Restaurant") {
          accountId =
            Math.random() < 0.6 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        }

        txnList.push({
          id: generateId(),
          name: pattern.name,
          amount: -amount,
          date: transactionDate.toISOString(),
          description: `${pattern.name} purchase`,
          payee: pattern.name,
          notes: null,
          tags: null,
          type: "Expense",
          isvoid: false,
          accountid: accountId,
          categoryid: pattern.categoryid,
          transferaccountid: null,
          transferid: null,
          tenantid: DEMO_TENANT_ID,
          isdeleted: false,
          createdby: DEMO_USER_ID,
          updatedby: null,
          createdat: transactionDate.toISOString(),
          updatedat: transactionDate.toISOString(),
        });
      }
    });
  });

  // Monthly bills and fixed expenses (only if we're past those days)
  const monthlyBills = [
    {
      categoryid: "ef228637-4334-4d7d-8697-84dd19b1e173",
      name: "Rent Payment",
      amount: 1200,
      day: 1,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "4f8111aa-b5ef-468b-800d-f9d51a8e7dca",
      name: "Electricity Bill",
      amount: 95,
      day: 5,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "6ffe01d0-e0bf-45da-8384-3c167b6794b0",
      name: "Water Bill",
      amount: 55,
      day: 5,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "aad62461-d513-42ed-a478-ddcc8039a349",
      name: "Phone Bill",
      amount: 75,
      day: 10,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "5b2bd8af-f00c-429d-8351-c42c4c8db97f",
      name: "Car Insurance",
      amount: 180,
      day: 1,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "9031526c-8069-4110-be4b-2b9c14ccb3ea",
      name: "Medical Insurance",
      amount: 320,
      day: 1,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "e4211cd6-2485-4728-b646-d47b790d5c78",
      name: "Netflix Subscription",
      amount: 18,
      day: 15,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "e4211cd6-2485-4728-b646-d47b790d5c78",
      name: "Spotify Subscription",
      amount: 11,
      day: 12,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "e4211cd6-2485-4728-b646-d47b790d5c78",
      name: "Gaming Subscription",
      amount: 15,
      day: 20,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
  ];

  monthlyBills.forEach(bill => {
    if (bill.day <= currentDay) {
      const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), bill.day);

      txnList.push({
        id: generateId(),
        name: bill.name,
        amount: -bill.amount,
        date: transactionDate.toISOString(),
        description: `Monthly ${bill.name}`,
        payee: bill.name.replace(" Payment", "").replace(" Bill", ""),
        notes: null,
        tags: null,
        type: "Expense",
        isvoid: false,
        accountid: bill.account,
        categoryid: bill.categoryid,
        transferaccountid: null,
        transferid: null,
        tenantid: DEMO_TENANT_ID,
        isdeleted: false,
        createdby: DEMO_USER_ID,
        updatedby: null,
        createdat: transactionDate.toISOString(),
        updatedat: transactionDate.toISOString(),
      });
    }
  });

  // Special purchases and one-time expenses
  const specialPurchases = [
    {
      categoryid: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f",
      name: "Clothing Store",
      amount: 85,
      day: 3,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "41dee609-6a44-4fda-8ed4-2ec0bd35a99f",
      name: "Online Shopping",
      amount: 120,
      day: 7,
      account: "019313ea-448f-7c15-9b2e-7db8c90d1e2f",
    },
    {
      categoryid: "3e086e05-2998-400a-9574-7ef562c4354e",
      name: "Car Maintenance",
      amount: 125,
      day: 4,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "43697723-bb6f-4edc-abe7-ea7540595df7",
      name: "Pharmacy",
      amount: 35,
      day: 6,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
    {
      categoryid: "775793ad-2dce-4d95-b2f5-afeea47c7bc9",
      name: "Food Delivery",
      amount: 42,
      day: 8,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "4f036417-a86c-4335-813e-b65e7a3cb909",
      name: "Home Depot",
      amount: 95,
      day: 9,
      account: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    },
    {
      categoryid: "fa748d7a-072e-4268-82ad-40f7bfdae1ab",
      name: "Farmers Market",
      amount: 22,
      day: 2,
      account: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
    },
    {
      categoryid: "e4211cd6-2485-4728-b646-d47b790d5c78",
      name: "Video Game Purchase",
      amount: 60,
      day: 14,
      account: "019313ea-448f-7c15-9b2e-7db8c90d1e2f",
    },
    {
      categoryid: "55485de3-113a-42fa-a9a8-68f151b5d233",
      name: "Miscellaneous",
      amount: 45,
      day: 11,
      account: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    },
  ];

  specialPurchases.forEach(purchase => {
    if (purchase.day <= currentDay) {
      const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), purchase.day);

      txnList.push({
        id: generateId(),
        name: purchase.name,
        amount: -purchase.amount,
        date: transactionDate.toISOString(),
        description: `${purchase.name} purchase`,
        payee: purchase.name,
        notes: null,
        tags: null,
        type: "Expense",
        isvoid: false,
        accountid: purchase.account,
        categoryid: purchase.categoryid,
        transferaccountid: null,
        transferid: null,
        tenantid: DEMO_TENANT_ID,
        isdeleted: false,
        createdby: DEMO_USER_ID,
        updatedby: null,
        createdat: transactionDate.toISOString(),
        updatedat: transactionDate.toISOString(),
      });
    }
  });

  // Income for current month (salary if applicable)
  const salaryDay = 1; // Assume salary on 1st and 15th
  const salaryDay2 = 15;

  if (salaryDay <= currentDay) {
    const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), salaryDay);
    txnList.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: 2500,
      date: transactionDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
      transferaccountid: null,
      transferid: null,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transactionDate.toISOString(),
      updatedat: transactionDate.toISOString(),
    });
  }

  if (salaryDay2 <= currentDay) {
    const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), salaryDay2);
    txnList.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: 2500,
      date: transactionDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
      transferaccountid: null,
      transferid: null,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transactionDate.toISOString(),
      updatedat: transactionDate.toISOString(),
    });
  }

  // Monthly savings transfer (if day 5 has passed)
  if (5 <= currentDay) {
    const transferDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5);
    const transferOutId = generateId();
    const transferInId = generateId();

    txnList.push({
      id: transferOutId,
      name: "Transfer to Savings",
      amount: -200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: null,
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      transferid: transferInId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    txnList.push({
      id: transferInId,
      name: "Transfer from Checking",
      amount: 200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: transferOutId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });
  }

  // Credit card payment (if day 15 has passed)
  if (15 <= currentDay) {
    const paymentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15);
    const paymentOutId = generateId();
    const paymentInId = generateId();
    const paymentAmount = 650;

    txnList.push({
      id: paymentOutId,
      name: "Credit Card Payment",
      amount: -paymentAmount,
      date: paymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: "Credit Card Company",
      notes: null,
      tags: null,
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      transferid: paymentInId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: paymentDate.toISOString(),
      updatedat: paymentDate.toISOString(),
    });

    txnList.push({
      id: paymentInId,
      name: "Payment Received",
      amount: paymentAmount,
      date: paymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: null,
      notes: null,
      tags: null,
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: paymentOutId,
      tenantid: DEMO_TENANT_ID,
      isdeleted: false,
      createdby: DEMO_USER_ID,
      updatedby: null,
      createdat: paymentDate.toISOString(),
      updatedat: paymentDate.toISOString(),
    });
  }

  return txnList;
};

// =====================================
// SEED FUNCTIONS
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
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      description: g.description || null,
      type: g.type as any,
      createdat: g.createdat.toISOString(),
      updatedat: g.updatedat.toISOString(),
    }));
    await db.insert(transactionGroups).values(groupsToInsert as any);
    console.log(`Seeded ${groupsToInsert.length} transaction groups`);

    // Seed Transaction Categories
    const catsToInsert = transactionCategoriesData.map(c => ({
      ...c,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      description: c.description || null,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(transactionCategories).values(catsToInsert as any);
    console.log(`Seeded ${catsToInsert.length} transaction categories`);

    // Seed Account Categories
    const accCatsToInsert = accountCategoriesData.map(c => ({
      ...c,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(accountCategories).values(accCatsToInsert as any);
    console.log(`Seeded ${accCatsToInsert.length} account categories`);

    // Seed Configurations
    const configsToInsert = configurationsData.map(c => ({
      ...c,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(configurations).values(configsToInsert as any);
    console.log(`Seeded ${configsToInsert.length} configurations`);

    // Seed Transactions (Generated)
    const txnsData = generateDemoTransactionsData();
    const txnsToInsert = txnsData.map(t => ({
      ...t,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      isvoid: false,
      type: t.type as any,
      // Generated transactions already have ISO string dates
    }));
    await db.insert(transactions).values(txnsToInsert as any);
    console.log(`Seeded ${txnsToInsert.length} transactions`);

    // Seed Accounts (Calculated)
    const accountsList = getAccountsData(txnsData);
    const accsToInsert = accountsList.map(a => ({
      ...a,
      tenantid: DEMO_TENANT_ID,
      createdby: DEMO_USER_ID,
      owner: DEMO_USER_ID,
      createdat: a.createdat.toISOString(),
      updatedat: a.updatedat.toISOString(),
    }));
    await db.insert(accounts).values(accsToInsert as any);
    console.log(`Seeded ${accsToInsert.length} accounts`);

    console.log("Demo database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed demo database:", error);
    throw error;
  }
};

export const seedLocalDb = async () => {
  if (!isSqliteInitialized()) {
    throw new Error("Database not initialized");
  }

  const db = getSqliteDb();

  console.log("Seeding local database...");

  try {
    // Seed Transaction Groups
    const groupsToInsert = transactionGroupsData.map(g => ({
      ...g,
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      description: g.description || null,
      type: g.type as any,
      createdat: g.createdat.toISOString(),
      updatedat: g.updatedat.toISOString(),
    }));
    await db.insert(transactionGroups).values(groupsToInsert as any);

    // Seed Transaction Categories
    const catsToInsert = transactionCategoriesData.map(c => ({
      ...c,
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      description: c.description || null,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(transactionCategories).values(catsToInsert as any);

    // Seed Account Categories
    const accCatsToInsert = accountCategoriesData.map(c => ({
      ...c,
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(accountCategories).values(accCatsToInsert as any);

    // Seed Configurations
    const configsToInsert = configurationsData.map(c => ({
      ...c,
      tenantid: LOCAL_TENANT_ID,
      createdby: LOCAL_USER_ID,
      type: c.type as any,
      createdat: c.createdat.toISOString(),
      updatedat: c.updatedat.toISOString(),
    }));
    await db.insert(configurations).values(configsToInsert as any);

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
