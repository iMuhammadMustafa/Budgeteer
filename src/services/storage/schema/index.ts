/**
 * Database Schema Enforcement Utilities
 * 
 * This module provides comprehensive schema validation, runtime validation,
 * and migration utilities for all storage implementations.
 */

import { ForeignKeyDataProvider, ValidationOptions, ValidationResult } from '../validation/types';
import { TableName } from './SchemaValidator';

// Core schema validation
export {
  SchemaValidator,
  schemaValidator,
  SchemaValidationError,
  RequiredFieldError,
  TypeValidationError,
  EnumValidationError,
  ForeignKeyValidationError,
  type TableName,
  type ViewName,
  type EnumName,
  type TableRow,
  type TableInsert,
  type TableUpdate,
  type TableRelationships
} from './SchemaValidator';

// Runtime validation for CRUD operations
export {
  RuntimeValidator,
  runtimeValidator
} from './RuntimeValidator';

// Validation types
export type {
  ValidationResult,
  ValidationOptions,
  ForeignKeyDataProvider
} from '../validation/types';

// Schema migration utilities
export {
  SchemaMigrationBase,
  IndexedDBMigration,
  SQLiteMigration,
  createSchemaMigration,
  type MigrationScript,
  type SchemaVersion,
  type MigrationResult
} from './SchemaMigration';

/**
 * Utility function to validate data before any CRUD operation
 */
export async function validateCRUDOperation<T extends TableName>(
  operation: 'create' | 'update' | 'delete',
  tableName: T,
  data: any,
  dataProvider?: ForeignKeyDataProvider,
  options?: ValidationOptions
): Promise<ValidationResult> {
  const { runtimeValidator: validator } = require('./RuntimeValidator');
  
  switch (operation) {
    case 'create':
      return await validator.validateCreate(tableName, data, dataProvider, options);
    case 'update':
      return await validator.validateUpdate(tableName, data, dataProvider, options);
    case 'delete':
      return await validator.validateDelete(tableName as string, data, dataProvider, options);
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Utility function to validate schema compliance
 */
export function validateSchemaCompliance<T extends TableName>(
  tableName: T,
  data: any,
  operation: 'insert' | 'update'
): void {
  const { schemaValidator: validator } = require('./SchemaValidator');
  
  if (operation === 'insert') {
    validator.validateInsert(tableName, data);
  } else {
    validator.validateUpdate(tableName, data);
  }
}

/**
 * Utility function to get table metadata
 */
export function getTableMetadata(tableName: string) {
  const { schemaValidator } = require('./SchemaValidator');
  return schemaValidator.getTableMetadata(tableName);
}

/**
 * Utility function to get enum values
 */
export function getEnumValues(enumName: string): string[] {
  const { schemaValidator } = require('./SchemaValidator');
  return schemaValidator.getEnumValues(enumName);
}

/**
 * Utility function to validate table name
 */
export function isValidTableName(tableName: string): boolean {
  const { schemaValidator } = require('./SchemaValidator');
  return schemaValidator.isValidTableName(tableName);
}

/**
 * Utility function to validate view name
 */
export function isValidViewName(viewName: string): boolean {
  const { schemaValidator } = require('./SchemaValidator');
  return schemaValidator.isValidViewName(viewName);
}