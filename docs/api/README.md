# API Reference

## Overview

This document provides comprehensive API reference for Budgeteer's multi-tier storage architecture. All APIs maintain consistent interfaces across all storage modes (Cloud, Demo, Local).

## Table of Contents

1. [Storage Mode Manager](#storage-mode-manager)
2. [Repository Manager](#repository-manager)
3. [Repository APIs](#repository-apis)
4. [Provider Interfaces](#provider-interfaces)
5. [Validation Framework](#validation-framework)
6. [Error Types](#error-types)
7. [Type Definitions](#type-definitions)

## Storage Mode Manager

### `StorageModeManager`

Central manager for storage mode operations.

#### Methods

##### `getInstance(): StorageModeManager`
Returns the singleton instance of StorageModeManager.

```typescript
const manager = StorageModeManager.getInstance();
```

##### `setMode(mode: StorageMode, config?: StorageModeConfig): Promise<void>`
Sets the current storage mode.

**Parameters:**
- `mode`: `'cloud' | 'demo' | 'local'` - The storage mode to set
- `config`: `StorageModeConfig` (optional) - Mode-specific configuration

**Example:**
```typescript
await manager.setMode('local');

// With configuration
await manager.setMode('cloud', {
  mode: 'cloud',
  requiresAuth: true,
  persistent: true,
  offline: false
});
```

##### `getCurrentMode(): StorageMode`
Returns the current storage mode.

```typescript
const currentMode = manager.getCurrentMode();
```

##### `getProvider<T>(entityType: string): T`
Returns the provider instance for the specified entity type.

**Parameters:**
- `entityType`: `string` - The entity type ('accounts', 'transactions', etc.)

**Returns:** Provider instance implementing the appropriate interface

**Example:**
```typescript
const accountProvider = manager.getProvider<IAccountProvider>('accounts');
```

##### `cleanup(): Promise<void>`
Cleans up current providers and resources.

```typescript
await manager.cleanup();
```

## Repository Manager

### `RepositoryManager`

Manages repository instances with dependency injection.

#### Methods

##### `getInstance(): RepositoryManager`
Returns the singleton instance of RepositoryManager.

```typescript
const repoManager = RepositoryManager.getInstance();
```

##### `getAccountRepository(): IAccountRepository`
Returns the account repository instance.

```typescript
const accountRepo = repoManager.getAccountRepository();
```

##### `getTransactionRepository(): ITransactionRepository`
Returns the transaction repository instance.

```typescript
const transactionRepo = repoManager.getTransactionRepository();
```

##### `getAccountCategoryRepository(): IAccountCategoryRepository`
Returns the account category repository instance.

##### `getTransactionCategoryRepository(): ITransactionCategoryRepository`
Returns the transaction category repository instance.

##### `getTransactionGroupRepository(): ITransactionGroupRepository`
Returns the transaction group repository instance.

##### `getConfigurationRepository(): IConfigurationRepository`
Returns the configuration repository instance.

##### `getRecurringRepository(): IRecurringRepository`
Returns the recurring transaction repository instance.

##### `getStatsRepository(): IStatsRepository`
Returns the statistics repository instance.

##### `clearAll(): void`
Clears all repository instances (forces re-initialization).

```typescript
repoManager.clearAll();
```

## Repository APIs

### Account Repository

#### `getAllAccounts(tenantId: string): Promise<Account[]>`
Retrieves all accounts for a tenant.

**Parameters:**
- `tenantId`: `string` - The tenant identifier

**Returns:** Array of Account objects

**Example:**
```typescript
const accounts = await AccountsRepository.getAllAccounts('tenant123');
```

#### `getAccountById(id: string, tenantId: string): Promise<Account | null>`
Retrieves a specific account by ID.

**Parameters:**
- `id`: `string` - The account ID
- `tenantId`: `string` - The tenant identifier

**Returns:** Account object or null if not found

#### `createAccount(account: Inserts<TableNames.Accounts>): Promise<any>`
Creates a new account.

**Parameters:**
- `account`: Account data for creation

**Returns:** Created account data

**Example:**
```typescript
const newAccount = {
  name: 'Checking Account',
  tenantid: 'tenant123',
  categoryid: 'category456',
  balance: 1000.00
};

const result = await AccountsRepository.createAccount(newAccount);
```

#### `updateAccount(account: Updates<TableNames.Accounts>): Promise<any>`
Updates an existing account.

**Parameters:**
- `account`: Account data for update (must include id)

**Returns:** Updated account data

#### `deleteAccount(id: string, userId?: string): Promise<any>`
Soft deletes an account.

**Parameters:**
- `id`: `string` - The account ID
- `userId`: `string` (optional) - The user ID for authorization

**Returns:** Deletion result

#### `restoreAccount(id: string, userId?: string): Promise<any>`
Restores a soft-deleted account.

#### `updateAccountBalance(accountid: string, amount: number): Promise<any>`
Updates an account's balance.

**Parameters:**
- `accountid`: `string` - The account ID
- `amount`: `number` - The amount to add/subtract

#### `getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any>`
Gets the opening transaction for an account.

#### `getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>`
Gets the total balance across all accounts for a tenant.

### Transaction Repository

#### `getAllTransactions(tenantId: string): Promise<Transaction[]>`
Retrieves all transactions for a tenant.

#### `getTransactionById(id: string, tenantId: string): Promise<Transaction | null>`
Retrieves a specific transaction by ID.

#### `createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any>`
Creates a new transaction.

**Example:**
```typescript
const newTransaction = {
  accountid: 'account123',
  amount: -50.00,
  description: 'Grocery shopping',
  date: new Date().toISOString(),
  categoryid: 'category789',
  tenantid: 'tenant123'
};

const result = await TransactionsRepository.createTransaction(newTransaction);
```

#### `updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>`
Updates an existing transaction.

#### `deleteTransaction(id: string, userId?: string): Promise<any>`
Soft deletes a transaction.

#### `restoreTransaction(id: string, userId?: string): Promise<any>`
Restores a soft-deleted transaction.

#### `getTransactionsByAccount(accountid: string, tenantId: string): Promise<Transaction[]>`
Gets all transactions for a specific account.

#### `getTransactionsByCategory(categoryid: string, tenantId: string): Promise<Transaction[]>`
Gets all transactions for a specific category.

#### `getTransactionsByDateRange(startDate: string, endDate: string, tenantId: string): Promise<Transaction[]>`
Gets transactions within a date range.

### Account Category Repository

#### `getAllAccountCategories(tenantId: string): Promise<AccountCategory[]>`
Retrieves all account categories for a tenant.

#### `getAccountCategoryById(id: string, tenantId: string): Promise<AccountCategory | null>`
Retrieves a specific account category by ID.

#### `createAccountCategory(category: Inserts<TableNames.AccountCategories>): Promise<any>`
Creates a new account category.

#### `updateAccountCategory(category: Updates<TableNames.AccountCategories>): Promise<any>`
Updates an existing account category.

#### `deleteAccountCategory(id: string, userId?: string): Promise<any>`
Soft deletes an account category.

#### `restoreAccountCategory(id: string, userId?: string): Promise<any>`
Restores a soft-deleted account category.

### Transaction Category Repository

#### `getAllTransactionCategories(tenantId: string): Promise<TransactionCategory[]>`
Retrieves all transaction categories for a tenant.

#### `getTransactionCategoryById(id: string, tenantId: string): Promise<TransactionCategory | null>`
Retrieves a specific transaction category by ID.

#### `createTransactionCategory(category: Inserts<TableNames.TransactionCategories>): Promise<any>`
Creates a new transaction category.

#### `updateTransactionCategory(category: Updates<TableNames.TransactionCategories>): Promise<any>`
Updates an existing transaction category.

#### `deleteTransactionCategory(id: string, userId?: string): Promise<any>`
Soft deletes a transaction category.

#### `restoreTransactionCategory(id: string, userId?: string): Promise<any>`
Restores a soft-deleted transaction category.

### Transaction Group Repository

#### `getAllTransactionGroups(tenantId: string): Promise<TransactionGroup[]>`
Retrieves all transaction groups for a tenant.

#### `getTransactionGroupById(id: string, tenantId: string): Promise<TransactionGroup | null>`
Retrieves a specific transaction group by ID.

#### `createTransactionGroup(group: Inserts<TableNames.TransactionGroups>): Promise<any>`
Creates a new transaction group.

#### `updateTransactionGroup(group: Updates<TableNames.TransactionGroups>): Promise<any>`
Updates an existing transaction group.

#### `deleteTransactionGroup(id: string, userId?: string): Promise<any>`
Soft deletes a transaction group.

#### `restoreTransactionGroup(id: string, userId?: string): Promise<any>`
Restores a soft-deleted transaction group.

### Configuration Repository

#### `getAllConfigurations(tenantId: string): Promise<Configuration[]>`
Retrieves all configurations for a tenant.

#### `getConfiguration(key: string, table: string, tenantId: string): Promise<Configuration | null>`
Retrieves a specific configuration by key and table.

#### `createConfiguration(config: Inserts<TableNames.Configurations>): Promise<any>`
Creates a new configuration.

#### `updateConfiguration(config: Updates<TableNames.Configurations>): Promise<any>`
Updates an existing configuration.

#### `deleteConfiguration(id: string, userId?: string): Promise<any>`
Soft deletes a configuration.

#### `restoreConfiguration(id: string, userId?: string): Promise<any>`
Restores a soft-deleted configuration.

### Recurring Repository

#### `getAllRecurrings(tenantId: string): Promise<Recurring[]>`
Retrieves all recurring transactions for a tenant.

#### `getRecurringById(id: string, tenantId: string): Promise<Recurring | null>`
Retrieves a specific recurring transaction by ID.

#### `createRecurring(recurring: Inserts<TableNames.Recurrings>): Promise<any>`
Creates a new recurring transaction.

#### `updateRecurring(recurring: Updates<TableNames.Recurrings>): Promise<any>`
Updates an existing recurring transaction.

#### `deleteRecurring(id: string, userId?: string): Promise<any>`
Soft deletes a recurring transaction.

#### `restoreRecurring(id: string, userId?: string): Promise<any>`
Restores a soft-deleted recurring transaction.

### Stats Repository

#### `getAccountStats(tenantId: string): Promise<any>`
Retrieves account statistics for a tenant.

#### `getTransactionStats(tenantId: string): Promise<any>`
Retrieves transaction statistics for a tenant.

#### `getCategoryStats(tenantId: string): Promise<any>`
Retrieves category statistics for a tenant.

#### `getMonthlyStats(tenantId: string, year: number, month: number): Promise<any>`
Retrieves monthly statistics for a specific month.

## Provider Interfaces

### `IAccountProvider`

Interface that all account providers must implement.

```typescript
interface IAccountProvider {
  getAllAccounts(tenantId: string): Promise<Account[]>;
  getAccountById(id: string, tenantId: string): Promise<Account | null>;
  createAccount(account: Inserts<TableNames.Accounts>): Promise<any>;
  updateAccount(account: Updates<TableNames.Accounts>): Promise<any>;
  deleteAccount(id: string, userId?: string): Promise<any>;
  restoreAccount(id: string, userId?: string): Promise<any>;
  updateAccountBalance(accountid: string, amount: number): Promise<any>;
  getAccountOpenedTransaction(accountid: string, tenantId: string): Promise<any>;
  getTotalAccountBalance(tenantId: string): Promise<{ totalbalance: number } | null>;
}
```

### `ITransactionProvider`

Interface that all transaction providers must implement.

```typescript
interface ITransactionProvider {
  getAllTransactions(tenantId: string): Promise<Transaction[]>;
  getTransactionById(id: string, tenantId: string): Promise<Transaction | null>;
  createTransaction(transaction: Inserts<TableNames.Transactions>): Promise<any>;
  updateTransaction(transaction: Updates<TableNames.Transactions>): Promise<any>;
  deleteTransaction(id: string, userId?: string): Promise<any>;
  restoreTransaction(id: string, userId?: string): Promise<any>;
  getTransactionsByAccount(accountid: string, tenantId: string): Promise<Transaction[]>;
  getTransactionsByCategory(categoryid: string, tenantId: string): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string, tenantId: string): Promise<Transaction[]>;
}
```

### Other Provider Interfaces

Similar interfaces exist for:
- `IAccountCategoryProvider`
- `ITransactionCategoryProvider`
- `ITransactionGroupProvider`
- `IConfigurationProvider`
- `IRecurringProvider`
- `IStatsProvider`

## Validation Framework

### `ValidationService`

Singleton service for data validation.

#### Methods

##### `getInstance(): ValidationService`
Returns the singleton instance.

```typescript
const validationService = ValidationService.getInstance();
```

##### `validateCreate(tableName: string, data: any, tenantId: string): Promise<void>`
Validates data before creation.

**Parameters:**
- `tableName`: `string` - The table name
- `data`: `any` - The data to validate
- `tenantId`: `string` - The tenant identifier

**Throws:** Validation errors if data is invalid

**Example:**
```typescript
await validationService.validateCreate('accounts', accountData, 'tenant123');
```

##### `validateUpdate(tableName: string, data: any, id: string, tenantId: string): Promise<void>`
Validates data before update.

##### `validateDelete(tableName: string, id: string, tenantId: string): Promise<void>`
Validates before deletion (checks for dependent records).

### `ReferentialIntegrityValidator`

Handles referential integrity validation.

#### Methods

##### `validateCreate(tableName: string, data: any, tenantId: string): Promise<void>`
Validates referential integrity for creation.

##### `validateUpdate(tableName: string, data: any, id: string, tenantId: string): Promise<void>`
Validates referential integrity for updates.

##### `validateDelete(tableName: string, id: string, tenantId: string): Promise<void>`
Validates referential integrity for deletion.

##### `addCustomRule(tableName: string, rule: ValidationRule): void`
Adds a custom validation rule.

**Example:**
```typescript
validator.addCustomRule('accounts', async (data, tenantId) => {
  if (data.balance < 0 && data.type === 'asset') {
    throw new ValidationError('Asset accounts cannot have negative balance');
  }
});
```

## Error Types

### `StorageError`

Base error class for storage-related errors.

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}
```

### `ValidationError`

Error thrown when validation fails.

```typescript
class ValidationError extends StorageError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}
```

### `ReferentialIntegrityError`

Error thrown when referential integrity is violated.

```typescript
class ReferentialIntegrityError extends StorageError {
  constructor(table: string, field: string, value: string) {
    super(
      `Referenced record not found: ${table}.${field} = ${value}`,
      'REFERENTIAL_INTEGRITY_ERROR',
      { table, field, value }
    );
  }
}
```

### `ConstraintViolationError`

Error thrown when database constraints are violated.

```typescript
class ConstraintViolationError extends StorageError {
  constructor(message: string, details?: any) {
    super(message, 'CONSTRAINT_VIOLATION_ERROR', details);
  }
}
```

### `NotFoundError`

Error thrown when a requested record is not found.

```typescript
class NotFoundError extends StorageError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND_ERROR', details);
  }
}
```

## Type Definitions

### `StorageMode`

```typescript
type StorageMode = 'cloud' | 'demo' | 'local';
```

### `StorageModeConfig`

```typescript
interface StorageModeConfig {
  mode: StorageMode;
  requiresAuth: boolean;
  persistent: boolean;
  offline: boolean;
  [key: string]: any; // Mode-specific configuration
}
```

### Database Types

All database types are defined in `src/types/db/database.types.ts`:

- `Account`
- `AccountCategory`
- `Transaction`
- `TransactionCategory`
- `TransactionGroup`
- `Configuration`
- `Recurring`

### Insert and Update Types

```typescript
type Inserts<T> = Omit<T, 'id' | 'createdat' | 'updatedat'>;
type Updates<T> = Partial<T> & { id: string };
```

### Table Names

```typescript
enum TableNames {
  Accounts = 'accounts',
  AccountCategories = 'accountcategories',
  Transactions = 'transactions',
  TransactionCategories = 'transactioncategories',
  TransactionGroups = 'transactiongroups',
  Configurations = 'configurations',
  Recurrings = 'recurrings'
}
```

## Usage Examples

### Basic Repository Usage

```typescript
import * as AccountsRepository from '@/src/services/apis/Accounts.repository';

// Get all accounts
const accounts = await AccountsRepository.getAllAccounts('tenant123');

// Create new account
const newAccount = await AccountsRepository.createAccount({
  name: 'Savings Account',
  tenantid: 'tenant123',
  categoryid: 'savings-category',
  balance: 5000
});

// Update account
await AccountsRepository.updateAccount({
  id: newAccount.data.id,
  name: 'Updated Savings Account',
  tenantid: 'tenant123'
});
```

### Storage Mode Management

```typescript
import { StorageModeManager } from '@/src/services/storage';

const manager = StorageModeManager.getInstance();

// Switch to local mode
await manager.setMode('local');

// Get current mode
const currentMode = manager.getCurrentMode();

// Get provider for specific entity
const accountProvider = manager.getProvider<IAccountProvider>('accounts');
```

### Validation Usage

```typescript
import { validationService } from '@/src/services/apis/validation';

try {
  // Validate before creating
  await validationService.validateCreate('accounts', accountData, 'tenant123');
  
  // Create account
  const result = await AccountsRepository.createAccount(accountData);
} catch (error) {
  if (error instanceof ReferentialIntegrityError) {
    console.error('Referenced category not found:', error.details);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
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

async function handleAccountOperation(operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      console.error('Validation failed:', error.message);
    } else if (error instanceof ReferentialIntegrityError) {
      // Handle referential integrity errors
      console.error('Referenced record not found:', error.details);
    } else if (error instanceof ConstraintViolationError) {
      // Handle constraint violations
      console.error('Constraint violated:', error.message);
    } else if (error instanceof NotFoundError) {
      // Handle not found errors
      console.error('Record not found:', error.message);
    } else if (error instanceof StorageError) {
      // Handle general storage errors
      console.error('Storage error:', error.code, error.details);
    } else {
      // Handle unknown errors
      console.error('Unknown error:', error);
    }
    throw error;
  }
}
```

## Best Practices

### Repository Usage

1. **Always use repository methods** instead of direct provider access
2. **Handle errors appropriately** using the provided error types
3. **Validate data** before performing operations
4. **Use TypeScript types** for better type safety

### Storage Mode Management

1. **Initialize storage mode early** in your application lifecycle
2. **Handle mode switching gracefully** with proper cleanup
3. **Test all storage modes** in your application
4. **Provide user feedback** during mode switches

### Error Handling

1. **Use specific error types** for different error scenarios
2. **Provide meaningful error messages** to users
3. **Log errors appropriately** for debugging
4. **Implement retry logic** where appropriate

## Next Steps

- [Developer Guide](../developer-guide/README.md) - Learn to work with the APIs
- [Usage Examples](../examples/README.md) - See practical implementations
- [Architecture Overview](../architecture/README.md) - Understand the system design