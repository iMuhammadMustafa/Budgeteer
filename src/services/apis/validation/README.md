# Referential Integrity Validation System

This module provides comprehensive referential integrity validation across all storage implementations (Supabase, Mock, Local) in the Budgeteer application. It ensures data consistency and enforces database schema rules regardless of the storage backend being used.

## Features

- **Cross-Storage Validation**: Works with Supabase, Mock (in-memory), and Local (SQLite/IndexedDB) storage modes
- **Foreign Key Constraints**: Validates that referenced records exist and belong to the correct tenant
- **Unique Constraints**: Enforces unique field combinations per tenant
- **Cascade Delete Management**: Handles dependent record validation and cascade operations
- **Tenant Isolation**: Ensures data access is properly isolated by tenant
- **Error Handling**: Provides detailed error information with user-friendly messages
- **Batch Operations**: Supports validation of multiple records at once

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                  ValidationService                          │
│                 (Main Entry Point)                          │
├─────────────────────────────────────────────────────────────┤
│              ReferentialIntegrityValidator                  │
│                 (Core Validation Logic)                     │
├─────────────────────────────────────────────────────────────┤
│                  DataProviderFactory                        │
│                 (Storage Mode Selection)                    │
├─────────────────────────────────────────────────────────────┤
│  MockDataProvider  │ SupabaseDataProvider │ LocalDataProvider │
│   (Demo Mode)      │    (Cloud Mode)      │   (Local Mode)    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import { validationService } from '@/src/services/apis/validation';

// Validate before creating a record
try {
  await validationService.validateCreate('accounts', {
    name: 'New Account',
    categoryid: 'cat-1',
    tenantid: 'tenant-123'
  }, 'tenant-123');
  
  // Proceed with creation
  const account = await createAccount(accountData);
} catch (error) {
  console.error('Validation failed:', error.message);
}

// Validate before updating a record
await validationService.validateUpdate('accounts', {
  name: 'Updated Name'
}, 'account-id', 'tenant-123');

// Validate before deleting a record
await validationService.validateDelete('accounts', 'account-id', 'tenant-123');
```

### Using Validation Helpers

```typescript
import { ValidationHelpers } from '@/src/services/apis/validation';

// Check if a record can be safely deleted
const { canDelete, blockers } = await ValidationHelpers.canDeleteSafely(
  'accountcategories', 
  'category-id', 
  'tenant-123'
);

if (!canDelete) {
  console.log('Cannot delete:', blockers);
  // blockers: [{ table: 'accounts', count: 5 }]
}

// Get preview of what would be deleted in cascade operation
const preview = await ValidationHelpers.getCascadeDeletePreview(
  'accountcategories',
  'category-id',
  'tenant-123'
);

console.log('Would delete:', preview);
// preview: [
//   { table: 'accountcategories', id: 'category-id', name: 'Cash' },
//   { table: 'accounts', id: 'account-1', name: 'Checking' },
//   { table: 'accounts', id: 'account-2', name: 'Savings' }
// ]
```

### Error Handling

```typescript
import { ValidationErrorHandler } from '@/src/services/apis/validation';

try {
  await validationService.validateCreate('accounts', accountData, tenantId);
} catch (error) {
  if (ValidationErrorHandler.isReferentialIntegrityError(error)) {
    console.log('Foreign key constraint violation');
  } else if (ValidationErrorHandler.isConstraintViolationError(error)) {
    console.log('Unique constraint violation');
  } else if (ValidationErrorHandler.isCascadeDeleteError(error)) {
    console.log('Cannot delete due to dependent records');
  }
  
  // Get user-friendly message
  const message = ValidationErrorHandler.getUserFriendlyMessage(error);
  showErrorToUser(message);
  
  // Get detailed error info for debugging
  const details = ValidationErrorHandler.getDetailedErrorInfo(error);
  console.log('Error details:', details);
}
```

## Integration with Existing Code

### Using Decorators (Experimental)

```typescript
import { validateCreate, validateUpdate, validateDelete } from '@/src/services/apis/validation';

class AccountService {
  @validateCreate('accounts')
  async createAccount(accountData: any, tenantId: string) {
    // Validation happens automatically before this method executes
    return await this.repository.create(accountData);
  }
  
  @validateUpdate('accounts')
  async updateAccount(updateData: any, accountId: string, tenantId: string) {
    // Validation happens automatically before this method executes
    return await this.repository.update(accountId, updateData);
  }
  
