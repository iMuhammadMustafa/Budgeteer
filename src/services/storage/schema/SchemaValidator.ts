/**
 * Database Schema Enforcement Utilities
 * 
 * This module provides comprehensive schema validation utilities that work with database.types.ts
 * to ensure data integrity across all storage implementations (Supabase, Mock, Local).
 */

import { Database } from '@/src/types/db/database.types';
import { TableNames, ViewNames } from '@/src/types/db/TableNames';

// Type utilities for schema validation
export type TableName = keyof Database['public']['Tables'];
export type ViewName = keyof Database['public']['Views'];
export type EnumName = keyof Database['public']['Enums'];

export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];
export type TableRelationships<T extends TableName> = Database['public']['Tables'][T]['Relationships'];

// Schema validation error types
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public table: string,
    public field?: string,
    public value?: any,
    public code: string = 'SCHEMA_VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export class RequiredFieldError extends SchemaValidationError {
  constructor(table: string, field: string) {
    super(`Required field '${field}' is missing`, table, field, undefined, 'REQUIRED_FIELD_ERROR');
  }
}

export class TypeValidationError extends SchemaValidationError {
  constructor(table: string, field: string, expectedType: string, actualValue: any) {
    super(
      `Field '${field}' expected type '${expectedType}' but got '${typeof actualValue}'`,
      table,
      field,
      actualValue,
      'TYPE_VALIDATION_ERROR'
    );
  }
}

export class EnumValidationError extends SchemaValidationError {
  constructor(table: string, field: string, value: any, allowedValues: string[]) {
    super(
      `Field '${field}' value '${value}' is not in allowed enum values: [${allowedValues.join(', ')}]`,
      table,
      field,
      value,
      'ENUM_VALIDATION_ERROR'
    );
  }
}

export class ForeignKeyValidationError extends SchemaValidationError {
  constructor(table: string, field: string, value: any, referencedTable: string) {
    super(
      `Foreign key '${field}' value '${value}' does not exist in referenced table '${referencedTable}'`,
      table,
      field,
      value,
      'FOREIGN_KEY_VALIDATION_ERROR'
    );
  }
}

/**
 * Core schema validator class that provides comprehensive validation utilities
 */
export class SchemaValidator {
  private static instance: SchemaValidator;
  
  // Cache for enum values to avoid repeated lookups
  private enumCache = new Map<string, string[]>();
  
  // Schema metadata extracted from database types
  private schemaMetadata: Map<string, any> = new Map();

  private constructor() {
    this.initializeSchemaMetadata();
  }

  public static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  /**
   * Initialize schema metadata from database types
   */
  private initializeSchemaMetadata(): void {
    // Initialize enum values
    this.enumCache.set('accounttypes', ['Asset', 'Liability']);
    this.enumCache.set('transactionstatuses', ['Clear', 'Void']);
    this.enumCache.set('transactiontypes', ['Income', 'Expense', 'Transfer']);
    
    // Initialize table metadata with required fields and relationships
    this.schemaMetadata.set('accounts', {
      requiredFields: ['name', 'categoryid'],
      relationships: [
        { field: 'categoryid', referencedTable: 'accountcategories', referencedField: 'id' }
      ],
      enums: [
        { field: 'type', enumName: 'accounttypes' }
      ]
    });

    this.schemaMetadata.set('accountcategories', {
      requiredFields: ['name'],
      relationships: [],
      enums: [
        { field: 'type', enumName: 'accounttypes' }
      ]
    });

    this.schemaMetadata.set('transactions', {
      requiredFields: ['accountid', 'categoryid', 'date'],
      relationships: [
        { field: 'accountid', referencedTable: 'accounts', referencedField: 'id' },
        { field: 'categoryid', referencedTable: 'transactioncategories', referencedField: 'id' },
        { field: 'transferaccountid', referencedTable: 'accounts', referencedField: 'id', optional: true },
        { field: 'transferid', referencedTable: 'transactions', referencedField: 'id', optional: true }
      ],
      enums: [
        { field: 'type', enumName: 'transactiontypes' }
      ]
    });

    this.schemaMetadata.set('transactioncategories', {
      requiredFields: ['groupid'],
      relationships: [
        { field: 'groupid', referencedTable: 'transactiongroups', referencedField: 'id' }
      ],
      enums: [
        { field: 'type', enumName: 'transactiontypes' }
      ]
    });

    this.schemaMetadata.set('transactiongroups', {
      requiredFields: ['name'],
      relationships: [],
      enums: [
        { field: 'type', enumName: 'transactiontypes' }
      ]
    });

    this.schemaMetadata.set('configurations', {
      requiredFields: ['key', 'table', 'type', 'value'],
      relationships: [],
      enums: []
    });

    this.schemaMetadata.set('recurrings', {
      requiredFields: ['name', 'nextoccurrencedate', 'recurrencerule', 'sourceaccountid', 'tenantid'],
      relationships: [
        { field: 'sourceaccountid', referencedTable: 'accounts', referencedField: 'id' },
        { field: 'categoryid', referencedTable: 'transactioncategories', referencedField: 'id', optional: true }
      ],
      enums: [
        { field: 'type', enumName: 'transactiontypes' }
      ]
    });
  }

