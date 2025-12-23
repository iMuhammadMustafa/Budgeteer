import { TableNames } from "./database/TableNames";

// Export/Import operation result types
export interface ExportResult {
  success: boolean;
  files: ExportedFile[];
  errors: string[];
  recordCount: Record<string, number>;
  timestamp: string;
}

export interface ExportedFile {
  modelName: string;
  fileName: string;
  content: string; // CSV content
  recordCount: number;
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  warnings: string[];
  skippedRecordIds?: string[];
}

export interface ImportSummary {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  recordsByModel: Record<string, ModelImportSummary>;
}

export interface ModelImportSummary {
  modelName: string;
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

export interface ImportError {
  modelName: string;
  rowNumber: number;
  recordId?: string;
  field?: string;
  errorType: ImportErrorType;
  message: string;
}

export enum ImportErrorType {
  VALIDATION = "validation",
  DUPLICATE = "duplicate",
  MISSING_DEPENDENCY = "missing_dependency",
  INVALID_FORMAT = "invalid_format",
  DATABASE_ERROR = "database_error",
}

// CSV Record types
export interface CSVRecord {
  [key: string]: string | null;
}

export interface ParsedCSVData {
  headers: string[];
  records: CSVRecord[];
}

// Model configuration for import/export
export interface ModelConfig {
  tableName: TableNames;
  displayName: string;
  order: number;
  exportEnabled: boolean;
  importEnabled: boolean;
  dependencies: TableNames[];
  requiredFields: string[];
  uniqueFields: string[]; // Fields used to check for duplicates
  dateFields: string[]; // Fields that contain dates
  fields?: string[]; // List of allowed fields to import/export (only these fields will be processed, unless ignored)
  ignoredFields?: string[]; // Fields to ignore during both import and export
  ignoredExportFields?: string[]; // Fields to ignore only during export
  ignoredImportFields?: string[]; // Fields to ignore only during import
  fieldMappings?: Record<string, string>; // Map CSV column names to database fields
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  type: ValidationErrorType;
}

export enum ValidationErrorType {
  REQUIRED = "required",
  INVALID_TYPE = "invalid_type",
  INVALID_FORMAT = "invalid_format",
  INVALID_VALUE = "invalid_value",
  DUPLICATE = "duplicate",
  MISSING_DEPENDENCY = "missing_dependency",
}

// Progress tracking
export interface ImportProgress {
  currentModel: string;
  currentModelProgress: number;
  currentModelTotal: number;
  overallProgress: number;
  overallTotal: number;
  phase: ImportPhase;
}

export enum ImportPhase {
  PARSING = "parsing",
  VALIDATING = "validating",
  IMPORTING = "importing",
  COMPLETE = "complete",
  FAILED = "failed",
}

export interface ExportProgress {
  currentModel: string;
  currentModelProgress: number;
  currentModelTotal: number;
  overallProgress: number;
  overallTotal: number;
  phase: ExportPhase;
}

export enum ExportPhase {
  FETCHING = "fetching",
  GENERATING = "generating",
  COMPLETE = "complete",
  FAILED = "failed",
}

// File handling types
export interface ImportFile {
  name: string;
  content: string;
  size: number;
}

export interface ExportOptions {
  includeViews?: boolean;
  format?: "csv" | "json";
  dateFormat?: string;
  selectedModels?: TableNames[]; // For selective export
  exportType?: "backup" | "csv" | "both"; // backup = JSON for import, csv = CSV for viewing, both = both formats
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  validateOnly?: boolean;
  continueOnError?: boolean;
}
