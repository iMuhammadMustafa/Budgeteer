# Repository Pattern Implementation

This folder contains the repository pattern implementation for the Budgeteer application. All Supabase functions have been wrapped in repository classes that implement their corresponding interfaces.

## Repository Classes

Each repository class implements the base `IRepository` interface and may include additional methods specific to that entity:

### Available Repository Classes

1. **AccountCategoryRepository** - Implements `IAccountCategoryRepository`
2. **AccountRepository** - Implements `IAccountRepository`
3. **ConfigurationRepository** - Implements `IConfigurationRepository`
4. **RecurringRepository** - Implements `IRecurringRepository`
5. **StatsRepository** - Implements `IStatsRepository`
6. **TransactionCategoryRepository** - Implements `ITransactionCategoryRepository`
7. **TransactionGroupRepository** - Implements `ITransactionGroupRepository`
8. **TransactionRepository** - Implements `ITransactionRepository`

## Base Repository Interface

All repositories implement the base `IRepository` interface which includes:

```typescript
interface IRepository<T, InsertType, UpdateType> {
  // Read operations
  findById(id: string, tenantId?: string): Promise<T | null>;
  findAll(filters?: any, tenantId?: string): Promise<T[]>;

  // Write operations
  create(data: InsertType, tenantId?: string): Promise<T>;
  update(id: string, data: UpdateType, tenantId?: string): Promise<T | null>;
  delete(id: string, tenantId?: string): Promise<void>;

  // Soft delete operations
  softDelete(id: string, tenantId?: string): Promise<void>;
  restore(id: string, tenantId?: string): Promise<void>;
}
```

## Usage Examples

### Using Repository Classes (Recommended)

```typescript
import { AccountCategoryRepository } from "@/src/repositories";

// Create an instance
const accountCategoryRepo = new AccountCategoryRepository();

// Use the repository methods
const categories = await accountCategoryRepo.findAll(undefined, tenantId);
const category = await accountCategoryRepo.findById(id, tenantId);
const newCategory = await accountCategoryRepo.create(categoryData, tenantId);
const updatedCategory = await accountCategoryRepo.update(id, updateData, tenantId);
await accountCategoryRepo.softDelete(id, tenantId);
```

### Using Legacy Functions (For Backward Compatibility)

```typescript
import { getAllAccountCategories, getAccountCategoryById } from "@/src/repositories";

// Legacy functions still work
const categories = await getAllAccountCategories(tenantId);
const category = await getAccountCategoryById(id, tenantId);
```

## Migration Strategy

1. **Phase 1**: Repository classes are created alongside existing functions
2. **Phase 2**: New code should use repository classes
3. **Phase 3**: Gradually migrate existing code to use repository classes
4. **Phase 4**: Remove legacy functions (optional)

## Special Repository Methods

Some repositories have additional methods beyond the base interface:

### AccountRepository

- `updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number>`
- `getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{id: string, amount: number}>`
- `getTotalAccountBalance(tenantId?: string): Promise<{totalbalance: number} | null>`

### TransactionRepository

- `getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView>`
- `findByName(text: string, tenantId: string): Promise<{label: string, item: SearchDistinctTransactions}[]>`
- `createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]>`
- `updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>`

### ConfigurationRepository

- `getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<Configuration>`

### StatsRepository

- `getStatsDailyTransactions(tenantId: string, startDate?: string, endDate?: string, type?: TransactionType): Promise<StatsDailyTransactions[]>`
- `getStatsMonthlyTransactionsTypes(tenantId: string, startDate?: string, endDate?: string): Promise<StatsMonthlyTransactionsTypes[]>`
- `getStatsMonthlyCategoriesTransactions(tenantId: string, startDate?: string, endDate?: string): Promise<StatsMonthlyCategoriesTransactions[]>`
- `getStatsMonthlyAccountsTransactions(tenantId: string, startDate?: string, endDate?: string): Promise<StatsMonthlyAccountsTransactions[]>`
- `getStatsNetWorthGrowth(tenantId: string, startDate?: string, endDate?: string): Promise<StatsNetWorthGrowth[]>`

## Benefits of Repository Pattern

1. **Consistent Interface**: All repositories follow the same interface pattern
2. **Type Safety**: Full TypeScript support with proper typing
3. **Testability**: Easy to mock repositories for unit testing
4. **Separation of Concerns**: Business logic separated from data access
5. **Maintainability**: Centralized data access logic
6. **Backward Compatibility**: Legacy functions still work during migration

## File Structure

```
src/repositories/
├── index.ts                 # Main exports
├── interfaces/              # Repository interfaces
│   ├── IRepository.ts
│   ├── IAccountCategoryRepository.ts
│   ├── IAccountRepository.ts
│   ├── IConfigurationRepository.ts
│   ├── IRecurringRepository.ts
│   ├── IStatsRepository.ts
│   ├── ITransactionCategoryRepository.ts
│   ├── ITransactionGroupRepository.ts
│   └── ITransactionRepository.ts
└── supabase/               # Repository implementations
    ├── AccountCategories.supa.ts
    ├── Accounts.supa.ts
    ├── Configurations.supa.ts
    ├── Recurrings.api.supa.ts
    ├── Stats.supa.ts
    ├── TransactionCategories.supa.ts
    ├── TransactionGroups.supa.ts
    └── Transactions.supa.ts
```
