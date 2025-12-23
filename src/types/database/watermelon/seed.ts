import { Database } from "@nozbe/watermelondb";
import { ConfigurationTypes } from "../Config.Types";
import { TableNames } from "../TableNames";
import { WATERMELONDB_DEFAULT_TENANT_ID, WATERMELONDB_DEFAULT_USER_ID } from "./constants";
import { getWatermelonDB } from "./index";
import AccountCategory from "./models/AccountCategory";
import Configuration from "./models/Configuration";
import TransactionCategory from "./models/TransactionCategory";
import TransactionGroup from "./models/TransactionGroup";

const transactionGroupsData = [
  {
    id: "0ab0d9b5-76e6-43fb-9aba-543c7655aafb",
    description: null,
    icon: "Drama",
    color: "error-100",
    name: "Entertainment",
    type: "Expense",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-05T20:12:34.066-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-05T20:12:34.066-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-10T17:04:17.938-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-10T17:04:17.938-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-22T20:55:02.633308-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-22T20:55:02.633308-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-08T12:57:01.011229-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:01.011229-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-08T12:57:36.788949-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:36.788949-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-28T18:03:23.525252-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-28T18:03:23.525252-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-08T16:24:43.531759-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-08T16:24:43.531759-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
    icon: "PiggyBank",
    displayorder: 1000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "b717a537-78a2-4a78-8da9-2598faca1cec",
    name: "Debit Card",
    type: "Asset",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-02T15:06:01.929132-06:00"),
    updatedby: WATERMELONDB_DEFAULT_USER_ID,
    updatedat: new Date("2025-01-02T15:06:01.929132-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
    icon: "Banknote",
    displayorder: 2000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    name: "Credit Card",
    type: "Liability",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
    icon: "CreditCard",
    displayorder: 3000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "5d192f78-41e8-413c-9457-c9d68f9decf1",
    name: "Cash",
    type: "Asset",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
    icon: "Banknote",
    displayorder: 4000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "d9833b85-1523-4a01-8c82-10fbe3c1ad18",
    name: "Gift Card",
    type: "Asset",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-01-02T07:43:37.280129-06:00"),
    updatedby: WATERMELONDB_DEFAULT_USER_ID,
    updatedat: new Date("2025-01-02T07:43:37.280129-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
    icon: "WalletCards",
    displayorder: 5000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "bbefb010-bcf9-4552-b41f-c4c3053b4357",
    name: "Loan",
    type: "Liability",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
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
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
  },
  {
    id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    tablename: TableNames.TransactionCategories,
    type: "Other",
    key: "id",
    value: "55485de3-113a-42fa-a9a8-68f151b5d233",
    createdby: WATERMELONDB_DEFAULT_USER_ID,
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEFAULT_TENANT_ID,
  },
];

/**
 * Checks if the database has already been seeded
 */
export const isSeeded = async (database: Database): Promise<boolean> => {
  const transactionGroups = await database.get(TransactionGroup.table).query().fetch();
  return transactionGroups.length > 0;
};

/**
 * Seeds the WatermelonDB database with initial data
 */
export const seedWatermelonDB = async (database?: Database): Promise<void> => {
  try {
    const db = database || (await getWatermelonDB());

    // Check if already seeded
    if (await isSeeded(db)) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding WatermelonDB database...");

    await db.write(async () => {
      // Seed Transaction Groups first (parent records)
      console.log("Seeding Transaction Groups...");
      for (const groupData of transactionGroupsData) {
        await db.get(TransactionGroup.table).create(group => {
          const transactionGroup = group as TransactionGroup;
          transactionGroup._raw.id = groupData.id;
          transactionGroup.name = groupData.name;
          transactionGroup.type = groupData.type as any;
          transactionGroup.color = groupData.color;
          transactionGroup.icon = groupData.icon;
          transactionGroup.description = groupData.description;
          transactionGroup.displayorder = groupData.displayorder;
          transactionGroup.budgetamount = groupData.budgetamount;
          transactionGroup.budgetfrequency = groupData.budgetfrequency;
          transactionGroup.tenantid = groupData.tenantid;
          transactionGroup.isdeleted = groupData.isdeleted;
          transactionGroup.createdby = groupData.createdby;
          transactionGroup.updatedby = groupData.updatedby;
          transactionGroup.createdat = groupData.createdat.toISOString();
          transactionGroup.updatedat = groupData.updatedat.toISOString();
        });
      }

      // Seed Account Categories
      console.log("Seeding Account Categories...");
      for (const categoryData of accountCategoriesData) {
        await db.get(AccountCategory.table).create(category => {
          const accountCategory = category as AccountCategory;
          accountCategory._raw.id = categoryData.id;
          accountCategory.name = categoryData.name;
          accountCategory.type = categoryData.type as any;
          accountCategory.color = categoryData.color;
          accountCategory.icon = categoryData.icon;
          accountCategory.displayorder = categoryData.displayorder;
          accountCategory.tenantid = categoryData.tenantid;
          accountCategory.isdeleted = categoryData.isdeleted;
          accountCategory.createdby = categoryData.createdby || null;
          accountCategory.updatedby = categoryData.updatedby || null;
          accountCategory.createdat = categoryData.createdat.toISOString();
          accountCategory.updatedat = categoryData.updatedat?.toISOString() || null;
        });
      }

      // Seed Transaction Categories (child records)
      console.log("Seeding Transaction Categories...");
      for (const categoryData of transactionCategoriesData) {
        await db.get(TransactionCategory.table).create(category => {
          const transactionCategory = category as TransactionCategory;
          transactionCategory._raw.id = categoryData.id;
          transactionCategory.name = categoryData.name;
          transactionCategory.groupid = categoryData.groupid;
          transactionCategory.type = categoryData.type as any;
          transactionCategory.color = categoryData.color;
          transactionCategory.icon = categoryData.icon;
          transactionCategory.description = categoryData.description;
          transactionCategory.displayorder = categoryData.displayorder;
          transactionCategory.budgetamount = categoryData.budgetamount;
          transactionCategory.budgetfrequency = categoryData.budgetfrequency;
          transactionCategory.tenantid = categoryData.tenantid;
          transactionCategory.isdeleted = categoryData.isdeleted;
          transactionCategory.createdby = categoryData.createdby;
          transactionCategory.updatedby = categoryData.updatedby;
          transactionCategory.createdat = categoryData.createdat.toISOString();
          transactionCategory.updatedat = categoryData.updatedat.toISOString();
        });
      }

      // Seed Configurations
      console.log("Seeding Configurations...");
      for (const configData of configurationsData) {
        await db.get(Configuration.table).create(config => {
          const configuration = config as Configuration;
          configuration._raw.id = configData.id;
          configuration.key = configData.key;
          configuration.value = configData.value;
          configuration.type = configData.type as any;
          configuration.tablename = configData.tablename;
          configuration.tenantid = configData.tenantid;
          configuration.isdeleted = configData.isdeleted;
          configuration.createdby = configData.createdby;
          configuration.updatedby = configData.updatedby;
          configuration.createdat = configData.createdat.toISOString();
          configuration.updatedat = configData.updatedat.toISOString();
        });
      }
    });

    console.log("WatermelonDB database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed WatermelonDB database:", error);
    throw error;
  }
};

/**
 * Clears all seed data from the database
 */
export const clearSeedData = async (database?: Database): Promise<void> => {
  console.log("Starting to clear seed data from WatermelonDB database...");
  try {
    const db = database || (await getWatermelonDB());

    console.log("Clearing seed data from WatermelonDB database...");

    await db.write(async () => {
      // Clear in reverse order of dependencies
      const configurations = await db.get(Configuration.table).query().fetch();
      for (const config of configurations) {
        await config.destroyPermanently();
      }

      const transactionCategories = await db.get(TransactionCategory.table).query().fetch();
      for (const category of transactionCategories) {
        await category.destroyPermanently();
      }

      const accountCategories = await db.get(AccountCategory.table).query().fetch();
      for (const category of accountCategories) {
        await category.destroyPermanently();
      }

      const transactionGroups = await db.get(TransactionGroup.table).query().fetch();
      for (const group of transactionGroups) {
        await group.destroyPermanently();
      }
    });

    console.log("Seed data cleared successfully!");
  } catch (error) {
    console.error("Failed to clear seed data:", error);
    throw error;
  }
};

export default {
  seedWatermelonDB,
  isSeeded,
  clearSeedData,
};
