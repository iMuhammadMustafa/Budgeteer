import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { TableNames } from "@/src/types/database/TableNames";
import {
    ExistingDataMap,
    EXPORT_VERSION,
    EXPORTABLE_TABLES,
    ExportData,
    ExportDataTables,
    IMPORT_ORDER,
    ImportResult,
    ImportSummary,
    ImportValidationResult,
    TABLE_SCHEMAS,
    ValidationError,
    ValidationWarning,
} from "@/src/types/ImportExport.Types";
import * as DocumentPicker from "expo-document-picker";
import * as ExpoFS from "expo-file-system";
import { Platform } from "react-native";
import { DataValidationService } from "./DataValidation.Service";

// ============================================================================
// ImportService
// ============================================================================

/**
 * Service for importing data into the database
 */
export class ImportService {
    /**
     * Pick a JSON file for import
     */
    static async pickImportFile(): Promise<{ success: boolean; content?: string; error?: string }> {
        try {
            if (Platform.OS === "web") {
                // Web: use file input
                return new Promise(resolve => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".json,application/json";
                    input.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = event => {
                                resolve({ success: true, content: event.target?.result as string });
                            };
                            reader.onerror = () => {
                                resolve({ success: false, error: "Failed to read file" });
                            };
                            reader.readAsText(file);
                        } else {
                            resolve({ success: false, error: "No file selected" });
                        }
                    };
                    input.click();
                });
            } else {
                // Native: use DocumentPicker
                const result = await DocumentPicker.getDocumentAsync({
                    type: "application/json",
                    copyToCacheDirectory: true,
                });

                if (result.canceled || !result.assets || result.assets.length === 0) {
                    return { success: false, error: "No file selected" };
                }

                const fileUri = result.assets[0].uri;
                const file = new ExpoFS.File(fileUri);
                const content = await file.text();

                return { success: true, content };
            }
        } catch (error) {
            console.error("Error picking import file:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }

    /**
     * Parse import file content
     */
    static parseImportFile(content: string): { success: boolean; data?: ExportData; error?: string } {
        try {
            const data = JSON.parse(content) as ExportData;

            // Basic structure validation
            if (!data.version || !data.data || !data.exportConfig) {
                return {
                    success: false,
                    error: "Invalid export file format. Missing required fields.",
                };
            }

            return { success: true, data };
        } catch {
            return {
                success: false,
                error: "Invalid JSON format. Please ensure the file is a valid Budgeteer export.",
            };
        }
    }

    /**
     * Validate import data against database constraints
     */
    static async validateImportData(
        data: ExportData,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<ImportValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Check version compatibility
        const versionWarning = DataValidationService.validateVersion(data.version, EXPORT_VERSION);
        if (versionWarning) {
            warnings.push(versionWarning);
        }

        // Build existing data map for dependency checking
        const existingData = await this.buildExistingDataMap(dbContext, tenantId);

        // Get tables that are in the import data
        const tablesInImport = Object.keys(data.data).filter(
            key =>
                data.data[key as keyof ExportDataTables] &&
                (data.data[key as keyof ExportDataTables] as any[]).length > 0,
        ) as TableNames[];

        // Validate each table in import order
        const recordCounts: Partial<Record<TableNames, number>> = {};
        const duplicatesSkipped: Partial<Record<TableNames, number>> = {};
        const recordsToImport: Partial<Record<TableNames, number>> = {};

        for (const tableName of IMPORT_ORDER) {
            const tableData = data.data[tableName as keyof ExportDataTables];
            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) continue;

            recordCounts[tableName] = tableData.length;

            // Check dependencies are included
            const dependencyErrors = DataValidationService.checkDependencyInclusion(tableName, tablesInImport);
            errors.push(...dependencyErrors);

            // Validate schema
            const schemaResult = DataValidationService.validateTableSchema(tableName, tableData);
            errors.push(...schemaResult.errors);

            // Validate enum values
            const enumResult = DataValidationService.validateEnumValues(tableName, tableData);
            errors.push(...enumResult.errors);

            // Check for duplicates
            const existingIds = existingData[tableName] || new Set();
            const duplicateResult = DataValidationService.checkDuplicates(tableName, tableData, existingIds);
            duplicatesSkipped[tableName] = duplicateResult.duplicateIds.length;
            recordsToImport[tableName] = duplicateResult.newIds.length;

            // Add duplicate warnings
            warnings.push(...DataValidationService.generateDuplicateWarnings(tableName, duplicateResult.duplicateIds));
        }

        // Validate foreign key dependencies
        const dependencyResult = DataValidationService.validateDependencies(data, existingData);
        errors.push(...dependencyResult.errors);

        const summary: ImportSummary = {
            tablesFound: tablesInImport,
            recordCounts,
            duplicatesSkipped,
            recordsToImport,
        };

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            summary,
        };
    }

    /**
     * Build a map of existing record IDs for each table
     * Queries ALL IDs across all tenants since WatermelonDB IDs are globally unique
     */
    private static async buildExistingDataMap(
        dbContext: IRepositoryFactory,
        _tenantId: string, // Kept for API compatibility but not used - we check all tenants
    ): Promise<ExistingDataMap> {
        const existingData: ExistingDataMap = {};

        for (const tableName of EXPORTABLE_TABLES) {
            try {
                // Get ALL IDs across all tenants for proper duplicate detection
                const ids = await this.getAllTableIds(tableName, dbContext);
                existingData[tableName] = new Set(ids);
            } catch (error) {
                console.error(`Error fetching existing IDs for ${tableName}:`, error);
                existingData[tableName] = new Set();
            }
        }

        return existingData;
    }

    /**
     * Get all record IDs from a table (across all tenants)
     * Used for duplicate detection since WatermelonDB IDs are globally unique
     */
    private static async getAllTableIds(
        table: TableNames,
        dbContext: IRepositoryFactory,
    ): Promise<string[]> {
        // Cast to any to access getAllIds method which exists on both base repositories
        // but is not in the interface (to avoid breaking changes)
        const repo = this.getRepository(table, dbContext) as any;
        if (repo && typeof repo.getAllIds === 'function') {
            return await repo.getAllIds();
        }
        return [];
    }

    /**
     * Get the repository for a table
     */
    private static getRepository(table: TableNames, dbContext: IRepositoryFactory): any {
        switch (table) {
            case TableNames.AccountCategories:
                return dbContext.AccountCategoryRepository();
            case TableNames.Accounts:
                return dbContext.AccountRepository();
            case TableNames.TransactionGroups:
                return dbContext.TransactionGroupRepository();
            case TableNames.TransactionCategories:
                return dbContext.TransactionCategoryRepository();
            case TableNames.Configurations:
                return dbContext.ConfigurationRepository();
            case TableNames.Recurrings:
                return dbContext.RecurringRepository();
            case TableNames.Transactions:
                return dbContext.TransactionRepository();
            default:
                return null;
        }
    }

    /**
     * Get records from a table (for a specific tenant)
     */
    private static async getTableRecords(
        table: TableNames,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<any[]> {
        const repo = this.getRepository(table, dbContext);
        if (repo) {
            return await repo.findAll(tenantId, { includeDeleted: true });
        }
        return [];
    }

    /**
     * Execute the import
     */
    static async executeImport(
        data: ExportData,
        dbContext: IRepositoryFactory,
        tenantId: string,
        targetTenantId?: string,
    ): Promise<ImportResult> {
        const startTime = Date.now();
        const importedCounts: Partial<Record<TableNames, number>> = {};
        const skippedCounts: Partial<Record<TableNames, number>> = {};
        const errors: ValidationError[] = [];

        // Use target tenant ID if provided (for cross-tenant import)
        const effectiveTenantId = targetTenantId || tenantId;

        // Get existing data to skip duplicates
        const existingData = await this.buildExistingDataMap(dbContext, effectiveTenantId);

        // Import tables in dependency order
        for (const tableName of IMPORT_ORDER) {
            const tableData = data.data[tableName as keyof ExportDataTables];
            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) continue;

            const existingIds = existingData[tableName] || new Set();
            const recordsToImportList = tableData.filter((record: any) => !existingIds.has(record.id));
            skippedCounts[tableName] = tableData.length - recordsToImportList.length;

            if (recordsToImportList.length === 0) {
                importedCounts[tableName] = 0;
                continue;
            }

            try {
                const importedCount = await this.importTableRecords(
                    tableName,
                    recordsToImportList,
                    dbContext,
                    effectiveTenantId,
                );
                importedCounts[tableName] = importedCount;
            } catch (error) {
                console.error(`Error importing ${tableName}:`, error);
                errors.push({
                    type: "INVALID_SCHEMA",
                    table: tableName,
                    message: `Failed to import ${tableName}: ${error instanceof Error ? error.message : "Unknown error"}`,
                });
                importedCounts[tableName] = 0;
            }
        }

        return {
            success: errors.length === 0,
            importedCounts,
            skippedCounts,
            errors,
            durationMs: Date.now() - startTime,
        };
    }

    /**
     * Import records for a single table
     */
    private static async importTableRecords(
        table: TableNames,
        records: any[],
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<number> {
        let importedCount = 0;

        for (const record of records) {
            try {
                // Prepare record with new tenant ID and sanitize fields
                const preparedRecord = this.prepareRecordForImport(record, tenantId, table);

                await this.createRecord(table, preparedRecord, dbContext, tenantId);
                importedCount++;
            } catch (error) {
                console.error(`Error importing record ${record.id} to ${table}:`, error);
                // Continue with other records
            }
        }

        return importedCount;
    }

    /**
     * Prepare a record for import (update tenant ID, sanitize fields)
     * Only includes fields defined in the table schema to avoid importing joined entity data
     */
    private static prepareRecordForImport(record: any, tenantId: string, table: TableNames): any {
        const schema = TABLE_SCHEMAS[table];
        if (!schema) {
            return {
                ...record,
                tenantid: tenantId,
            };
        }

        const allowedFields = new Set(Object.keys(schema.fields));
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(record)) {
            // Only include fields that are in the schema
            if (allowedFields.has(key)) {
                sanitized[key] = value;
            }
        }

        // Ensure tenantid is set to the target tenant
        sanitized.tenantid = tenantId;

        return sanitized;
    }

    /**
     * Create a record in the database
     */
    private static async createRecord(
        table: TableNames,
        record: any,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<void> {
        switch (table) {
            case TableNames.AccountCategories:
                await dbContext.AccountCategoryRepository().create(record, tenantId);
                break;
            case TableNames.Accounts:
                await dbContext.AccountRepository().create(record, tenantId);
                break;
            case TableNames.TransactionGroups:
                await dbContext.TransactionGroupRepository().create(record, tenantId);
                break;
            case TableNames.TransactionCategories:
                await dbContext.TransactionCategoryRepository().create(record, tenantId);
                break;
            case TableNames.Configurations:
                await dbContext.ConfigurationRepository().create(record, tenantId);
                break;
            case TableNames.Recurrings:
                await dbContext.RecurringRepository().create(record, tenantId);
                break;
            case TableNames.Transactions:
                await dbContext.TransactionRepository().create(record, tenantId);
                break;
            default:
                throw new Error(`Unknown table: ${table}`);
        }
    }
}

export default ImportService;
