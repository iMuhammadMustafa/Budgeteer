# Repository Pattern Implementation

### Using Repository Classes

```typescript
import { AccountCategorySupaRepository } from "@/src/repositories";

// Create an instance
const accountCategoryRepo = new AccountCategorySupaRepository();

// Use the repository methods
const categories = await accountCategoryRepo.findAll(undefined, tenantId);
const category = await accountCategoryRepo.findById(id, tenantId);
const newCategory = await accountCategoryRepo.create(categoryData, tenantId);
const updatedCategory = await accountCategoryRepo.update(id, updateData, tenantId);
await accountCategoryRepo.softDelete(id, tenantId);
```

All functions have been wrapped in repository classes that implement their corresponding interfaces.

## Repository Classes

Each repository class implements the base `IRepository` interface and may include additional methods specific to that entity:

### Available Repository Classes

1. **AccountCategorySupaRepository** - Implements `IAccountCategoryRepository`
2. **AccountSupaRepository** - Implements `IAccountRepository`
3. **ConfigurationSupaRepository** - Implements `IConfigurationRepository`
4. **RecurringSupaRepository** - Implements `IRecurringRepository`
5. **StatsSupaRepository** - Implements `IStatsRepository`
6. **TransactionCategorySupaRepository** - Implements `ITransactionCategoryRepository`
7. **TransactionGroupSupaRepository** - Implements `ITransactionGroupRepository`
8. **TransactionSupaRepository** - Implements `ITransactionRepository`

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

## Special Repository Methods

Some repositories have additional methods beyond the base interface:

### AccountSupaRepository

- `updateAccountBalance(accountid: string, amount: number, tenantId?: string): Promise<number>`
- `getAccountOpenedTransaction(accountid: string, tenantId?: string): Promise<{id: string, amount: number}>`
- `getTotalAccountBalance(tenantId?: string): Promise<{totalbalance: number} | null>`

### TransactionSupaRepository

- `getTransactionByTransferId(id: string, tenantId: string): Promise<TransactionsView>`
- `findByName(text: string, tenantId: string): Promise<{label: string, item: SearchDistinctTransactions}[]>`
- `createMultipleTransactions(transactions: Inserts<TableNames.Transactions>[]): Promise<Transaction[]>`
- `updateTransferTransaction(transaction: Updates<TableNames.Transactions>): Promise<Transaction>`

### ConfigurationSupaRepository

- `getConfiguration(table: string, type: string, key: string, tenantId?: string): Promise<Configuration>`

### StatsSupaRepository

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
