export enum TableNames {
  Transactions = "transactions",
  Accounts = "accounts",
  Categories = "categories",
  UserAccounts = "useraccounts",
  Profiles = "profiles",
  AccountCategories = "accountscategories",
  CategoryGroups = "categorygroups"
}

export enum ViewNames {
  // TransactionsCategoryDateSum = "transactionscategorydatesum",
  TransactionsView = "transactionsview",
  TransactionDistinct = "transactiondistinct",
  MonthlyTransactions = "monthlycategorytransactions",
  DailyTransactionsSummary = "dailytransactions",
}
export enum FunctionNames {
  UpdateAccountBalance = "updateaccountbalance",
}

export const transactionsKeys = {
  all: () => [
    TableNames.Transactions,
    TableNames.Accounts,
    TableNames.Categories,
    TableNames.UserAccounts,
    TableNames.Profiles,
    TableNames.AccountCategories,
    TableNames.CategoryGroups,
    ViewNames.TransactionsView,
    ViewNames.TransactionDistinct,
    ViewNames.MonthlyTransactions,
    ViewNames.DailyTransactionsSummary,
  ],
  list: () => [...transactionsKeys.all(), "list"],
  details: (name: string) => [...transactionsKeys.all(), "detail"],
  detail: (name: string, id: string) => [...transactionsKeys.details(name), id],
};
