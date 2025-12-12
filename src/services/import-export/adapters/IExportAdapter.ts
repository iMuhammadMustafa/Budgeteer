import { ExportedFile, ExportProgress } from "@/src/types/ImportExport.types";
import { TableNames, ViewNames } from "@/src/types/database/TableNames";

/**
 * Base Export Adapter Interface
 * Defines the contract for storage-specific export implementations
 */

export interface IExportAdapter {
  /**
   * Export data from a specific table
   * @param tableName - The table to export data from
   * @param tenantId - The tenant ID for filtering data
   * @param onProgress - Optional callback for progress updates
   * @returns Exported file data
   */
  exportTable(
    tableName: TableNames,
    tenantId: string,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportedFile>;

  /**
   * Export data from a specific view (optional, for views export)
   * @param viewName - The view to export data from
   * @param tenantId - The tenant ID for filtering data
   * @param onProgress - Optional callback for progress updates
   * @returns Exported file data
   */
  exportView?(
    viewName: ViewNames,
    tenantId: string,
    onProgress?: (progress: ExportProgress) => void,
  ): Promise<ExportedFile>;

  /**
   * Get the total record count for a table (for progress calculation)
   * @param tableName - The table to count records from
   * @param tenantId - The tenant ID for filtering data
   * @returns Total number of records
   */
  getRecordCount(tableName: TableNames, tenantId: string): Promise<number>;

  /**
   * Get the total record count for a view (for progress calculation)
   * @param viewName - The view to count records from
   * @param tenantId - The tenant ID for filtering data
   * @returns Total number of records
   */
  getViewRecordCount?(viewName: ViewNames, tenantId: string): Promise<number>;

  /**
   * Validate that the adapter is ready to export
   * @returns true if ready, false otherwise
   */
  isReady(): Promise<boolean>;
}

/**
 * Export adapter factory type
 */
export type ExportAdapterFactory = () => IExportAdapter;
