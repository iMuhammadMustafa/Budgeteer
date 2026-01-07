import { Database } from "@nozbe/watermelondb";
import GenerateUuid from "../../../utils/uuid.Helper";
import { ConfigurationTypes } from "../Config.Types";
import { TableNames } from "../TableNames";
import { WATERMELONDB_DEMO_TENANT_ID, WATERMELONDB_DEMO_USER_ID } from "./constants";
import { getWatermelonDB } from "./index";
import Account from "./models/Account";
import AccountCategory from "./models/AccountCategory";
import Configuration from "./models/Configuration";
import Transaction from "./models/Transaction";
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-27T17:25:55.155234-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-27T17:25:55.155234-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-05T20:12:34.066-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-05T20:12:34.066-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-10T17:04:17.938-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-10T17:04:17.938-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-22T20:55:02.633308-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-22T20:55:02.633308-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-08T12:57:01.011229-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:01.011229-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-08T12:57:36.788949-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-08T12:57:36.788949-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:15:08.12299-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:15:08.12299-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-28T18:03:23.525252-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-28T18:03:23.525252-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-08T16:24:43.531759-06:00"),
    updatedby: null,
    updatedat: new Date("2025-01-08T16:24:43.531759-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-06T17:32:00.434296-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-06T17:32:00.434296-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    icon: "PiggyBank",
    displayorder: 1000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "b717a537-78a2-4a78-8da9-2598faca1cec",
    name: "Debit Card",
    type: "Asset",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-02T15:06:01.929132-06:00"),
    updatedby: WATERMELONDB_DEMO_USER_ID,
    updatedat: new Date("2025-01-02T15:06:01.929132-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    icon: "Banknote",
    displayorder: 2000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699",
    name: "Credit Card",
    type: "Liability",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    icon: "CreditCard",
    displayorder: 3000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "5d192f78-41e8-413c-9457-c9d68f9decf1",
    name: "Cash",
    type: "Asset",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    icon: "Banknote",
    displayorder: 4000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "d9833b85-1523-4a01-8c82-10fbe3c1ad18",
    name: "Gift Card",
    type: "Asset",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-01-02T07:43:37.280129-06:00"),
    updatedby: WATERMELONDB_DEMO_USER_ID,
    updatedat: new Date("2025-01-02T07:43:37.280129-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    icon: "WalletCards",
    displayorder: 5000,
    color: "error-100",
    statementdate: null,
  },
  {
    id: "bbefb010-bcf9-4552-b41f-c4c3053b4357",
    name: "Loan",
    type: "Liability",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2024-09-01T20:32:12.976757-05:00"),
    updatedby: null,
    updatedat: new Date("2024-09-01T20:32:12.976757-05:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
  },
  {
    id: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7",
    tablename: TableNames.TransactionCategories,
    type: "Other",
    key: "id",
    value: "55485de3-113a-42fa-a9a8-68f151b5d233",
    createdby: WATERMELONDB_DEMO_USER_ID,
    createdat: new Date("2025-02-02T19:02:26.572-06:00"),
    updatedby: null,
    updatedat: new Date("2025-02-02T19:02:26.572-06:00"),
    isdeleted: false,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
  },
];

// Demo Seed Accounts Data
// This function is defined after generateTransactionsData so it can calculate balances
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 1,
      categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", // Bank category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 2,
      categoryid: "ddb8fefe-4b2e-4bb9-9c60-07de2e7286e7", // Bank category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 3,
      categoryid: "fdb5a25c-b05c-4e36-9c74-1c02b8cee699", // Credit Card category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 4,
      categoryid: "5d192f78-41e8-413c-9457-c9d68f9decf1", // Cash category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 5,
      categoryid: "bbefb010-bcf9-4552-b41f-c4c3053b4357", // Loan category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 6,
      categoryid: "d9833b85-1523-4a01-8c82-10fbe3c1ad18", // Gift Card category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
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
      owner: WATERMELONDB_DEMO_USER_ID,
      displayorder: 7,
      categoryid: "d9833b85-1523-4a01-8c82-10fbe3c1ad18", // Gift Card category
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: accountCreationDate,
      updatedat: accountCreationDate,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
    },
  ];
};

