# Database Schema Enforcement Utilities

This module provides comprehensive database schema validation, runtime validation, and migration utilities for the Budgeteer application's multi-tier storage architecture.

## Overview

The schema enforcement utilities ensure data integrity across all storage implementations (Supabase, Mock, and Local storage) by providing:

1. **Schema Validation**: Type checking and constraint validation based on `database.types.ts`
2. **Runtime Validation**: Business rule validation for CRUD operations
3. **Migration Utilities**: Schema migration support for local storage implementations

## Components

### SchemaValidator

The core schema validator that enforces database schema compliance.

```typescript
import { schemaValidator } from '@/src/services/storage/schema';

// Validate insert data
schemaValidator.validateInsert('accounts', {
  name: 'Test Account',
  categoryid: 'cat1',
  balance: 100.50
});

// Validate update data
schemaValidator.validateUpdate('accounts', {
  balance: 200.75
});

// Validate foreign keys
await schemaValidator.validateForeignKeys('accounts', data, dataProvider);
```

**Features:**
- Required field validation
- Type checking (string, number, boolean, date)
- Enum value validation
- Foreign key constraint validation
- Comprehensive error reporting

### RuntimeValidator

Provides runtime validation with business rules for CRUD operations.

```typescript
import { runtimeValidator } from '@/src/services/storage/schema';

// Validate account creation
const result = await runtimeValidator.validateCreate(
  'Accounts',
  accountData,
  dataProvider
);

if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}

// Validate transaction update
const updateResult = await runtimeValidator.validateUpdate(
  'Transactions',
  updateData,
  dataProvider
);
```

**Features:**
- Schema validation integration
- Business rule validation
- Transfer transaction validation
- Currency format validation
- Date format validation
- Batch validation support
- Configurable validation options

### SchemaMigration

Provides schema migration utilities for local storage implementations.

```typescript
import { createSchemaMigration } from '@/src/services/storage/schema';

// Create IndexedDB migration
const indexedDbMigration = createSchemaMigration('indexeddb', {
  dbName: 'BudgeteerDB'
});

// Create SQLite migration
const sqliteMigration = createSchemaMigration('sqlite', {
  dbPath: 'budgeteer.db'
});

// Run migrations
const result = await migration.migrate(3);
if (result.success) {
  console.log('Applied migrations:', result.appliedMigrations);
}
```

**Features:**
- Version-based migration system
- Up and down migration support
- Schema validation after migration
- Migration history tracking
- IndexedDB and SQLite implementations

## Usage Examples

### Basic CRUD Validation

```typescript
import { validateCRUDOperation } from '@/src/services/storage/schema';

// Validate account creation
const createResult = await validateCRUDOperation(
  'create',
  'Accounts',
  {
    name: 'New Account',
    categoryid: 'cat1',
    balance: 1000,
    currency: 'USD'
  },
  dataProvider
);

// Validate account update
const updateResult = await validateCRUDOperation(
  'update',
  'Accounts',
  { balance: 1500 },
  dataProvider
);

// Validate account deletion
const deleteResult = await validateCRUDOperation(
  'delete',
  'Accounts',
  'account-id',
  dataProvider
);
```

### Schema Compliance Check

```typescript
import { validateSchemaCompliance } from '@/src/services/storage/schema';

try {
  validateSchemaCompliance('Accounts', accountData, 'insert');
  console.log('Schema validation passed');
} catch (error) {
  console.error('Schema validation failed:', error.message);
}
```

### Utility Functions

```typescript
import {
  getTableMetadata,
  getEnumValues,
  isValidTableName
} from '@/src/services/storage/schema';

// Get table metadata
const metadata = getTableMetadata('accounts');
console.log('Required fields:', metadata.requiredFields);

// Get enum values
const accountTypes = getEnumValues('accounttypes');
console.log('Account types:', accountTypes); // ['Asset', 'Liability']

// Validate table name
const isValid = isValidTableName('accounts'); // true
```

## Error Types

### SchemaValidationError
Base error class for schema validation failures.

### RequiredFieldError
Thrown when required fields are missing.

### TypeValidationError
Thrown when field types don't match expected types.

### EnumValidationError
Thrown when enum values are invalid.

### ForeignKeyValidationError
Thrown when foreign key references don't exist.

## Business Rules

### Account Validation
- Account names should be unique within tenant (warning)
- Currency codes must be 3-letter uppercase format
- Negative balances generate warnings

### Transaction Validation
- Transfer transactions must have transfer account
- Transfer account cannot be same as source account
- Zero amounts generate warnings
- Date format validation (ISO format)

### Recurring Transaction Validation
- Next occurrence date should be in future (warning)
- End date must be after next occurrence date
- Recurrence rule format validation

## Integration with Storage Providers

All storage implementations should implement the `ForeignKeyDataProvider` interface:

```typescript
interface ForeignKeyDataProvider {
  recordExists(tableName: string, fieldName: string, value: any): Promise<boolean>;
}
```

This allows the validation utilities to check foreign key constraints across all storage modes.

## Testing

The module includes comprehensive tests:

- `SchemaValidator.test.ts`: Core schema validation tests
- `RuntimeValidator.test.ts`: Runtime validation and business rules tests
- `SchemaMigration.test.ts`: Migration utility tests
- `integration.test.ts`: End-to-end integration tests

Run tests with:
```bash
npm test -- src/services/storage/schema/__tests__ --run
```

## Configuration

### Validation Options

```typescript
interface ValidationOptions {
  skipForeignKeyValidation?: boolean;
  skipTypeValidation?: boolean;
  skipRequiredFieldValidation?: boolean;
  skipEnumValidation?: boolean;
  allowPartialUpdates?: boolean;
}
```

### Migration Configuration

```typescript
// IndexedDB configuration
const indexedDbConfig = {
  dbName: 'BudgeteerDB'
};

// SQLite configuration
const sqliteConfig = {
  dbPath: 'budgeteer.db'
};
```

## Best Practices

1. **Always validate before CRUD operations**: Use `validateCRUDOperation` before performing database operations.

2. **Handle validation errors gracefully**: Check `ValidationResult.isValid` and handle errors appropriately.

3. **Use batch validation for multiple records**: Use `runtimeValidator.validateBatch` for better performance.

4. **Run migrations during application startup**: Ensure local storage schema is up-to-date.

5. **Implement ForeignKeyDataProvider correctly**: Ensure accurate foreign key validation across storage modes.

6. **Monitor validation warnings**: Address warnings to improve data quality.

## Future Enhancements

- Custom validation rules per tenant
- Performance optimization for large datasets
- Additional database backends support
- Real-time schema synchronization
- Advanced migration rollback strategies