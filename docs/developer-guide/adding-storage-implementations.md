# Adding New Storage Implementations

## Overview

This guide walks you through the process of adding a new storage implementation to the Budgeteer multi-tier storage architecture. Whether you're adding support for a new database, cloud service, or storage technology, this guide provides a step-by-step approach.

## Prerequisites

- Understanding of the [Architecture Overview](../architecture/README.md)
- Familiarity with TypeScript and the existing codebase
- Knowledge of the target storage technology
- Understanding of the [Repository Pattern](./README.md#repository-pattern)

## Step-by-Step Implementation

### Step 1: Define Storage Requirements

Before implementing, clearly define your storage requirements:

```typescript
// Example: Redis storage implementation requirements
interface RedisStorageRequirements {
  connectionString: string;
  keyPrefix: string;
  ttl?: number;
  serialization: 'json' | 'msgpack';
  clustering: boolean;
}
```

### Step 2: Create Provider Interfaces (if needed)

If you're adding a completely new entity type, define the provider interface:

```typescript
// src/services/storage/types.ts
export interface IMyNewEntityProvider {
  getAll(tenantId: string): Promise<MyNewEntity[]>;
  getById(id: string, tenantId: string): Promise<MyNewEntity | null>;
  create(entity: Inserts<TableNames.MyNewEntity>): Promise<any>;
  update(entity: Updates<TableNames.MyNewEntity>): Promise<any>;
  delete(id: string, userId?: string): Promise<any>;
  
  // Add any entity-specific methods
  getByCustomField(field: string, tenantId: string): Promise<MyNewEntity[]>;
}
```

### Step 3: Implement the Storage Provider

Create your storage implementation following the established patterns:

```typescript
// src/services/apis/redis/Accounts.redis.ts
import Redis from 'ioredis';
import { IAccountProvider } from '@/src/services/storage/types';

export class AccountRedisProvider implements IAccountProvider {
  private redis: Redis;
  private keyPrefix = 'budgeteer:accounts';
  
  constructor(connectionString: string) {
    this.redis = new Redis(connectionString);
  }
  
  async getAllAccounts(tenantId: string): Promise<Account[]> {
    try {
      const pattern = `${this.keyPrefix}:${tenantId}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) return [];
      
      const values = await this.redis.mget(keys);
      return values
        .filter(value => value !== null)
        .map(value => JSON.parse(value!))
        .filter(account => !account.isdeleted);
    } catch (error) {
      throw new StorageError('Failed to retrieve accounts', 'REDIS_GET_ERROR', error);
    }
  }
  
  async getAccountById(id: string, tenantId: string): Promise<Account | null> {
    try {
      const key = `${this.keyPrefix}:${tenantId}:${id}`;
      const value = await this.redis.get(key);
      
      if (!value) return null;
      
      const account = JSON.parse(value);
      return account.isdeleted ? null : account;
    } catch (error) {
      throw new StorageError('Failed to retrieve account', 'REDIS_GET_ERROR', error);
    }
  }
  
  async createAccount(account: Inserts<TableNames.Accounts>): Promise<any> {
    try {
      // Validate required fields
      if (!account.name?.trim()) {
        throw new ValidationError('Account name is required');
      }
      
      // Generate ID if not provided
      const id = account.id || generateUUID();
      const now = new Date().toISOString();
      
      const newAccount: Account = {
        ...account,
        id,
        createdat: now,
        updatedat: now,
        isdeleted: false
      };
      
      // Check for unique constraint (name + tenantid)
      await this.validateUniqueConstraint(newAccount.name, newAccount.tenantid, id);
      
      // Store in Redis
      const key = `${this.keyPrefix}:${newAccount.tenantid}:${id}`;
      await this.redis.setex(key, 86400, JSON.stringify(newAccount)); // 24h TTL
      
      return { data: newAccount };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError('Failed to create account', 'REDIS_CREATE_ERROR', error);
    }
  }
  
  async updateAccount(account: Updates<TableNames.Accounts>): Promise<any> {
    try {
      if (!account.id) {
        throw new ValidationError('Account ID is required for update');
      }
      
      // Get existing account
      const existing = await this.getAccountById(account.id, account.tenantid!);
      if (!existing) {
        throw new NotFoundError('Account not found');
      }
      
      // Merge updates
      const updated: Account = {
        ...existing,
        ...account,
        updatedat: new Date().toISOString()
      };
      
      // Validate unique constraint if name changed
      if (account.name && account.name !== existing.name) {
        await this.validateUniqueConstraint(account.name, updated.tenantid, updated.id);
      }
      
      // Store updated account
      const key = `${this.keyPrefix}:${updated.tenantid}:${updated.id}`;
      await this.redis.setex(key, 86400, JSON.stringify(updated));
      
      return { data: updated };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new StorageError('Failed to update account', 'REDIS_UPDATE_ERROR', error);
    }
  }
  
  async deleteAccount(id: string, userId?: string): Promise<any> {
    try {
      // For Redis implementation, we'll do soft delete
      const account = await this.getAccountById(id, userId!);
      if (!account) {
        throw new NotFoundError('Account not found');
      }
      
      const deletedAccount: Account = {
        ...account,
        isdeleted: true,
        updatedat: new Date().toISOString()
      };
      
      const key = `${this.keyPrefix}:${account.tenantid}:${id}`;
      await this.redis.setex(key, 86400, JSON.stringify(deletedAccount));
      
      return { data: deletedAccount };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new StorageError('Failed to delete account', 'REDIS_DELETE_ERROR', error);
    }
  }
  
  // Additional methods specific to your implementation
  async restoreAccount(id: string, userId?: string): Promise<any> {
    // Implementation for restore functionality
  }
  
  async updateAccountBalance(accountid: string, amount: number): Promise<any> {
    // Implementation for balance updates
  }
  
  // Helper methods
  private async validateUniqueConstraint(name: string, tenantId: string, excludeId?: string): Promise<void> {
    const accounts = await this.getAllAccounts(tenantId);
    const duplicate = accounts.find(acc => 
      acc.name.toLowerCase() === name.toLowerCase() && 
      acc.id !== excludeId
    );
    
    if (duplicate) {
      throw new ConstraintViolationError('Account name must be unique within tenant');
    }
  }
  
  async cleanup(): Promise<void> {
    await this.redis.disconnect();
  }
}
```

### Step 4: Create Provider Factory Entry

Add your new provider to the provider factory:

```typescript
// src/services/storage/ProviderFactory.ts
export class ProviderFactory {
  static createProvider<T>(entityType: string, mode: StorageMode): T {
    switch (entityType) {
      case 'accounts':
        return this.createAccountProvider(mode) as T;
      // ... other cases
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
  
  private static createAccountProvider(mode: StorageMode): IAccountProvider {
    switch (mode) {
      case 'cloud':
        return AccountSupaProvider;
      case 'demo':
        return AccountMockProvider;
      case 'local':
        return AccountLocalProvider;
      case 'redis': // New storage mode
        return new AccountRedisProvider(process.env.REDIS_URL!);
      default:
        throw new Error(`Unsupported storage mode: ${mode}`);
    }
  }
}
```

### Step 5: Update Storage Mode Types

Add your new storage mode to the type definitions:

```typescript
// src/services/storage/types.ts
export type StorageMode = 'cloud' | 'demo' | 'local' | 'redis';

export interface StorageModeConfig {
  mode: StorageMode;
  requiresAuth: boolean;
  persistent: boolean;
  offline: boolean;
  // Add mode-specific configuration
  redis?: {
    connectionString: string;
    keyPrefix?: string;
    ttl?: number;
  };
}
```

### Step 6: Update Storage Mode Manager

Enhance the storage mode manager to support your new mode:

```typescript
// src/services/storage/StorageModeManager.ts
export class StorageModeManager {
  async setMode(mode: StorageMode, config?: StorageModeConfig): Promise<void> {
    // Cleanup current providers
    await this.cleanup();
    
    // Validate mode-specific requirements
    if (mode === 'redis') {
      if (!config?.redis?.connectionString) {
        throw new Error('Redis connection string is required');
      }
    }
    
    this.currentMode = mode;
    this.config = config;
    
    // Initialize new providers
    await this.initializeProviders();
    
    // Notify repositories of mode change
    this.notifyModeChange();
  }
  
  private async initializeProviders(): Promise<void> {
    switch (this.currentMode) {
      case 'redis':
        await this.initializeRedisProviders();
        break;
      // ... other cases
    }
  }
  
  private async initializeRedisProviders(): Promise<void> {
    // Initialize Redis connection and test connectivity
    const redis = new Redis(this.config?.redis?.connectionString!);
    await redis.ping();
    redis.disconnect();
  }
}
```

### Step 7: Add Configuration Support

Update configuration files to support your new storage mode:

```typescript
// src/utils/storageMode.ts
export const getStorageModeConfig = (mode: StorageMode): StorageModeConfig => {
  switch (mode) {
    case 'redis':
      return {
        mode: 'redis',
        requiresAuth: false,
        persistent: true,
        offline: false,
        redis: {
          connectionString: process.env.REDIS_URL || 'redis://localhost:6379',
          keyPrefix: 'budgeteer',
          ttl: 86400 // 24 hours
        }
      };
    // ... other cases
  }
};
```

### Step 8: Add Validation Support

Integrate your new storage mode with the validation framework:

```typescript
// src/services/apis/validation/DataProviderFactory.ts
export class DataProviderFactory {
  static createProvider(): IDataProvider {
    const mode = StorageModeManager.getInstance().getCurrentMode();
    
    switch (mode) {
      case 'redis':
        return new RedisDataProvider();
      // ... other cases
    }
  }
}

// Create Redis data provider
export class RedisDataProvider implements IDataProvider {
  async getRecords(tableName: string, tenantId: string): Promise<any[]> {
    const provider = StorageModeManager.getInstance().getProvider(tableName);
    return provider.getAll(tenantId);
  }
  
  async getRecord(tableName: string, id: string, tenantId: string): Promise<any | null> {
    const provider = StorageModeManager.getInstance().getProvider(tableName);
    return provider.getById(id, tenantId);
  }
}
```

### Step 9: Create Tests

Create comprehensive tests for your new storage implementation:

```typescript
// src/services/apis/redis/__tests__/Accounts.redis.test.ts
describe('AccountRedisProvider', () => {
  let provider: AccountRedisProvider;
  let redis: Redis;
  
  beforeAll(async () => {
    // Setup test Redis instance
    redis = new Redis(process.env.REDIS_TEST_URL);
    provider = new AccountRedisProvider(process.env.REDIS_TEST_URL!);
  });
  
  afterAll(async () => {
    await redis.flushall();
    await redis.disconnect();
    await provider.cleanup();
  });
  
  beforeEach(async () => {
    await redis.flushall();
  });
  
  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const accountData = {
        name: 'Test Account',
        tenantid: 'tenant1',
        categoryid: 'cat1',
        balance: 1000
      };
      
      const result = await provider.createAccount(accountData);
      
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('Test Account');
      expect(result.data.id).toBeDefined();
    });
    
    it('should enforce unique constraint', async () => {
      const accountData = {
        name: 'Duplicate Account',
        tenantid: 'tenant1',
        categoryid: 'cat1'
      };
      
      await provider.createAccount(accountData);
      
      await expect(provider.createAccount(accountData))
        .rejects.toThrow(ConstraintViolationError);
    });
  });
  
  describe('getAllAccounts', () => {
    it('should return all non-deleted accounts', async () => {
      // Create test accounts
      await provider.createAccount({
        name: 'Account 1',
        tenantid: 'tenant1',
        categoryid: 'cat1'
      });
      
      await provider.createAccount({
        name: 'Account 2',
        tenantid: 'tenant1',
        categoryid: 'cat1'
      });
      
      const accounts = await provider.getAllAccounts('tenant1');
      
      expect(accounts).toHaveLength(2);
      expect(accounts.every(acc => !acc.isdeleted)).toBe(true);
    });
  });
  
  // Add more tests for other methods
});
```

### Step 10: Add Integration Tests

Create integration tests to ensure your implementation works with the overall system:

```typescript
// src/services/storage/__tests__/RedisIntegration.test.ts
describe('Redis Storage Integration', () => {
  beforeAll(async () => {
    await StorageModeManager.getInstance().setMode('redis', {
      mode: 'redis',
      requiresAuth: false,
      persistent: true,
      offline: false,
      redis: {
        connectionString: process.env.REDIS_TEST_URL!
      }
    });
  });
  
  it('should work with repository layer', async () => {
    const repository = RepositoryManager.getInstance().getAccountRepository();
    
    const accountData = {
      name: 'Integration Test Account',
      tenantid: 'tenant1',
      categoryid: 'cat1'
    };
    
    const created = await repository.create(accountData);
    expect(created.data).toBeDefined();
    
    const accounts = await repository.getAll('tenant1');
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Integration Test Account');
  });
  
  it('should work with validation framework', async () => {
    const accountData = {
      name: 'Validation Test',
      tenantid: 'tenant1',
      categoryid: 'nonexistent-category' // Invalid foreign key
    };
    
    await expect(
      validationService.validateCreate('accounts', accountData, 'tenant1')
    ).rejects.toThrow(ReferentialIntegrityError);
  });
});
```

### Step 11: Update Documentation

Document your new storage implementation:

```typescript
// docs/storage-modes/redis.md
# Redis Storage Mode

