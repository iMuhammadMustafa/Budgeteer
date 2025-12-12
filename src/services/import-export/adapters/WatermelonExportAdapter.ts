import { getExportFileName, getModelConfig } from "@/src/config/ImportExport.config";
import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { ExportedFile, ExportPhase, ExportProgress } from "@/src/types/ImportExport.types";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { formatValueForCSV, generateCSV } from "@/src/utils/csv.utils";
import { filterObjectFields } from "@/src/utils/import-validation.utils";
import { IExportAdapter } from "./IExportAdapter";

/**
 * WatermelonDB Export Adapter
 * Implements export functionality for WatermelonDB storage mode (Local/Demo)
 */
export class WatermelonExportAdapter implements IExportAdapter {
  private repositoryFactory: IRepositoryFactory;
  private tenantId: string;

  constructor(repositoryFactory: IRepositoryFactory, tenantId: string = "local") {
    this.repositoryFactory = repositoryFactory;
    this.tenantId = tenantId;
  }

  /**
   * Check if the adapter is ready to export
   */
  async isReady(): Promise<boolean> {
    try {
      // Verify we can access repositories
      return this.repositoryFactory !== null && this.repositoryFactory !== undefined;
    } catch (error) {
      console.error("WatermelonExportAdapter: Not ready", error);
      return false;
    }
  }

  /**
   * Get record count for a table
   */
  async getRecordCount(tableName: TableNames, tenantId: string): Promise<number> {
    try {
      const repository = this.getRepositoryForTable(tableName);
      const records = await repository.findAll(tenantId);
      return records.length;
    } catch (error) {
      console.error(`Failed to get record count for ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Get record count for a view
   */
  async getViewRecordCount(viewName: ViewNames, tenantId: string): Promise<number> {
    // WatermelonDB doesn't have materialized views in the same way as Supabase
    // Views are optional exports, so we return 0
    try {
      return 0;
    } catch (error) {
      console.error(`Failed to get record count for view ${viewName}:`, error);
      return 0;
    }
  }

  /**
   * Export data from a table
   */
  async exportTable(
    tableName: TableNames,
    tenantId: string,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportedFile> {
    const config = getModelConfig(tableName);
    if (!config) {
      throw new Error(`No configuration found for table: ${tableName}`);
    }

    try {
      // Get repository
      const repository = this.getRepositoryForTable(tableName);

      // Notify start of fetching
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.FETCHING,
        });
      }

      // Fetch all records
      const records = await repository.findAll(tenantId);

      // Notify fetching complete, start generating
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: records.length,
          currentModelTotal: records.length,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.GENERATING,
        });
      }

      // Convert WatermelonDB records to plain objects
      const plainRecords = records.map((record: any) => this.convertWatermelonRecord(record));

      // Convert records to CSV-safe format
      const csvRecords = plainRecords.map((record: any) => this.convertRecordToCSV(record, config.dateFields, tableName));

      // Generate CSV content
      const csvContent = generateCSV(csvRecords);

      // Create exported file
      const exportedFile: ExportedFile = {
        modelName: config.displayName,
        fileName: getExportFileName(tableName),
        content: csvContent,
        recordCount: records.length,
      };

      // Notify complete
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: records.length,
          currentModelTotal: records.length,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.COMPLETE,
        });
      }

      return exportedFile;
    } catch (error) {
      // Notify failed
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.FAILED,
        });
      }

      throw new Error(`Failed to export ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export data from a view (not supported for WatermelonDB)
   */
  async exportView(
    viewName: ViewNames,
    tenantId: string,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportedFile> {
    // WatermelonDB doesn't have materialized views
    // Return empty export file
    try {
      if (onProgress) {
        onProgress({
          currentModel: viewName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.COMPLETE,
        });
      }

      return {
        modelName: viewName,
        fileName: `${viewName.toLowerCase()}.csv`,
        content: "",
        recordCount: 0,
      };
    } catch (error) {
      throw new Error(`Failed to export view ${viewName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the appropriate repository for a table
   */
  private getRepositoryForTable(tableName: TableNames): any {
    switch (tableName) {
      case TableNames.AccountCategories:
        return this.repositoryFactory.AccountCategoryRepository();
      case TableNames.Accounts:
        return this.repositoryFactory.AccountRepository();
      case TableNames.TransactionGroups:
        return this.repositoryFactory.TransactionGroupRepository();
      case TableNames.TransactionCategories:
        return this.repositoryFactory.TransactionCategoryRepository();
      case TableNames.Transactions:
        return this.repositoryFactory.TransactionRepository();
      case TableNames.Recurrings:
        return this.repositoryFactory.RecurringRepository();
      case TableNames.Configurations:
        return this.repositoryFactory.ConfigurationRepository();
      default:
        throw new Error(`Unknown table name: ${tableName}`);
    }
  }

  /**
   * Convert WatermelonDB record to plain object
   * WatermelonDB models have special properties and methods that need to be extracted
   */
  private convertWatermelonRecord(record: any): Record<string, any> {
    const plainRecord: Record<string, any> = {};

    // WatermelonDB models typically have a _raw property with the actual data
    if (record._raw) {
      return { ...record._raw };
    }

    // Fallback: extract properties from the record
    // Get all enumerable properties
    for (const key in record) {
      if (record.hasOwnProperty(key) && !key.startsWith("_") && typeof record[key] !== "function") {
        plainRecord[key] = record[key];
      }
    }

    // Ensure we have the ID
    if (record.id && !plainRecord.id) {
      plainRecord.id = record.id;
    }

    return plainRecord;
  }

  /**
   * Convert a record to CSV-safe format
   */
  private convertRecordToCSV(record: any, dateFields: string[], tableName?: TableNames): Record<string, any> {
    let recordToProcess = record;

    // Filter fields based on configuration
    if (tableName) {
      recordToProcess = filterObjectFields(record, tableName, "export");
    }

    const csvRecord: Record<string, any> = {};

    Object.entries(recordToProcess).forEach(([key, value]) => {
      // Check if this is a date field
      const isDateField = dateFields.includes(key.toLowerCase());

      // Format value for CSV
      csvRecord[key] = formatValueForCSV(value, isDateField);
    });

    return csvRecord;
  }
}
