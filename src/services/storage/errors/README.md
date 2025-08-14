# Storage Error Handling System

This directory contains a comprehensive error handling system that ensures consistent error behavior across all storage implementations (Supabase, Mock, and Local storage).

## Overview

The error handling system provides:

- **Consistent Error Types**: All storage implementations throw the same error types
- **Error Mapping**: Automatic mapping from backend-specific errors to consistent StorageError types
- **Error Recovery**: Retry mechanisms and fallback strategies for handling transient failures
- **Error Logging**: Comprehensive logging and reporting for debugging and monitoring
- **Integration**: Seamless integration with existing TanStack Query patterns

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Storage       │    │   Error          │    │   Error         │
│   Operations    │───▶│   Handler        │───▶│   Logger        │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Error          │
                       │   Mapper         │
                       │                  │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Error          │
                       │   Recovery       │
                       │                  │
                       └──────────────────┘
```

## Components

### 1. StorageErrors.ts

Defines consistent error types used across all storage implementations:

```typescript
// Base error class
export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  public readonly details: StorageErrorDetails;
  public readonly isRetryable: boolean;
  public readonly timestamp: string;
}

// Specific error types
export class ReferentialIntegrityError extends StorageError
export class UniqueConstraintError extends StorageError
export class RecordNotFoundError extends StorageError
export class ValidationError extends StorageError
export class NetworkError extends StorageError
export class TimeoutError extends StorageError
export class QuotaExceededError extends StorageError
export class UnauthorizedError extends StorageError
```

### 2. ErrorMapper.ts

Maps backend-specific errors to consistent StorageError types:

```typescript
export class ErrorMapper {
  static mapError(error: any, context: ErrorMappingContext): StorageError
  private static mapSupabaseError(error: any, details: StorageErrorDetails): StorageError
  private static mapLocalStorageError(error: any, details: StorageErrorDetails): StorageError
  private static mapMockError(error: any, details: StorageErrorDetails): StorageError
}
```

### 3. ErrorRecovery.ts

Provides retry mechanisms and recovery strategies:

```typescript
export class ErrorRecovery {
  static async withRetry<T>(operation: () => Promise<T>, context: RecoveryContext, options?: RetryOptions): Promise<T>
  static async withFallback<T>(primaryOperation: () => Promise<T>, fallbackOperation: () => Promise<T>, context: RecoveryContext): Promise<T>
  static async attemptRecovery(error: StorageError, context: RecoveryContext): Promise<boolean>
  static createCircuitBreaker(failureThreshold?: number, resetTimeout?: number)
}
```

### 4. ErrorLogger.ts

Comprehensive logging and reporting system:

```typescript
export class ErrorLogger {
  logError(error: StorageError, context: any): void
  logRetryAttempt(context: any, attempt: number, error: StorageError): void
  logRecovery(context: any, successfulAttempt: number, lastError: StorageError): void
  generateErrorReport(timeRange?: { start: Date; end: Date }): ErrorReport
  getFilteredLogs(filter: any): ErrorLogEntry[]
}
```

### 5. StorageErrorHandler.ts

Main integration point that combines all error handling components:

```typescript
export class StorageErrorHandler {
  async handleOperation<T>(operation: () => Promise<T>, context: any, options?: any): Promise<T>
  async withRetry<T>(operation: () => Promise<T>, context: RecoveryContext, retryOptions?: Partial<RetryOptions>): Promise<T>
  async withFallback<T>(primaryOperation: () => Promise<T>, fallbackOperation: () => Promise<T>, context: RecoveryContext): Promise<T>
  createBoundHandler(storageMode: 'cloud' | 'demo' | 'local', table?: string, tenantId?: string)
}
```

## Usage

### Basic Error Handling

```typescript
import { withStorageErrorHandling } from '@/src/services/storage/errors';

export const getAllAccounts = async (tenantId: string): Promise<Account[]> => {
  return withStorageErrorHandling(
    async () => {
      // Your storage operation here
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('tenantid', tenantId);
      
      if (error) throw error;
      return data;
    },
    {
      storageMode: 'cloud',
      operation: 'getAllAccounts',
      table: 'accounts',
      tenantId
    }
  );
};
```

### Advanced Error Handling with Retry

```typescript
import { StorageErrorHandler } from '@/src/services/storage/errors';

const errorHandler = new StorageErrorHandler({
  enableRetry: true,
  retryOptions: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  }
});

export const createAccount = async (account: any) => {
  return errorHandler.handleOperation(
    async () => {
      // Your create operation
    },
    {
      storageMode: 'cloud',
      operation: 'createAccount',
      table: 'accounts',
      tenantId: account.tenantid
    },
    {
      retry: true,
      fallback: async () => {
        // Fallback operation if needed
      }
    }
  );
};
```

### Bound Error Handler

```typescript
// Create a bound handler for a specific storage mode and table
const accountsHandler = errorHandler.createBoundHandler('cloud', 'accounts', 'tenant-123');

