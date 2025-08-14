/**
 * Integration Tests for Schema Enforcement Utilities
 * 
 * These tests demonstrate how all schema utilities work together
 * to provide comprehensive data validation and migration support.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  schemaValidator,
  runtimeValidator,
  validateCRUDOperation,
  validateSchemaCompliance,
  getTableMetadata,
  getEnumValues,
  isValidTableName,
  ForeignKeyDataProvider
} from '../index';
import { TableNames } from '@/src/types/db/TableNames';

// Mock storage provider that implements ForeignKeyDataProvider
class MockStorageProvider implements ForeignKeyDataProvider {
  private data: Map<string, Map<string, any>> = new Map();

  constructor() {
    // Initialize with some test data
    this.data.set('accountcategories', new Map([
      ['cat1', { id: 'cat1', name: 'Assets', type: 'Asset' }],
      ['cat2', { id: 'cat2', name: 'Liabilities', type: 'Liability' }]
    ]));

    this.data.set('accounts', new Map([
      ['acc1', { id: 'acc1', name: 'Checking', categoryid: 'cat1', balance: 1000 }],
      ['acc2', { id: 'acc2', name: 'Savings', categoryid: 'cat1', balance: 5000 }]
    ]));

    this.data.set('transactiongroups', new Map([
      ['group1', { id: 'group1', name: 'Food', type: 'Expense' }],
      ['group2', { id: 'group2', name: 'Income', type: 'Income' }]
    ]));

    this.data.set('transactioncategories', new Map([
      ['tcat1', { id: 'tcat1', name: 'Groceries', groupid: 'group1', type: 'Expense' }],
      ['tcat2', { id: 'tcat2', name: 'Salary', groupid: 'group2', type: 'Income' }]
    ]));
  }

  async recordExists(tableName: string, fieldName: string, value: any): Promise<boolean> {
    const table = this.data.get(tableName);
    if (!table) return false;
    
    if (fieldName === 'id') {
      return table.has(value);
    }
    
    // For other fields, search through records
    for (const record of table.values()) {
      if (record[fieldName] === value) {
        return true;
      }
    }
    return false;
  }

  // Helper methods for testing
  addRecord(tableName: string, record: any): void {
    if (!this.data.has(tableName)) {
      this.data.set(tableName, new Map());
    }
    this.data.get(tableName)!.set(record.id, record);
  }

  removeRecord(tableName: string, id: string): void {
    this.data.get(tableName)?.delete(id);
  }

  getRecord(tableName: string, id: string): any {
    return this.data.get(tableName)?.get(id);
  }
}

describe('Schema Utilities Integration', () => {
  let mockProvider: MockStorageProvider;

  beforeEach(() => {
    mockProvider = new MockStorageProvider();
  });

  describe('Complete CRUD Validation Workflow', () => {
    it('should validate complete account creation workflow', async () => {
      const newAccount = {
        name: 'New Investment Account',
        categoryid: 'cat1',
        balance: 10000,
        currency: 'USD',
        description: 'Long-term investments',
        tenantid: 'tenant1'
      };

      // Step 1: Schema compliance validation
      expect(() => {
        validateSchemaCompliance('Accounts', newAccount, 'insert');
      }).not.toThrow();

      // Step 2: Runtime validation with business rules
      const validationResult = await validateCRUDOperation(
        'create',
        'Accounts',
        newAccount,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Simulate successful creation
      mockProvider.addRecord('accounts', { ...newAccount, id: 'acc3' });

      // Step 4: Verify record exists
      const exists = await mockProvider.recordExists('accounts', 'id', 'acc3');
      expect(exists).toBe(true);
    });

    it('should validate complete transaction creation workflow', async () => {
      const newTransaction = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-15',
        amount: 50.75,
        type: 'Expense',
        description: 'Grocery shopping',
        payee: 'SuperMarket',
        tenantid: 'tenant1'
      };

      // Schema validation
      expect(() => {
        validateSchemaCompliance('Transactions', newTransaction, 'insert');
      }).not.toThrow();

      // Runtime validation
      const validationResult = await validateCRUDOperation(
        'create',
        'Transactions',
        newTransaction,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should validate transfer transaction workflow', async () => {
      const transferTransaction = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-15',
        amount: 500,
        type: 'Transfer',
        transferaccountid: 'acc2',
        description: 'Transfer to savings',
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Transactions',
        transferTransaction,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });
  });

  describe('Error Detection and Handling', () => {
    it('should detect and report multiple validation errors', async () => {
      const invalidAccount = {
        // Missing required field: name
        categoryid: 'nonexistent', // Invalid foreign key
        balance: 'invalid_number', // Invalid type
        currency: 'INVALID', // Invalid format
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Accounts',
        invalidAccount,
        mockProvider
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(1);
      
      // Should have different types of errors
      const errorCodes = validationResult.errors.map(e => e.code);
      expect(errorCodes).toContain('REQUIRED_FIELD_ERROR');
      expect(errorCodes).toContain('FOREIGN_KEY_VALIDATION_ERROR');
      expect(errorCodes).toContain('INVALID_CURRENCY_FORMAT');
    });

    it('should detect invalid transfer transaction', async () => {
      const invalidTransfer = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-15',
        amount: 100,
        type: 'Transfer',
        transferaccountid: 'acc1', // Same as source account
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Transactions',
        invalidTransfer,
        mockProvider
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.some(e => e.code === 'INVALID_TRANSFER_ACCOUNT')).toBe(true);
    });

    it('should detect missing transfer account for transfer transaction', async () => {
      const incompleteTransfer = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-15',
        amount: 100,
        type: 'Transfer',
        // Missing transferaccountid
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Transactions',
        incompleteTransfer,
        mockProvider
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.some(e => e.code === 'MISSING_TRANSFER_ACCOUNT')).toBe(true);
    });
  });

  describe('Update Validation Workflow', () => {
    it('should validate account updates', async () => {
      const updateData = {
        name: 'Updated Account Name',
        balance: 1500.50,
        description: 'Updated description'
      };

      const validationResult = await validateCRUDOperation(
        'update',
        'Accounts',
        updateData,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    it('should validate partial updates', async () => {
      const partialUpdate = {
        balance: 2000
      };

      const validationResult = await validateCRUDOperation(
        'update',
        'Accounts',
        partialUpdate,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });

    it('should detect invalid updates', async () => {
      const invalidUpdate = {
        categoryid: 'nonexistent', // Invalid foreign key
        currency: 'INVALID' // Invalid format
      };

      const validationResult = await validateCRUDOperation(
        'update',
        'Accounts',
        invalidUpdate,
        mockProvider
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Delete Validation Workflow', () => {
    it('should validate deletion of existing record', async () => {
      const validationResult = await validateCRUDOperation(
        'delete',
        'Accounts',
        'acc1',
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });

    it('should detect deletion of non-existent record', async () => {
      const validationResult = await validateCRUDOperation(
        'delete',
        'Accounts',
        'nonexistent',
        mockProvider
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.some(e => e.code === 'RECORD_NOT_FOUND')).toBe(true);
    });

    it('should warn about dependent records', async () => {
      // Add a transaction that depends on acc1
      mockProvider.addRecord('transactions', {
        id: 'trans1',
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-01',
        amount: 100
      });

      const validationResult = await validateCRUDOperation(
        'delete',
        'Accounts',
        'acc1',
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.warnings.length).toBeGreaterThan(0);
      expect(validationResult.warnings.some(w => w.includes('dependent records'))).toBe(true);
    });
  });

  describe('Utility Functions Integration', () => {
    it('should provide comprehensive table metadata', () => {
      const accountMetadata = getTableMetadata('accounts');
      
      expect(accountMetadata).toBeDefined();
      expect(accountMetadata.requiredFields).toContain('name');
      expect(accountMetadata.requiredFields).toContain('categoryid');
      expect(accountMetadata.relationships).toBeDefined();
      expect(accountMetadata.enums).toBeDefined();
    });

    it('should provide enum values', () => {
      const accountTypes = getEnumValues('accounttypes');
      expect(accountTypes).toContain('Asset');
      expect(accountTypes).toContain('Liability');

      const transactionTypes = getEnumValues('transactiontypes');
      expect(transactionTypes).toContain('Income');
      expect(transactionTypes).toContain('Expense');
      expect(transactionTypes).toContain('Transfer');
    });

    it('should validate table and view names', () => {
      expect(isValidTableName('accounts')).toBe(true);
      expect(isValidTableName('transactions')).toBe(true);
      expect(isValidTableName('invalid_table')).toBe(false);
    });
  });

  describe('Complex Business Scenarios', () => {
    it('should handle recurring transaction validation', async () => {
      const recurringTransaction = {
        name: 'Monthly Rent',
        sourceaccountid: 'acc1',
        categoryid: 'tcat1',
        amount: 1200,
        type: 'Expense',
        recurrencerule: 'FREQ=MONTHLY',
        nextoccurrencedate: '2024-02-01',
        enddate: '2024-12-01',
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Recurrings',
        recurringTransaction,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });

    it('should validate transaction category hierarchy', async () => {
      const newCategory = {
        name: 'Restaurant',
        groupid: 'group1', // Food group
        type: 'Expense',
        budgetamount: 300,
        budgetfrequency: 'monthly',
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'TransactionCategories',
        newCategory,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });

    it('should handle configuration validation', async () => {
      const configuration = {
        key: 'default_currency',
        table: 'accounts',
        type: 'string',
        value: 'USD',
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Configurations',
        configuration,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle batch validation efficiently', async () => {
      const accounts = Array.from({ length: 10 }, (_, i) => ({
        name: `Account ${i}`,
        categoryid: 'cat1',
        balance: i * 100,
        currency: 'USD',
        tenantid: 'tenant1'
      }));

      const results = await runtimeValidator.validateBatch(
        'Accounts',
        accounts,
        'create',
        mockProvider
      );

      expect(results).toHaveLength(10);
      expect(results.every(r => r.isValid)).toBe(true);
    });

    it('should handle null and undefined values correctly', async () => {
      const accountWithNulls = {
        name: 'Test Account',
        categoryid: 'cat1',
        balance: 0,
        description: null, // Allowed null
        notes: undefined, // Allowed undefined
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Accounts',
        accountWithNulls,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
    });

    it('should handle edge case amounts and dates', async () => {
      const edgeCaseTransaction = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-02-29', // Leap year date
        amount: 0.01, // Very small amount
        type: 'Expense',
        tenantid: 'tenant1'
      };

      const validationResult = await validateCRUDOperation(
        'create',
        'Transactions',
        edgeCaseTransaction,
        mockProvider
      );

      expect(validationResult.isValid).toBe(true);
      // Should warn about zero-like amount
      expect(validationResult.warnings.length).toBeGreaterThan(0);
    });
  });
});