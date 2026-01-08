import { StorageMode } from "./StorageMode";
import { TableNames, ViewNames } from "./database/TableNames";
import {
    Account,
    AccountCategory,
    Configuration,
    Recurring,
    Transaction,
    TransactionCategory,
    TransactionGroup,
} from "./database/Tables.Types";

// ============================================================================
// Export Types
// ============================================================================

/**
 * Configuration for what to include in an export
 */
export interface ExportConfig {
    includedTables: TableNames[];
    excludedTables: TableNames[];
    /** Order in which tables should be imported (respects dependencies) */
    tableOrder: TableNames[];
}

/**
 * Data structure for exported table data
 */
export interface ExportDataTables {
    accountcategories?: AccountCategory[];
    transactiongroups?: TransactionGroup[];
    accounts?: Account[];
    transactioncategories?: TransactionCategory[];
    configurations?: Configuration[];
    recurrings?: Recurring[];
    transactions?: Transaction[];
}

/**
 * Metadata about the export
 */
export interface ExportMetadata {
    recordCounts: Partial<Record<TableNames, number>>;
    exportDurationMs?: number;
}

/**
 * Complete export data structure
 */
export interface ExportData {
    version: string;
    exportDate: string;
    sourceStorageMode: StorageMode;
    tenantId: string;
    exportConfig: ExportConfig;
    data: ExportDataTables;
    metadata: ExportMetadata;
}

// ============================================================================
// Import Types
// ============================================================================

/**
 * Types of validation errors
 */
export type ValidationErrorType =
    | "INVALID_JSON"
    | "INVALID_SCHEMA"
    | "VERSION_MISMATCH"
    | "MISSING_DEPENDENCY"
    | "DUPLICATE_RECORD"
    | "INVALID_ENUM"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_FIELD_TYPE"
    | "FOREIGN_KEY_VIOLATION";

/**
 * A single validation error
 */
export interface ValidationError {
    type: ValidationErrorType;
    table?: TableNames;
    recordId?: string;
    field?: string;
    message: string;
    details?: Record<string, any>;
}

/**
 * A validation warning (non-blocking)
 */
export interface ValidationWarning {
    type: "DUPLICATE_SKIPPED" | "FIELD_IGNORED" | "VERSION_DIFFERENT";
    table?: TableNames;
    recordId?: string;
    message: string;
}

/**
 * Summary of what will be imported
 */
export interface ImportSummary {
    tablesFound: TableNames[];
    recordCounts: Partial<Record<TableNames, number>>;
    duplicatesSkipped: Partial<Record<TableNames, number>>;
    recordsToImport: Partial<Record<TableNames, number>>;
}

/**
 * Result of import validation
 */
export interface ImportValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: ImportSummary;
}

/**
 * Result of executing an import
 */
export interface ImportResult {
    success: boolean;
    importedCounts: Partial<Record<TableNames, number>>;
    skippedCounts: Partial<Record<TableNames, number>>;
    errors: ValidationError[];
    durationMs: number;
}

// ============================================================================
// Table Schema Definitions (for validation)
// ============================================================================

/**
 * Field type definitions
 */
export type FieldType = "string" | "number" | "boolean" | "array" | "date";

/**
 * Field schema definition
 */
export interface FieldSchema {
    type: FieldType;
    required: boolean;
    isEnum?: boolean;
    enumValues?: string[];
    isForeignKey?: boolean;
    foreignTable?: TableNames;
    foreignField?: string;
}

/**
 * Table schema definition
 */
