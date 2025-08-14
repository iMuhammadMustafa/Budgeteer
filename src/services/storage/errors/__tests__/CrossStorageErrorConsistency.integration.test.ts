// Integration tests for error handling consistency across storage modes

// No need to import test functions as they're global in Jest
import { 
  StorageError, 
  StorageErrorCode, 
  ReferentialIntegrityError,
  UniqueConstraintError,
  RecordNotFoundError
} from '../StorageErrors';
import { withStorageErrorHandling } from '../StorageErrorHandler';

// Mock storage implementations for testing
const mockSupabaseError = (code: string, message: string) => ({
  code,
  message,
  details: 'Supabase error details'
});

const mockIndexedDBError = (name: string, message: string) => {
  const error = new Error(message);
  error.name = name;
  return error;
};

const mockGenericError = (message: string) => new Error(message);

describe('Cross-Storage Error Consistency Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Referential Integrity Errors', () => {
    it('should handle foreign key violations consistently across all storage modes', async () => {
      // Test Supabase (cloud) foreign key error
      const cloudOperation = async () => {
        throw mockSupabaseError('23503', 'Foreign key constraint violation');
      };

      await expect(
        withStorageErrorHandling(cloudOperation, {
          storageMode: 'cloud',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(ReferentialIntegrityError);

      // Test IndexedDB (local) constraint error
      const localOperation = async () => {
        throw mockIndexedDBError('ConstraintError', 'Foreign key constraint failed');
      };

      await expect(
        withStorageErrorHandling(localOperation, {
          storageMode: 'local',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(ReferentialIntegrityError);

      // Test Mock (demo) referential integrity error
      const demoOperation = async () => {
        throw mockGenericError('Referenced record not found: accounts.categoryid = invalid-id');
      };

      await expect(
        withStorageErrorHandling(demoOperation, {
          storageMode: 'demo',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(ReferentialIntegrityError);
    });
  });

  describe('Unique Constraint Errors', () => {
    it('should handle unique constraint violations consistently across all storage modes', async () => {
      // Test Supabase unique constraint error
      const cloudOperation = async () => {
        throw mockSupabaseError('23505', 'Unique constraint violation');
      };

      await expect(
        withStorageErrorHandling(cloudOperation, {
          storageMode: 'cloud',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(UniqueConstraintError);

      // Test IndexedDB unique constraint error
      const localOperation = async () => {
        throw mockIndexedDBError('ConstraintError', 'Unique constraint violation');
      };

      await expect(
        withStorageErrorHandling(localOperation, {
          storageMode: 'local',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(UniqueConstraintError);

      // Test Mock unique constraint error
      const demoOperation = async () => {
        throw mockGenericError('Account name already exists');
      };

      await expect(
        withStorageErrorHandling(demoOperation, {
          storageMode: 'demo',
          operation: 'createAccount',
          table: 'accounts',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(StorageError);
    });
  });

  describe('Record Not Found Errors', () => {
    it('should handle record not found errors consistently across all storage modes', async () => {
      // Test Supabase not found error
      const cloudOperation = async () => {
        throw mockSupabaseError('PGRST116', 'No rows found');
      };

      await expect(
        withStorageErrorHandling(cloudOperation, {
          storageMode: 'cloud',
          operation: 'getAccountById',
          table: 'accounts',
          recordId: 'non-existent-id',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(RecordNotFoundError);

      // Test IndexedDB not found error
      const localOperation = async () => {
        throw mockIndexedDBError('NotFoundError', 'Record not found');
      };

      await expect(
        withStorageErrorHandling(localOperation, {
          storageMode: 'local',
          operation: 'getAccountById',
          table: 'accounts',
          recordId: 'non-existent-id',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(RecordNotFoundError);

      // Test Mock not found error
      const demoOperation = async () => {
        throw mockGenericError('Account not found');
      };

      await expect(
        withStorageErrorHandling(demoOperation, {
          storageMode: 'demo',
          operation: 'getAccountById',
          table: 'accounts',
          recordId: 'non-existent-id',
          tenantId: 'test-tenant'
        })
      ).rejects.toThrow(RecordNotFoundError);
    });
  });

  describe('Network and Connection Errors', () => {
    it('should handle network errors consistently', async () => {
      // Test Supabase network error
      const cloudOperation = async () => {
        throw mockSupabaseError('08006', 'Connection failure');
      };

      const cloudError = await withStorageErrorHandling(cloudOperation, {
        storageMode: 'cloud',
        operation: 'getAllAccounts',
        table: 'accounts',
        tenantId: 'test-tenant'
      }).catch(err => err);

      expect(cloudError).toBeInstanceOf(StorageError);
      expect(cloudError.code).toBe(StorageErrorCode.NETWORK_ERROR);
      expect(cloudError.isRetryable).toBe(true);

      // Test generic network error
      const networkOperation = async () => {
        throw mockGenericError('Network request failed');
      };

      const networkError = await withStorageErrorHandling(networkOperation, {
        storageMode: 'cloud',
        operation: 'getAllAccounts',
        table: 'accounts',
        tenantId: 'test-tenant'
      }).catch(err => err);

      expect(networkError).toBeInstanceOf(StorageError);
      expect(networkError.code).toBe(StorageErrorCode.NETWORK_ERROR);
      expect(networkError.isRetryable).toBe(true);
    });
  });

  describe('Storage-Specific Errors', () => {
    it('should handle quota exceeded errors for local storage', async () => {
      const localOperation = async () => {
        throw mockIndexedDBError('QuotaExceededError', 'Storage quota exceeded');
      };

      const error = await withStorageErrorHandling(localOperation, {
        storageMode: 'local',
        operation: 'createAccount',
        table: 'accounts',
        tenantId: 'test-tenant'
      }).catch(err => err);

      expect(error).toBeInstanceOf(StorageError);
      expect(error.code).toBe(StorageErrorCode.QUOTA_EXCEEDED);
      expect(error.isRetryable).toBe(false);
    });

    it('should handle database locked errors for local storage', async () => {
      const localOperation = async () => {
        throw mockGenericError('Database is locked');
      };

      const error = await withStorageErrorHandling(localOperation, {
        storageMode: 'local',
        operation: 'updateAccount',
        table: 'accounts',
        recordId: 'acc-123',
        tenantId: 'test-tenant'
      }).catch(err => err);

      expect(error).toBeInstanceOf(StorageError);
      expect(error.code).toBe(StorageErrorCode.DATABASE_LOCKED);
      expect(error.isRetryable).toBe(true);
    });

    it('should handle timeout errors for cloud storage', async () => {
      const cloudOperation = async () => {
        throw mockSupabaseError('57014', 'Query canceled due to timeout');
      };

      const error = await withStorageErrorHandling(cloudOperation, {
        storageMode: 'cloud',
        operation: 'getAllAccounts',
        table: 'accounts',
        tenantId: 'test-tenant'
      }).catch(err => err);

      expect(error).toBeInstanceOf(StorageError);
      expect(error.code).toBe(StorageErrorCode.TIMEOUT_ERROR);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve error context across all storage modes', async () => {
      const testCases = [
        {
          storageMode: 'cloud' as const,
          operation: async () => { throw mockSupabaseError('23503', 'Foreign key error'); }
        },
        {
          storageMode: 'local' as const,
          operation: async () => { throw mockIndexedDBError('ConstraintError', 'Constraint failed'); }
        },
        {
          storageMode: 'demo' as const,
          operation: async () => { throw mockGenericError('Mock error'); }
        }
      ];

      for (const testCase of testCases) {
        const error = await withStorageErrorHandling(testCase.operation, {
          storageMode: testCase.storageMode,
          operation: 'testOperation',
          table: 'accounts',
          recordId: 'test-id',
          tenantId: 'test-tenant'
        }).catch(err => err);

        expect(error).toBeInstanceOf(StorageError);
        expect(error.details.storageMode).toBe(testCase.storageMode);
        expect(error.details.operation).toBe('testOperation');
        expect(error.details.table).toBe('accounts');
        expect(error.details.recordId).toBe('test-id');
        expect(error.details.tenantId).toBe('test-tenant');
        expect(error.details.timestamp).toBeDefined();
        expect(error.details.originalError).toBeDefined();
      }
    });
  });

  describe('Error Serialization Consistency', () => {
    it('should serialize errors consistently across storage modes', async () => {
      const testOperations = [
        {
          storageMode: 'cloud' as const,
          operation: async () => { throw mockSupabaseError('23503', 'Foreign key error'); }
        },
        {
          storageMode: 'local' as const,
          operation: async () => { throw mockIndexedDBError('ConstraintError', 'Constraint failed'); }
        },
        {
          storageMode: 'demo' as const,
          operation: async () => { throw mockGenericError('Mock error'); }
        }
      ];

      const serializedErrors = [];

      for (const testOp of testOperations) {
        const error = await withStorageErrorHandling(testOp.operation, {
          storageMode: testOp.storageMode,
          operation: 'testOperation',
          table: 'accounts',
          tenantId: 'test-tenant'
        }).catch(err => err);

        const serialized = error.toJSON();
        serializedErrors.push(serialized);

        // Verify consistent serialization structure
        expect(serialized).toHaveProperty('name');
        expect(serialized).toHaveProperty('message');
        expect(serialized).toHaveProperty('code');
        expect(serialized).toHaveProperty('details');
        expect(serialized).toHaveProperty('isRetryable');
        expect(serialized).toHaveProperty('timestamp');
        expect(serialized).toHaveProperty('stack');
        
        expect(serialized.details).toHaveProperty('storageMode');
        expect(serialized.details).toHaveProperty('operation');
        expect(serialized.details).toHaveProperty('table');
        expect(serialized.details).toHaveProperty('tenantId');
        expect(serialized.details).toHaveProperty('timestamp');
      }

      // Verify all errors have the same structure
      const firstErrorKeys = Object.keys(serializedErrors[0]).sort();
      for (let i = 1; i < serializedErrors.length; i++) {
        const currentErrorKeys = Object.keys(serializedErrors[i]).sort();
        expect(currentErrorKeys).toEqual(firstErrorKeys);
      }
    });
  });
});