// Demo Seed Transactions Data
// Helper function to generate dates relative to today
const generateTransactionsData = () => {
  const transactions: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight
  const twoYearsAgo = new Date(today);
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  const generateId = () => GenerateUuid();

  // 1. Opening Balance Transactions (2 years ago)
  const openingBalanceDate = new Date(twoYearsAgo);
  openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);

  // Opening balance for Checking Account
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 500,
    date: openingBalanceDate.toISOString(),
    description: "Initial account balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9", // Account Operations category
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Savings Account
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 50000,
    date: openingBalanceDate.toISOString(),
    description: "Initial account balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Credit Card (negative)
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: -2000,
    date: openingBalanceDate.toISOString(),
    description: "Initial credit card balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Cash
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 200,
    date: openingBalanceDate.toISOString(),
    description: "Initial cash balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Loan (negative)
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: -50000,
    date: openingBalanceDate.toISOString(),
    description: "Initial loan balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Amazon Gift Card
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 100,
    date: openingBalanceDate.toISOString(),
    description: "Initial gift card balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7db8c90d1e2f",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // Opening balance for Starbucks Gift Card
  transactions.push({
    id: generateId(),
    name: "Opening Balance",
    amount: 50,
    date: openingBalanceDate.toISOString(),
    description: "Initial gift card balance",
    payee: null,
    notes: null,
    tags: ["opening-balance"],
    type: "Initial",
    isvoid: false,
    accountid: "019313ea-448f-7c15-9b2e-7da1b2c3d4e5",
    categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
    transferaccountid: null,
    transferid: null,
    tenantid: WATERMELONDB_DEMO_TENANT_ID,
    isdeleted: false,
    createdby: WATERMELONDB_DEMO_USER_ID,
    updatedby: null,
    createdat: openingBalanceDate.toISOString(),
    updatedat: openingBalanceDate.toISOString(),
  });

  // 2. Bi-weekly Salary Deposits (for last 2 years)
  // Starting from 2 years ago, every 14 days
  const salaryAmount = 2500; // Bi-weekly salary
  let salaryDate = new Date(twoYearsAgo);

  while (salaryDate <= today) {
    transactions.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: salaryAmount,
      date: salaryDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: ["income", "salary"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea", // Salary category
      transferaccountid: null,
      transferid: null,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: salaryDate.toISOString(),
      updatedat: salaryDate.toISOString(),
    });

    salaryDate.setDate(salaryDate.getDate() + 14);
  }

  // 3. Monthly Transfers from Checking to Savings ($200)
  let transferDate = new Date(twoYearsAgo);
  transferDate.setDate(5); // 5th of each month

  while (transferDate <= today) {
    const transferOutId = generateId();
    const transferInId = generateId();

    // Transfer out from checking
    transactions.push({
      id: transferOutId,
      name: "Transfer to Savings",
      amount: -200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: ["transfer", "savings"],
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      transferid: transferInId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    // Transfer in to savings
    transactions.push({
      id: transferInId,
      name: "Transfer from Checking",
      amount: 200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: ["transfer", "savings"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: transferOutId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    transferDate.setMonth(transferDate.getMonth() + 1);
  }

  // 4. Monthly Credit Card Payments from Checking
  let ccPaymentDate = new Date(twoYearsAgo);
  ccPaymentDate.setDate(15); // 15th of each month

  while (ccPaymentDate <= today) {
    const paymentAmount = 500 + Math.floor(Math.random() * 300); // $500-800
    const paymentOutId = generateId();
    const paymentInId = generateId();

    // Payment out from checking
    transactions.push({
      id: paymentOutId,
      name: "Credit Card Payment",
      amount: -paymentAmount,
      date: ccPaymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: "Credit Card Company",
      notes: null,
      tags: ["payment", "credit-card"],
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      transferid: paymentInId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: ccPaymentDate.toISOString(),
      updatedat: ccPaymentDate.toISOString(),
    });

    // Payment received on credit card (reduces balance)
    transactions.push({
      id: paymentInId,
      name: "Payment Received",
      amount: paymentAmount,
      date: ccPaymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: null,
      notes: null,
      tags: ["payment", "credit-card"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: paymentOutId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: ccPaymentDate.toISOString(),
      updatedat: ccPaymentDate.toISOString(),
    });

    ccPaymentDate.setMonth(ccPaymentDate.getMonth() + 1);
  }

  // 4.1 Monthly Auto Loan Payments from Checking -> Auto Loan ($500)
  let loanPaymentDate = new Date(twoYearsAgo);
  loanPaymentDate.setDate(1); // Pay on the 1st of each month

  while (loanPaymentDate <= today) {
    const loanPaymentOutId = generateId();
    const loanPaymentInId = generateId();
    const loanPaymentAmount = 500; // fixed monthly payment

    // Outgoing transfer from checking (payment)
    transactions.push({
      id: loanPaymentOutId,
      name: "Loan Payment",
      amount: -loanPaymentAmount,
      date: loanPaymentDate.toISOString(),
      description: "Monthly auto loan payment",
      payee: "Auto Loan",
      notes: null,
      tags: ["transfer", "loan"],
      type: "Transfer",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
      transferid: loanPaymentInId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: loanPaymentDate.toISOString(),
      updatedat: loanPaymentDate.toISOString(),
    });

    // Incoming transfer to loan (reduces loan balance)
    transactions.push({
      id: loanPaymentInId,
      name: "Loan Payment Received",
      amount: loanPaymentAmount,
      date: loanPaymentDate.toISOString(),
      description: "Monthly auto loan payment",
      payee: null,
      notes: null,
      tags: ["transfer", "loan"],
      type: "Transfer",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d8e9f0a1b2c",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: loanPaymentOutId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: loanPaymentDate.toISOString(),
      updatedat: loanPaymentDate.toISOString(),
    });

    loanPaymentDate.setMonth(loanPaymentDate.getMonth() + 1);
  }

  // 5. Random Cash Deposits from Checking (small amounts)
  // Random 3-5 times per month
  let cashDepositDate = new Date(twoYearsAgo);

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
      transactions.push({
        id: cashOutId,
        name: "Cash Withdrawal",
        amount: -cashAmount,
        date: depositDate.toISOString(),
        description: "ATM withdrawal",
        payee: null,
        notes: null,
        tags: ["transfer", "cash"],
        type: "Expense",
        isvoid: false,
        accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
        categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
        transferaccountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
        transferid: cashInId,
        tenantid: WATERMELONDB_DEMO_TENANT_ID,
        isdeleted: false,
        createdby: WATERMELONDB_DEMO_USER_ID,
        updatedby: null,
        createdat: depositDate.toISOString(),
        updatedat: depositDate.toISOString(),
      });

      // Deposit to cash
      transactions.push({
        id: cashInId,
        name: "Cash Deposit",
        amount: cashAmount,
        date: depositDate.toISOString(),
        description: "ATM withdrawal",
        payee: null,
        notes: null,
        tags: ["transfer", "cash"],
        type: "Income",
        isvoid: false,
        accountid: "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a",
        categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
        transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
        transferid: cashOutId,
        tenantid: WATERMELONDB_DEMO_TENANT_ID,
        isdeleted: false,
        createdby: WATERMELONDB_DEMO_USER_ID,
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

  let expenseDate = new Date(twoYearsAgo);

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
          accountId = Math.random() < 0.7 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
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
          accountId = Math.random() < 0.8 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        }

        transactions.push({
          id: generateId(),
          name: category.name,
          amount: -amount,
          date: transactionDate.toISOString(),
          description: `${category.name} expense`,
          payee: `${category.name} Vendor`,
          notes: null,
          tags: ["expense"],
          type: "Expense",
          isvoid: false,
          accountid: accountId,
          categoryid: category.id,
          transferaccountid: null,
          transferid: null,
          tenantid: WATERMELONDB_DEMO_TENANT_ID,
          isdeleted: false,
          createdby: WATERMELONDB_DEMO_USER_ID,
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
          accountId = Math.random() < 0.6 ? "019313ea-448f-7c15-9b2e-7da1b2c3d4e5" : "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a";
        } else if (pattern.name === "Fast Food" || pattern.name.includes("Snack")) {
          accountId =
            Math.random() < 0.4 ? "019313ea-448f-7c15-9b2e-7d1c2d3e4f5a" : Math.random() < 0.7 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (pattern.name === "Grocery Store" || pattern.name === "Gas Station") {
          accountId = Math.random() < 0.8 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        } else if (pattern.name === "Restaurant") {
          accountId = Math.random() < 0.6 ? "019313ea-448f-7c15-9b2e-7d5d6e7f8a90" : "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b";
        }

        transactions.push({
          id: generateId(),
          name: pattern.name,
          amount: -amount,
          date: transactionDate.toISOString(),
          description: `${pattern.name} purchase`,
          payee: pattern.name,
          notes: null,
          tags: ["expense", "current-month"],
          type: "Expense",
          isvoid: false,
          accountid: accountId,
          categoryid: pattern.categoryid,
          transferaccountid: null,
          transferid: null,
          tenantid: WATERMELONDB_DEMO_TENANT_ID,
          isdeleted: false,
          createdby: WATERMELONDB_DEMO_USER_ID,
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

      transactions.push({
        id: generateId(),
        name: bill.name,
        amount: -bill.amount,
        date: transactionDate.toISOString(),
        description: `Monthly ${bill.name}`,
        payee: bill.name.replace(" Payment", "").replace(" Bill", ""),
        notes: null,
        tags: ["bill", "current-month"],
        type: "Expense",
        isvoid: false,
        accountid: bill.account,
        categoryid: bill.categoryid,
        transferaccountid: null,
        transferid: null,
        tenantid: WATERMELONDB_DEMO_TENANT_ID,
        isdeleted: false,
        createdby: WATERMELONDB_DEMO_USER_ID,
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

      transactions.push({
        id: generateId(),
        name: purchase.name,
        amount: -purchase.amount,
        date: transactionDate.toISOString(),
        description: `${purchase.name} purchase`,
        payee: purchase.name,
        notes: null,
        tags: ["expense", "current-month"],
        type: "Expense",
        isvoid: false,
        accountid: purchase.account,
        categoryid: purchase.categoryid,
        transferaccountid: null,
        transferid: null,
        tenantid: WATERMELONDB_DEMO_TENANT_ID,
        isdeleted: false,
        createdby: WATERMELONDB_DEMO_USER_ID,
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
    transactions.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: 2500,
      date: transactionDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: ["income", "salary", "current-month"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
      transferaccountid: null,
      transferid: null,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: transactionDate.toISOString(),
      updatedat: transactionDate.toISOString(),
    });
  }

  if (salaryDay2 <= currentDay) {
    const transactionDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), salaryDay2);
    transactions.push({
      id: generateId(),
      name: "Salary Deposit",
      amount: 2500,
      date: transactionDate.toISOString(),
      description: "Bi-weekly paycheck",
      payee: "TechCorp Inc.",
      notes: null,
      tags: ["income", "salary", "current-month"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "8be7e399-75fb-4da0-b043-3b7d7e0082ea",
      transferaccountid: null,
      transferid: null,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
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

    transactions.push({
      id: transferOutId,
      name: "Transfer to Savings",
      amount: -200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: ["transfer", "savings", "current-month"],
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      transferid: transferInId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: transferDate.toISOString(),
      updatedat: transferDate.toISOString(),
    });

    transactions.push({
      id: transferInId,
      name: "Transfer from Checking",
      amount: 200,
      date: transferDate.toISOString(),
      description: "Monthly savings transfer",
      payee: null,
      notes: null,
      tags: ["transfer", "savings", "current-month"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d2d3e4f5a6b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: transferOutId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
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

    transactions.push({
      id: paymentOutId,
      name: "Credit Card Payment",
      amount: -paymentAmount,
      date: paymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: "Credit Card Company",
      notes: null,
      tags: ["payment", "credit-card", "current-month"],
      type: "Expense",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      transferid: paymentInId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: paymentDate.toISOString(),
      updatedat: paymentDate.toISOString(),
    });

    transactions.push({
      id: paymentInId,
      name: "Payment Received",
      amount: paymentAmount,
      date: paymentDate.toISOString(),
      description: "Monthly credit card payment",
      payee: null,
      notes: null,
      tags: ["payment", "credit-card", "current-month"],
      type: "Income",
      isvoid: false,
      accountid: "019313ea-448f-7c15-9b2e-7d5d6e7f8a90",
      categoryid: "5b3daefa-e88c-43f9-a8e4-0c4aab18fcf9",
      transferaccountid: "019313ea-448f-7c15-9b2e-7d7d8e9f0a1b",
      transferid: paymentOutId,
      tenantid: WATERMELONDB_DEMO_TENANT_ID,
      isdeleted: false,
      createdby: WATERMELONDB_DEMO_USER_ID,
      updatedby: null,
      createdat: paymentDate.toISOString(),
      updatedat: paymentDate.toISOString(),
    });
  }

  return transactions;
};

const transactionsData = generateTransactionsData();

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
export const seedWatermelonDemoDB = async (database?: Database): Promise<void> => {
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

      // Seed Accounts
      console.log("Seeding Accounts...");
      const accountsData = getAccountsData(transactionsData);
      for (const accountData of accountsData) {
        await db.get(Account.table).create(account => {
          const acc = account as Account;
          acc._raw.id = accountData.id;
          acc.name = accountData.name;
          acc.balance = accountData.balance;
          acc.currency = accountData.currency;
          acc.color = accountData.color;
          acc.icon = accountData.icon;
          acc.description = accountData.description;
          acc.notes = accountData.notes;
          acc.owner = accountData.owner;
          acc.displayorder = accountData.displayorder;
          acc.categoryid = accountData.categoryid;
          acc.tenantid = accountData.tenantid;
          acc.isdeleted = accountData.isdeleted;
          acc.createdby = accountData.createdby;
          acc.updatedby = accountData.updatedby;
          acc.createdat = accountData.createdat.toISOString();
          acc.updatedat = accountData.updatedat?.toISOString() || null;
        });
      }

      // Seed Transactions
      console.log(`Seeding ${transactionsData.length} Transactions...`);
      for (const transactionData of transactionsData) {
        await db.get(Transaction.table).create(transaction => {
          const txn = transaction as Transaction;
          txn._raw.id = transactionData.id;
          txn.name = transactionData.name;
          txn.amount = transactionData.amount;
          txn.date = transactionData.date;
          txn.description = transactionData.description;
          txn.payee = transactionData.payee;
          txn.notes = transactionData.notes;
          txn.tags = transactionData.tags;
          txn.type = transactionData.type as any;
          txn.isvoid = transactionData.isvoid;
          txn.accountid = transactionData.accountid;
          txn.categoryid = transactionData.categoryid;
          txn.transferaccountid = transactionData.transferaccountid;
          txn.transferid = transactionData.transferid;
          txn.tenantid = transactionData.tenantid;
          txn.isdeleted = transactionData.isdeleted;
          txn.createdby = transactionData.createdby;
          txn.updatedby = transactionData.updatedby;
          txn.createdat = transactionData.createdat;
          txn.updatedat = transactionData.updatedat;
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
  try {
    const db = database || (await getWatermelonDB());

    console.log("Clearing seed data from WatermelonDB database...");

    await db.write(async () => {
      // Clear in reverse order of dependencies
      const transactions = await db.get(Transaction.table).query().fetch();
      for (const transaction of transactions) {
        await transaction.destroyPermanently();
      }

      const accounts = await db.get(Account.table).query().fetch();
      for (const account of accounts) {
        await account.destroyPermanently();
      }

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
  seedWatermelonDemoDB,
  isSeeded,
  clearSeedData,
};
