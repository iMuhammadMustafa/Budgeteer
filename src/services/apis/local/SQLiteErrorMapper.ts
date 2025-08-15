import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError, 
  UniqueConstraintError,
  ValidationError,
  QuotaExceededError,
  TimeoutError
} from '../../storage/errors';

export class SQLiteErrorMapper {
  /**
   * Maps SQLite-specific errors to standardized StorageError types
   */
  static mapError(error: any, context: string, operation?: string): StorageError {
    const errorMessage = error?.message || error?.toString() || 'Unknown SQLite error';
    
    // Database locked errors
    if (errorMessage.includes('database is locked') || errorMessage.includes('SQLITE_BUSY')) {
      return new StorageError(
        'Database is currently locked by another operation',
        StorageErrorCode.DATABASE_LOCKED,
        {
          context,
          operation,
          originalError: error,
          isRetryable: true
        },
        true // This is retryable
      );
    }

    // Foreign key constraint violations
    if (errorMessage.includes('FOREIGN KEY constraint failed') || 
        errorMessage.includes('foreign key constraint')) {
      // Try to extract table and field information from the error
      const match = errorMessage.match(/FOREIGN KEY constraint failed/i);
      return new ReferentialIntegrityError(
        'unknown_table',
        'unknown_field', 
        'unknown_value',
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage
        }
      );
    }

    // Unique constraint violations
    if (errorMessage.includes('UNIQUE constraint failed') || 
        errorMessage.includes('unique constraint')) {
      const match = errorMessage.match(/UNIQUE constraint failed: (\w+)\.(\w+)/i);
      const table = match?.[1] || 'unknown_table';
      const field = match?.[2] || 'unknown_field';
      
      return new UniqueConstraintError(
        table,
        field,
        'unknown_value',
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage
        }
      );
    }

    // Check constraint violations
    if (errorMessage.includes('CHECK constraint failed') || 
        errorMessage.includes('check constraint')) {
      return new ValidationError(
        'unknown_field',
        'unknown_value',
        'Check constraint violation',
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage
        }
      );
    }

    // NOT NULL constraint violations
    if (errorMessage.includes('NOT NULL constraint failed')) {
      const match = errorMessage.match(/NOT NULL constraint failed: (\w+)\.(\w+)/i);
      const table = match?.[1] || 'unknown_table';
      const field = match?.[2] || 'unknown_field';
      
      return new ValidationError(
        field,
        null,
        `Required field '${field}' cannot be null`,
        {
          context,
          operation,
          table,
          originalError: error,
          sqliteError: errorMessage
        }
      );
    }

    // Disk I/O errors
    if (errorMessage.includes('disk I/O error') || 
        errorMessage.includes('SQLITE_IOERR')) {
      return new StorageError(
        'Database disk I/O error occurred',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage,
          isRetryable: true
        },
        true
      );
    }

    // Database corruption errors
    if (errorMessage.includes('database disk image is malformed') || 
        errorMessage.includes('SQLITE_CORRUPT')) {
      return new StorageError(
        'Database corruption detected',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage,
          requiresRecovery: true
        },
        false
      );
    }

    // Database full errors
    if (errorMessage.includes('database or disk is full') || 
        errorMessage.includes('SQLITE_FULL')) {
      return new QuotaExceededError({
        context,
        operation,
        originalError: error,
        sqliteError: errorMessage
      });
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || 
        errorMessage.includes('SQLITE_TIMEOUT')) {
      return new TimeoutError(
        operation || 'SQLite operation',
        30000, // Default timeout
        {
          context,
          originalError: error,
          sqliteError: errorMessage
        }
      );
    }

    // Schema errors
    if (errorMessage.includes('no such table') || 
        errorMessage.includes('no such column')) {
      return new StorageError(
        'Database schema error: ' + errorMessage,
        StorageErrorCode.STORAGE_INITIALIZATION_FAILED,
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage,
          requiresSchemaUpdate: true
        },
        false
      );
    }

    // SQL syntax errors
    if (errorMessage.includes('syntax error') || 
        errorMessage.includes('SQLITE_ERROR')) {
      return new StorageError(
        'SQL syntax error: ' + errorMessage,
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        {
          context,
          operation,
          originalError: error,
          sqliteError: errorMessage
        },
        false
      );
    }

    // Generic SQLite error
    return new StorageError(
      `SQLite operation failed: ${errorMessage}`,
      StorageErrorCode.STORAGE_OPERATION_FAILED,
      {
        context,
        operation,
        originalError: error,
        sqliteError: errorMessage
      },
      false
    );
  }

  /**
   * Determines if an error is retryable based on SQLite error codes
   */
  static isRetryable(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    
    return (
      errorMessage.includes('database is locked') ||
      errorMessage.includes('SQLITE_BUSY') ||
      errorMessage.includes('disk I/O error') ||
      errorMessage.includes('SQLITE_IOERR') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('SQLITE_TIMEOUT')
    );
  }

  /**
   * Extracts foreign key constraint details from SQLite error messages
   */
  static extractForeignKeyDetails(error: any): { table?: string; field?: string; value?: string } {
    const errorMessage = error?.message || error?.toString() || '';
    
    // Try to extract more specific information from the error context
    // This would need to be enhanced based on actual error patterns observed
    return {
      table: 'unknown_table',
      field: 'unknown_field',
      value: 'unknown_value'
    };
  }
}