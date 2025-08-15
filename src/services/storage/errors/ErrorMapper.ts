// Error mapping utilities for different storage backends

import {
  StorageError,
  StorageErrorCode,
  ReferentialIntegrityError,
  UniqueConstraintError,
  RecordNotFoundError,
  ValidationError,
  NetworkError,
  TimeoutError,
  QuotaExceededError,
  UnauthorizedError,
  StorageErrorDetails,
} from "./StorageErrors";

export interface ErrorMappingContext {
  storageMode: "cloud" | "demo" | "local";
  operation: string;
  table?: string;
  recordId?: string;
  tenantId?: string;
}

export class ErrorMapper {
  /**
   * Maps native errors from different storage backends to consistent StorageError types
   */
  static mapError(error: any, context: ErrorMappingContext): StorageError {
    const details: StorageErrorDetails = {
      storageMode: context.storageMode,
      operation: context.operation,
      table: context.table,
      recordId: context.recordId,
      tenantId: context.tenantId,
      originalError: error,
    };

    // If it's already a StorageError, return as-is (details are already set in constructor)
    if (error instanceof StorageError) {
      return error;
    }

    switch (context.storageMode) {
      case "cloud":
        return this.mapSupabaseError(error, details);
      case "local":
        return this.mapLocalStorageError(error, details);
      case "demo":
        return this.mapMockError(error, details);
      default:
        return this.mapGenericError(error, details);
    }
  }

  /**
   * Maps Supabase-specific errors to StorageError types
   */
  private static mapSupabaseError(error: any, details: StorageErrorDetails): StorageError {
    const message = error.message || error.toString();

    // Supabase PostgreSQL error codes
    if (error.code) {
      switch (error.code) {
        case "23503": // Foreign key violation
          return new ReferentialIntegrityError(details.table || "unknown", "unknown_field", "unknown_value", details);

        case "23505": // Unique violation
          return new UniqueConstraintError(details.table || "unknown", "unknown_field", "unknown_value", details);

        case "PGRST116": // No rows found
          return new RecordNotFoundError(details.table || "unknown", details.recordId || "unknown", details);

        case "42501": // Insufficient privilege
          return new UnauthorizedError(details.operation || "unknown", details);

        case "08006": // Connection failure
        case "08001": // Unable to connect
          return new NetworkError(message, details);

        case "57014": // Query canceled (timeout)
          return new TimeoutError(details.operation || "unknown", 30000, details);
      }
    }

    // Supabase-specific error patterns
    if (message.includes("JWT")) {
      return new UnauthorizedError(details.operation || "unknown", details);
    }

    if (message.includes("network") || message.includes("fetch")) {
      return new NetworkError(message, details);
    }

    if (message.includes("timeout")) {
      return new TimeoutError(details.operation || "unknown", 30000, details);
    }

    return new StorageError(message, StorageErrorCode.STORAGE_OPERATION_FAILED, details, this.isRetryableError(error));
  }

  /**
   * Maps local storage (IndexedDB/SQLite) errors to StorageError types
   */
  private static mapLocalStorageError(error: any, details: StorageErrorDetails): StorageError {
    const message = error.message || error.toString();

    // IndexedDB error patterns
    if (error.name === "QuotaExceededError" || message.includes("quota")) {
      return new QuotaExceededError(details);
    }

    if (error.name === "ConstraintError" || message.includes("constraint")) {
      if (message.toLowerCase().includes("unique")) {
        return new UniqueConstraintError(details.table || "unknown", "unknown_field", "unknown_value", details);
      }
      return new ReferentialIntegrityError(details.table || "unknown", "unknown_field", "unknown_value", details);
    }

    if (error.name === "NotFoundError" || message.includes("not found")) {
      return new RecordNotFoundError(details.table || "unknown", details.recordId || "unknown", details);
    }

    if (error.name === "InvalidStateError" || message.includes("database is locked")) {
      return new StorageError(message, StorageErrorCode.DATABASE_LOCKED, details, true);
    }

    if (message.includes("migration")) {
      return new StorageError(message, StorageErrorCode.MIGRATION_FAILED, details, false);
    }

    // SQLite error patterns
    if (message.includes("SQLITE_CONSTRAINT")) {
      if (message.includes("UNIQUE")) {
        return new UniqueConstraintError(details.table || "unknown", "unknown_field", "unknown_value", details);
      }
      if (message.includes("FOREIGN KEY")) {
        return new ReferentialIntegrityError(details.table || "unknown", "unknown_field", "unknown_value", details);
      }
    }

    return new StorageError(message, StorageErrorCode.STORAGE_OPERATION_FAILED, details, this.isRetryableError(error));
  }

