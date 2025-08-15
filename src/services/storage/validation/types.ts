/**
 * Type definitions for storage validation framework
 */

export interface ForeignKeyDataProvider {
  getRecord(table: string, id: string): Promise<any | null>;
  getRecords(table: string, filter?: any): Promise<any[]>;
  recordExists(tableName: string, fieldName: string, value: any): Promise<boolean>;
}

export interface ValidationOptions {
  skipForeignKeyValidation?: boolean;
  skipRequiredFieldValidation?: boolean;
  skipTypeValidation?: boolean;
  skipEnumValidation?: boolean;
  allowPartialUpdates?: boolean;
  strictMode?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  message: string;
  table: string;
  field?: string;
  value?: any;
  code: string;
}