## Overview
Redis storage mode provides high-performance in-memory data storage with optional persistence.

## Configuration
```typescript
const redisConfig = {
  mode: 'redis' as const,
  requiresAuth: false,
  persistent: true,
  offline: false,
  redis: {
    connectionString: 'redis://localhost:6379',
    keyPrefix: 'budgeteer',
    ttl: 86400 // 24 hours
  }
};
```

## Features
- ✅ High-performance in-memory storage
- ✅ Optional data persistence
- ✅ Automatic expiration (TTL)
- ✅ Clustering support
- ❌ Limited query capabilities
- ❌ No built-in relationships

## Use Cases
- High-performance caching layer
- Session storage
- Temporary data storage
- Real-time applications
```

### Step 12: Add UI Support

If your storage mode should be selectable by users, add it to the login screen:

```typescript
// src/components/LoginScreen.tsx
const STORAGE_MODES = [
  // ... existing modes
  {
    id: 'redis',
    title: 'Redis Mode',
    description: 'High-performance in-memory storage',
    icon: 'zap',
    requiresAuth: false,
    benefits: ['High performance', 'Real-time updates', 'Scalable']
  }
];
```

## Best Practices for New Implementations

### 1. Error Handling
- Use consistent error types (`StorageError`, `ValidationError`, etc.)
- Provide meaningful error messages
- Include debugging information in error details

### 2. Performance
- Implement connection pooling where applicable
- Use batch operations for multiple records
- Consider caching strategies
- Implement proper cleanup procedures

### 3. Data Consistency
- Enforce the same validation rules as other implementations
- Maintain referential integrity
- Use transactions where supported

### 4. Testing
- Write comprehensive unit tests
- Include integration tests
- Test error scenarios
- Performance test under load

### 5. Configuration
- Make configuration flexible and environment-aware
- Provide sensible defaults
- Validate configuration at startup

### 6. Documentation
- Document configuration options
- Provide usage examples
- Document limitations and trade-offs
- Include troubleshooting guides

## Common Pitfalls

### 1. Inconsistent Interfaces
Ensure your implementation exactly matches the interface signatures:

```typescript
// Wrong - different return type
async createAccount(account: any): Promise<Account> {
  // ...
}

