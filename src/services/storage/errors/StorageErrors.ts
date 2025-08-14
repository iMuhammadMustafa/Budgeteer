// Comprehensive error handling system for multi-tier storage architecture

export enum StorageErrorCode {
  // Generic storage errors
  STORAGE_INITIALIZATION_FAILED = 'STORAGE_INITIALIZATION_FAILED',
  STORAGE_CONNECTION_FAILED = 'STORAGE_CONNECTION_FAILED',
  STORAGE_OPERATION_FAILED = 'STORAGE_OPERATION_FAILED',
  STORAGE_CLEANUP_FAILED = 'STORAGE_CLEANUP_FAILED',
  
  // Data validation errors
  INVALID_DATA = 'INVALID_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  
  // Referential integrity errors
  REFERENTIAL_INTEGRITY_ERROR = 'REFERENTIAL_INTEGRITY_ERROR',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  CHECK_CONSTRAINT_VIOLATION = 'CHECK_CONSTRAINT_VIOLATION',
  
  // CRUD operation errors
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  RECORD_ALREADY_EXISTS = 'RECORD_ALREADY_EXISTS',
  CREATE_OPERATION_FAILED = 'CREATE_OPERATION_FAILED',
  READ_OPERATION_FAILED = 'READ_OPERATION_FAILED',
  UPDATE_OPERATION_FAILED = 'UPDATE_OPERATION_FAILED',
  DELETE_OPERATION_FAILED = 'DELETE_OPERATION_FAILED',
  
  // Permission and access errors
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  
  // Network and connectivity errors (for cloud mode)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Local storage specific errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  DATABASE_LOCKED = 'DATABASE_LOCKED',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  
  // Mock storage specific errors
  MOCK_DATA_CORRUPTION = 'MOCK_DATA_CORRUPTION',
  MOCK_VALIDATION_FAILED = 'MOCK_VALIDATION_FAILED',
  
  // Unknown/unexpected errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StorageErrorDetails {
  table?: string;
  field?: string;
  value?: any;
  operation?: string;
  tenantId?: string;
  recordId?: string;
  originalError?: Error;
  stackTrace?: string;
  timestamp?: string;
  storageMode?: 'cloud' | 'demo' | 'local';
  [key: string]: any;
}

export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  public readonly details: StorageErrorDetails;
  public readonly isRetryable: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: StorageErrorCode,
    details: StorageErrorDetails = {},
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.details = {
      ...details,
      timestamp: new Date().toISOString(),
      stackTrace: this.stack
    };
    this.isRetryable = isRetryable;
    this.timestamp = new Date().toISOString();

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, StorageError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ReferentialIntegrityError extends StorageError {
  constructor(table: string, field: string, value: string, details: StorageErrorDetails = {}) {
    super(
      `Referenced record not found: ${table}.${field} = ${value}`,
      StorageErrorCode.REFERENTIAL_INTEGRITY_ERROR,
      {
        ...details,
        table,
        field,
        value
      },
      false
    );
    this.name = 'ReferentialIntegrityError';
    Object.setPrototypeOf(this, ReferentialIntegrityError.prototype);
  }
}

export class UniqueConstraintError extends StorageError {
  constructor(table: string, field: string, value: string, details: StorageErrorDetails = {}) {
    super(
      `Unique constraint violation: ${table}.${field} = ${value} already exists`,
      StorageErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
      {
        ...details,
        table,
        field,
        value
      },
      false
    );
    this.name = 'UniqueConstraintError';
    Object.setPrototypeOf(this, UniqueConstraintError.prototype);
  }
}

export class RecordNotFoundError extends StorageError {
  constructor(table: string, recordId: string, details: StorageErrorDetails = {}) {
    super(
      `Record not found: ${table} with id ${recordId}`,
      StorageErrorCode.RECORD_NOT_FOUND,
      {
        ...details,
        table,
        recordId
      },
      false
    );
    this.name = 'RecordNotFoundError';
    Object.setPrototypeOf(this, RecordNotFoundError.prototype);
  }
}

export class ValidationError extends StorageError {
  constructor(field: string, value: any, reason: string, details: StorageErrorDetails = {}) {
    super(
      `Validation failed for field '${field}': ${reason}`,
      StorageErrorCode.INVALID_DATA,
      {
        ...details,
        field,
        value,
        reason
      },
      false
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NetworkError extends StorageError {
  constructor(message: string, details: StorageErrorDetails = {}) {
    super(
      `Network error: ${message}`,
      StorageErrorCode.NETWORK_ERROR,
      details,
      true // Network errors are typically retryable
    );
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends StorageError {
  constructor(operation: string, timeout: number, details: StorageErrorDetails = {}) {
    super(
      `Operation '${operation}' timed out after ${timeout}ms`,
      StorageErrorCode.TIMEOUT_ERROR,
      {
        ...details,
        operation,
        timeout
      },
      true // Timeout errors are typically retryable
    );
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class QuotaExceededError extends StorageError {
  constructor(details: StorageErrorDetails = {}) {
    super(
      'Storage quota exceeded',
      StorageErrorCode.QUOTA_EXCEEDED,
      details,
      false
    );
    this.name = 'QuotaExceededError';
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

export class UnauthorizedError extends StorageError {
  constructor(operation: string, details: StorageErrorDetails = {}) {
    super(
      `Unauthorized access to operation: ${operation}`,
      StorageErrorCode.UNAUTHORIZED_ACCESS,
      {
        ...details,
        operation
      },
      false
    );
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}