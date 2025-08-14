/**
 * Runtime Validation Utilities for CRUD Operations
 * 
 * This module provides runtime validation that can be applied to all CRUD operations
 * across different storage implementations to ensure data integrity.
 */

import { schemaValidator, ForeignKeyDataProvider, SchemaValidationError } from './SchemaValidator';
import { TableNames } from '@/src/types/db/TableNames';
import { Tables, Inserts, Updates } from '@/src/types/db/Tables.Types';

export interface ValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
  warnings: string[];
}

export interface ValidationOptions {
  skipForeignKeyValidation?: boolean;
  skipTypeValidation?: boolean;
  skipRequiredFieldValidation?: boolean;
  skipEnumValidation?: boolean;
  allowPartialUpdates?: boolean;
}

/**
 * Runtime validator that can be used by all storage implementations
 */
export class RuntimeValidator {
  private static instance: RuntimeValidator;

  private constructor() {}

  public static getInstance(): RuntimeValidator {
    if (!RuntimeValidator.instance) {
      RuntimeValidator.instance = new RuntimeValidator();
    }
    return RuntimeValidator.instance;
  }

  /**
   * Validate data before CREATE operation
   */
  public async validateCreate<T extends keyof typeof TableNames>(
    tableName: T,
    data: Inserts<TableNames[T]>,
    dataProvider?: ForeignKeyDataProvider,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic schema validation
      if (!options.skipRequiredFieldValidation || !options.skipTypeValidation || !options.skipEnumValidation) {
        schemaValidator.validateInsert(TableNames[tableName] as any, data);
      }

      // Foreign key validation
      if (!options.skipForeignKeyValidation && dataProvider) {
        await schemaValidator.validateForeignKeys(TableNames[tableName] as any, data, dataProvider);
      }

      // Additional business logic validation
      this.validateBusinessRules(TableNames[tableName], data, 'create', result);

    } catch (error) {
      result.isValid = false;
      if (error instanceof SchemaValidationError) {
        result.errors.push(error);
      } else {
        result.errors.push(new SchemaValidationError(
          error instanceof Error ? error.message : 'Unknown validation error',
          TableNames[tableName]
        ));
      }
    }

