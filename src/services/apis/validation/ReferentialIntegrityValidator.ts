/**
 * Referential Integrity Validation System
 * 
 * This module provides comprehensive referential integrity validation
 * that works across all storage implementations (Supabase, Mock, Local).
 * It enforces foreign key constraints and business rules defined in the database schema.
 */

import { Database } from "@/src/types/db/database.types";

// Type definitions for better type safety
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

// Extract row types for each table
type AccountRow = Tables['accounts']['Row'];
type AccountCategoryRow = Tables['accountcategories']['Row'];
type TransactionRow = Tables['transactions']['Row'];
type TransactionCategoryRow = Tables['transactioncategories']['Row'];
type TransactionGroupRow = Tables['transactiongroups']['Row'];
type RecurringRow = Tables['recurrings']['Row'];
type ConfigurationRow = Tables['configurations']['Row'];

// Custom error types for referential integrity violations
export class ReferentialIntegrityError extends Error {
  constructor(
    public readonly table: string,
    public readonly field: string,
    public readonly value: string,
    public readonly referencedTable: string
  ) {
    super(`Foreign key constraint violation: ${table}.${field} = '${value}' does not exist in ${referencedTable}`);
    this.name = 'ReferentialIntegrityError';
  }
}

export class ConstraintViolationError extends Error {
  constructor(
    message: string,
    public readonly constraint: string,
    public readonly table: string
  ) {
    super(message);
    this.name = 'ConstraintViolationError';
  }
}

export class CascadeDeleteError extends Error {
  constructor(
    public readonly table: string,
    public readonly id: string,
    public readonly dependentTable: string,
    public readonly dependentCount: number
  ) {
    super(`Cannot delete ${table} '${id}': ${dependentCount} dependent records exist in ${dependentTable}`);
    this.name = 'CascadeDeleteError';
  }
}

// Interface for data providers to implement
export interface IDataProvider {
  // Core data access methods
  getAccountCategories(tenantId: string): Promise<AccountCategoryRow[]>;
  getAccounts(tenantId: string): Promise<AccountRow[]>;
  getTransactions(tenantId: string): Promise<TransactionRow[]>;
  getTransactionCategories(tenantId: string): Promise<TransactionCategoryRow[]>;
  getTransactionGroups(tenantId: string): Promise<TransactionGroupRow[]>;
  getRecurrings(tenantId: string): Promise<RecurringRow[]>;
  getConfigurations(tenantId: string): Promise<ConfigurationRow[]>;
  
  // Single record access methods
  getAccountCategoryById(id: string): Promise<AccountCategoryRow | null>;
  getAccountById(id: string): Promise<AccountRow | null>;
  getTransactionById(id: string): Promise<TransactionRow | null>;
  getTransactionCategoryById(id: string): Promise<TransactionCategoryRow | null>;
  getTransactionGroupById(id: string): Promise<TransactionGroupRow | null>;
  getRecurringById(id: string): Promise<RecurringRow | null>;
  getConfigurationById(id: string): Promise<ConfigurationRow | null>;
}

// Foreign key relationship definitions based on database schema
export const FOREIGN_KEY_RELATIONSHIPS = {
  accounts: {
    categoryid: { table: 'accountcategories', column: 'id' }
  },
  transactions: {
    accountid: { table: 'accounts', column: 'id' },
    categoryid: { table: 'transactioncategories', column: 'id' },
    transferaccountid: { table: 'accounts', column: 'id', nullable: true },
    transferid: { table: 'transactions', column: 'id', nullable: true }
  },
  transactioncategories: {
    groupid: { table: 'transactiongroups', column: 'id' }
  },
  recurrings: {
    sourceaccountid: { table: 'accounts', column: 'id' },
    categoryid: { table: 'transactioncategories', column: 'id', nullable: true }
  }
} as const;

// Unique constraint definitions
export const UNIQUE_CONSTRAINTS = {
  accounts: [
    { fields: ['name', 'tenantid'], name: 'unique_account_name_per_tenant' }
  ],
  accountcategories: [
    { fields: ['name', 'tenantid'], name: 'unique_account_category_name_per_tenant' }
  ],
  transactioncategories: [
    { fields: ['name', 'tenantid'], name: 'unique_transaction_category_name_per_tenant' }
  ],
  transactiongroups: [
    { fields: ['name', 'tenantid'], name: 'unique_transaction_group_name_per_tenant' }
  ],
  configurations: [
    { fields: ['key', 'table', 'tenantid'], name: 'unique_configuration_key_per_table_tenant' }
  ]
} as const;

/**
 * Main referential integrity validator class
 */
export class ReferentialIntegrityValidator {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Validate foreign key constraints for a record before create/update
   */
  async validateForeignKeys<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    const relationships = FOREIGN_KEY_RELATIONSHIPS[tableName as keyof typeof FOREIGN_KEY_RELATIONSHIPS];
    
