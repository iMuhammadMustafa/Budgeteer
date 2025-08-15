# Developer Guide

## Introduction

This guide provides comprehensive information for developers working with Budgeteer's multi-tier storage architecture. Whether you're contributing to the project, extending functionality, or integrating with existing systems, this guide will help you understand and work effectively with the storage system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Concepts](#architecture-concepts)
3. [Working with Storage Providers](#working-with-storage-providers)
4. [Repository Pattern](#repository-pattern)
5. [Dependency Injection](#dependency-injection)
6. [Validation Framework](#validation-framework)
7. [Testing Strategies](#testing-strategies)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native development environment
- TypeScript knowledge
- Understanding of React and React Native
- Familiarity with TanStack Query

### Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd budgeteer
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Configure your Supabase credentials
```

3. **Database Setup**
```bash
# Start local Supabase (optional)
npx supabase start
```

4. **Run Development Server**
```bash
# Web
npm run web

# iOS
npm run ios

# Android
npm run android
```

### Project Structure
```
src/
├── services/
│   ├── apis/
│   │   ├── supabase/          # Cloud storage implementation
│   │   ├── __mock__/          # Demo storage implementation
│   │   ├── local/             # Local storage implementation
│   │   ├── repositories/      # Repository layer
│   │   └── validation/        # Validation framework
│   └── storage/
│       ├── DIContainer.ts     # Dependency injection
│       ├── StorageModeManager.ts
│       └── types.ts           # Interface definitions
├── providers/
│   ├── StorageModeProvider.tsx
│   └── DemoModeGlobal.ts
└── types/
    └── db/
        └── database.types.ts  # Database schema types
```

## Architecture Concepts

### Core Principles

#### 1. Interface Segregation
All storage implementations must implement the same interfaces:

```typescript
interface IAccountProvider {
  getAllAccounts(tenantId: string): Promise<Account[]>;
  getAccountById(id: string, tenantId: string): Promise<Account | null>;
  createAccount(account: Inserts<TableNames.Accounts>): Promise<any>;
  updateAccount(account: Updates<TableNames.Accounts>): Promise<any>;
  deleteAccount(id: string, userId?: string): Promise<any>;
  // ... other methods
}
```

#### 2. Dependency Injection
Components receive their dependencies through constructor injection:

```typescript
export class AccountRepository implements IAccountRepository {
  constructor(private provider: IAccountProvider) {}
  
  async getAllAccounts(tenantId: string): Promise<Account[]> {
    return this.provider.getAllAccounts(tenantId);
  }
}
```

#### 3. Storage Mode Abstraction
The storage mode is abstracted away from business logic:

```typescript
// Business logic doesn't know about storage mode
const accounts = await AccountRepository.getAllAccounts(tenantId);
```

### Key Components

#### Storage Mode Manager
Central component for managing storage modes:

```typescript
import { StorageModeManager } from '@/src/services/storage';

const manager = StorageModeManager.getInstance();

// Switch storage mode
await manager.setMode('local');

// Get current provider
const accountProvider = manager.getProvider<IAccountProvider>('accounts');
```

#### Repository Manager
Manages repository instances with dependency injection:

```typescript
import { RepositoryManager } from '@/src/services/apis/repositories';

const repoManager = RepositoryManager.getInstance();
const accountRepo = repoManager.getAccountRepository();
```

## Working with Storage Providers

### Creating a New Provider

1. **Define the Interface** (if not exists)
```typescript
// src/services/storage/types.ts
interface IMyEntityProvider {
  getAll(tenantId: string): Promise<MyEntity[]>;
  getById(id: string, tenantId: string): Promise<MyEntity | null>;
  create(entity: Inserts<TableNames.MyEntity>): Promise<any>;
  update(entity: Updates<TableNames.MyEntity>): Promise<any>;
  delete(id: string, userId?: string): Promise<any>;
}
```

2. **Implement for Each Storage Mode**

**Supabase Implementation:**
```typescript
// src/services/apis/supabase/MyEntity.supa.ts
import { supabase } from '@/src/providers/Supabase';

export const MyEntitySupaProvider: IMyEntityProvider = {
  async getAll(tenantId: string): Promise<MyEntity[]> {
    const { data, error } = await supabase
      .from('myentities')
      .select('*')
      .eq('tenantid', tenantId)
      .eq('isdeleted', false);
    
    if (error) throw error;
    return data || [];
  },
  
  // ... implement other methods
};
```

**Mock Implementation:**
```typescript
// src/services/apis/__mock__/MyEntity.mock.ts
import { mockDataStore } from './mockDataStore';

export const MyEntityMockProvider: IMyEntityProvider = {
  async getAll(tenantId: string): Promise<MyEntity[]> {
    return mockDataStore.myentities.filter(
      entity => entity.tenantid === tenantId && !entity.isdeleted
    );
  },
  
  // ... implement other methods
};
```

**Local Implementation:**
```typescript
// src/services/apis/local/MyEntity.local.ts
import { db } from './BudgeteerDatabase';

export const MyEntityLocalProvider: IMyEntityProvider = {
  async getAll(tenantId: string): Promise<MyEntity[]> {
    return await db.myentities
      .where('tenantid')
      .equals(tenantId)
      .and(entity => !entity.isdeleted)
      .toArray();
  },
  
  // ... implement other methods
};
```

3. **Register with Provider Factory**
```typescript
// src/services/storage/ProviderFactory.ts
export class ProviderFactory {
  static createProvider<T>(entityType: string, mode: StorageMode): T {
    switch (entityType) {
      case 'myentity':
        return this.createMyEntityProvider(mode) as T;
      // ... other cases
    }
  }
  
  private static createMyEntityProvider(mode: StorageMode): IMyEntityProvider {
    switch (mode) {
      case 'cloud':
        return MyEntitySupaProvider;
      case 'demo':
        return MyEntityMockProvider;
      case 'local':
        return MyEntityLocalProvider;
    }
  }
}
```

### Provider Best Practices

#### Error Handling
```typescript
export const MyEntityProvider: IMyEntityProvider = {
  async create(entity: Inserts<TableNames.MyEntity>): Promise<any> {
    try {
      // Validate input
      if (!entity.name?.trim()) {
        throw new ValidationError('Name is required');
      }
      
      // Perform operation
      const result = await performCreate(entity);
      
      return result;
    } catch (error) {
      // Map to consistent error types
      if (error.code === '23505') {
        throw new ConstraintViolationError('Entity name must be unique');
      }
      throw error;
    }
  }
};
```

#### Referential Integrity
```typescript
import { validationService } from '@/src/services/apis/validation';

export const MyEntityProvider: IMyEntityProvider = {
  async create(entity: Inserts<TableNames.MyEntity>): Promise<any> {
    // Validate referential integrity
    await validationService.validateCreate('myentities', entity, entity.tenantid);
    
    // Perform creation
    return await performCreate(entity);
  }
};
```

## Repository Pattern

### Creating Repositories

1. **Define Repository Interface**
```typescript
// src/services/apis/repositories/interfaces.ts
interface IMyEntityRepository {
  getAll(tenantId: string): Promise<MyEntity[]>;
  getById(id: string, tenantId: string): Promise<MyEntity | null>;
  create(entity: Inserts<TableNames.MyEntity>): Promise<any>;
  update(entity: Updates<TableNames.MyEntity>): Promise<any>;
  delete(id: string, userId?: string): Promise<any>;
}
```

2. **Implement Repository**
```typescript
// src/services/apis/repositories/MyEntityRepository.ts
export class MyEntityRepository implements IMyEntityRepository {
  constructor(private provider: IMyEntityProvider) {}
  
  async getAll(tenantId: string): Promise<MyEntity[]> {
    return this.provider.getAll(tenantId);
  }
  
  async create(entity: Inserts<TableNames.MyEntity>): Promise<any> {
    // Add business logic here if needed
    return this.provider.create(entity);
  }
  
  // ... implement other methods
}
```

3. **Register with Repository Manager**
```typescript
// src/services/apis/repositories/RepositoryManager.ts
export class RepositoryManager {
  getMyEntityRepository(): IMyEntityRepository {
    if (!this.myEntityRepository) {
      const provider = this.storageManager.getProvider<IMyEntityProvider>('myentity');
      this.myEntityRepository = new MyEntityRepository(provider);
    }
    return this.myEntityRepository;
  }
}
```

4. **Create Repository Export**
```typescript
// src/services/apis/MyEntity.repository.ts
import { RepositoryManager } from './repositories/RepositoryManager';

const repositoryManager = RepositoryManager.getInstance();

export const getAllMyEntities = async (tenantId: string): Promise<MyEntity[]> => {
  return repositoryManager.getMyEntityRepository().getAll(tenantId);
};

export const createMyEntity = async (entity: Inserts<TableNames.MyEntity>): Promise<any> => {
  return repositoryManager.getMyEntityRepository().create(entity);
};

// ... export other methods
```

### Repository Best Practices

#### Business Logic Placement
```typescript
export class AccountRepository implements IAccountRepository {
  async updateBalance(accountId: string, amount: number, tenantId: string): Promise<void> {
    // Business logic: validate amount
    if (amount < 0) {
      throw new ValidationError('Amount cannot be negative');
    }
    
    // Business logic: check account exists
    const account = await this.getById(accountId, tenantId);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    
    // Delegate to provider
    return this.provider.updateAccountBalance(accountId, amount);
  }
}
```

#### Transaction Management
```typescript
export class TransactionRepository implements ITransactionRepository {
  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    tenantId: string
  ): Promise<void> {
    // Business logic: create two linked transactions
    const transferId = generateUUID();
    
    const outgoingTransaction = {
      accountid: fromAccountId,
      amount: -amount,
      transferaccountid: toAccountId,
      transferid: transferId,
      tenantid: tenantId
    };
    
    const incomingTransaction = {
      accountid: toAccountId,
      amount: amount,
      transferaccountid: fromAccountId,
      transferid: transferId,
      tenantid: tenantId
    };
    
    // Create both transactions
    await this.provider.create(outgoingTransaction);
    await this.provider.create(incomingTransaction);
  }
}
```

## Dependency Injection

### DI Container Usage

```typescript
import { DIContainer } from '@/src/services/storage';

// Register providers
DIContainer.register<IAccountProvider>('accountProvider', accountProvider);

// Resolve dependencies
const accountProvider = DIContainer.resolve<IAccountProvider>('accountProvider');
```

### Custom DI Registration
```typescript
// Register custom services
DIContainer.register<IMyService>('myService', new MyService());

// Register with factory
DIContainer.registerFactory<IMyService>('myService', () => {
  return new MyService(DIContainer.resolve('dependency'));
});
```

## Validation Framework

### Using Validation Service

```typescript
import { validationService } from '@/src/services/apis/validation';

// Validate before create
try {
  await validationService.validateCreate('accounts', accountData, tenantId);
  const result = await createAccount(accountData);
} catch (error) {
  if (error instanceof ReferentialIntegrityError) {
    // Handle foreign key violation
  }
}
```

### Custom Validation Rules
```typescript
import { ReferentialIntegrityValidator } from '@/src/services/apis/validation';

// Add custom validation
const validator = new ReferentialIntegrityValidator(dataProvider);

validator.addCustomRule('accounts', async (data, tenantId) => {
  if (data.balance < 0 && data.categorytype === 'asset') {
    throw new ValidationError('Asset accounts cannot have negative balance');
  }
});
```

## Testing Strategies

### Unit Testing Providers
```typescript
// MyEntity.test.ts
describe('MyEntityProvider', () => {
  let provider: IMyEntityProvider;
  let mockDataProvider: jest.Mocked<IDataProvider>;
  
  beforeEach(() => {
    mockDataProvider = createMockDataProvider();
    provider = new MyEntityProvider(mockDataProvider);
  });
  
  it('should create entity with valid data', async () => {
    const entityData = { name: 'Test Entity', tenantid: 'tenant1' };
    
    const result = await provider.create(entityData);
    
    expect(result).toBeDefined();
    expect(mockDataProvider.create).toHaveBeenCalledWith('myentities', entityData);
  });
});
```

### Integration Testing
```typescript
// StorageIntegration.test.ts
describe('Storage Integration', () => {
  it('should work across all storage modes', async () => {
    const modes: StorageMode[] = ['cloud', 'demo', 'local'];
    
    for (const mode of modes) {
      await StorageModeManager.getInstance().setMode(mode);
      
      const repository = RepositoryManager.getInstance().getAccountRepository();
      const accounts = await repository.getAll('tenant1');
      
      expect(Array.isArray(accounts)).toBe(true);
    }
  });
});
```

### Validation Testing
```typescript
// Validation.test.ts
describe('Validation Framework', () => {
  it('should enforce referential integrity', async () => {
    const invalidAccount = {
      name: 'Test Account',
      categoryid: 'nonexistent-category',
      tenantid: 'tenant1'
    };
    
    await expect(
      validationService.validateCreate('accounts', invalidAccount, 'tenant1')
    ).rejects.toThrow(ReferentialIntegrityError);
  });
});
```

## Best Practices

### Code Organization
1. **Separate Concerns**: Keep business logic in repositories, data access in providers
2. **Interface First**: Define interfaces before implementations
3. **Consistent Naming**: Use consistent naming conventions across all implementations
4. **Error Handling**: Use consistent error types and handling patterns

### Performance
1. **Lazy Loading**: Use lazy initialization for expensive resources
2. **Caching**: Leverage TanStack Query for caching
3. **Batch Operations**: Implement batch operations where possible
4. **Connection Pooling**: Use connection pooling for database operations

### Security
1. **Input Validation**: Always validate input data
2. **SQL Injection**: Use parameterized queries
3. **Authorization**: Implement proper authorization checks
4. **Data Sanitization**: Sanitize data before storage

### Maintainability
1. **Documentation**: Document complex business logic
2. **Type Safety**: Use TypeScript strictly
3. **Testing**: Maintain high test coverage
4. **Refactoring**: Regularly refactor to improve code quality

## Common Patterns

### Repository with Caching
```typescript
export class CachedAccountRepository implements IAccountRepository {
  private cache = new Map<string, Account[]>();
  
  constructor(private provider: IAccountProvider) {}
  
  async getAll(tenantId: string): Promise<Account[]> {
    if (this.cache.has(tenantId)) {
      return this.cache.get(tenantId)!;
    }
    
    const accounts = await this.provider.getAll(tenantId);
    this.cache.set(tenantId, accounts);
    return accounts;
  }
  
  async create(account: Inserts<TableNames.Accounts>): Promise<any> {
    const result = await this.provider.create(account);
    this.cache.delete(account.tenantid); // Invalidate cache
    return result;
  }
}
```

### Provider with Retry Logic
```typescript
export class ResilientProvider implements IAccountProvider {
  constructor(private baseProvider: IAccountProvider) {}
  
  async getAll(tenantId: string): Promise<Account[]> {
    return this.withRetry(() => this.baseProvider.getAll(tenantId));
  }
  
  private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Composite Repository
```typescript
export class CompositeAccountRepository implements IAccountRepository {
  constructor(
    private primaryProvider: IAccountProvider,
    private cacheProvider: IAccountProvider
  ) {}
  
  async getAll(tenantId: string): Promise<Account[]> {
    try {
      // Try cache first
      return await this.cacheProvider.getAll(tenantId);
    } catch {
      // Fallback to primary
      const accounts = await this.primaryProvider.getAll(tenantId);
      // Update cache
      await this.updateCache(tenantId, accounts);
      return accounts;
    }
  }
  
  private async updateCache(tenantId: string, accounts: Account[]): Promise<void> {
    // Implementation to update cache
  }
}
```

## Troubleshooting

### Common Issues

#### Provider Not Found
```typescript
// Error: Provider not found for entity type 'myentity'
// Solution: Register provider in ProviderFactory
```

#### Circular Dependencies
```typescript
// Error: Circular dependency detected
// Solution: Use dependency injection and interfaces
```

#### Validation Errors
```typescript
// Error: ReferentialIntegrityError
// Solution: Ensure referenced records exist
```

### Debugging Tips

1. **Enable Logging**
```typescript
import { logger } from '@/src/utils/logger';

logger.debug('Storage mode:', StorageModeManager.getInstance().getCurrentMode());
```

2. **Inspect Provider State**
```typescript
const provider = StorageModeManager.getInstance().getProvider('accounts');
console.log('Provider type:', provider.constructor.name);
```

3. **Validate Data Flow**
```typescript
// Add logging to trace data flow
export const createAccount = async (account: any) => {
  console.log('Repository: Creating account', account);
  const result = await provider.create(account);
  console.log('Repository: Account created', result);
  return result;
};
```

## Next Steps

- [Adding Storage Implementations](./adding-storage-implementations.md) - Add new storage backends
- [Usage Examples](../examples/README.md) - See practical examples
- [API Reference](../api/README.md) - Detailed API documentation
- [Testing Guide](../testing/README.md) - Comprehensive testing strategies