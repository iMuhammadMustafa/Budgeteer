# Local Storage Implementation

This directory contains the local storage implementation for the Budgeteer application supporting both IndexedDB (web) and SQLite (native).

## Overview

The local storage implementation provides persistent client-side data storage that mirrors the Supabase database schema across platforms:
- **Web**: IndexedDB with Dexie.js
- **Native**: SQLite with expo-sqlite

Both implementations support all CRUD operations and maintain referential integrity constraints.

## Architecture

### Core Components

- **BudgeteerDatabase.ts**: Main Dexie database class with table definitions and hooks
- **LocalStorageProvider.ts**: Storage provider implementation with initialization and cleanup
- **migrations.ts**: Database migration system for schema updates
- **Entity Providers**: Individual provider files for each entity type

### Entity Providers

- `Accounts.local.ts` - Account management
- `AccountCategories.local.ts` - Account category management
- `Transactions.local.ts` - Transaction management
- `TransactionCategories.local.ts` - Transaction category management
- `TransactionGroups.local.ts` - Transaction group management
- `Configurations.local.ts` - Configuration management
- `Recurrings.local.ts` - Recurring transaction management
- `Stats.local.ts` - Statistics and reporting

## Features

### Database Schema
- Mirrors the exact Supabase database schema
- Automatic timestamp management (createdat, updatedat)
- Soft delete support (isdeleted flag)
- Foreign key constraint validation

### Referential Integrity
- Validates foreign key relationships before create/update operations
- Throws `ReferentialIntegrityError` for constraint violations
- Maintains data consistency across all operations

### Migration System
- Version-based migration system
- Automatic migration execution on initialization
- Rollback support for development
- Schema version tracking in configurations table

### Error Handling
- Consistent error types across all providers
- Detailed error messages for debugging
- Graceful handling of constraint violations

## Usage

### Initialization

```typescript
import { localStorageProvider } from './LocalStorageProvider';

// Initialize the local storage
await localStorageProvider.initialize();
```

### Using Providers

```typescript
import { ProviderFactory } from '../../storage/ProviderFactory';

const factory = ProviderFactory.getInstance();
const accountProvider = factory.createProvider('accounts', 'local');

// Use the provider
const accounts = await accountProvider.getAllAccounts('tenant-id');
```

### Database Information

```typescript
const dbInfo = await localStorageProvider.getDatabaseInfo();
console.log('Database info:', dbInfo);
```

## Database Schema

The local database includes the following tables with comprehensive indexing:

### Tables and Indexes

**accounts**: User accounts with balances and categories
- Indexes: `id, tenantid, categoryid, name, isdeleted, balance, displayorder, createdat, updatedat, owner, currency`
- Compound indexes: `[tenantid+isdeleted], [categoryid+isdeleted]`

**accountcategories**: Account categorization (Asset, Liability, etc.)
- Indexes: `id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, color, icon`
- Compound indexes: `[tenantid+isdeleted], [tenantid+type]`

**transactions**: Financial transactions (most complex queries)
- Indexes: `id, tenantid, accountid, categoryid, date, isdeleted, amount, type, createdat, updatedat, payee, transferaccountid, transferid, isvoid`
- Compound indexes: `[tenantid+isdeleted], [accountid+isdeleted], [categoryid+isdeleted], [tenantid+date], [accountid+date], [categoryid+date]`

**transactioncategories**: Transaction categorization
- Indexes: `id, tenantid, groupid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency`
- Compound indexes: `[tenantid+isdeleted], [groupid+isdeleted], [tenantid+type]`

**transactiongroups**: Transaction group organization
- Indexes: `id, tenantid, name, type, isdeleted, displayorder, createdat, updatedat, budgetamount, budgetfrequency`
- Compound indexes: `[tenantid+isdeleted], [tenantid+type]`

**configurations**: Application configuration settings
- Indexes: `id, tenantid, key, table, isdeleted, createdat, updatedat, type, value`
- Compound indexes: `[tenantid+key], [table+key], [tenantid+table]`

**recurrings**: Recurring transaction templates
- Indexes: `id, tenantid, sourceaccountid, categoryid, isdeleted, nextoccurrencedate, createdat, updatedat, isactive, lastexecutedat, type`
- Compound indexes: `[tenantid+isdeleted], [sourceaccountid+isdeleted], [tenantid+nextoccurrencedate], [tenantid+isactive]`

### Important Notes about Dexie Schema

The schema definition in Dexie's `stores()` method defines **indexes only**, not the complete table structure. Dexie will store all properties you put into objects, but only the fields listed in the schema string will be indexed for efficient querying.

This means:
- All database fields are stored (matching the Supabase schema exactly)
- Only indexed fields can be used in `.where()` queries efficiently
- Non-indexed fields can still be filtered using `.and()` or `.filter()` methods
- Compound indexes like `[tenantid+isdeleted]` enable efficient multi-field queries

## Migration System

### Adding New Migrations

```typescript
// In migrations.ts
this.migrations.push({
  version: 2,
  description: 'Add new column to accounts table',
  up: async () => {
    // Migration logic here
    await db.version(2).stores({
      accounts: 'id, tenantid, categoryid, name, isdeleted, balance, displayorder, createdat, newcolumn'
    });
  },
  down: async () => {
    // Rollback logic (optional)
  }
});
```

### Running Migrations

Migrations run automatically during initialization. Manual migration control:

```typescript
import { MigrationManager } from './migrations';

const migrationManager = MigrationManager.getInstance();
await migrationManager.runMigrations();
```

## Testing

A test utility is provided to verify the implementation:

```typescript
import { testLocalStorage } from './test';

const success = await testLocalStorage();
console.log('Test result:', success ? 'PASSED' : 'FAILED');
```

## Performance Considerations

- IndexedDB operations are asynchronous and non-blocking
- Bulk operations should use Dexie's bulk methods
- Indexes are optimized for common query patterns
- Memory usage is managed by the browser's IndexedDB implementation

## Browser Compatibility

- Supported in all modern browsers
- IndexedDB storage limits vary by browser (typically 50MB+)
- Automatic cleanup on storage quota exceeded
- Graceful degradation for unsupported browsers

## Limitations

- Web-only implementation (IndexedDB not available in React Native)
- Storage quota limitations (browser-dependent)
- No server-side synchronization
- Data is isolated per browser/domain

## Future Enhancements

- Data export/import functionality
- Compression for large datasets
- Background sync capabilities
- Cross-tab synchronization
- Offline-first optimizations