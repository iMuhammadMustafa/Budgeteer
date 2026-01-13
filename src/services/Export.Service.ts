import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import {
    CSVExportOptions,
    EXPORT_VERSION,
    EXPORTABLE_TABLES,
    ExportConfig,
    ExportData,
    ExportDataTables,
    ExportMetadata,
    IMPORT_ORDER,
    TABLE_SCHEMAS,
} from "@/src/types/ImportExport.Types";
import { StorageMode } from "@/src/types/StorageMode";
import dayjs from "dayjs";
import * as ExpoFS from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";


export class ExportService {
    static async exportToJSON(
        tables: TableNames[],
        dbContext: IRepositoryFactory,
        tenantId: string,
        storageMode: StorageMode,
    ): Promise<ExportData> {
        const startTime = Date.now();
        const data: ExportDataTables = {};
        const recordCounts: Partial<Record<TableNames, number>> = {};

        // Filter to only supported tables and sort by import order
        const validTables = tables.filter(t => EXPORTABLE_TABLES.includes(t));
        const orderedTables = IMPORT_ORDER.filter(t => validTables.includes(t));

        // Export each table
        for (const table of orderedTables) {
            const tableData = await this.exportTable(table, dbContext, tenantId);
            (data as any)[table] = tableData;
            recordCounts[table] = tableData.length;
        }

        const exportConfig: ExportConfig = {
            includedTables: orderedTables as TableNames[],
            excludedTables: EXPORTABLE_TABLES.filter(t => !validTables.includes(t)) as TableNames[],
            tableOrder: orderedTables as TableNames[],
        };

        const metadata: ExportMetadata = {
            recordCounts,
            exportDurationMs: Date.now() - startTime,
        };

        return {
            version: EXPORT_VERSION,
            exportDate: dayjs().toISOString(),
            sourceStorageMode: storageMode,
            tenantId,
            exportConfig,
            data,
            metadata,
        };
    }

    private static async exportTable(
        table: TableNames,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<any[]> {
        try {
            let rawData: any[];
            switch (table) {
                case TableNames.AccountCategories:
                    rawData = await dbContext.AccountCategoryRepository().findAll(tenantId, {});
                    break;
                case TableNames.Accounts:
                    rawData = await dbContext.AccountRepository().findAll(tenantId, {});
                    break;
                case TableNames.TransactionGroups:
                    rawData = await dbContext.TransactionGroupRepository().findAll(tenantId, {});
                    break;
                case TableNames.TransactionCategories:
                    rawData = await dbContext.TransactionCategoryRepository().findAll(tenantId, {});
                    break;
                case TableNames.Configurations:
                    rawData = await dbContext.ConfigurationRepository().findAll(tenantId, {});
                    break;
                case TableNames.Recurrings:
                    rawData = await dbContext.RecurringRepository().findAll(tenantId, {});
                    break;
                case TableNames.Transactions:
                    rawData = await dbContext.TransactionRepository().findAll(tenantId, {});
                    break;
                default:
                    console.warn(`Unknown table for export: ${table}`);
                    return [];
            }

            // Sanitize data - only include fields defined in TABLE_SCHEMAS
            return this.sanitizeExportData(table, rawData);
        } catch (error) {
            console.error(`Error exporting table ${table}:`, error);
            return [];
        }
    }

    private static sanitizeExportData(table: TableNames, data: any[]): any[] {
        const schema = TABLE_SCHEMAS[table];
        if (!schema) return data;

        const allowedFields = new Set(Object.keys(schema.fields));

        return data.map(record => {
            const sanitized: Record<string, any> = {};
            for (const [key, value] of Object.entries(record)) {
                // Only include fields that are in the schema
                if (allowedFields.has(key)) {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        });
    }

    static async exportToCSV(
        options: CSVExportOptions,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<string> {
        const { table } = options;

        let data: any[] = [];

        // Check if it's a view or table
        if (Object.values(ViewNames).includes(table as ViewNames)) {
            data = await this.exportView(table as ViewNames, dbContext, tenantId);
        } else if (Object.values(TableNames).includes(table as TableNames)) {
            data = await this.exportTable(table as TableNames, dbContext, tenantId);
        }

        if (data.length === 0) {
            return "";
        }

        return this.convertToCSV(data);
    }

    private static async exportView(
        view: ViewNames,
        dbContext: IRepositoryFactory,
        tenantId: string,
    ): Promise<any[]> {
        try {
            const statsRepo = dbContext.StatsRepository();

            switch (view) {
                case ViewNames.TransactionsView:
                    return await dbContext.TransactionRepository().findAllFromView(tenantId, {});
                case ViewNames.StatsDailyTransactions:
                    return await statsRepo.getStatsDailyTransactions(tenantId);
                case ViewNames.StatsMonthlyTransactionsTypes:
                    return await statsRepo.getStatsMonthlyTransactionsTypes(tenantId);
                case ViewNames.StatsMonthlyCategoriesTransactions:
                    return await statsRepo.getStatsMonthlyCategoriesTransactions(tenantId);
                case ViewNames.StatsMonthlyAccountsTransactions:
                    return await statsRepo.getStatsMonthlyAccountsTransactions(tenantId);
                default:
                    console.warn(`View export not implemented: ${view}`);
                    return [];
            }
        } catch (error) {
            console.error(`Error exporting view ${view}:`, error);
            return [];
        }
    }

    private static convertToCSV(data: any[]): string {
        if (data.length === 0) return "";

        // Get all unique keys from all objects
        const allKeys = new Set<string>();
        for (const row of data) {
            Object.keys(row).forEach(key => allKeys.add(key));
        }
        const headers = Array.from(allKeys);

        // Build CSV
        const lines: string[] = [];

        // Header row
        lines.push(headers.map(h => this.escapeCSVField(h)).join(","));

        // Data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return this.escapeCSVField(this.formatCSVValue(value));
            });
            lines.push(values.join(","));
        }

        return lines.join("\n");
    }

    private static formatCSVValue(value: any): string {
        if (value === null || value === undefined) {
            return "";
        }
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        return String(value);
    }

    private static escapeCSVField(field: string): string {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }

    static async downloadFile(
        content: string,
        filename: string,
        type: "json" | "csv",
    ): Promise<{ success: boolean; path?: string; error?: string }> {
        const mimeType = type === "json" ? "application/json" : "text/csv";
        const extension = type === "json" ? ".json" : ".csv";
        const fullFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;

        try {
            if (Platform.OS === "web") {
                // Web: Create blob and download
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fullFilename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                return { success: true };
            } else {
                // Native: Write to file and share
                const file = new ExpoFS.File(ExpoFS.Paths.cache, fullFilename);
                await file.write(content);
                const fileUri = file.uri;

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType,
                        dialogTitle: `Export ${fullFilename}`,
                    });
                }

                return { success: true, path: fileUri };
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }

    static generateFilename(type: "json" | "csv", tableName?: string): string {
        const timestamp = dayjs().format("YYYY-MM-DD_HH-mm");
        if (tableName) {
            return `budgeteer_${tableName}_${timestamp}`;
        }
        return `budgeteer_export_${timestamp}`;
    }
}

export default ExportService;
