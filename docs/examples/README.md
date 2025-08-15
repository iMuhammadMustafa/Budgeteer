# Usage Examples

## Overview

This section provides practical examples of working with Budgeteer's multi-tier storage architecture. These examples demonstrate common patterns, best practices, and real-world usage scenarios across all storage modes.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Storage Mode Selection](#storage-mode-selection)
3. [Repository Operations](#repository-operations)
4. [Validation Examples](#validation-examples)
5. [Error Handling](#error-handling)
6. [Advanced Patterns](#advanced-patterns)
7. [Testing Examples](#testing-examples)
8. [Migration Examples](#migration-examples)

## Basic Usage

### Setting Up Storage Mode

```typescript
import { StorageModeManager } from '@/src/services/storage';

// Initialize storage mode manager
const storageManager = StorageModeManager.getInstance();

// Set storage mode to local
await storageManager.setMode('local');

// Or set with configuration
await storageManager.setMode('cloud', {
  mode: 'cloud',
  requiresAuth: true,
  persistent: true,
  offline: false
});
```

### Basic CRUD Operations

```typescript
import * as AccountsRepository from '@/src/services/apis/Accounts.repository';

// Create an account
const newAccount = {
  name: 'My Checking Account',
  tenantid: 'user123',
  categoryid: 'checking-category-id',
  balance: 1500.00
};

const createdAccount = await AccountsRepository.createAccount(newAccount);
console.log('Created account:', createdAccount.data);

// Get all accounts
const accounts = await AccountsRepository.getAllAccounts('user123');
console.log('All accounts:', accounts);

// Get specific account
const account = await AccountsRepository.getAccountById(createdAccount.data.id, 'user123');
console.log('Specific account:', account);

// Update account
const updatedAccount = await AccountsRepository.updateAccount({
  id: createdAccount.data.id,
  name: 'Updated Account Name',
  tenantid: 'user123'
});
console.log('Updated account:', updatedAccount.data);

// Delete account (soft delete)
await AccountsRepository.deleteAccount(createdAccount.data.id, 'user123');
```

### Using with TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as AccountsRepository from '@/src/services/apis/Accounts.repository';

// Query hook for accounts
export const useAccounts = (tenantId: string) => {
  return useQuery({
    queryKey: ['accounts', tenantId],
    queryFn: () => AccountsRepository.getAllAccounts(tenantId),
    enabled: !!tenantId
  });
};

// Mutation hook for creating accounts
export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: AccountsRepository.createAccount,
    onSuccess: (data, variables) => {
      // Invalidate and refetch accounts
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.tenantid] });
    }
  });
};