  /**
   * Maps mock storage errors to StorageError types
   */
  private static mapMockError(error: any, details: StorageErrorDetails): StorageError {
    const message = error.message || error.toString();

    // Check for referential integrity errors first (more specific)
    if (message.includes("Referenced record not found")) {
      return new ReferentialIntegrityError(details.table || "unknown", "unknown_field", "unknown_value", details);
    }

    // Then check for general "not found" errors
    if (message.includes("not found")) {
      return new RecordNotFoundError(details.table || "unknown", details.recordId || "unknown", details);
    }

    if (message.includes("already exists") || message.includes("duplicate")) {
      return new UniqueConstraintError(details.table || "unknown", "unknown_field", "unknown_value", details);
    }

    if (message.includes("validation")) {
      return new ValidationError("unknown_field", "unknown_value", message, details);
    }

    return new StorageError(message, StorageErrorCode.MOCK_VALIDATION_FAILED, details, false);
  }

  /**
   * Maps generic errors to StorageError types
   */
  private static mapGenericError(error: any, details: StorageErrorDetails): StorageError {
    const message = error.message || error.toString();

    // Check for network-related patterns
    if (message.toLowerCase().includes("network")) {
      return new NetworkError(message, details);
    }

    // Check for timeout patterns
    if (message.toLowerCase().includes("timeout")) {
      return new TimeoutError(details.operation || "unknown", 30000, details);
    }

    // Check for database locked patterns
    if (message.toLowerCase().includes("database is locked") || message.toLowerCase().includes("locked")) {
      return new StorageError(message, StorageErrorCode.DATABASE_LOCKED, details, true);
    }

    return new StorageError(message, StorageErrorCode.UNKNOWN_ERROR, details, this.isRetryableError(error));
  }

  /**
   * Determines if an error is potentially retryable
   */
  private static isRetryableError(error: any): boolean {
    const message = error.message || error.toString();
    const retryablePatterns = ["network", "timeout", "connection", "temporary", "busy", "locked", "unavailable"];

    return retryablePatterns.some(pattern => message.toLowerCase().includes(pattern));
  }

  /**
   * Extracts detailed error information for better error mapping
   */
  static extractErrorDetails(error: any): {
    table?: string;
    field?: string;
    value?: string;
    constraint?: string;
  } {
    const message = error.message || error.toString();
    const details: any = {};

    // Extract table name from error messages
    const tableMatch =
      message.match(/table "?(\w+)"?/i) || message.match(/relation "?(\w+)"?/i) || message.match(/on table (\w+)/i);
    if (tableMatch) {
      details.table = tableMatch[1];
    }

    // Extract field name from error messages
    const fieldMatch =
      message.match(/column "?(\w+)"?/i) || message.match(/field "?(\w+)"?/i) || message.match(/key "?(\w+)"?/i);
    if (fieldMatch) {
      details.field = fieldMatch[1];
    }

    // Extract constraint name
    const constraintMatch = message.match(/constraint "?(\w+)"?/i);
    if (constraintMatch) {
      details.constraint = constraintMatch[1];
    }

    return details;
  }
}