// Correct - matches interface
async createAccount(account: Inserts<TableNames.Accounts>): Promise<any> {
  // ...
}
```

### 2. Missing Validation
Don't forget to implement the same validation as other providers:

```typescript
// Always validate required fields
if (!account.name?.trim()) {
  throw new ValidationError('Account name is required');
}

// Always check unique constraints
await this.validateUniqueConstraint(account.name, account.tenantid);
```

### 3. Incomplete Error Handling
Handle all error scenarios consistently:

```typescript
try {
  // Operation
} catch (error) {
  // Map storage-specific errors to standard errors
  if (error.code === 'CONNECTION_ERROR') {
    throw new StorageError('Database connection failed', 'CONNECTION_ERROR', error);
  }
  throw error;
}
```

### 4. Resource Leaks
Always implement proper cleanup:

```typescript
export class MyStorageProvider {
  private connection: Connection;
  
  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }
}
```

## Testing Your Implementation

### 1. Run the Storage Validation Suite
```bash
npm run test:storage-validation
```

### 2. Run Integration Tests
```bash
npm run test:integration
```

### 3. Test Mode Switching
```bash
npm run test:mode-switching
```

### 4. Performance Testing
```bash
npm run test:performance
```

## Deployment Considerations

### 1. Environment Configuration
- Set up environment variables for your storage backend
- Configure connection strings and credentials
- Set up monitoring and logging

### 2. Infrastructure
- Ensure your storage backend is properly configured
- Set up backup and recovery procedures
- Configure monitoring and alerting

### 3. Migration
- Plan data migration strategies if needed
- Test migration procedures
- Prepare rollback plans

## Next Steps

After implementing your new storage mode:

1. **Test Thoroughly**: Run all test suites and validate functionality
2. **Update Documentation**: Ensure all documentation is current
3. **Performance Tuning**: Optimize for your specific use case
4. **Monitor**: Set up monitoring and alerting
5. **Iterate**: Gather feedback and improve the implementation

## Getting Help

- Check existing implementations for patterns and examples
- Review the [Architecture Overview](../architecture/README.md) for design principles
- Consult the [API Reference](../api/README.md) for interface details
- Ask questions in the project repository