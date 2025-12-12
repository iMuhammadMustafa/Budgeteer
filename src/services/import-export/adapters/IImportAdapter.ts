import { ImportOptions, ImportProgress, ImportResult } from "@/src/types/ImportExport.types";
import { TableNames } from "@/src/types/database/TableNames";

/**
 * Base Import Adapter Interface
 * Defines the contract for storage-specific import implementations
 */

export interface IImportAdapter {
  /**
   * Import data into a specific table from CSV content
   * @param tableName - The table to import data into
   * @param csvContent - The CSV content to import
   * @param tenantId - The tenant ID for the data
   * @param options - Import options (skip duplicates, validation, etc.)
   * @param onProgress - Optional callback for progress updates
   * @returns Import result with success status and details
   */
  importTable(
    tableName: TableNames,
    csvContent: string,
    tenantId: string,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void,
  ): Promise<ImportResult>;

  /**
   * Validate import data without actually importing
   * Useful for pre-validation before actual import
   * @param tableName - The table to validate data for
   * @param csvContent - The CSV content to validate
   * @param tenantId - The tenant ID for the data
   * @returns Import result with validation errors (no data is imported)
   */
  validateImport(tableName: TableNames, csvContent: string, tenantId: string): Promise<ImportResult>;

  /**
   * Check if records with given IDs already exist in the database
   * @param tableName - The table to check
   * @param ids - Array of IDs to check
   * @param tenantId - The tenant ID for filtering data
   * @returns Set of IDs that exist in the database
   */
  checkExistingRecords(tableName: TableNames, ids: string[], tenantId: string): Promise<Set<string>>;

  /**
   * Get existing dependency data for validation
   * @param tableName - The table to get dependency data for
   * @param tenantId - The tenant ID for filtering data
   * @returns Map of table names to sets of existing IDs
   */
  getDependencyData(tableName: TableNames, tenantId: string): Promise<Map<TableNames, Set<string>>>;

  /**
   * Validate that the adapter is ready to import
   * @returns true if ready, false otherwise
   */
  isReady(): Promise<boolean>;
}

/**
 * Import adapter factory type
 */
export type ImportAdapterFactory = () => IImportAdapter;
