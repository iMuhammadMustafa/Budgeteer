import { getExportFileName, getModelConfig } from "@/src/config/ImportExport.config";
import supabase from "@/src/providers/Supabase";
import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { ExportedFile, ExportPhase, ExportProgress } from "@/src/types/ImportExport.types";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";
import { formatValueForCSV, generateCSV } from "@/src/utils/csv.utils";
import { filterObjectFields } from "@/src/utils/import-validation.utils";
import { IExportAdapter } from "./IExportAdapter";

/**
 * Supabase Export Adapter
 * Implements export functionality for Supabase storage mode
 */
export class SupabaseExportAdapter implements IExportAdapter {
  private repositoryFactory: IRepositoryFactory;

  constructor(repositoryFactory: IRepositoryFactory) {
    this.repositoryFactory = repositoryFactory;
  }

  /**
   * Check if the adapter is ready to export
   */
  async isReady(): Promise<boolean> {
    try {
      // Verify we can access repositories
      return this.repositoryFactory !== null && this.repositoryFactory !== undefined;
    } catch (error) {
      console.error("SupabaseExportAdapter: Not ready", error);
      return false;
    }
  }

  /**
   * Get record count for a table
   */
  async getRecordCount(tableName: TableNames, tenantId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .eq("tenantid", tenantId)
        .eq("isdeleted", false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`Failed to get record count for ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Get record count for a view
   */
  async getViewRecordCount(viewName: ViewNames, tenantId: string): Promise<number> {
    // For Supabase, we can query views through the Stats repository
    try {
      // This is a simplified approach - in production you might need specific view queries
      // For now, we'll return 0 as views are optional exports
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

      // Fetch all records directly from the table (not from views)
      const { data: records, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("tenantid", tenantId)
        .eq("isdeleted", false);

      if (error) {
        throw error;
      }

      // Notify fetching complete, start generating
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: records?.length || 0,
          currentModelTotal: records?.length || 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.GENERATING,
        });
      }

      // Convert records to CSV-safe format
      const csvRecords = (records || []).map((record: any) =>
        this.convertRecordToCSV(record, config.dateFields, tableName),
      );

      // Generate CSV content
      const csvContent = generateCSV(csvRecords);

      // Create exported file
      const exportedFile: ExportedFile = {
        modelName: config.displayName,
        fileName: getExportFileName(tableName),
        content: csvContent,
        recordCount: records?.length || 0,
      };

      // Notify complete
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: records?.length || 0,
          currentModelTotal: records?.length || 0,
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
   * Export data from a view
   */
  async exportView(
    viewName: ViewNames,
    tenantId: string,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportedFile> {
    try {
      // For views, we'll use the Stats repository as it has access to views
      const statsRepo = this.repositoryFactory.StatsRepository();

      // Notify start
      if (onProgress) {
        onProgress({
          currentModel: viewName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.FETCHING,
        });
      }

      // For now, views export is a placeholder - you'll need to implement specific queries
      // based on your StatsRepository methods
      const records: any[] = [];

      // Generate CSV
      const csvContent = generateCSV(records);

      const exportedFile: ExportedFile = {
        modelName: viewName,
        fileName: `${viewName.toLowerCase()}.csv`,
        content: csvContent,
        recordCount: records.length,
      };

      // Notify complete
      if (onProgress) {
        onProgress({
          currentModel: viewName,
          currentModelProgress: records.length,
          currentModelTotal: records.length,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.COMPLETE,
        });
      }

      return exportedFile;
    } catch (error) {
      if (onProgress) {
        onProgress({
          currentModel: viewName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.FAILED,
        });
      }

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
