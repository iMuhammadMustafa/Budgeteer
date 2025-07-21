export enum TableNames {
  Accounts = "accounts",
  AccountCategories = "accountcategories",
  Transactions = "transactions",
  TransactionCategories = "transactioncategories",
  TransactionGroups = "transactiongroups",
  Configurations = "configurations",
  Recurrings = "recurrings",
}

export enum ViewNames {
  TransactionsView = "transactionsview",
  SearchDistinctTransactions = "search_distincttransactions",
  StatsDailyTransactions = "stats_dailytransactions",
  StatsMonthlyTransactionsTypes = "stats_monthlytransactionstypes",
  StatsMonthlyCategoriesTransactions = "stats_monthlycategoriestransactions",
  StatsMonthlyAccountsTransactions = "stats_monthlyaccountstransactions",
  StatsNetWorthGrowth = "stats_networthgrowth",
  StatsTotalAccountBalance = "stats_totalaccountbalance",
  ViewAccountsWithRunningBalance = "view_accounts_with_running_balance",
}

export enum EnumNames {
  AccountTypes = "accounttypes",
  TransactionStatuses = "transactionstatuses",
  TransactionTypes = "transactiontypes",
}

export enum FunctionNames {
  UpdateAccountBalance = "updateaccountbalance",
  ApplyRecurringTransaction = "apply_recurring_transaction",
}
