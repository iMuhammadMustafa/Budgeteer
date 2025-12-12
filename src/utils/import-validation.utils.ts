import { getModelConfig } from "../config/ImportExport.config";
import { TableNames } from "../types/database/TableNames";
import { CSVRecord, ValidationError, ValidationErrorType, ValidationResult } from "../types/ImportExport.types";

/**
 * Import Validation Utilities
 * Handles validation of import data including duplicate checking and dependency validation
 */

/**
 * Validate a single record against model configuration
 */
export function validateRecord(record: CSVRecord, tableName: TableNames, rowNumber: number): ValidationResult {
  const errors: ValidationError[] = [];
  const config = getModelConfig(tableName);

  if (!config) {
    errors.push({
      field: "model",
      value: tableName,
      message: `Unknown model: ${tableName}`,
      type: ValidationErrorType.INVALID_VALUE,
    });
    return { isValid: false, errors };
  }

  // Validate required fields
  for (const field of config.requiredFields) {
    const value = record[field];
    if (value === null || value === undefined || value === "") {
      errors.push({
        field,
        value,
        message: `Required field '${field}' is missing or empty at row ${rowNumber}`,
        type: ValidationErrorType.REQUIRED,
      });
    }
  }

  // Validate date fields
  for (const field of config.dateFields) {
    const value = record[field];
    if (value !== null && value !== undefined && value !== "") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({
          field,
          value,
          message: `Invalid date format for field '${field}' at row ${rowNumber}: ${value}`,
          type: ValidationErrorType.INVALID_FORMAT,
        });
      }
    }
  }

  // Validate numeric fields (amount, balance, etc.)
  const numericFields = ["amount", "balance", "initialbalance"];
  for (const field of numericFields) {
    const value = record[field];
    if (value !== null && value !== undefined && value !== "") {
      if (isNaN(Number(value))) {
        errors.push({
          field,
          value,
          message: `Invalid numeric value for field '${field}' at row ${rowNumber}: ${value}`,
          type: ValidationErrorType.INVALID_TYPE,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all records in a batch
 */
export function validateRecords(
  records: CSVRecord[],
  tableName: TableNames,
  startRowNumber: number = 2, // Start from 2 (1 is header)
): ValidationResult {
  const allErrors: ValidationError[] = [];

  records.forEach((record, index) => {
    const rowNumber = startRowNumber + index;
    const result = validateRecord(record, tableName, rowNumber);
    allErrors.push(...result.errors);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Check if a record already exists based on unique fields
 */
export function isDuplicate(record: CSVRecord, existingRecords: any[], uniqueFields: string[]): boolean {
  return existingRecords.some(existing => {
    return uniqueFields.every(field => {
      const recordValue = normalizeValue(record[field]);
      const existingValue = normalizeValue(existing[field]);
      return recordValue === existingValue;
    });
  });
}

/**
 * Find duplicates within a batch of records
 */
export function findInternalDuplicates(
  records: CSVRecord[],
  uniqueFields: string[],
): { duplicates: number[]; unique: CSVRecord[] } {
  const seen = new Map<string, number>();
  const duplicates: number[] = [];
  const unique: CSVRecord[] = [];

  records.forEach((record, index) => {
    const key = uniqueFields.map(field => normalizeValue(record[field])).join("|");

    if (seen.has(key)) {
      duplicates.push(index);
    } else {
      seen.set(key, index);
      unique.push(record);
    }
  });

  return { duplicates, unique };
}

/**
 * Validate that dependencies exist for a record
 */
export function validateRecordDependencies(
  record: CSVRecord,
  tableName: TableNames,
  dependencyData: Map<TableNames, Set<string>>,
  rowNumber: number,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const config = getModelConfig(tableName);

  if (!config) {
    return errors;
  }

  // Map of foreign key fields to their parent table
  const foreignKeyMap: Record<string, TableNames> = {
    categoryid: TableNames.AccountCategories,
    accountid: TableNames.Accounts,
    groupid: TableNames.TransactionGroups,
  };

  // Check each dependency
  for (const [field, parentTable] of Object.entries(foreignKeyMap)) {
    const value = record[field];

    // Skip if field doesn't exist in this table or is null
    if (value === null || value === undefined || value === "") {
      continue;
    }

    // Check if this is a required dependency for the current table
    if (config.dependencies.includes(parentTable)) {
      const existingIds = dependencyData.get(parentTable);

      if (!existingIds || !existingIds.has(normalizeValue(value))) {
        errors.push({
          field,
          value,
          message: `Missing dependency: ${parentTable} with id '${value}' does not exist (row ${rowNumber})`,
          type: ValidationErrorType.MISSING_DEPENDENCY,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate all dependencies for a batch of records
 */
export function validateBatchDependencies(
  records: CSVRecord[],
  tableName: TableNames,
  dependencyData: Map<TableNames, Set<string>>,
  startRowNumber: number = 2,
): ValidationError[] {
  const allErrors: ValidationError[] = [];

  records.forEach((record, index) => {
    const rowNumber = startRowNumber + index;
    const errors = validateRecordDependencies(record, tableName, dependencyData, rowNumber);
    allErrors.push(...errors);
  });

  return allErrors;
}

/**
 * Build dependency data map from existing records
 */
export function buildDependencyMap(
  existingData: Map<TableNames, any[]>,
  uniqueFields: Map<TableNames, string[]>,
): Map<TableNames, Set<string>> {
  const dependencyMap = new Map<TableNames, Set<string>>();

  existingData.forEach((records, tableName) => {
    const fields = uniqueFields.get(tableName) || ["id"];
    const idSet = new Set<string>();

    records.forEach(record => {
      fields.forEach(field => {
        const value = normalizeValue(record[field]);
        if (value) {
          idSet.add(value);
        }
      });
    });

    dependencyMap.set(tableName, idSet);
  });

  return dependencyMap;
}

/**
 * Normalize a value for comparison
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string and trim
  const stringValue = String(value).trim();

  // Convert to lowercase for case-insensitive comparison
  return stringValue.toLowerCase();
}

/**
 * Validate CSV headers match expected fields
 */
export function validateHeaders(
  headers: string[],
  tableName: TableNames,
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getModelConfig(tableName);

  if (!config) {
    errors.push(`Unknown model: ${tableName}`);
    return { isValid: false, errors, warnings };
  }

  // Normalize headers
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Check for required fields
  const missingRequired = config.requiredFields.filter(field => !normalizedHeaders.includes(field.toLowerCase()));

  if (missingRequired.length > 0) {
    errors.push(`Missing required fields: ${missingRequired.join(", ")}`);
  }

  // Check for duplicate headers
  const headerSet = new Set<string>();
  const duplicates = normalizedHeaders.filter(h => {
    if (headerSet.has(h)) {
      return true;
    }
    headerSet.add(h);
    return false;
  });

  if (duplicates.length > 0) {
    errors.push(`Duplicate headers found: ${duplicates.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize record data before import
 */
export function sanitizeRecord(record: CSVRecord, tableName: TableNames): CSVRecord {
  const sanitized: CSVRecord = {};
  const config = getModelConfig(tableName);

  if (!config) {
    return record;
  }

  // Process each field
  Object.entries(record).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();

    // Skip empty or null values for non-required fields
    if ((value === null || value === undefined || value === "") && !config.requiredFields.includes(normalizedKey)) {
      sanitized[normalizedKey] = null;
      return;
    }

    // Trim string values
    if (typeof value === "string") {
      sanitized[normalizedKey] = value.trim();
    } else {
      sanitized[normalizedKey] = value;
    }
  });

  return sanitized;
}

/**
 * Group validation errors by type
 */
export function groupErrorsByType(errors: ValidationError[]): Record<ValidationErrorType, ValidationError[]> {
  const grouped: Record<ValidationErrorType, ValidationError[]> = {
    [ValidationErrorType.REQUIRED]: [],
    [ValidationErrorType.INVALID_TYPE]: [],
    [ValidationErrorType.INVALID_FORMAT]: [],
    [ValidationErrorType.INVALID_VALUE]: [],
    [ValidationErrorType.DUPLICATE]: [],
    [ValidationErrorType.MISSING_DEPENDENCY]: [],
  };

  errors.forEach(error => {
    grouped[error.type].push(error);
  });

  return grouped;
}

/**
 * Filter record fields based on field configuration
 * Applies field allowlist, ignored fields, and mode-specific ignores
 */
export function filterRecordFields(
  record: CSVRecord,
  tableName: TableNames,
  mode: "import" | "export" = "import",
): CSVRecord {
  const config = getModelConfig(tableName);
  if (!config) {
    return record;
  }

  const filtered: CSVRecord = {};
  const fieldsToIgnore = new Set<string>();

  // Add ignored fields (both modes)
  if (config.ignoredFields) {
    config.ignoredFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  }

  // Add mode-specific ignored fields
  if (mode === "export" && config.ignoredExportFields) {
    config.ignoredExportFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  } else if (mode === "import" && config.ignoredImportFields) {
    config.ignoredImportFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  }

  // Process each field in the record
  Object.entries(record).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();

    // Skip if field is in ignore list
    if (fieldsToIgnore.has(normalizedKey)) {
      return;
    }

    // If fields allowlist exists, only include fields in the list
    if (config.fields && config.fields.length > 0) {
      if (!config.fields.some(f => f.toLowerCase() === normalizedKey)) {
        return;
      }
    }

    filtered[normalizedKey] = value;
  });

  return filtered;
}

/**
 * Filter object fields based on field configuration
 * Applies field allowlist, ignored fields, and mode-specific ignores
 */
export function filterObjectFields(
  obj: Record<string, any>,
  tableName: TableNames,
  mode: "import" | "export" = "import",
): Record<string, any> {
  const config = getModelConfig(tableName);
  if (!config) {
    return obj;
  }

  const filtered: Record<string, any> = {};
  const fieldsToIgnore = new Set<string>();

  // Add ignored fields (both modes)
  if (config.ignoredFields) {
    config.ignoredFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  }

  // Add mode-specific ignored fields
  if (mode === "export" && config.ignoredExportFields) {
    config.ignoredExportFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  } else if (mode === "import" && config.ignoredImportFields) {
    config.ignoredImportFields.forEach(field => fieldsToIgnore.add(field.toLowerCase()));
  }

  // Process each field in the object
  Object.entries(obj).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase();

    // Skip if field is in ignore list
    if (fieldsToIgnore.has(normalizedKey)) {
      return;
    }

    // If fields allowlist exists, only include fields in the list
    if (config.fields && config.fields.length > 0) {
      if (!config.fields.some(f => f.toLowerCase() === normalizedKey)) {
        return;
      }
    }

    filtered[key] = value;
  });

  return filtered;
}