    return result;
  }

  /**
   * Validate data before UPDATE operation
   */
  public async validateUpdate<T extends keyof typeof TableNames>(
    tableName: T,
    data: Updates<TableNames[T]>,
    dataProvider?: ForeignKeyDataProvider,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Basic schema validation
      if (!options.skipTypeValidation || !options.skipEnumValidation) {
        schemaValidator.validateUpdate(TableNames[tableName] as any, data);
      }

      // Foreign key validation
      if (!options.skipForeignKeyValidation && dataProvider) {
        await schemaValidator.validateForeignKeys(TableNames[tableName] as any, data, dataProvider);
      }

      // Additional business logic validation
      this.validateBusinessRules(TableNames[tableName], data, 'update', result);

    } catch (error) {
      result.isValid = false;
      if (error instanceof SchemaValidationError) {
        result.errors.push(error);
      } else {
        result.errors.push(new SchemaValidationError(
          error instanceof Error ? error.message : 'Unknown validation error',
          TableNames[tableName]
        ));
      }
    }

    return result;
  }

  /**
   * Validate data before DELETE operation
   */
  public async validateDelete(
    tableName: string,
    id: string,
    dataProvider?: ForeignKeyDataProvider,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if record exists
      if (dataProvider) {
        const exists = await dataProvider.recordExists(tableName, 'id', id);
        if (!exists) {
          result.errors.push(new SchemaValidationError(
            `Record with id '${id}' does not exist in table '${tableName}'`,
            tableName,
            'id',
            id,
            'RECORD_NOT_FOUND'
          ));
          result.isValid = false;
          return result;
        }
      }

      // Check for dependent records that would be affected
      if (!options.skipForeignKeyValidation && dataProvider) {
        await this.validateDeleteConstraints(tableName, id, dataProvider, result);
      }

    } catch (error) {
      result.isValid = false;
      if (error instanceof SchemaValidationError) {
        result.errors.push(error);
      } else {
        result.errors.push(new SchemaValidationError(
          error instanceof Error ? error.message : 'Unknown validation error',
          tableName
        ));
      }
    }

    return result;
  }

  /**
   * Validate business rules specific to each table
   */
  private validateBusinessRules(
    tableName: string,
    data: any,
    operation: 'create' | 'update',
    result: ValidationResult
  ): void {
    switch (tableName) {
      case 'accounts':
        this.validateAccountRules(data, operation, result);
        break;
      case 'transactions':
        this.validateTransactionRules(data, operation, result);
        break;
      case 'transactioncategories':
        this.validateTransactionCategoryRules(data, operation, result);
        break;
      case 'recurrings':
        this.validateRecurringRules(data, operation, result);
        break;
      // Add more table-specific validations as needed
    }
  }

  /**
   * Account-specific business rules
   */
  private validateAccountRules(data: any, operation: string, result: ValidationResult): void {
    // Validate account name uniqueness within tenant (warning)
    if (data.name && data.tenantid) {
      result.warnings.push(`Account name '${data.name}' should be unique within tenant`);
    }

    // Validate balance is not negative for asset accounts
    if (data.balance !== undefined && data.balance < 0) {
      result.warnings.push('Account balance is negative - verify this is intentional');
    }

    // Validate currency code format
    if (data.currency && !/^[A-Z]{3}$/.test(data.currency)) {
      result.errors.push(new SchemaValidationError(
        'Currency code must be a 3-letter uppercase code (e.g., USD, EUR)',
        'accounts',
        'currency',
        data.currency,
        'INVALID_CURRENCY_FORMAT'
      ));
      result.isValid = false;
    }
  }

  /**
   * Transaction-specific business rules
   */
  private validateTransactionRules(data: any, operation: string, result: ValidationResult): void {
    // Validate amount is not zero
    if (data.amount !== undefined && data.amount === 0) {
      result.warnings.push('Transaction amount is zero - verify this is intentional');
    }

    // Validate transfer transactions have transfer account
    if (data.type === 'Transfer' && !data.transferaccountid) {
      result.errors.push(new SchemaValidationError(
        'Transfer transactions must have a transfer account ID',
        'transactions',
        'transferaccountid',
        data.transferaccountid,
        'MISSING_TRANSFER_ACCOUNT'
      ));
      result.isValid = false;
    }

    // Validate transfer account is different from source account
    if (data.transferaccountid && data.accountid && data.transferaccountid === data.accountid) {
      result.errors.push(new SchemaValidationError(
        'Transfer account cannot be the same as source account',
        'transactions',
        'transferaccountid',
        data.transferaccountid,
        'INVALID_TRANSFER_ACCOUNT'
      ));
      result.isValid = false;
    }

    // Validate date format
    if (data.date && !this.isValidDateString(data.date)) {
      result.errors.push(new SchemaValidationError(
        'Date must be in valid ISO format (YYYY-MM-DD)',
        'transactions',
        'date',
        data.date,
        'INVALID_DATE_FORMAT'
      ));
      result.isValid = false;
    }
  }

  /**
   * Transaction category-specific business rules
   */
  private validateTransactionCategoryRules(data: any, operation: string, result: ValidationResult): void {
    // Validate budget amount is not negative
    if (data.budgetamount !== undefined && data.budgetamount < 0) {
      result.warnings.push('Budget amount is negative - verify this is intentional');
    }

    // Validate budget frequency
    if (data.budgetfrequency && !['monthly', 'weekly', 'yearly', 'daily'].includes(data.budgetfrequency.toLowerCase())) {
      result.warnings.push(`Budget frequency '${data.budgetfrequency}' may not be supported`);
    }
  }

  /**
   * Recurring transaction-specific business rules
   */
  private validateRecurringRules(data: any, operation: string, result: ValidationResult): void {
    // Validate next occurrence date is in the future
    if (data.nextoccurrencedate) {
      const nextDate = new Date(data.nextoccurrencedate);
      const now = new Date();
      if (nextDate <= now) {
        result.warnings.push('Next occurrence date is in the past or present');
      }
    }

    // Validate end date is after next occurrence date
    if (data.enddate && data.nextoccurrencedate) {
      const endDate = new Date(data.enddate);
      const nextDate = new Date(data.nextoccurrencedate);
      if (endDate <= nextDate) {
        result.errors.push(new SchemaValidationError(
          'End date must be after next occurrence date',
          'recurrings',
          'enddate',
          data.enddate,
          'INVALID_END_DATE'
        ));
        result.isValid = false;
      }
    }

    // Validate recurrence rule format (basic validation)
    if (data.recurrencerule && !data.recurrencerule.startsWith('FREQ=')) {
      result.warnings.push('Recurrence rule format may be invalid - should start with FREQ=');
    }
  }

  /**
   * Validate delete constraints to prevent orphaned records
   */
  private async validateDeleteConstraints(
    tableName: string,
    id: string,
    dataProvider: ForeignKeyDataProvider,
    result: ValidationResult
  ): Promise<void> {
    const dependentTables = this.getDependentTables(tableName);
    
    for (const { table, field } of dependentTables) {
      const hasDependent = await dataProvider.recordExists(table, field, id);
      if (hasDependent) {
        result.warnings.push(
          `Deleting this ${tableName} record may affect dependent records in ${table} table`
        );
      }
    }
  }

  /**
   * Get tables that depend on the given table
   */
  private getDependentTables(tableName: string): Array<{ table: string; field: string }> {
    const dependencies: Record<string, Array<{ table: string; field: string }>> = {
      'accounts': [
        { table: 'transactions', field: 'accountid' },
        { table: 'transactions', field: 'transferaccountid' },
        { table: 'recurrings', field: 'sourceaccountid' }
      ],
      'accountcategories': [
        { table: 'accounts', field: 'categoryid' }
      ],
      'transactiongroups': [
        { table: 'transactioncategories', field: 'groupid' }
      ],
      'transactioncategories': [
        { table: 'transactions', field: 'categoryid' },
        { table: 'recurrings', field: 'categoryid' }
      ],
      'transactions': [
        { table: 'transactions', field: 'transferid' }
      ]
    };

    return dependencies[tableName] || [];
  }

  /**
   * Utility method to validate date strings
   */
  private isValidDateString(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}/);
  }

  /**
   * Batch validation for multiple records
   */
  public async validateBatch<T extends keyof typeof TableNames>(
    tableName: T,
    records: Array<Inserts<TableNames[T]> | Updates<TableNames[T]>>,
    operation: 'create' | 'update',
    dataProvider?: ForeignKeyDataProvider,
    options: ValidationOptions = {}
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const record of records) {
      if (operation === 'create') {
        const result = await this.validateCreate(tableName, record as Inserts<TableNames[T]>, dataProvider, options);
        results.push(result);
      } else {
        const result = await this.validateUpdate(tableName, record as Updates<TableNames[T]>, dataProvider, options);
        results.push(result);
      }
    }

    return results;
  }
}

// Export singleton instance
export const runtimeValidator = RuntimeValidator.getInstance();