    if (!relationships) {
      return; // No foreign key constraints for this table
    }

    for (const [fieldName, constraint] of Object.entries(relationships)) {
      const fieldValue = (record as any)[fieldName];
      
      // Skip validation if field is null/undefined and constraint allows nulls
      if ((fieldValue === null || fieldValue === undefined) && constraint.nullable) {
        continue;
      }
      
      // Skip validation if field is not being set
      if (fieldValue === undefined) {
        continue;
      }

      // Validate the foreign key reference
      await this.validateForeignKeyReference(
        tableName,
        fieldName,
        fieldValue,
        constraint.table,
        constraint.column,
        tenantId
      );
    }
  }

  /**
   * Validate a single foreign key reference
   */
  private async validateForeignKeyReference(
    sourceTable: string,
    sourceField: string,
    value: string,
    targetTable: string,
    targetField: string,
    tenantId: string
  ): Promise<void> {
    let referencedRecord: any = null;

    // Get the referenced record based on target table
    switch (targetTable) {
      case 'accountcategories':
        referencedRecord = await this.dataProvider.getAccountCategoryById(value);
        break;
      case 'accounts':
        referencedRecord = await this.dataProvider.getAccountById(value);
        break;
      case 'transactioncategories':
        referencedRecord = await this.dataProvider.getTransactionCategoryById(value);
        break;
      case 'transactiongroups':
        referencedRecord = await this.dataProvider.getTransactionGroupById(value);
        break;
      case 'transactions':
        referencedRecord = await this.dataProvider.getTransactionById(value);
        break;
      case 'recurrings':
        referencedRecord = await this.dataProvider.getRecurringById(value);
        break;
      default:
        throw new Error(`Unknown target table: ${targetTable}`);
    }

    // Check if referenced record exists and is not deleted
    if (!referencedRecord || referencedRecord.isdeleted) {
      throw new ReferentialIntegrityError(sourceTable, sourceField, value, targetTable);
    }

    // Validate tenant isolation (referenced record must belong to same tenant)
    if (referencedRecord.tenantid && referencedRecord.tenantid !== tenantId) {
      throw new ReferentialIntegrityError(sourceTable, sourceField, value, targetTable);
    }
  }

  /**
   * Validate unique constraints for a record before create/update
   */
  async validateUniqueConstraints<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string,
    excludeId?: string
  ): Promise<void> {
    const constraints = UNIQUE_CONSTRAINTS[tableName as keyof typeof UNIQUE_CONSTRAINTS];
    
    if (!constraints) {
      return; // No unique constraints for this table
    }

    for (const constraint of constraints) {
      await this.validateUniqueConstraint(tableName, record, constraint, tenantId, excludeId);
    }
  }

  /**
   * Validate a single unique constraint
   */
  private async validateUniqueConstraint<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    constraint: { fields: string[]; name: string },
    tenantId: string,
    excludeId?: string
  ): Promise<void> {
    // Build the constraint values
    const constraintValues: Record<string, any> = {};
    let hasAllFields = true;

    for (const field of constraint.fields) {
      const value = (record as any)[field];
      if (value === undefined) {
        hasAllFields = false;
        break;
      }
      constraintValues[field] = value;
    }

    // Skip validation if not all constraint fields are provided
    if (!hasAllFields) {
      return;
    }

    // Get all records of this table type to check for duplicates
    let allRecords: any[] = [];
    
    switch (tableName) {
      case 'accounts':
        allRecords = await this.dataProvider.getAccounts(tenantId);
        break;
      case 'accountcategories':
        allRecords = await this.dataProvider.getAccountCategories(tenantId);
        break;
      case 'transactioncategories':
        allRecords = await this.dataProvider.getTransactionCategories(tenantId);
        break;
      case 'transactiongroups':
        allRecords = await this.dataProvider.getTransactionGroups(tenantId);
        break;
      case 'configurations':
        allRecords = await this.dataProvider.getConfigurations(tenantId);
        break;
      default:
        return; // No unique constraints validation for this table
    }

    // Check for existing record with same constraint values
    const existingRecord = allRecords.find(existing => {
      // Skip deleted records and the record being updated
      if (existing.isdeleted || existing.id === excludeId) {
        return false;
      }

      // Check if all constraint fields match
      return constraint.fields.every(field => existing[field] === constraintValues[field]);
    });

    if (existingRecord) {
      const fieldValues = constraint.fields.map(field => `${field}='${constraintValues[field]}'`).join(', ');
      throw new ConstraintViolationError(
        `Unique constraint violation: ${fieldValues} already exists`,
        constraint.name,
        tableName
      );
    }
  }

  /**
   * Check if a record can be deleted (no dependent records exist)
   */
  async validateCascadeDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    switch (tableName) {
      case 'accountcategories':
        await this.validateAccountCategoryDelete(recordId, tenantId);
        break;
      case 'accounts':
        await this.validateAccountDelete(recordId, tenantId);
        break;
      case 'transactiongroups':
        await this.validateTransactionGroupDelete(recordId, tenantId);
        break;
      case 'transactioncategories':
        await this.validateTransactionCategoryDelete(recordId, tenantId);
        break;
      case 'transactions':
        await this.validateTransactionDelete(recordId, tenantId);
        break;
      default:
        // No cascade delete validation needed for this table
        break;
    }
  }

  /**
   * Validate account category can be deleted
   */
  private async validateAccountCategoryDelete(categoryId: string, tenantId: string): Promise<void> {
    const accounts = await this.dataProvider.getAccounts(tenantId);
    const dependentAccounts = accounts.filter(acc => acc.categoryid === categoryId && !acc.isdeleted);
    
    if (dependentAccounts.length > 0) {
      throw new CascadeDeleteError('accountcategories', categoryId, 'accounts', dependentAccounts.length);
    }
  }

  /**
   * Validate account can be deleted
   */
  private async validateAccountDelete(accountId: string, tenantId: string): Promise<void> {
    const transactions = await this.dataProvider.getTransactions(tenantId);
    const recurrings = await this.dataProvider.getRecurrings(tenantId);
    
    const dependentTransactions = transactions.filter(tr => 
      (tr.accountid === accountId || tr.transferaccountid === accountId) && !tr.isdeleted
    );
    
    const dependentRecurrings = recurrings.filter(rec => 
      rec.sourceaccountid === accountId && !rec.isdeleted
    );
    
    if (dependentTransactions.length > 0) {
      throw new CascadeDeleteError('accounts', accountId, 'transactions', dependentTransactions.length);
    }
    
    if (dependentRecurrings.length > 0) {
      throw new CascadeDeleteError('accounts', accountId, 'recurrings', dependentRecurrings.length);
    }
  }

  /**
   * Validate transaction group can be deleted
   */
  private async validateTransactionGroupDelete(groupId: string, tenantId: string): Promise<void> {
    const categories = await this.dataProvider.getTransactionCategories(tenantId);
    const dependentCategories = categories.filter(cat => cat.groupid === groupId && !cat.isdeleted);
    
    if (dependentCategories.length > 0) {
      throw new CascadeDeleteError('transactiongroups', groupId, 'transactioncategories', dependentCategories.length);
    }
  }

  /**
   * Validate transaction category can be deleted
   */
  private async validateTransactionCategoryDelete(categoryId: string, tenantId: string): Promise<void> {
    const transactions = await this.dataProvider.getTransactions(tenantId);
    const recurrings = await this.dataProvider.getRecurrings(tenantId);
    
    const dependentTransactions = transactions.filter(tr => tr.categoryid === categoryId && !tr.isdeleted);
    const dependentRecurrings = recurrings.filter(rec => rec.categoryid === categoryId && !rec.isdeleted);
    
    if (dependentTransactions.length > 0) {
      throw new CascadeDeleteError('transactioncategories', categoryId, 'transactions', dependentTransactions.length);
    }
    
    if (dependentRecurrings.length > 0) {
      throw new CascadeDeleteError('transactioncategories', categoryId, 'recurrings', dependentRecurrings.length);
    }
  }

  /**
   * Validate transaction can be deleted
   */
  private async validateTransactionDelete(transactionId: string, tenantId: string): Promise<void> {
    const transactions = await this.dataProvider.getTransactions(tenantId);
    const dependentTransactions = transactions.filter(tr => tr.transferid === transactionId && !tr.isdeleted);
    
    if (dependentTransactions.length > 0) {
      throw new CascadeDeleteError('transactions', transactionId, 'transactions', dependentTransactions.length);
    }
  }

  /**
   * Comprehensive validation for create operations
   */
  async validateCreate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    tenantId: string
  ): Promise<void> {
    await this.validateForeignKeys(tableName, record, tenantId);
    await this.validateUniqueConstraints(tableName, record, tenantId);
  }

  /**
   * Comprehensive validation for update operations
   */
  async validateUpdate<T extends TableName>(
    tableName: T,
    record: Partial<Tables[T]['Row']>,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    await this.validateForeignKeys(tableName, record, tenantId);
    await this.validateUniqueConstraints(tableName, record, tenantId, recordId);
  }

  /**
   * Comprehensive validation for delete operations
   */
  async validateDelete<T extends TableName>(
    tableName: T,
    recordId: string,
    tenantId: string
  ): Promise<void> {
    await this.validateCascadeDelete(tableName, recordId, tenantId);
  }
}