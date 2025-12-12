import { ModelConfig } from "../types/ImportExport.types";
import { TableNames, ViewNames } from "../types/database/TableNames";

/**
 * Import/Export Configuration
 * Defines model ordering, dependencies, and validation rules
 */

export const MODEL_EXPORT_IMPORT_CONFIG: ModelConfig[] = [
  {
    tableName: TableNames.AccountCategories,
    displayName: "Account Categories",
    order: 1,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [],
    requiredFields: ["id", "name", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
  {
    tableName: TableNames.Accounts,
    displayName: "Accounts",
    order: 2,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [TableNames.AccountCategories],
    requiredFields: ["id", "name", "categoryid", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
  {
    tableName: TableNames.TransactionGroups,
    displayName: "Transaction Groups",
    order: 3,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [],
    requiredFields: ["id", "name", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
  {
    tableName: TableNames.TransactionCategories,
    displayName: "Transaction Categories",
    order: 4,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [TableNames.TransactionGroups],
    requiredFields: ["id", "name", "groupid", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
  {
    tableName: TableNames.Transactions,
    displayName: "Transactions",
    order: 5,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [TableNames.Accounts, TableNames.TransactionCategories],
    requiredFields: ["id", "accountid", "categoryid", "amount", "date", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["date", "createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
  {
    tableName: TableNames.Recurrings,
    displayName: "Recurring Transactions",
    order: 6,
    exportEnabled: true,
    importEnabled: true,
    dependencies: [TableNames.Accounts, TableNames.TransactionCategories],
    requiredFields: ["id", "accountid", "categoryid", "amount", "tenantid"],
    uniqueFields: ["id"],
    dateFields: ["startdate", "enddate", "nextdate", "createdat", "updatedat"],
    ignoredFields: [],
    ignoredExportFields: [],
    ignoredImportFields: [],
  },
];

/**
 * Views configuration (export only)
 */
export const VIEW_EXPORT_CONFIG = [
  {
    viewName: ViewNames.TransactionsView,
    displayName: "Transactions View",
    order: 7,
    exportEnabled: true,
    dateFields: ["date", "createdat", "updatedat"],
  },
  {
    viewName: ViewNames.ViewAccountsWithRunningBalance,
    displayName: "Accounts with Running Balance",
    order: 8,
    exportEnabled: true,
    dateFields: ["createdat", "updatedat"],
  },
  {
    viewName: ViewNames.SearchDistinctTransactions,
    displayName: "Distinct Transactions",
    order: 9,
    exportEnabled: true,
    dateFields: ["date"],
  },
  {
    viewName: ViewNames.StatsDailyTransactions,
    displayName: "Daily Transaction Statistics",
    order: 10,
    exportEnabled: true,
    dateFields: ["date"],
  },
  {
    viewName: ViewNames.StatsMonthlyTransactionsTypes,
    displayName: "Monthly Transaction Types",
    order: 11,
    exportEnabled: true,
    dateFields: [],
  },
  {
    viewName: ViewNames.StatsMonthlyCategoriesTransactions,
    displayName: "Monthly Categories Transactions",
    order: 12,
    exportEnabled: true,
    dateFields: [],
  },
  {
    viewName: ViewNames.StatsMonthlyAccountsTransactions,
    displayName: "Monthly Accounts Transactions",
    order: 13,
    exportEnabled: true,
    dateFields: [],
  },
  {
    viewName: ViewNames.StatsNetWorthGrowth,
    displayName: "Net Worth Growth",
    order: 14,
    exportEnabled: true,
    dateFields: [],
  },
  {
    viewName: ViewNames.StatsTotalAccountBalance,
    displayName: "Total Account Balance",
    order: 15,
    exportEnabled: true,
    dateFields: [],
  },
];

/**
 * Get model configuration by table name
 */
export function getModelConfig(tableName: TableNames): ModelConfig | undefined {
  return MODEL_EXPORT_IMPORT_CONFIG.find(config => config.tableName === tableName);
}

/**
 * Get all models in export/import order
 */
export function getModelsInOrder(): ModelConfig[] {
  return [...MODEL_EXPORT_IMPORT_CONFIG].sort((a, b) => a.order - b.order);
}

/**
 * Get models available for import
 */
export function getImportableModels(): ModelConfig[] {
  return MODEL_EXPORT_IMPORT_CONFIG.filter(config => config.importEnabled).sort((a, b) => a.order - b.order);
}

/**
 * Get models available for export
 */
export function getExportableModels(): ModelConfig[] {
  return MODEL_EXPORT_IMPORT_CONFIG.filter(config => config.exportEnabled).sort((a, b) => a.order - b.order);
}

/**
 * Get dependencies for a model
 */
export function getModelDependencies(tableName: TableNames): TableNames[] {
  const config = getModelConfig(tableName);
  return config?.dependencies || [];
}

/**
 * Validate model dependencies are satisfied
 */
export function validateDependencies(
  tableName: TableNames,
  importedModels: Set<TableNames>,
): { isValid: boolean; missingDependencies: TableNames[] } {
  const dependencies = getModelDependencies(tableName);
  const missingDependencies = dependencies.filter(dep => !importedModels.has(dep));

  return {
    isValid: missingDependencies.length === 0,
    missingDependencies,
  };
}

/**
 * Get file name for a model export
 */
export function getExportFileName(tableName: TableNames | string): string {
  const config = getModelConfig(tableName as TableNames);
  const displayName = config?.displayName || tableName;
  return `${displayName.toLowerCase().replace(/\s+/g, "_")}.csv`;
}

/**
 * Parse model name from file name
 */
export function parseModelFromFileName(fileName: string): TableNames | null {
  const nameWithoutExt = fileName.replace(/\.csv$/i, "");
  const config = MODEL_EXPORT_IMPORT_CONFIG.find(
    c => c.displayName.toLowerCase().replace(/\s+/g, "_") === nameWithoutExt.toLowerCase(),
  );
  return config?.tableName || null;
}

/**
 * Export configuration constants
 */
export const EXPORT_CONFIG = {
  CSV_ENCODING: "utf-8",
  DATE_FORMAT: "ISO8601", // YYYY-MM-DDTHH:mm:ss.sssZ
  BATCH_SIZE: 1000, // Number of records to process in a batch
  MAX_FILE_SIZE_MB: 50,
};

/**
 * Import configuration constants
 */
export const IMPORT_CONFIG = {
  MAX_FILE_SIZE_MB: 50,
  BATCH_SIZE: 100, // Number of records to import in a batch
  SKIP_DUPLICATES_DEFAULT: true,
  VALIDATE_ONLY_DEFAULT: false,
  CONTINUE_ON_ERROR_DEFAULT: false,
};