  /**
   * Validate a record for insert operation
   */
  public validateInsert<T extends TableName>(
    tableName: T,
    data: TableInsert<T>
  ): void {
    this.validateRecord(tableName, data, 'insert');
  }

  /**
   * Validate a record for update operation
   */
  public validateUpdate<T extends TableName>(
    tableName: T,
    data: TableUpdate<T>
  ): void {
    this.validateRecord(tableName, data, 'update');
  }

  /**
   * Core validation logic for records
   */
  private validateRecord<T extends TableName>(
    tableName: T,
    data: TableInsert<T> | TableUpdate<T>,
    operation: 'insert' | 'update'
  ): void {
    const tableNameStr = tableName as string;
    const metadata = this.schemaMetadata.get(tableNameStr);
    
    if (!metadata) {
      throw new SchemaValidationError(`Unknown table: ${tableNameStr}`, tableNameStr);
    }

    // Validate required fields (only for insert operations)
    if (operation === 'insert') {
      this.validateRequiredFields(tableNameStr, data, metadata.requiredFields);
    }

    // Validate field types
    this.validateFieldTypes(tableNameStr, data);

    // Validate enum values
    this.validateEnumFields(tableNameStr, data, metadata.enums);
  }

  /**
   * Validate required fields are present
   */
  private validateRequiredFields(
    tableName: string,
    data: any,
    requiredFields: string[]
  ): void {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new RequiredFieldError(tableName, field);
      }
    }
  }

  /**
   * Validate field types match expected types
   */
  private validateFieldTypes(tableName: string, data: any): void {
    // Basic type validation - this could be expanded based on specific needs
    for (const [field, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;

      // Validate common field patterns
      if (field.endsWith('id') && typeof value !== 'string') {
        throw new TypeValidationError(tableName, field, 'string', value);
      }
      
      if (field === 'amount' && typeof value !== 'number') {
        throw new TypeValidationError(tableName, field, 'number', value);
      }
      
      if (field === 'balance' && typeof value !== 'number') {
        throw new TypeValidationError(tableName, field, 'number', value);
      }
      
      if (field.includes('date') && typeof value !== 'string') {
        throw new TypeValidationError(tableName, field, 'string (ISO date)', value);
      }
      
      if (field.startsWith('is') && typeof value !== 'boolean') {
        throw new TypeValidationError(tableName, field, 'boolean', value);
      }
    }
  }

  /**
   * Validate enum field values
   */
  private validateEnumFields(
    tableName: string,
    data: any,
    enumFields: Array<{ field: string; enumName: string }>
  ): void {
    for (const { field, enumName } of enumFields) {
      const value = data[field];
      if (value === null || value === undefined) continue;

      const allowedValues = this.enumCache.get(enumName);
      if (!allowedValues) {
        throw new SchemaValidationError(`Unknown enum: ${enumName}`, tableName, field, value);
      }

      if (!allowedValues.includes(value)) {
        throw new EnumValidationError(tableName, field, value, allowedValues);
      }
    }
  }

  /**
   * Validate foreign key relationships
   * This method should be called with access to the data provider to check referenced records
   */
  public async validateForeignKeys<T extends TableName>(
    tableName: T,
    data: TableInsert<T> | TableUpdate<T>,
    dataProvider: ForeignKeyDataProvider
  ): Promise<void> {
    const tableNameStr = tableName as string;
    const metadata = this.schemaMetadata.get(tableNameStr);
    
    if (!metadata) return;

    for (const relationship of metadata.relationships) {
      const { field, referencedTable, referencedField, optional } = relationship;
      const value = (data as any)[field];

      // Skip validation if field is optional and not provided
      if (optional && (value === null || value === undefined)) {
        continue;
      }

      // Skip if value is not provided (will be caught by required field validation)
      if (value === null || value === undefined) {
        continue;
      }

      // Check if referenced record exists
      const exists = await dataProvider.recordExists(referencedTable, referencedField, value);
      if (!exists) {
        throw new ForeignKeyValidationError(tableNameStr, field, value, referencedTable);
      }
    }
  }

  /**
   * Get table schema metadata
   */
  public getTableMetadata(tableName: string): any {
    return this.schemaMetadata.get(tableName);
  }

  /**
   * Get enum values for a specific enum
   */
  public getEnumValues(enumName: string): string[] {
    return this.enumCache.get(enumName) || [];
  }

  /**
   * Validate that a table name is valid
   */
  public isValidTableName(tableName: string): boolean {
    return Object.values(TableNames).includes(tableName as any);
  }

  /**
   * Validate that a view name is valid
   */
  public isValidViewName(viewName: string): boolean {
    return Object.values(ViewNames).includes(viewName as any);
  }

  /**
   * Get all table names
   */
  public getAllTableNames(): string[] {
    return Object.values(TableNames);
  }

  /**
   * Get all view names
   */
  public getAllViewNames(): string[] {
    return Object.values(ViewNames);
  }
}

/**
 * Interface for data providers to implement foreign key validation
 */
export interface ForeignKeyDataProvider {
  recordExists(tableName: string, fieldName: string, value: any): Promise<boolean>;
}

// Export singleton instance
export const schemaValidator = SchemaValidator.getInstance();