// Main error handling wrapper that integrates all error handling components

import { StorageError, StorageErrorCode } from './StorageErrors';
import { ErrorMapper, ErrorMappingContext } from './ErrorMapper';
import { ErrorRecovery, RetryOptions, RecoveryContext } from './ErrorRecovery';
import { ErrorLogger } from './ErrorLogger';

export interface StorageErrorHandlerOptions {
  enableRetry?: boolean;
  retryOptions?: Partial<RetryOptions>;
  enableFallback?: boolean;
  enableLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export class StorageErrorHandler {
  private logger: ErrorLogger;
  private options: StorageErrorHandlerOptions;

  constructor(options: StorageErrorHandlerOptions = {}) {
    this.options = {
      enableRetry: true,
      enableFallback: false,
      enableLogging: true,
      logLevel: 'error',
      ...options
    };
    
    this.logger = new ErrorLogger();
  }

  /**
   * Wraps a storage operation with comprehensive error handling
   */
  async handleOperation<T>(
    operation: () => Promise<T>,
    context: {
      storageMode: 'cloud' | 'demo' | 'local';
      operation: string;
      table?: string;
      recordId?: string;
      tenantId?: string;
    },
    options: {
      retry?: boolean;
      retryOptions?: Partial<RetryOptions>;
      fallback?: () => Promise<T>;
    } = {}
  ): Promise<T> {
    const mappingContext: ErrorMappingContext = {
      storageMode: context.storageMode,
      operation: context.operation,
      table: context.table,
      recordId: context.recordId,
      tenantId: context.tenantId
    };

    const recoveryContext: RecoveryContext = {
      operation: context.operation,
      storageMode: context.storageMode,
      table: context.table,
      recordId: context.recordId,
      tenantId: context.tenantId
    };

    try {
      // Execute with retry if enabled
      if ((options.retry ?? this.options.enableRetry)) {
        return await ErrorRecovery.withRetry(
          operation,
          recoveryContext,
          options.retryOptions || this.options.retryOptions
        );
      }

      // Execute with fallback if provided
      if (options.fallback && this.options.enableFallback) {
        return await ErrorRecovery.withFallback(
          operation,
          options.fallback,
          recoveryContext
        );
      }

      // Execute normally
      return await operation();
    } catch (error) {
      // Map the error to a consistent StorageError
      const mappedError = ErrorMapper.mapError(error, mappingContext);
      
      // Log the error if logging is enabled
      if (this.options.enableLogging) {
        this.logger.logError(mappedError, {
          operation: context.operation,
          storageMode: context.storageMode,
          table: context.table,
          recordId: context.recordId,
          tenantId: context.tenantId
        });
      }

      throw mappedError;
    }
  }

  /**
   * Wraps a storage operation with retry logic only
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: RecoveryContext,
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    try {
      return await ErrorRecovery.withRetry(
        operation,
        context,
        retryOptions || this.options.retryOptions
      );
    } catch (error) {
      const mappedError = ErrorMapper.mapError(error, {
        storageMode: context.storageMode,
        operation: context.operation,
        table: context.table,
        recordId: context.recordId,
        tenantId: context.tenantId
      });

      if (this.options.enableLogging) {
        this.logger.logError(mappedError, context);
      }

      throw mappedError;
    }
  }

  /**
   * Wraps a storage operation with fallback logic
   */
  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: RecoveryContext
  ): Promise<T> {
    try {
      return await ErrorRecovery.withFallback(
        primaryOperation,
        fallbackOperation,
        context
      );
    } catch (error) {
      const mappedError = ErrorMapper.mapError(error, {
        storageMode: context.storageMode,
        operation: context.operation,
        table: context.table,
        recordId: context.recordId,
        tenantId: context.tenantId
      });

      if (this.options.enableLogging) {
        this.logger.logError(mappedError, context);
      }

      throw mappedError;
    }
  }

  /**
   * Maps a raw error to a StorageError
   */
  mapError(error: any, context: ErrorMappingContext): StorageError {
    const mappedError = ErrorMapper.mapError(error, context);
    
    if (this.options.enableLogging) {
      this.logger.logError(mappedError, {
        operation: context.operation,
        storageMode: context.storageMode,
        table: context.table,
        recordId: context.recordId,
        tenantId: context.tenantId
      });
    }

    return mappedError;
  }

  /**
   * Creates a circuit breaker for a specific operation
   */
  createCircuitBreaker(failureThreshold: number = 5, resetTimeout: number = 60000) {
    return ErrorRecovery.createCircuitBreaker(failureThreshold, resetTimeout);
  }

  /**
   * Gets the error logger instance
   */
  getLogger(): ErrorLogger {
    return this.logger;
  }

  /**
   * Generates an error report
   */
  generateErrorReport(timeRange?: { start: Date; end: Date }) {
    return this.logger.generateErrorReport(timeRange);
  }

  /**
   * Clears all logged errors
   */
  clearErrorLogs(): void {
    this.logger.clearLogs();
  }

  /**
   * Updates the error handler options
   */
  updateOptions(options: Partial<StorageErrorHandlerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Creates a bound error handler for a specific storage mode and table
   */
  createBoundHandler(
    storageMode: 'cloud' | 'demo' | 'local',
    table?: string,
    tenantId?: string
  ) {
    return {
      handleOperation: <T>(
        operation: () => Promise<T>,
        operationName: string,
        recordId?: string,
        options?: {
          retry?: boolean;
          retryOptions?: Partial<RetryOptions>;
          fallback?: () => Promise<T>;
        }
      ) => this.handleOperation(
        operation,
        {
          storageMode,
          operation: operationName,
          table,
          recordId,
          tenantId
        },
        options
      ),

      mapError: (error: any, operation: string, recordId?: string) => 
        this.mapError(error, {
          storageMode,
          operation,
          table,
          recordId,
          tenantId
        })
    };
  }
}

// Global error handler instance
export const globalErrorHandler = new StorageErrorHandler({
  enableRetry: true,
  enableFallback: false,
  enableLogging: true,
  logLevel: 'error',
  retryOptions: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  }
});

// Convenience functions for common error handling patterns
export const withStorageErrorHandling = <T>(
  operation: () => Promise<T>,
  context: {
    storageMode: 'cloud' | 'demo' | 'local';
    operation: string;
    table?: string;
    recordId?: string;
    tenantId?: string;
  }
): Promise<T> => {
  return globalErrorHandler.handleOperation(operation, context);
};

export const mapStorageError = (
  error: any,
  context: ErrorMappingContext
): StorageError => {
  return globalErrorHandler.mapError(error, context);
};