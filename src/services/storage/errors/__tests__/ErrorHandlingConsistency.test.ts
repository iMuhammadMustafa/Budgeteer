// Tests for error handling consistency across all storage implementations

import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError,
  UniqueConstraintError,
  RecordNotFoundError,
  NetworkError,
  TimeoutError
} from '../StorageErrors';
import { ErrorMapper } from '../ErrorMapper';
import { ErrorRecovery } from '../ErrorRecovery';
import { ErrorLogger } from '../ErrorLogger';
import { StorageErrorHandler, globalErrorHandler } from '../StorageErrorHandler';

describe('Error Handling Consistency', () => {
  let errorHandler: StorageErrorHandler;
  let logger: ErrorLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new StorageErrorHandler({
      enableRetry: true,
      enableLogging: true,
      retryOptions: {
        maxAttempts: 2,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: false
      }
    });
    logger = errorHandler.getLogger();
    logger.clearLogs();
  });

  describe('StorageError Types', () => {
    it('should create consistent StorageError instances', () => {
      const error = new StorageError(
        'Test error',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        { table: 'accounts', operation: 'create' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StorageError);
      expect(error.name).toBe('StorageError');
      expect(error.code).toBe(StorageErrorCode.STORAGE_OPERATION_FAILED);
      expect(error.details.table).toBe('accounts');
      expect(error.details.operation).toBe('create');
      expect(error.isRetryable).toBe(false);
      expect(error.timestamp).toBeDefined();
    });

    it('should create ReferentialIntegrityError correctly', () => {
      const error = new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id');

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(ReferentialIntegrityError);
      expect(error.name).toBe('ReferentialIntegrityError');
      expect(error.code).toBe(StorageErrorCode.REFERENTIAL_INTEGRITY_ERROR);
      expect(error.details.table).toBe('accounts');
      expect(error.details.field).toBe('categoryid');
      expect(error.details.value).toBe('invalid-id');
    });

    it('should create UniqueConstraintError correctly', () => {
      const error = new UniqueConstraintError('accounts', 'name', 'duplicate-name');

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(UniqueConstraintError);
      expect(error.name).toBe('UniqueConstraintError');
      expect(error.code).toBe(StorageErrorCode.UNIQUE_CONSTRAINT_VIOLATION);
    });

    it('should serialize errors to JSON correctly', () => {
      const error = new StorageError(
        'Test error',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        { table: 'accounts' }
      );

      const json = error.toJSON();
      expect(json.name).toBe('StorageError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(StorageErrorCode.STORAGE_OPERATION_FAILED);
      expect(json.details.table).toBe('accounts');
      expect(json.isRetryable).toBe(false);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('Error Mapping', () => {
    it('should map Supabase errors correctly', () => {
      const supabaseError = {
        code: '23503',
        message: 'Foreign key violation'
      };

      const mappedError = ErrorMapper.mapError(supabaseError, {
        storageMode: 'cloud',
        operation: 'createAccount',
        table: 'accounts'
      });

      expect(mappedError).toBeInstanceOf(ReferentialIntegrityError);
      expect(mappedError.code).toBe(StorageErrorCode.REFERENTIAL_INTEGRITY_ERROR);
      expect(mappedError.details.storageMode).toBe('cloud');
    });

    it('should map local storage errors correctly', () => {
      const indexedDBError = {
        name: 'QuotaExceededError',
        message: 'Storage quota exceeded'
      };

      const mappedError = ErrorMapper.mapError(indexedDBError, {
        storageMode: 'local',
        operation: 'createAccount',
        table: 'accounts'
      });

      expect(mappedError.code).toBe(StorageErrorCode.QUOTA_EXCEEDED);
      expect(mappedError.details.storageMode).toBe('local');
    });

    it('should map mock errors correctly', () => {
      const mockError = new Error('Referenced record not found: accounts.categoryid = invalid-id');

      const mappedError = ErrorMapper.mapError(mockError, {
        storageMode: 'demo',
        operation: 'createAccount',
        table: 'accounts'
      });

      expect(mappedError).toBeInstanceOf(ReferentialIntegrityError);
      expect(mappedError.details.storageMode).toBe('demo');
    });

    it('should preserve existing StorageError instances', () => {
      const originalError = new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id');

      const mappedError = ErrorMapper.mapError(originalError, {
        storageMode: 'cloud',
        operation: 'createAccount',
        table: 'accounts'
      });

      expect(mappedError).toBe(originalError);
      expect(mappedError.details.storageMode).toBe('cloud');
    });
  });

  describe('Error Recovery', () => {
    it('should retry retryable operations', async () => {
      let attempts = 0;
      const operation = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new NetworkError('Network timeout');
        }
        return 'success';
      });

      const result = await ErrorRecovery.withRetry(
        operation,
        {
          operation: 'testOperation',
          storageMode: 'cloud'
        },
        {
          maxAttempts: 3,
          baseDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          jitter: false
        }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable operations', async () => {
      let attempts = 0;
      const operation = jest.fn(async () => {
        attempts++;
        throw new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id');
      });

      await expect(
        ErrorRecovery.withRetry(
          operation,
          {
            operation: 'testOperation',
            storageMode: 'cloud'
          },
          {
            maxAttempts: 3,
            baseDelay: 10,
            maxDelay: 100,
            backoffMultiplier: 2,
            jitter: false
          }
        )
      ).rejects.toThrow(ReferentialIntegrityError);

      expect(attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute fallback when primary operation fails', async () => {
      const primaryOperation = jest.fn(async () => {
        throw new NetworkError('Primary failed');
      });

      const fallbackOperation = jest.fn(async () => {
        return 'fallback success';
      });

      const result = await ErrorRecovery.withFallback(
        primaryOperation,
        fallbackOperation,
        {
          operation: 'testOperation',
          storageMode: 'cloud'
        }
      );

      expect(result).toBe('fallback success');
      expect(primaryOperation).toHaveBeenCalledTimes(1);
      expect(fallbackOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with full context', () => {
      const error = new StorageError(
        'Test error',
        StorageErrorCode.STORAGE_OPERATION_FAILED,
        { table: 'accounts' }
      );

      logger.logError(error, {
        operation: 'createAccount',
        storageMode: 'cloud',
        table: 'accounts',
        recordId: 'acc-123',
        tenantId: 'tenant-456'
      });

      const logs = logger.getAllLogs();
      expect(logs).toHaveLength(1);
      
      const logEntry = logs[0];
      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toBe('Test error');
      expect(logEntry.error).toBe(error);
      expect(logEntry.operation).toBe('createAccount');
      expect(logEntry.storageMode).toBe('cloud');
      expect(logEntry.table).toBe('accounts');
      expect(logEntry.recordId).toBe('acc-123');
      expect(logEntry.tenantId).toBe('tenant-456');
    });

    it('should generate error reports correctly', () => {
      // Log multiple errors
      logger.logError(new StorageError('Error 1', StorageErrorCode.NETWORK_ERROR), {
        storageMode: 'cloud',
        table: 'accounts'
      });
      logger.logError(new StorageError('Error 2', StorageErrorCode.NETWORK_ERROR), {
        storageMode: 'cloud',
        table: 'transactions'
      });
      logger.logError(new StorageError('Error 3', StorageErrorCode.QUOTA_EXCEEDED), {
        storageMode: 'local',
        table: 'accounts'
      });

      const report = logger.generateErrorReport();
      
      expect(report.summary.totalErrors).toBe(3);
      expect(report.summary.errorsByCode[StorageErrorCode.NETWORK_ERROR]).toBe(2);
      expect(report.summary.errorsByCode[StorageErrorCode.QUOTA_EXCEEDED]).toBe(1);
      expect(report.summary.errorsByStorageMode.cloud).toBe(2);
      expect(report.summary.errorsByStorageMode.local).toBe(1);
      expect(report.summary.errorsByTable.accounts).toBe(2);
      expect(report.summary.errorsByTable.transactions).toBe(1);
    });
  });

  describe('StorageErrorHandler Integration', () => {
    it('should handle operations with error mapping and logging', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Generic error');
      });

      await expect(
        errorHandler.handleOperation(
          operation,
          {
            storageMode: 'cloud',
            operation: 'testOperation',
            table: 'accounts',
            recordId: 'acc-123',
            tenantId: 'tenant-456'
          }
        )
      ).rejects.toThrow(StorageError);

      const logs = logger.getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].operation).toBe('testOperation');
      expect(logs[0].storageMode).toBe('cloud');
    });

    it('should create bound handlers correctly', async () => {
      const boundHandler = errorHandler.createBoundHandler('cloud', 'accounts', 'tenant-123');
      
      const operation = jest.fn(async () => {
        throw new Error('Test error');
      });

      await expect(
        boundHandler.handleOperation(operation, 'testOperation', 'acc-123')
      ).rejects.toThrow(StorageError);

      const logs = logger.getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].storageMode).toBe('cloud');
      expect(logs[0].table).toBe('accounts');
      expect(logs[0].tenantId).toBe('tenant-123');
      expect(logs[0].recordId).toBe('acc-123');
    });

    it('should work with global error handler', async () => {
      const operation = jest.fn(async () => {
        return 'success';
      });

      const result = await globalErrorHandler.handleOperation(
        operation,
        {
          storageMode: 'demo',
          operation: 'testOperation'
        }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after failure threshold', async () => {
      const circuitBreaker = ErrorRecovery.createCircuitBreaker(2, 1000);
      
      const failingOperation = jest.fn(async () => {
        throw new Error('Operation failed');
      });

      // First failure
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      expect(circuitBreaker.getState().state).toBe('closed');
      
      // Second failure - should open circuit
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
      expect(circuitBreaker.getState().state).toBe('open');
      
      // Third attempt - should be rejected immediately
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(StorageError);
      expect(failingOperation).toHaveBeenCalledTimes(2); // Not called the third time
    });
  });
});