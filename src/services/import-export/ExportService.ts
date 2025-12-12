import { getExportableModels } from "@/src/config/ImportExport.config";
import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import { ExportOptions, ExportPhase, ExportProgress, ExportResult } from "@/src/types/ImportExport.types";
import { StorageMode } from "@/src/types/StorageMode";
import { TableNames } from "@/src/types/database/TableNames";
import { IExportAdapter } from "./adapters/IExportAdapter";
import { SupabaseExportAdapter } from "./adapters/SupabaseExportAdapter";
import { WatermelonExportAdapter } from "./adapters/WatermelonExportAdapter";

/**
 * Export Service
 * Orchestrates the export process across different storage modes
 */
export class ExportService {
  private adapter: IExportAdapter;
  private storageMode: StorageMode;

  constructor(storageMode: StorageMode, repositoryFactory: IRepositoryFactory, tenantId: string) {
    this.storageMode = storageMode;

    // Create appropriate adapter based on storage mode
    console.log(`ExportService: Initializing adapter for storage mode: ${storageMode}`);
    if (storageMode === StorageMode.Cloud) {
      this.adapter = new SupabaseExportAdapter(repositoryFactory);
    } else {
      // Local or Demo mode uses WatermelonDB
      this.adapter = new WatermelonExportAdapter(repositoryFactory, tenantId);
    }
  }

  /**
   * Export data from the database
   * @param tenantId - The tenant ID for filtering data
   * @param tableNames - Optional array of table names to export. If not provided or empty, exports all.
   * @param options - Export options
   * @param onProgress - Optional callback for progress updates
   * @returns Export result with exported files
   */
  async export(
    tenantId: string,
    tableNames?: TableNames[],
    options: ExportOptions = {},
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportResult> {
    const errors: string[] = [];
    const exportedFiles: ExportResult["files"] = [];
    const recordCount: Record<string, number> = {};

    try {
      // Check if adapter is ready
      const isReady = await this.adapter.isReady();
      if (!isReady) {
        throw new Error("Export adapter is not ready");
      }

      // Get all exportable models
      const allModels = getExportableModels();

      // Determine which models to export
      let modelsToExport = allModels;
      if (tableNames && tableNames.length > 0) {
        modelsToExport = allModels.filter(model => tableNames.includes(model.tableName));
        if (modelsToExport.length === 0) {
          throw new Error("No valid models selected for export");
        }
      }

      // Calculate total records for progress tracking
      let totalRecords = 0;
      const modelRecordCounts = new Map<string, number>();

      for (const model of modelsToExport) {
        const count = await this.adapter.getRecordCount(model.tableName, tenantId);
        modelRecordCounts.set(model.tableName, count);
        totalRecords += count;
      }

      let processedRecords = 0;

      // Export each model
      for (const model of modelsToExport) {
        const modelRecordCount = modelRecordCounts.get(model.tableName) || 0;

        try {
          const exportedFile = await this.adapter.exportTable(model.tableName, tenantId, progress => {
            const overallProgress = processedRecords + progress.currentModelProgress;
            const overallTotal = totalRecords;

            if (onProgress) {
              onProgress({
                ...progress,
                overallProgress,
                overallTotal,
              });
            }
          });

          exportedFiles.push(exportedFile);
          recordCount[model.displayName] = exportedFile.recordCount;
          processedRecords += modelRecordCount;
        } catch (error) {
          const errorMsg = `Failed to export ${model.displayName}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(errorMsg);

          // Add empty file to maintain order
          exportedFiles.push({
            modelName: model.displayName,
            fileName: `${model.displayName.toLowerCase().replace(/\s+/g, "_")}.csv`,
            content: "",
            recordCount: 0,
          });
        }
      }

      // Export views if requested (optional)
      if (options.includeViews && this.adapter.exportView) {
        // View export is optional and not implemented fully yet
        // This can be extended in the future
      }

      // Notify completion
      if (onProgress) {
        onProgress({
          currentModel: "Complete",
          currentModelProgress: totalRecords,
          currentModelTotal: totalRecords,
          overallProgress: totalRecords,
          overallTotal: totalRecords,
          phase: ExportPhase.COMPLETE,
        });
      }

      return {
        success: errors.length === 0,
        files: exportedFiles,
        errors,
        recordCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMsg = `Export failed: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);

      // Notify failure
      if (onProgress) {
        onProgress({
          currentModel: "Failed",
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ExportPhase.FAILED,
        });
      }

      return {
        success: false,
        files: exportedFiles,
        errors,
        recordCount,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