  @validateDelete('accounts')
  async deleteAccount(accountId: string, tenantId: string) {
    // Validation happens automatically before this method executes
    return await this.repository.delete(accountId);
  }
}
```

### Manual Integration

```typescript
import { ValidationHelpers } from '@/src/services/apis/validation';

class AccountService {
  async createAccount(accountData: any, tenantId: string) {
    // Validate before creation
    await ValidationHelpers.validateBeforeCreate('accounts', accountData, tenantId);
    
    // Proceed with creation
    return await this.repository.create(accountData);
  }
  
  async deleteAccount(accountId: string, tenantId: string) {
    // Check if safe to delete
    const { canDelete, blockers } = await ValidationHelpers.canDeleteSafely(
      'accounts', 
      accountId, 
      tenantId
    );
    
    if (!canDelete) {
      throw new Error(`Cannot delete account: referenced by ${blockers.length} other records`);
    }
    
    // Proceed with deletion
    return await this.repository.delete(accountId);
  }
}
```

## Supported Constraints

### Foreign Key Relationships

The system validates the following foreign key relationships based on the database schema:

- **accounts.categoryid** → accountcategories.id
- **transactions.accountid** → accounts.id
- **transactions.categoryid** → transactioncategories.id
- **transactions.transferaccountid** → accounts.id (nullable)
- **transactions.transferid** → transactions.id (nullable)
- **transactioncategories.groupid** → transactiongroups.id
- **recurrings.sourceaccountid** → accounts.id
- **recurrings.categoryid** → transactioncategories.id (nullable)

### Unique Constraints

The system enforces the following unique constraints:

- **accounts**: name + tenantid
- **accountcategories**: name + tenantid
- **transactioncategories**: name + tenantid
- **transactiongroups**: name + tenantid
- **configurations**: key + table + tenantid

### Cascade Delete Rules

The system checks for dependent records before allowing deletions:

- **accountcategories**: Cannot delete if referenced by accounts
- **accounts**: Cannot delete if referenced by transactions or recurrings
- **transactiongroups**: Cannot delete if referenced by transactioncategories
- **transactioncategories**: Cannot delete if referenced by transactions or recurrings
- **transactions**: Cannot delete if referenced by other transactions (transfers)

## Configuration

### Storage Mode Detection

The system automatically detects the current storage mode based on:

1. `DemoModeGlobal.isDemoMode` for demo mode
2. `process.env.EXPO_PUBLIC_STORAGE_MODE === 'local'` for local mode
3. Default to cloud mode (Supabase)

### Environment Variables

```bash
# For local storage mode
EXPO_PUBLIC_STORAGE_MODE=local

# For Supabase (cloud mode)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

The validation system includes comprehensive tests covering:

- Foreign key validation
- Unique constraint validation
- Cascade delete validation
- Error handling
- Data provider implementations
- Integration helpers

Run tests with:

```bash
npm test src/services/apis/validation/__tests__/
```

## Performance Considerations

- **Caching**: Data providers can implement caching for frequently accessed reference data
- **Batch Validation**: Use `BatchValidation` utilities for validating multiple records
- **Lazy Loading**: Validation only loads data when needed
- **Tenant Isolation**: Queries are automatically filtered by tenant for performance

## Extending the System

### Adding New Tables

1. Update `FOREIGN_KEY_RELATIONSHIPS` in `ReferentialIntegrityValidator.ts`
2. Update `UNIQUE_CONSTRAINTS` if needed
3. Add methods to `IDataProvider` interface
4. Implement methods in all data providers
5. Add cascade delete rules if needed

### Adding New Storage Modes

1. Create a new data provider implementing `IDataProvider`
2. Update `DataProviderFactory` to handle the new mode
3. Add mode detection logic
4. Update tests

## Troubleshooting

### Common Issues

1. **"Referenced record not found"**: The foreign key reference doesn't exist or is deleted
2. **"Unique constraint violation"**: A record with the same unique field combination already exists
3. **"Cannot delete: dependent records exist"**: The record being deleted is referenced by other records

### Debug Mode

Enable detailed error logging:

```typescript
const details = ValidationErrorHandler.getDetailedErrorInfo(error);
console.log('Validation error details:', details);
```

### Performance Issues

If validation is slow:

1. Check if proper indexes exist on foreign key fields
2. Consider implementing caching in data providers
3. Use batch validation for multiple records
4. Profile database queries in data providers

## API Reference

See the exported types and interfaces in `index.ts` for complete API documentation.