export const updateAccount = async (account: any) => {
  return accountsHandler.handleOperation(
    async () => {
      // Your update operation
    },
    'updateAccount',
    account.id
  );
};
```

### Error Logging and Monitoring

```typescript
import { globalErrorHandler } from '@/src/services/storage/errors';

// Generate error report
const report = globalErrorHandler.generateErrorReport({
  start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
  end: new Date()
});

console.log('Total errors:', report.summary.totalErrors);
console.log('Most common errors:', report.patterns.mostCommonErrors);
console.log('Error trends:', report.patterns.errorTrends);
```

## Error Codes

The system uses standardized error codes:

```typescript
export enum StorageErrorCode {
  // Generic storage errors
  STORAGE_INITIALIZATION_FAILED = 'STORAGE_INITIALIZATION_FAILED',
  STORAGE_CONNECTION_FAILED = 'STORAGE_CONNECTION_FAILED',
  STORAGE_OPERATION_FAILED = 'STORAGE_OPERATION_FAILED',
  
  // Data validation errors
  INVALID_DATA = 'INVALID_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Referential integrity errors
  REFERENTIAL_INTEGRITY_ERROR = 'REFERENTIAL_INTEGRITY_ERROR',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  
  // CRUD operation errors
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  RECORD_ALREADY_EXISTS = 'RECORD_ALREADY_EXISTS',
  CREATE_OPERATION_FAILED = 'CREATE_OPERATION_FAILED',
  
  // Network and connectivity errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Local storage specific errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  DATABASE_LOCKED = 'DATABASE_LOCKED',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  
  // And more...
}
```

## Error Mapping Examples

### Supabase Errors

| Supabase Code | StorageError Type | Retryable |
|---------------|-------------------|-----------|
| 23503 | ReferentialIntegrityError | No |
| 23505 | UniqueConstraintError | No |
| PGRST116 | RecordNotFoundError | No |
| 08006 | NetworkError | Yes |
| 57014 | TimeoutError | Yes |

### IndexedDB/SQLite Errors

| Native Error | StorageError Type | Retryable |
|--------------|-------------------|-----------|
| QuotaExceededError | QuotaExceededError | No |
| ConstraintError | ReferentialIntegrityError/UniqueConstraintError | No |
| NotFoundError | RecordNotFoundError | No |
| InvalidStateError | StorageError (DATABASE_LOCKED) | Yes |

### Mock Errors

| Error Pattern | StorageError Type | Retryable |
|---------------|-------------------|-----------|
| "not found" | RecordNotFoundError | No |
| "already exists" | UniqueConstraintError | No |
| "Referenced record not found" | ReferentialIntegrityError | No |
| "validation" | ValidationError | No |

## Testing

The error handling system includes comprehensive tests:

- **Unit Tests**: Test individual components (ErrorMapper, ErrorRecovery, etc.)
- **Integration Tests**: Test cross-storage consistency
- **Error Scenario Tests**: Test specific error conditions

Run tests:

```bash
npm test src/services/storage/errors
```

## Best Practices

1. **Always use withStorageErrorHandling**: Wrap all storage operations
2. **Provide context**: Include operation, table, recordId, and tenantId when available
3. **Handle retryable errors**: Use retry mechanisms for network and temporary failures
4. **Log errors appropriately**: Use the built-in logging for debugging and monitoring
5. **Test error scenarios**: Include error handling tests in your test suites
6. **Monitor error patterns**: Use error reports to identify and fix common issues

## Migration Guide

To migrate existing storage implementations:

1. **Import error handling**: Add `import { withStorageErrorHandling } from '@/src/services/storage/errors';`
2. **Wrap operations**: Wrap existing operations with `withStorageErrorHandling`
3. **Update error handling**: Replace custom error handling with consistent StorageError types
4. **Add context**: Provide operation context for better error tracking
5. **Test thoroughly**: Ensure error scenarios still work as expected

## Configuration

The error handling system can be configured:

```typescript
const errorHandler = new StorageErrorHandler({
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
```

## Troubleshooting

### Common Issues

1. **Errors not being mapped correctly**: Check error mapping patterns in ErrorMapper.ts
2. **Retry not working**: Verify error is marked as retryable
3. **Logs not appearing**: Check if logging is enabled in configuration
4. **Context missing**: Ensure all required context is provided to error handlers

### Debug Mode

Enable debug logging to see detailed error information:

```typescript
const errorHandler = new StorageErrorHandler({
  enableLogging: true,
  logLevel: 'debug'
});
```

## Contributing

When adding new error types or mappings:

1. Add the error code to `StorageErrorCode` enum
2. Create specific error class if needed
3. Update error mapping logic in `ErrorMapper.ts`
4. Add tests for the new error scenarios
5. Update this documentation