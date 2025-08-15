// Error recovery mechanisms for storage failures

import { StorageError, StorageErrorCode } from "./StorageErrors";
import { ErrorLogger } from "./ErrorLogger";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RecoveryContext {
  operation: string;
  storageMode: "cloud" | "demo" | "local";
  table?: string;
  recordId?: string;
  tenantId?: string;
  originalArgs?: any[];
}

export class ErrorRecovery {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  };

  private static readonly logger = new ErrorLogger();

  /**
   * Executes an operation with automatic retry logic for retryable errors
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: RecoveryContext,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const retryOptions = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: StorageError;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Log successful recovery if this wasn't the first attempt
        if (attempt > 1) {
          this.logger.logRecovery(context, attempt, lastError!);
        }

        return result;
      } catch (error) {
        // Preserve specific StorageError types (ReferentialIntegrityError, etc.)
        if (error instanceof StorageError) {
          lastError = error;
        } else {
          // Only convert non-StorageError types to generic StorageError
          const errorMessage = error instanceof Error ? error.message : (error as any)?.message || "Unknown error";
          const originalError = error instanceof Error ? error : undefined;
          lastError = new StorageError(errorMessage, StorageErrorCode.UNKNOWN_ERROR, { originalError });
        }

        // Log the error attempt
        this.logger.logRetryAttempt(context, attempt, lastError);

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === retryOptions.maxAttempts || !lastError.isRetryable) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryOptions);
        await this.sleep(delay);
      }
    }

    // All retry attempts failed
    this.logger.logRetryFailure(context, retryOptions.maxAttempts, lastError!);
    throw lastError!;
  }

  /**
   * Attempts to recover from specific error types
   */
  static async attemptRecovery(error: StorageError, context: RecoveryContext): Promise<boolean> {
    this.logger.logRecoveryAttempt(context, error);

    switch (error.code) {
      case StorageErrorCode.STORAGE_CONNECTION_FAILED:
        return await this.recoverFromConnectionFailure(context);

      case StorageErrorCode.DATABASE_LOCKED:
        return await this.recoverFromDatabaseLock(context);

      case StorageErrorCode.QUOTA_EXCEEDED:
        return await this.recoverFromQuotaExceeded(context);

      case StorageErrorCode.NETWORK_ERROR:
        return await this.recoverFromNetworkError(context);

      default:
        return false;
    }
  }

  /**
   * Provides fallback mechanisms when primary storage fails
   */
  static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: RecoveryContext,
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      // Preserve specific StorageError types (ReferentialIntegrityError, etc.)
      const storageError =
        error instanceof StorageError
          ? error
          : new StorageError(
              error instanceof Error ? error.message : (error as any)?.message || "Unknown error",
              StorageErrorCode.UNKNOWN_ERROR,
              { originalError: error instanceof Error ? error : undefined },
            );

      this.logger.logFallbackAttempt(context, storageError);

      try {
        const result = await fallbackOperation();
        this.logger.logFallbackSuccess(context, storageError);
        return result;
      } catch (fallbackError) {
        this.logger.logFallbackFailure(context, storageError, fallbackError);
        throw storageError; // Throw original error, not fallback error
      }
    }
  }

  /**
   * Calculates exponential backoff delay with optional jitter
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    const exponentialDelay = Math.min(
      options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1),
      options.maxDelay,
    );

    if (options.jitter) {
      // Add random jitter (±25% of the delay)
      const jitterRange = exponentialDelay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, exponentialDelay + jitter);
    }

    return exponentialDelay;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Recovery strategies for specific error types
   */
  private static async recoverFromConnectionFailure(context: RecoveryContext): Promise<boolean> {
    // For cloud storage, we might try to reinitialize the connection
    if (context.storageMode === "cloud") {
      try {
        // This would typically involve reinitializing the Supabase client
        // Implementation depends on the specific storage provider
        await this.sleep(2000); // Wait before retry
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  private static async recoverFromDatabaseLock(context: RecoveryContext): Promise<boolean> {
    // For local storage, wait a bit longer for the lock to be released
    if (context.storageMode === "local") {
      await this.sleep(5000);
      return true;
    }
    return false;
  }

  private static async recoverFromQuotaExceeded(context: RecoveryContext): Promise<boolean> {
    // For local storage, we might try to clean up old data
    if (context.storageMode === "local") {
      try {
        // This would involve cleaning up old or unnecessary data
        // Implementation would depend on the specific cleanup strategy
        return false; // For now, we can't automatically recover from quota issues
      } catch {
        return false;
      }
    }
    return false;
  }

  private static async recoverFromNetworkError(context: RecoveryContext): Promise<boolean> {
    // For network errors, we just wait and retry
    if (context.storageMode === "cloud") {
      await this.sleep(3000);
      return true;
    }
    return false;
  }

  /**
   * Determines if an operation should be retried based on error and context
   */
  static shouldRetry(error: StorageError, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }

    if (!error.isRetryable) {
      return false;
    }

    // Don't retry certain critical errors
    const nonRetryableCodes = [
      StorageErrorCode.UNAUTHORIZED_ACCESS,
      StorageErrorCode.INSUFFICIENT_PERMISSIONS,
      StorageErrorCode.REFERENTIAL_INTEGRITY_ERROR,
      StorageErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
      StorageErrorCode.INVALID_DATA,
    ];

    return !nonRetryableCodes.includes(error.code);
  }

  /**
   * Creates a circuit breaker pattern for failing operations
   */
  static createCircuitBreaker(failureThreshold: number = 5, resetTimeout: number = 60000) {
    let failureCount = 0;
    let lastFailureTime = 0;
    let state: "closed" | "open" | "half-open" = "closed";

    return {
      async execute<T>(operation: () => Promise<T>): Promise<T> {
        const now = Date.now();

        // Reset circuit breaker if enough time has passed
        if (state === "open" && now - lastFailureTime > resetTimeout) {
          state = "half-open";
          failureCount = 0;
        }

        // Reject immediately if circuit is open
        if (state === "open") {
          throw new StorageError("Circuit breaker is open", StorageErrorCode.SERVICE_UNAVAILABLE, {
            circuitBreakerState: state,
          });
        }

        try {
          const result = await operation();

          // Reset on success
          if (state === "half-open") {
            state = "closed";
            failureCount = 0;
          }

          return result;
        } catch (error) {
          failureCount++;
          lastFailureTime = now;

          // Open circuit if threshold reached
          if (failureCount >= failureThreshold) {
            state = "open";
          }

          throw error;
        }
      },

      getState() {
        return { state, failureCount, lastFailureTime };
      },
    };
  }
}
