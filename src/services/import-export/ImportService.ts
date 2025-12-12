import { IMPORT_CONFIG, getImportableModels, parseModelFromFileName } from "@/src/config/ImportExport.config";
import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import {
  ImportError,
  ImportFile,
  ImportOptions,
  ImportPhase,
  ImportProgress,
  ImportResult,
  ImportSummary,
} from "@/src/types/ImportExport.types";
import { StorageMode } from "@/src/types/StorageMode";
import { TableNames } from "@/src/types/database/TableNames";
import { IImportAdapter } from "./adapters/IImportAdapter";
import { SupabaseImportAdapter } from "./adapters/SupabaseImportAdapter";
import { WatermelonImportAdapter } from "./adapters/WatermelonImportAdapter";

/**
 * Import Service
 * Orchestrates the import process across different storage modes
 */
export class ImportService {
  private adapter: IImportAdapter;
  private storageMode: StorageMode;

  constructor(storageMode: StorageMode, repositoryFactory: IRepositoryFactory, tenantId: string = "local") {
    this.storageMode = storageMode;

    // Create appropriate adapter based on storage mode
    if (storageMode === StorageMode.Cloud) {
      this.adapter = new SupabaseImportAdapter(repositoryFactory);
    } else {
      // Local or Demo mode uses WatermelonDB
      this.adapter = new WatermelonImportAdapter(repositoryFactory, tenantId);
    }
  }

  /**
   * Import data from CSV files
   * @param files - Array of CSV files to import
   * @param tenantId - The tenant ID for the data
   * @param filterByModels - Optional array of table names to import (filters files). If not provided, imports all.
   * @param options - Import options
   * @param onProgress - Optional callback for progress updates
   * @returns Import result with imported data
   */
  async import(
    files: ImportFile[],
    tenantId: string,
    filterByModels?: TableNames[],
    options: ImportOptions = {},
    onProgress?: (progress: ImportProgress) => void,
  ): Promise<ImportResult> {
    const allErrors: ImportError[] = [];
    const allWarnings: string[] = [];
    const recordsByModel: Record<string, ImportSummary["recordsByModel"][string]> = {};

    try {
      // Check if adapter is ready
      const isReady = await this.adapter.isReady();
      if (!isReady) {
        throw new Error("Import adapter is not ready");
      }

      // Apply defaults
      const importOptions: ImportOptions = {
        skipDuplicates: options.skipDuplicates ?? IMPORT_CONFIG.SKIP_DUPLICATES_DEFAULT,
        validateOnly: options.validateOnly ?? IMPORT_CONFIG.VALIDATE_ONLY_DEFAULT,
        continueOnError: options.continueOnError ?? IMPORT_CONFIG.CONTINUE_ON_ERROR_DEFAULT,
      };

      // Filter files if specific models are requested
      let filesToProcess = files;
      if (filterByModels && filterByModels.length > 0) {
        filesToProcess = files.filter(file => {
          const tableName = parseModelFromFileName(file.name);
          return tableName && filterByModels.includes(tableName);
        });

        if (filesToProcess.length === 0) {
          throw new Error("No files match the selected models");
        }
      }

      // Parse and validate file names to determine import order
      const fileModels = filesToProcess
        .map(file => ({
          file,
          tableName: parseModelFromFileName(file.name),
        }))
        .filter(item => item.tableName !== null) as { file: ImportFile; tableName: TableNames }[];

      if (fileModels.length === 0) {
        throw new Error("No valid CSV files found for import");
      }

      // Get importable models in correct order
      const modelOrder = getImportableModels();

      // Sort files by model order
      const sortedFiles = fileModels.sort((a, b) => {
        const orderA = modelOrder.findIndex(m => m.tableName === a.tableName);
        const orderB = modelOrder.findIndex(m => m.tableName === b.tableName);
        return orderA - orderB;
      });

      // Calculate total records for progress tracking
      let totalRecords = 0;
      let processedRecords = 0;

      // Import each file in order
      for (let i = 0; i < sortedFiles.length; i++) {
        const { file, tableName } = sortedFiles[i];

        try {
          // Import or validate the table
          const result = importOptions.validateOnly
            ? await this.adapter.validateImport(tableName, file.content, tenantId)
            : await this.adapter.importTable(tableName, file.content, tenantId, importOptions, progress => {
                // Calculate overall progress
                const overallProgress = processedRecords + progress.currentModelProgress;

                // Call user's progress callback
                if (onProgress) {
                  onProgress({
                    ...progress,
                    overallProgress,
                    overallTotal: totalRecords,
                  });
                }
              });

          // Aggregate results
          allErrors.push(...result.errors);
          allWarnings.push(...result.warnings);

          // Add to records by model
          Object.entries(result.summary.recordsByModel).forEach(([modelName, summary]) => {
            recordsByModel[modelName] = summary;
            processedRecords += summary.total;
          });

          // If continue on error is false and there were errors, stop
          if (!importOptions.continueOnError && result.errors.length > 0) {
            break;
          }
        } catch (error) {
          const errorMsg = `Failed to import ${file.name}: ${error instanceof Error ? error.message : String(error)}`;
          allErrors.push({
            modelName: tableName || "Unknown",
            rowNumber: 0,
            errorType: "database_error" as any,
            message: errorMsg,
          });

          if (!importOptions.continueOnError) {
            break;
          }
        }
      }

      // Calculate summary
      const summary: ImportSummary = {
        totalRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.total, 0),
        importedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.imported, 0),
        skippedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.skipped, 0),
        failedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.failed, 0),
        recordsByModel,
      };

      // Notify completion
      if (onProgress) {
        onProgress({
          currentModel: "Complete",
          currentModelProgress: summary.totalRecords,
          currentModelTotal: summary.totalRecords,
          overallProgress: summary.totalRecords,
          overallTotal: summary.totalRecords,
          phase: ImportPhase.COMPLETE,
        });
      }

      return {
        success: allErrors.length === 0,
        summary,
        errors: allErrors,
        warnings: allWarnings,
      };
    } catch (error) {
      const errorMsg = `Import failed: ${error instanceof Error ? error.message : String(error)}`;
      allErrors.push({
        modelName: "System",
        rowNumber: 0,
        errorType: "database_error" as any,
        message: errorMsg,
      });

      // Notify failure
      if (onProgress) {
        onProgress({
          currentModel: "Failed",
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ImportPhase.FAILED,
        });
      }

      return {
        success: false,
        summary: {
          totalRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.total, 0),
          importedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.imported, 0),
          skippedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.skipped, 0),
          failedRecords: Object.values(recordsByModel).reduce((sum, m) => sum + m.failed, 0),
          recordsByModel,
        },
        errors: allErrors,
        warnings: allWarnings,
      };
    }
  }

  /**
   * Get import template (empty CSV with headers)
   * @param tableName - The table to get template for
   * @returns CSV content with headers
   */
  getImportTemplate(tableName: TableNames): string {
    const modelOrder = getImportableModels();
    const model = modelOrder.find(m => m.tableName === tableName);

    if (!model) {
      throw new Error(`Unknown table: ${tableName}`);
    }

    // Return CSV header row
    return model.requiredFields.join(",");
  }
}