export interface TableSchema {
    fields: Record<string, FieldSchema>;
    primaryKey: string;
    dependencies: TableNames[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Current export version
 */
export const EXPORT_VERSION = "1.0.0";

/**
 * Import order respecting foreign key dependencies
 * Level 0: No dependencies
 * Level 1: Depends on Level 0 tables
 * Level 2: Depends on Level 0 and/or Level 1 tables
 */
export const IMPORT_ORDER: readonly TableNames[] = [
    TableNames.AccountCategories, // Level 0: No dependencies
    TableNames.TransactionGroups, // Level 0: No dependencies
    TableNames.Configurations, // Level 0: No dependencies
    TableNames.Accounts, // Level 1: Depends on accountcategories
    TableNames.TransactionCategories, // Level 1: Depends on transactiongroups
    TableNames.Recurrings, // Level 2: Depends on accounts, transactioncategories
    TableNames.Transactions, // Level 2: Depends on accounts, transactioncategories
] as const;

/**
 * Tables that can be exported
 */
export const EXPORTABLE_TABLES: readonly TableNames[] = [
    TableNames.AccountCategories,
    TableNames.TransactionGroups,
    TableNames.Accounts,
    TableNames.TransactionCategories,
    TableNames.Configurations,
    TableNames.Recurrings,
    TableNames.Transactions,
] as const;

/**
 * Views that can be exported (CSV only)
 */
export const EXPORTABLE_VIEWS: readonly ViewNames[] = [
    ViewNames.TransactionsView,
    ViewNames.ViewAccountsWithRunningBalance,
    ViewNames.StatsDailyTransactions,
    ViewNames.StatsMonthlyTransactionsTypes,
    ViewNames.StatsMonthlyCategoriesTransactions,
    ViewNames.StatsMonthlyAccountsTransactions,
    ViewNames.StatsNetWorthGrowth,
    ViewNames.StatsTotalAccountBalance,
] as const;

/**
 * Account type enum values
 */
export const ACCOUNT_TYPE_ENUM = ["Asset", "Liability"] as const;

/**
 * Transaction type enum values
 */
export const TRANSACTION_TYPE_ENUM = [
    "Expense",
    "Income",
    "Transfer",
    "Adjustment",
    "Initial",
    "Refund",
] as const;

/**
 * Recurring type enum values
 */
export const RECURRING_TYPE_ENUM = ["Standard", "Transfer", "CreditCardPayment"] as const;

// ============================================================================
// Table Schemas for Validation
// ============================================================================

export const TABLE_SCHEMAS: Record<TableNames, TableSchema> = {
    [TableNames.AccountCategories]: {
        primaryKey: "id",
        dependencies: [],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            type: { type: "string", required: true, isEnum: true, enumValues: [...ACCOUNT_TYPE_ENUM] },
            color: { type: "string", required: false },
            icon: { type: "string", required: false },
            displayorder: { type: "number", required: false },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.Accounts]: {
        primaryKey: "id",
        dependencies: [TableNames.AccountCategories],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            balance: { type: "number", required: false },
            currency: { type: "string", required: false },
            color: { type: "string", required: false },
            icon: { type: "string", required: false },
            description: { type: "string", required: false },
            notes: { type: "string", required: false },
            owner: { type: "string", required: false },
            displayorder: { type: "number", required: false },
            statementdate: { type: "number", required: false },
            categoryid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.AccountCategories,
                foreignField: "id",
            },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.TransactionGroups]: {
        primaryKey: "id",
        dependencies: [],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            type: { type: "string", required: true, isEnum: true, enumValues: [...TRANSACTION_TYPE_ENUM] },
            color: { type: "string", required: false },
            icon: { type: "string", required: false },
            description: { type: "string", required: false },
            displayorder: { type: "number", required: false },
            budgetamount: { type: "number", required: false },
            budgetfrequency: { type: "string", required: false },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.TransactionCategories]: {
        primaryKey: "id",
        dependencies: [TableNames.TransactionGroups],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: false },
            type: { type: "string", required: true, isEnum: true, enumValues: [...TRANSACTION_TYPE_ENUM] },
            color: { type: "string", required: false },
            icon: { type: "string", required: false },
            description: { type: "string", required: false },
            displayorder: { type: "number", required: false },
            budgetamount: { type: "number", required: false },
            budgetfrequency: { type: "string", required: false },
            groupid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.TransactionGroups,
                foreignField: "id",
            },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.Configurations]: {
        primaryKey: "id",
        dependencies: [],
        fields: {
            id: { type: "string", required: true },
            key: { type: "string", required: true },
            value: { type: "string", required: true },
            type: { type: "string", required: true },
            table: { type: "string", required: true },
            tenantid: { type: "string", required: false },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.Recurrings]: {
        primaryKey: "id",
        dependencies: [TableNames.Accounts, TableNames.TransactionCategories],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            type: { type: "string", required: true, isEnum: true, enumValues: [...TRANSACTION_TYPE_ENUM] },
            recurringtype: { type: "string", required: false, isEnum: true, enumValues: [...RECURRING_TYPE_ENUM] },
            amount: { type: "number", required: false },
            currencycode: { type: "string", required: false },
            description: { type: "string", required: false },
            notes: { type: "string", required: false },
            payeename: { type: "string", required: false },
            recurrencerule: { type: "string", required: true },
            nextoccurrencedate: { type: "string", required: false },
            enddate: { type: "string", required: false },
            intervalmonths: { type: "number", required: false },
            isactive: { type: "boolean", required: false },
            isamountflexible: { type: "boolean", required: false },
            isdateflexible: { type: "boolean", required: false },
            autoapplyenabled: { type: "boolean", required: false },
            lastexecutedat: { type: "string", required: false },
            lastautoappliedat: { type: "string", required: false },
            failedattempts: { type: "number", required: false },
            maxfailedattempts: { type: "number", required: false },
            sourceaccountid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.Accounts,
                foreignField: "id",
            },
            transferaccountid: {
                type: "string",
                required: false,
                isForeignKey: true,
                foreignTable: TableNames.Accounts,
                foreignField: "id",
            },
            categoryid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.TransactionCategories,
                foreignField: "id",
            },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
    [TableNames.Transactions]: {
        primaryKey: "id",
        dependencies: [TableNames.Accounts, TableNames.TransactionCategories],
        fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: false },
            amount: { type: "number", required: true },
            date: { type: "string", required: true },
            type: { type: "string", required: true, isEnum: true, enumValues: [...TRANSACTION_TYPE_ENUM] },
            description: { type: "string", required: false },
            notes: { type: "string", required: false },
            payee: { type: "string", required: false },
            tags: { type: "array", required: false },
            isvoid: { type: "boolean", required: false },
            accountid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.Accounts,
                foreignField: "id",
            },
            categoryid: {
                type: "string",
                required: true,
                isForeignKey: true,
                foreignTable: TableNames.TransactionCategories,
                foreignField: "id",
            },
            transferaccountid: {
                type: "string",
                required: false,
                isForeignKey: true,
                foreignTable: TableNames.Accounts,
                foreignField: "id",
            },
            transferid: {
                type: "string",
                required: false,
                isForeignKey: true,
                foreignTable: TableNames.Transactions,
                foreignField: "id",
            },
            tenantid: { type: "string", required: true },
            isdeleted: { type: "boolean", required: false },
            createdat: { type: "string", required: false },
            createdby: { type: "string", required: false },
            updatedat: { type: "string", required: false },
            updatedby: { type: "string", required: false },
        },
    },
};

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Map of existing data for dependency validation
 */
export type ExistingDataMap = {
    [K in TableNames]?: Set<string>;
};

/**
 * Export format options
 */
export type ExportFormat = "json" | "csv";

/**
 * Export options for a single export operation
 */
export interface ExportOptions {
    tables: TableNames[];
    format: ExportFormat;
    includeDeleted?: boolean;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
    table: TableNames | ViewNames;
    includeDeleted?: boolean;
}
