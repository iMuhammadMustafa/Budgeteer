import { IMPORT_CONFIG, getModelConfig } from "@/src/config/ImportExport.config";
import { IRepositoryFactory } from "@/src/repositories/RepositoryFactory";
import {
  ImportError,
  ImportErrorType,
  ImportOptions,
  ImportPhase,
  ImportProgress,
  ImportResult,
  ImportSummary,
} from "@/src/types/ImportExport.types";
import { TableNames } from "@/src/types/database/TableNames";
import { parseCSV, parseValueFromCSV } from "@/src/utils/csv.utils";
import {
  buildDependencyMap,
  isDuplicate,
  sanitizeRecord,
  validateBatchDependencies,
  validateHeaders,
  validateRecords,
  filterRecordFields,
} from "@/src/utils/import-validation.utils";
import { IImportAdapter } from "./IImportAdapter";

/**
 * Supabase Import Adapter
 * Implements import functionality for Supabase storage mode
 */
export class SupabaseImportAdapter implements IImportAdapter {
  private repositoryFactory: IRepositoryFactory;

  constructor(repositoryFactory: IRepositoryFactory) {
    this.repositoryFactory = repositoryFactory;
  }

  /**
   * Check if the adapter is ready to import
   */
  async isReady(): Promise<boolean> {
    try {
      return this.repositoryFactory !== null && this.repositoryFactory !== undefined;
    } catch (error) {
      console.error("SupabaseImportAdapter: Not ready", error);
      return false;
    }
  }

  /**
   * Check if records exist in the database
   */
  async checkExistingRecords(tableName: TableNames, ids: string[], tenantId: string): Promise<Set<string>> {
    const existingIds = new Set<string>();

    try {
      const repository = this.getRepositoryForTable(tableName);
      const allRecords = await repository.findAll(tenantId);

      // Check which IDs exist
      ids.forEach(id => {
        const exists = allRecords.some((record: any) => record.id?.toLowerCase() === id.toLowerCase());
        if (exists) {
          existingIds.add(id.toLowerCase());
        }
      });
    } catch (error) {
      console.error(`Failed to check existing records for ${tableName}:`, error);
    }

    return existingIds;
  }

  /**
   * Get dependency data for validation
   */
  async getDependencyData(tableName: TableNames, tenantId: string): Promise<Map<TableNames, Set<string>>> {
    const config = getModelConfig(tableName);
    if (!config) {
      return new Map();
    }

    const dependencyData = new Map<TableNames, any[]>();
    const uniqueFieldsMap = new Map<TableNames, string[]>();

    // Fetch data for each dependency
    for (const depTableName of config.dependencies) {
      try {
        const depRepository = this.getRepositoryForTable(depTableName);
        const records = await depRepository.findAll(tenantId);
        dependencyData.set(depTableName, records);

        const depConfig = getModelConfig(depTableName);
        if (depConfig) {
          uniqueFieldsMap.set(depTableName, depConfig.uniqueFields);
        }
      } catch (error) {
        console.error(`Failed to fetch dependency data for ${depTableName}:`, error);
      }
    }

    return buildDependencyMap(dependencyData, uniqueFieldsMap);
  }

  /**
   * Validate import without actually importing
   */
  async validateImport(tableName: TableNames, csvContent: string, tenantId: string): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: string[] = [];
    const config = getModelConfig(tableName);

    if (!config) {
      errors.push({
        modelName: tableName,
        rowNumber: 0,
        errorType: ImportErrorType.VALIDATION,
        message: `Unknown table: ${tableName}`,
      });

      return {
        success: false,
        summary: this.createEmptySummary(tableName),
        errors,
        warnings,
      };
    }