// Usage in component
const AccountsList = ({ tenantId }: { tenantId: string }) => {
  const { data: accounts, isLoading, error } = useAccounts(tenantId);
  const createAccountMutation = useCreateAccount();
  
  const handleCreateAccount = async (accountData: any) => {
    try {
      await createAccountMutation.mutateAsync(accountData);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {accounts?.map(account => (
        <div key={account.id}>{account.name}: ${account.balance}</div>
      ))}
    </div>
  );
};
```

## Storage Mode Selection

### Login Screen Implementation

```typescript
import React, { useState } from 'react';
import { StorageModeManager } from '@/src/services/storage';

interface StorageModeOption {
  id: 'cloud' | 'demo' | 'local';
  title: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  benefits: string[];
}

const STORAGE_MODES: StorageModeOption[] = [
  {
    id: 'cloud',
    title: 'Login with Username and Password',
    description: 'Connect to cloud database with full sync',
    icon: 'cloud',
    requiresAuth: true,
    benefits: ['Multi-device sync', 'Cloud backup', 'Real-time updates']
  },
  {
    id: 'demo',
    title: 'Demo Mode',
    description: 'Try the app with sample data',
    icon: 'play-circle',
    requiresAuth: false,
    benefits: ['No signup required', 'Instant access', 'Sample data included']
  },
  {
    id: 'local',
    title: 'Local Mode',
    description: 'Store data locally on your device',
    icon: 'database',
    requiresAuth: false,
    benefits: ['Complete privacy', 'Offline access', 'No internet required']
  }
];

export const LoginScreen = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleModeSelection = async (mode: 'cloud' | 'demo' | 'local') => {
    setIsLoading(true);
    try {
      const storageManager = StorageModeManager.getInstance();
      await storageManager.setMode(mode);
      
      if (mode === 'cloud') {
        // Redirect to authentication
        // navigation.navigate('Auth');
      } else {
        // Proceed to main app
        // navigation.navigate('Main');
      }
    } catch (error) {
      console.error('Failed to set storage mode:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-screen">
      <h1>Welcome to Budgeteer</h1>
      <p>Choose how you'd like to store your data:</p>
      
      {STORAGE_MODES.map(mode => (
        <div
          key={mode.id}
          className={`mode-option ${selectedMode === mode.id ? 'selected' : ''}`}
          onClick={() => setSelectedMode(mode.id)}
        >
          <div className="mode-icon">{mode.icon}</div>
          <div className="mode-content">
            <h3>{mode.title}</h3>
            <p>{mode.description}</p>
            <ul>
              {mode.benefits.map(benefit => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
      
      {selectedMode && (
        <button
          onClick={() => handleModeSelection(selectedMode as any)}
          disabled={isLoading}
        >
          {isLoading ? 'Setting up...' : 'Continue'}
        </button>
      )}
    </div>
  );
};
```

### Dynamic Mode Switching

```typescript
import { StorageModeManager } from '@/src/services/storage';
import { RepositoryManager } from '@/src/services/apis/repositories';

export class StorageModeSwitcher {
  private storageManager = StorageModeManager.getInstance();
  private repositoryManager = RepositoryManager.getInstance();
  
  async switchMode(newMode: 'cloud' | 'demo' | 'local'): Promise<void> {
    try {
      // 1. Export current data (optional)
      const currentData = await this.exportCurrentData();
      
      // 2. Switch storage mode
      await this.storageManager.setMode(newMode);
      
      // 3. Clear repository cache
      this.repositoryManager.clearAll();
      
      // 4. Import data to new mode (optional)
      if (currentData && newMode !== 'demo') {
        await this.importData(currentData);
      }
      
      console.log(`Successfully switched to ${newMode} mode`);
    } catch (error) {
      console.error('Failed to switch storage mode:', error);
      throw error;
    }
  }
  
  private async exportCurrentData(): Promise<any> {
    // Implementation to export all data from current storage
    const accounts = await this.repositoryManager.getAccountRepository().getAll('current-tenant');
    const transactions = await this.repositoryManager.getTransactionRepository().getAll('current-tenant');
    // ... export other entities
    
    return {
      accounts,
      transactions,
      // ... other data
    };
  }
  
  private async importData(data: any): Promise<void> {
    // Implementation to import data to new storage
    for (const account of data.accounts) {
      await this.repositoryManager.getAccountRepository().create(account);
    }
    // ... import other entities
  }
}
```

## Repository Operations

### Complex Business Logic

```typescript
import { RepositoryManager } from '@/src/services/apis/repositories';
import { validationService } from '@/src/services/apis/validation';

export class TransferService {
  private repositoryManager = RepositoryManager.getInstance();
  
  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    tenantId: string,
    description?: string
  ): Promise<{ outgoing: any; incoming: any }> {
    // Validate inputs
    if (amount <= 0) {
      throw new ValidationError('Transfer amount must be positive');
    }
    
    if (fromAccountId === toAccountId) {
      throw new ValidationError('Cannot transfer to the same account');
    }
    
    // Get repositories
    const accountRepo = this.repositoryManager.getAccountRepository();
    const transactionRepo = this.repositoryManager.getTransactionRepository();
    
    // Validate accounts exist
    const fromAccount = await accountRepo.getById(fromAccountId, tenantId);
    const toAccount = await accountRepo.getById(toAccountId, tenantId);
    
    if (!fromAccount) {
      throw new NotFoundError('Source account not found');
    }
    
    if (!toAccount) {
      throw new NotFoundError('Destination account not found');
    }
    
    // Check sufficient balance
    if (fromAccount.balance < amount) {
      throw new ValidationError('Insufficient balance for transfer');
    }
    
    // Generate transfer ID for linking transactions
    const transferId = generateUUID();
    const now = new Date().toISOString();
    
    // Create outgoing transaction
    const outgoingTransaction = {
      accountid: fromAccountId,
      amount: -amount,
      description: description || `Transfer to ${toAccount.name}`,
      date: now,
      transferaccountid: toAccountId,
      transferid: transferId,
      tenantid: tenantId,
      categoryid: 'transfer-category-id' // Assuming transfer category exists
    };
    
    // Create incoming transaction
    const incomingTransaction = {
      accountid: toAccountId,
      amount: amount,
      description: description || `Transfer from ${fromAccount.name}`,
      date: now,
      transferaccountid: fromAccountId,
      transferid: transferId,
      tenantid: tenantId,
      categoryid: 'transfer-category-id'
    };
    
    // Validate transactions
    await validationService.validateCreate('transactions', outgoingTransaction, tenantId);
    await validationService.validateCreate('transactions', incomingTransaction, tenantId);
    
    // Create both transactions
    const outgoing = await transactionRepo.create(outgoingTransaction);
    const incoming = await transactionRepo.create(incomingTransaction);
    
    // Update account balances
    await accountRepo.updateBalance(fromAccountId, -amount, tenantId);
    await accountRepo.updateBalance(toAccountId, amount, tenantId);
    
    return { outgoing, incoming };
  }
}
```

### Batch Operations

```typescript
export class BatchOperationService {
  private repositoryManager = RepositoryManager.getInstance();
  
  async createMultipleTransactions(
    transactions: Array<Inserts<TableNames.Transactions>>,
    tenantId: string
  ): Promise<any[]> {
    const transactionRepo = this.repositoryManager.getTransactionRepository();
    const results: any[] = [];
    const errors: Array<{ index: number; error: Error }> = [];
    
    // Validate all transactions first
    for (let i = 0; i < transactions.length; i++) {
      try {
        await validationService.validateCreate('transactions', transactions[i], tenantId);
      } catch (error) {
        errors.push({ index: i, error: error as Error });
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(`Validation failed for ${errors.length} transactions`, {
        errors
      });
    }
    
    // Create all transactions
    for (let i = 0; i < transactions.length; i++) {
      try {
        const result = await transactionRepo.create(transactions[i]);
        results.push(result);
      } catch (error) {
        errors.push({ index: i, error: error as Error });
      }
    }
    
    if (errors.length > 0) {
      console.warn(`${errors.length} transactions failed to create:`, errors);
    }
    
    return results;
  }
  
  async updateAccountBalances(
    updates: Array<{ accountId: string; amount: number }>,
    tenantId: string
  ): Promise<void> {
    const accountRepo = this.repositoryManager.getAccountRepository();
    
    // Process updates in parallel
    const promises = updates.map(async ({ accountId, amount }) => {
      try {
        await accountRepo.updateBalance(accountId, amount, tenantId);
      } catch (error) {
        console.error(`Failed to update balance for account ${accountId}:`, error);
        throw error;
      }
    });
    
    await Promise.all(promises);
  }
}
```

## Validation Examples

### Custom Validation Rules

```typescript
import { ReferentialIntegrityValidator } from '@/src/services/apis/validation';

export class CustomValidationService {
  private validator: ReferentialIntegrityValidator;
  
  constructor(dataProvider: IDataProvider) {
    this.validator = new ReferentialIntegrityValidator(dataProvider);
    this.setupCustomRules();
  }
  
  private setupCustomRules(): void {
    // Custom rule: Asset accounts cannot have negative balance
    this.validator.addCustomRule('accounts', async (data, tenantId) => {
      if (data.balance < 0) {
        // Check if this is an asset account
        const category = await this.validator.dataProvider.getRecord(
          'accountcategories',
          data.categoryid,
          tenantId
        );
        
        if (category?.type === 'asset') {
          throw new ValidationError('Asset accounts cannot have negative balance');
        }
      }
    });
    
    // Custom rule: Transaction amount cannot be zero
    this.validator.addCustomRule('transactions', async (data, tenantId) => {
      if (data.amount === 0) {
        throw new ValidationError('Transaction amount cannot be zero');
      }
    });
    
    // Custom rule: Future-dated transactions require approval
    this.validator.addCustomRule('transactions', async (data, tenantId) => {
      const transactionDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (transactionDate > today && !data.approved) {
        throw new ValidationError('Future-dated transactions require approval');
      }
    });
  }
  
  async validateBusinessRules(
    tableName: string,
    data: any,
    tenantId: string
  ): Promise<void> {
    await this.validator.validateCreate(tableName, data, tenantId);
  }
}
```

### Validation with Error Recovery

```typescript
export class RobustValidationService {
  async createAccountWithValidation(
    accountData: Inserts<TableNames.Accounts>,
    tenantId: string
  ): Promise<any> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Validate data
        await validationService.validateCreate('accounts', accountData, tenantId);
        
        // Create account
        const result = await AccountsRepository.createAccount(accountData);
        return result;
        
      } catch (error) {
        attempt++;
        
        if (error instanceof ConstraintViolationError) {
          // Handle unique constraint violation
          if (error.message.includes('name must be unique')) {
            accountData.name = `${accountData.name} (${attempt})`;
            console.log(`Retrying with name: ${accountData.name}`);
            continue;
          }
        }
        
        if (error instanceof ReferentialIntegrityError) {
          // Try to create missing referenced record
          if (error.details?.field === 'categoryid') {
            await this.createDefaultCategory(tenantId);
            accountData.categoryid = 'default-category-id';
            console.log('Created default category, retrying...');
            continue;
          }
        }
        
        // If we can't recover, throw the error
        if (attempt >= maxRetries) {
          throw error;
        }
      }
    }
  }
  
  private async createDefaultCategory(tenantId: string): Promise<void> {
    const defaultCategory = {
      id: 'default-category-id',
      name: 'Default Category',
      type: 'asset',
      tenantid: tenantId
    };
    
    try {
      await AccountCategoriesRepository.createAccountCategory(defaultCategory);
    } catch (error) {
      // Category might already exist
      console.log('Default category already exists or failed to create');
    }
  }
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
import {
  StorageError,
  ValidationError,
  ReferentialIntegrityError,
  ConstraintViolationError,
  NotFoundError
} from '@/src/services/storage/errors';

export class ErrorHandlingService {
  async handleAccountOperation(operation: () => Promise<any>): Promise<any> {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: Error): never {
    if (error instanceof ValidationError) {
      throw new Error(`Validation failed: ${error.message}`);
    }
    
    if (error instanceof ReferentialIntegrityError) {
      const { table, field, value } = error.details;
      throw new Error(`Referenced ${table} record not found: ${field} = ${value}`);
    }
    
    if (error instanceof ConstraintViolationError) {
      throw new Error(`Data constraint violated: ${error.message}`);
    }
    
    if (error instanceof NotFoundError) {
      throw new Error(`Record not found: ${error.message}`);
    }
    
    if (error instanceof StorageError) {
      console.error('Storage error:', error.details);
      throw new Error(`Storage operation failed: ${error.message}`);
    }
    
    // Unknown error
    console.error('Unknown error:', error);
    throw new Error('An unexpected error occurred');
  }
}

// Usage with React error boundaries
export const ErrorBoundaryExample = () => {
  const [error, setError] = useState<string | null>(null);
  const errorHandler = new ErrorHandlingService();
  
  const handleCreateAccount = async (accountData: any) => {
    try {
      setError(null);
      await errorHandler.handleAccountOperation(async () => {
        return AccountsRepository.createAccount(accountData);
      });
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      {/* Rest of component */}
    </div>
  );
};
```

### Error Recovery Patterns

```typescript
export class ErrorRecoveryService {
  async createAccountWithRecovery(
    accountData: Inserts<TableNames.Accounts>,
    tenantId: string
  ): Promise<any> {
    try {
      return await AccountsRepository.createAccount(accountData);
    } catch (error) {
      if (error instanceof ReferentialIntegrityError) {
        // Try to recover by creating missing dependencies
        return await this.recoverFromReferentialError(error, accountData, tenantId);
      }
      
      if (error instanceof ConstraintViolationError) {
        // Try to recover by modifying data
        return await this.recoverFromConstraintError(error, accountData, tenantId);
      }
      
      throw error; // Can't recover
    }
  }
  
  private async recoverFromReferentialError(
    error: ReferentialIntegrityError,
    accountData: Inserts<TableNames.Accounts>,
    tenantId: string
  ): Promise<any> {
    const { table, field, value } = error.details;
    
    if (table === 'accountcategories' && field === 'id') {
      // Create a default account category
      const defaultCategory = {
        id: value,
        name: 'Default Category',
        type: 'asset',
        tenantid: tenantId
      };
      
      await AccountCategoriesRepository.createAccountCategory(defaultCategory);
      
      // Retry the original operation
      return await AccountsRepository.createAccount(accountData);
    }
    
    throw error; // Can't recover from this specific error
  }
  
  private async recoverFromConstraintError(
    error: ConstraintViolationError,
    accountData: Inserts<TableNames.Accounts>,
    tenantId: string
  ): Promise<any> {
    if (error.message.includes('name must be unique')) {
      // Generate a unique name
      const timestamp = Date.now();
      const modifiedData = {
        ...accountData,
        name: `${accountData.name} (${timestamp})`
      };
      
      // Retry with modified data
      return await AccountsRepository.createAccount(modifiedData);
    }
    
    throw error; // Can't recover from this specific error
  }
}
```

## Advanced Patterns

### Repository Caching

```typescript
export class CachedAccountRepository implements IAccountRepository {
  private cache = new Map<string, { data: Account[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  constructor(private baseRepository: IAccountRepository) {}
  
  async getAll(tenantId: string): Promise<Account[]> {
    const cacheKey = `accounts:${tenantId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    const accounts = await this.baseRepository.getAll(tenantId);
    this.cache.set(cacheKey, { data: accounts, timestamp: Date.now() });
    
    return accounts;
  }
  
  async create(account: Inserts<TableNames.Accounts>): Promise<any> {
    const result = await this.baseRepository.create(account);
    
    // Invalidate cache
    this.cache.delete(`accounts:${account.tenantid}`);
    
    return result;
  }
  
  // Implement other methods with cache invalidation
}
```

### Event-Driven Architecture

```typescript
export class EventDrivenAccountService {
  private eventEmitter = new EventEmitter();
  
  constructor(private repository: IAccountRepository) {
    this.setupEventHandlers();
  }
  
  async createAccount(accountData: Inserts<TableNames.Accounts>): Promise<any> {
    // Emit before create event
    this.eventEmitter.emit('account:beforeCreate', accountData);
    
    try {
      const result = await this.repository.create(accountData);
      
      // Emit after create event
      this.eventEmitter.emit('account:created', result.data);
      
      return result;
    } catch (error) {
      // Emit error event
      this.eventEmitter.emit('account:createError', { accountData, error });
      throw error;
    }
  }
  
  private setupEventHandlers(): void {
    this.eventEmitter.on('account:created', (account: Account) => {
      console.log('Account created:', account.name);
      // Update statistics, send notifications, etc.
    });
    
    this.eventEmitter.on('account:createError', ({ accountData, error }) => {
      console.error('Failed to create account:', accountData.name, error);
      // Log error, send alert, etc.
    });
  }
  
  // Subscribe to events
  onAccountCreated(callback: (account: Account) => void): void {
    this.eventEmitter.on('account:created', callback);
  }
  
  onAccountError(callback: (data: { accountData: any; error: Error }) => void): void {
    this.eventEmitter.on('account:createError', callback);
  }
}
```

## Testing Examples

### Unit Testing with Mocks

```typescript
// AccountService.test.ts
import { AccountService } from '../AccountService';
import { IAccountRepository } from '../interfaces';

describe('AccountService', () => {
  let accountService: AccountService;
  let mockRepository: jest.Mocked<IAccountRepository>;
  
  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    accountService = new AccountService(mockRepository);
  });
  
  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const accountData = {
        name: 'Test Account',
        tenantid: 'tenant1',
        categoryid: 'cat1'
      };
      
      const expectedResult = { data: { ...accountData, id: 'account1' } };
      mockRepository.create.mockResolvedValue(expectedResult);
      
      const result = await accountService.createAccount(accountData);
      
      expect(mockRepository.create).toHaveBeenCalledWith(accountData);
      expect(result).toEqual(expectedResult);
    });
    
    it('should handle validation errors', async () => {
      const accountData = {
        name: '',
        tenantid: 'tenant1',
        categoryid: 'cat1'
      };
      
      mockRepository.create.mockRejectedValue(new ValidationError('Name is required'));
      
      await expect(accountService.createAccount(accountData))
        .rejects.toThrow('Name is required');
    });
  });
});
```

### Integration Testing

```typescript
// StorageIntegration.test.ts
import { StorageModeManager } from '@/src/services/storage';
import { RepositoryManager } from '@/src/services/apis/repositories';

describe('Storage Integration Tests', () => {
  const testTenantId = 'test-tenant';
  
  beforeEach(async () => {
    // Clean up before each test
    await StorageModeManager.getInstance().cleanup();
  });
  
  describe('Cross-Storage Mode Compatibility', () => {
    const storageModes: Array<'cloud' | 'demo' | 'local'> = ['demo', 'local'];
    
    storageModes.forEach(mode => {
      describe(`${mode} mode`, () => {
        beforeEach(async () => {
          await StorageModeManager.getInstance().setMode(mode);
        });
        
        it('should perform basic CRUD operations', async () => {
          const repositoryManager = RepositoryManager.getInstance();
          const accountRepo = repositoryManager.getAccountRepository();
          
          // Create
          const accountData = {
            name: 'Integration Test Account',
            tenantid: testTenantId,
            categoryid: 'test-category'
          };
          
          const created = await accountRepo.create(accountData);
          expect(created.data).toBeDefined();
          expect(created.data.name).toBe(accountData.name);
          
          // Read
          const accounts = await accountRepo.getAll(testTenantId);
          expect(accounts).toHaveLength(1);
          expect(accounts[0].name).toBe(accountData.name);
          
          // Update
          const updated = await accountRepo.update({
            id: created.data.id,
            name: 'Updated Name',
            tenantid: testTenantId
          });
          expect(updated.data.name).toBe('Updated Name');
          
          // Delete
          await accountRepo.delete(created.data.id, testTenantId);
          const afterDelete = await accountRepo.getAll(testTenantId);
          expect(afterDelete).toHaveLength(0);
        });
      });
    });
  });
});
```

## Migration Examples

### Data Export/Import

```typescript
export class DataMigrationService {
  async exportAllData(tenantId: string): Promise<ExportData> {
    const repositoryManager = RepositoryManager.getInstance();
    
    const [
      accounts,
      accountCategories,
      transactions,
      transactionCategories,
      transactionGroups,
      configurations,
      recurrings
    ] = await Promise.all([
      repositoryManager.getAccountRepository().getAll(tenantId),
      repositoryManager.getAccountCategoryRepository().getAll(tenantId),
      repositoryManager.getTransactionRepository().getAll(tenantId),
      repositoryManager.getTransactionCategoryRepository().getAll(tenantId),
      repositoryManager.getTransactionGroupRepository().getAll(tenantId),
      repositoryManager.getConfigurationRepository().getAll(tenantId),
      repositoryManager.getRecurringRepository().getAll(tenantId)
    ]);
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      tenantId,
      data: {
        accounts,
        accountCategories,
        transactions,
        transactionCategories,
        transactionGroups,
        configurations,
        recurrings
      }
    };
  }
  
  async importAllData(exportData: ExportData): Promise<void> {
    const { data, tenantId } = exportData;
    const repositoryManager = RepositoryManager.getInstance();
    
    try {
      // Import in dependency order
      
      // 1. Account categories (no dependencies)
      for (const category of data.accountCategories) {
        await repositoryManager.getAccountCategoryRepository().create(category);
      }
      
      // 2. Transaction groups (no dependencies)
      for (const group of data.transactionGroups) {
        await repositoryManager.getTransactionGroupRepository().create(group);
      }
      
      // 3. Transaction categories (depend on groups)
      for (const category of data.transactionCategories) {
        await repositoryManager.getTransactionCategoryRepository().create(category);
      }
      
      // 4. Accounts (depend on account categories)
      for (const account of data.accounts) {
        await repositoryManager.getAccountRepository().create(account);
      }
      
      // 5. Transactions (depend on accounts and transaction categories)
      for (const transaction of data.transactions) {
        await repositoryManager.getTransactionRepository().create(transaction);
      }
      
      // 6. Recurrings (depend on accounts and transaction categories)
      for (const recurring of data.recurrings) {
        await repositoryManager.getRecurringRepository().create(recurring);
      }
      
      // 7. Configurations (no dependencies)
      for (const config of data.configurations) {
        await repositoryManager.getConfigurationRepository().create(config);
      }
      
      console.log('Data import completed successfully');
    } catch (error) {
      console.error('Data import failed:', error);
      throw error;
    }
  }
}

interface ExportData {
  version: string;
  exportDate: string;
  tenantId: string;
  data: {
    accounts: Account[];
    accountCategories: AccountCategory[];
    transactions: Transaction[];
    transactionCategories: TransactionCategory[];
    transactionGroups: TransactionGroup[];
    configurations: Configuration[];
    recurrings: Recurring[];
  };
}
```

### Storage Mode Migration

```typescript
export class StorageModeMigration {
  async migrateFromDemoToLocal(tenantId: string): Promise<void> {
    // 1. Ensure we're in demo mode
    const currentMode = StorageModeManager.getInstance().getCurrentMode();
    if (currentMode !== 'demo') {
      throw new Error('Migration can only be performed from demo mode');
    }
    
    // 2. Export demo data
    const migrationService = new DataMigrationService();
    const exportData = await migrationService.exportAllData(tenantId);
    
    // 3. Switch to local mode
    await StorageModeManager.getInstance().setMode('local');
    
    // 4. Import data to local storage
    await migrationService.importAllData(exportData);
    
    console.log('Successfully migrated from demo to local mode');
  }
  
  async migrateFromLocalToCloud(tenantId: string, authToken: string): Promise<void> {
    // 1. Ensure we're in local mode
    const currentMode = StorageModeManager.getInstance().getCurrentMode();
    if (currentMode !== 'local') {
      throw new Error('Migration can only be performed from local mode');
    }
    
    // 2. Export local data
    const migrationService = new DataMigrationService();
    const exportData = await migrationService.exportAllData(tenantId);
    
    // 3. Switch to cloud mode (requires authentication)
    await StorageModeManager.getInstance().setMode('cloud', {
      mode: 'cloud',
      requiresAuth: true,
      persistent: true,
      offline: false,
      authToken
    });
    
    // 4. Import data to cloud storage
    await migrationService.importAllData(exportData);
    
    console.log('Successfully migrated from local to cloud mode');
  }
}
```

These examples demonstrate the flexibility and power of the multi-tier storage architecture. They show how to work with different storage modes, handle errors gracefully, implement advanced patterns, and migrate data between storage backends.

## Next Steps

- [Developer Guide](../developer-guide/README.md) - Learn more about the architecture
- [API Reference](../api/README.md) - Detailed API documentation
- [Testing Guide](../testing/README.md) - Comprehensive testing strategies