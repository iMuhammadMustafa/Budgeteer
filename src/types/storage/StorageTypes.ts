/**
 * Core storage types and enums for the multi-tier storage architecture
 */

/**
 * Enum defining the available storage modes
 */
export enum StorageMode {
  Cloud = 'cloud',
  Demo = 'demo', 
  Local = 'local'
}

/**
 * Base error class for all storage-related errors
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Error thrown when referential integrity constraints are violated
 */
export class ReferentialIntegrityError extends StorageError {
  constructor(table: string, field: string, value: string) {
    super(
      `Referenced record not found: ${table}.${field} = ${value}`,
      'REFERENTIAL_INTEGRITY_ERROR',
      { table, field, value }
    );
    this.name = 'ReferentialIntegrityError';
  }
}

/**
 * Error thrown when attempting to create duplicate records with unique constraints
 */
export class DuplicateRecordError extends StorageError {
  constructor(table: string, field: string, value: string) {
    super(
      `Duplicate record found: ${table}.${field} = ${value}`,
      'DUPLICATE_RECORD_ERROR',
      { table, field, value }
    );
    this.name = 'DuplicateRecordError';
  }
}

/**
 * Error thrown when a required record is not found
 */
export class RecordNotFoundError extends StorageError {
  constructor(table: string, id: string) {
    super(
      `Record not found: ${table} with id = ${id}`,
      'RECORD_NOT_FOUND_ERROR',
      { table, id }
    );
    this.name = 'RecordNotFoundError';
  }
}