    try {
      // Parse CSV
      const { headers, records } = parseCSV(csvContent);

      // Validate headers
      const headerValidation = validateHeaders(headers, tableName);
      if (!headerValidation.isValid) {
        headerValidation.errors.forEach(error => {
          errors.push({
            modelName: config.displayName,
            rowNumber: 1,
            errorType: ImportErrorType.VALIDATION,
            message: error,
          });
        });
      }
      warnings.push(...headerValidation.warnings);

      // Validate records structure
      const recordValidation = validateRecords(records, tableName);
      recordValidation.errors.forEach(validationError => {
        errors.push({
          modelName: config.displayName,
          rowNumber: 0,
          field: validationError.field,
          errorType: ImportErrorType.VALIDATION,
          message: validationError.message,
        });
      });

      // Get dependency data
      const dependencyData = await this.getDependencyData(tableName, tenantId);

      // Validate dependencies
      const dependencyErrors = validateBatchDependencies(records, tableName, dependencyData);
      dependencyErrors.forEach(validationError => {
        errors.push({
          modelName: config.displayName,
          rowNumber: 0,
          field: validationError.field,
          errorType: ImportErrorType.MISSING_DEPENDENCY,
          message: validationError.message,
        });
      });

      return {
        success: errors.length === 0,
        summary: {
          totalRecords: records.length,
          importedRecords: 0,
          skippedRecords: 0,
          failedRecords: errors.length > 0 ? records.length : 0,
          recordsByModel: {
            [config.displayName]: {
              modelName: config.displayName,
              total: records.length,
              imported: 0,
              skipped: 0,
              failed: errors.length > 0 ? records.length : 0,
            },
          },
        },
        errors,
        warnings,
      };
    } catch (error) {
      errors.push({
        modelName: config.displayName,
        rowNumber: 0,
        errorType: ImportErrorType.INVALID_FORMAT,
        message: `Failed to validate CSV: ${error instanceof Error ? error.message : String(error)}`,
      });

      return {
        success: false,
        summary: this.createEmptySummary(tableName),
        errors,
        warnings,
      };
    }
  }

  /**
   * Import data into a table
   */
  async importTable(
    tableName: TableNames,
    csvContent: string,
    tenantId: string,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void,
  ): Promise<ImportResult> {
    const errors: ImportError[] = [];
    const warnings: string[] = [];
    const config = getModelConfig(tableName);

    if (!config) {
      errors.push({
        modelName: tableName,
        rowNumber: 0,
        errorType: ImportErrorType.VALIDATION,
        message: `Unknown table: ${tableName}`,
      });

      return {
        success: false,
        summary: this.createEmptySummary(tableName),
        errors,
        warnings,
      };
    }

    try {
      // Notify parsing phase
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ImportPhase.PARSING,
        });
      }

      // Parse CSV
      const { headers, records } = parseCSV(csvContent);
      const totalRecords = records.length;

      // Validate headers
      const headerValidation = validateHeaders(headers, tableName);
      if (!headerValidation.isValid) {
        headerValidation.errors.forEach(error => {
          errors.push({
            modelName: config.displayName,
            rowNumber: 1,
            errorType: ImportErrorType.VALIDATION,
            message: error,
          });
        });

        return {
          success: false,
          summary: this.createEmptySummary(tableName),
          errors,
          warnings,
        };
      }

      // Notify validating phase
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: totalRecords,
          overallProgress: 0,
          overallTotal: totalRecords,
          phase: ImportPhase.VALIDATING,
        });
      }

      // Get existing records if skip duplicates is enabled
      let existingRecords: any[] = [];
      if (options.skipDuplicates) {
        const repository = this.getRepositoryForTable(tableName);
        existingRecords = await repository.findAll(tenantId);
      }

      // Get dependency data
      const dependencyData = await this.getDependencyData(tableName, tenantId);

      // Notify importing phase
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: totalRecords,
          overallProgress: 0,
          overallTotal: totalRecords,
          phase: ImportPhase.IMPORTING,
        });
      }

      // Import records in batches
      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      const batchSize = IMPORT_CONFIG.BATCH_SIZE;
      const repository = this.getRepositoryForTable(tableName);

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, Math.min(i + batchSize, records.length));

        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const rowNumber = i + j + 2; // +2 for header row and 0-index

          try {
            // Sanitize record
            const sanitized = sanitizeRecord(record, tableName);

            // Filter record fields based on configuration
            const filtered = filterRecordFields(sanitized, tableName, "import");

            // Check for duplicates
            if (options.skipDuplicates && isDuplicate(filtered, existingRecords, config.uniqueFields)) {
              skippedCount++;
              warnings.push(`Row ${rowNumber}: Duplicate record skipped`);
              continue;
            }

            // Validate dependencies
            const depErrors = validateBatchDependencies([filtered], tableName, dependencyData, rowNumber);
            if (depErrors.length > 0) {
              depErrors.forEach(error => {
                errors.push({
                  modelName: config.displayName,
                  rowNumber,
                  field: error.field,
                  errorType: ImportErrorType.MISSING_DEPENDENCY,
                  message: error.message,
                });
              });
              failedCount++;
              if (!options.continueOnError) {
                throw new Error(`Dependency validation failed at row ${rowNumber}`);
              }
              continue;
            }

            // Convert CSV values to proper types
            const typedRecord = this.convertCSVRecord(filtered, config.dateFields);

            // Import record
            await repository.create(typedRecord as any, tenantId);
            importedCount++;
          } catch (error) {
            failedCount++;
            errors.push({
              modelName: config.displayName,
              rowNumber,
              recordId: record.id || undefined,
              errorType: ImportErrorType.DATABASE_ERROR,
              message: `Failed to import: ${error instanceof Error ? error.message : String(error)}`,
            });

            if (!options.continueOnError) {
              throw error;
            }
          }

          // Update progress
          if (onProgress) {
            onProgress({
              currentModel: config.displayName,
              currentModelProgress: i + j + 1,
              currentModelTotal: totalRecords,
              overallProgress: i + j + 1,
              overallTotal: totalRecords,
              phase: ImportPhase.IMPORTING,
            });
          }
        }
      }

      // Notify complete
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: totalRecords,
          currentModelTotal: totalRecords,
          overallProgress: totalRecords,
          overallTotal: totalRecords,
          phase: ImportPhase.COMPLETE,
        });
      }

      const summary: ImportSummary = {
        totalRecords,
        importedRecords: importedCount,
        skippedRecords: skippedCount,
        failedRecords: failedCount,
        recordsByModel: {
          [config.displayName]: {
            modelName: config.displayName,
            total: totalRecords,
            imported: importedCount,
            skipped: skippedCount,
            failed: failedCount,
          },
        },
      };

      return {
        success: failedCount === 0,
        summary,
        errors,
        warnings,
      };
    } catch (error) {
      if (onProgress) {
        onProgress({
          currentModel: config.displayName,
          currentModelProgress: 0,
          currentModelTotal: 0,
          overallProgress: 0,
          overallTotal: 0,
          phase: ImportPhase.FAILED,
        });
      }

      errors.push({
        modelName: config.displayName,
        rowNumber: 0,
        errorType: ImportErrorType.DATABASE_ERROR,
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      });

      return {
        success: false,
        summary: this.createEmptySummary(tableName),
        errors,
        warnings,
      };
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
   * Convert CSV record to typed record
   */
  private convertCSVRecord(record: any, dateFields: string[]): Record<string, any> {
    const typedRecord: Record<string, any> = {};

    Object.entries(record).forEach(([key, value]) => {
      const isDateField = dateFields.includes(key.toLowerCase());
      typedRecord[key] = parseValueFromCSV(value as string, isDateField);
    });

    return typedRecord;
  }

  /**
   * Create an empty summary for error cases
   */
  private createEmptySummary(tableName: TableNames): ImportSummary {
    const config = getModelConfig(tableName);
    const displayName = config?.displayName || tableName;

    return {
      totalRecords: 0,
      importedRecords: 0,
      skippedRecords: 0,
      failedRecords: 0,
      recordsByModel: {
        [displayName]: {
          modelName: displayName,
          total: 0,
          imported: 0,
          skipped: 0,
          failed: 0,
        },
      },
    };
  }
}
