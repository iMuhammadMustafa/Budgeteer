/**
 * Tests for Schema Validation Utilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  schemaValidator,
  SchemaValidationError,
  RequiredFieldError,
  TypeValidationError,
  EnumValidationError,
  ForeignKeyValidationError,
  ForeignKeyDataProvider
} from '../SchemaValidator';
import { TableNames } from '@/src/types/db/TableNames';

// Mock data provider for testing
class MockDataProvider implements ForeignKeyDataProvider {
  private mockData: Map<string, Set<string>> = new Map();

  constructor() {
    // Setup mock data for testing
    this.mockData.set('accountcategories', new Set(['cat1', 'cat2', 'cat3']));
    this.mockData.set('accounts', new Set(['acc1', 'acc2', 'acc3']));
    this.mockData.set('transactiongroups', new Set(['group1', 'group2']));
    this.mockData.set('transactioncategories', new Set(['tcat1', 'tcat2']));
  }

  async recordExists(tableName: string, fieldName: string, value: any): Promise<boolean> {
    const tableData = this.mockData.get(tableName);
    return tableData ? tableData.has(value) : false;
  }
}

describe('SchemaValidator', () => {
  let mockDataProvider: MockDataProvider;

  beforeEach(() => {
    mockDataProvider = new MockDataProvider();
  });

  describe('validateInsert', () => {
    it('should validate valid account insert data', () => {
      const validAccountData = {
        name: 'Test Account',
        categoryid: 'cat1',
        balance: 100.50,
        currency: 'USD',
        tenantid: 'tenant1'
      };

      expect(() => {
        schemaValidator.validateInsert('accounts', validAccountData);
      }).not.toThrow();
    });

    it('should throw RequiredFieldError for missing required fields', () => {
      const invalidAccountData = {
        balance: 100.50,
        currency: 'USD'
        // Missing required fields: name, categoryid
      };

      expect(() => {
        schemaValidator.validateInsert('accounts', invalidAccountData);
      }).toThrow(RequiredFieldError);
    });

    it('should throw TypeValidationError for invalid field types', () => {
      const invalidAccountData = {
        name: 'Test Account',
        categoryid: 'cat1',
        balance: 'invalid_number', // Should be number
        currency: 'USD',
        tenantid: 'tenant1'
      };

      expect(() => {
        schemaValidator.validateInsert('accounts', invalidAccountData);
      }).toThrow(TypeValidationError);
    });

    it('should throw EnumValidationError for invalid enum values', () => {
      const invalidAccountCategoryData = {
        name: 'Test Category',
        type: 'InvalidType' // Should be 'Asset' or 'Liability'
      };

      expect(() => {
        schemaValidator.validateInsert('accountcategories', invalidAccountCategoryData);
      }).toThrow(EnumValidationError);
    });
  });

  describe('validateUpdate', () => {
    it('should validate valid account update data', () => {
      const validUpdateData = {
        name: 'Updated Account Name',
        balance: 200.75
      };

      expect(() => {
        schemaValidator.validateUpdate('accounts', validUpdateData);
      }).not.toThrow();
    });

    it('should allow partial updates', () => {
      const partialUpdateData = {
        balance: 300.00
      };

      expect(() => {
        schemaValidator.validateUpdate('accounts', partialUpdateData);
      }).not.toThrow();
    });
  });

  describe('validateForeignKeys', () => {
    it('should validate existing foreign key references', async () => {
      const accountData = {
        name: 'Test Account',
        categoryid: 'cat1', // Exists in mock data
        tenantid: 'tenant1'
      };

      await expect(
        schemaValidator.validateForeignKeys('accounts', accountData, mockDataProvider)
      ).resolves.not.toThrow();
    });

    it('should throw ForeignKeyValidationError for non-existent references', async () => {
      const accountData = {
        name: 'Test Account',
        categoryid: 'nonexistent', // Does not exist in mock data
        tenantid: 'tenant1'
      };

      await expect(
        schemaValidator.validateForeignKeys('accounts', accountData, mockDataProvider)
      ).rejects.toThrow(ForeignKeyValidationError);
    });

    it('should handle optional foreign keys correctly', async () => {
      const transactionData = {
        accountid: 'acc1',
        categoryid: 'tcat1',
        date: '2024-01-01',
        amount: 100,
        transferaccountid: null // Optional field
      };

      await expect(
        schemaValidator.validateForeignKeys('transactions', transactionData, mockDataProvider)
      ).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    it('should return correct table metadata', () => {
      const metadata = schemaValidator.getTableMetadata('accounts');
      expect(metadata).toBeDefined();
      expect(metadata.requiredFields).toContain('name');
      expect(metadata.requiredFields).toContain('categoryid');
    });

    it('should return enum values', () => {
      const accountTypes = schemaValidator.getEnumValues('accounttypes');
      expect(accountTypes).toContain('Asset');
      expect(accountTypes).toContain('Liability');
    });

    it('should validate table names', () => {
      expect(schemaValidator.isValidTableName('accounts')).toBe(true);
      expect(schemaValidator.isValidTableName('invalid_table')).toBe(false);
    });

    it('should validate view names', () => {
      expect(schemaValidator.isValidViewName('transactionsview')).toBe(true);
      expect(schemaValidator.isValidViewName('invalid_view')).toBe(false);
    });

    it('should return all table names', () => {
      const tableNames = schemaValidator.getAllTableNames();
      expect(tableNames).toContain('accounts');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('accountcategories');
    });
  });

  describe('error handling', () => {
    it('should throw SchemaValidationError for unknown table', () => {
      expect(() => {
        schemaValidator.validateInsert('unknown_table' as any, {});
      }).toThrow(SchemaValidationError);
    });

    it('should create proper error messages', () => {
      const error = new RequiredFieldError('accounts', 'name');
      expect(error.message).toContain('Required field \'name\' is missing');
      expect(error.table).toBe('accounts');
      expect(error.field).toBe('name');
    });

    it('should create proper type validation errors', () => {
      const error = new TypeValidationError('accounts', 'balance', 'number', 'invalid');
      expect(error.message).toContain('expected type \'number\'');
      expect(error.table).toBe('accounts');
      expect(error.field).toBe('balance');
      expect(error.value).toBe('invalid');
    });

    it('should create proper enum validation errors', () => {
      const error = new EnumValidationError('accountcategories', 'type', 'Invalid', ['Asset', 'Liability']);
      expect(error.message).toContain('not in allowed enum values');
      expect(error.table).toBe('accountcategories');
      expect(error.field).toBe('type');
      expect(error.value).toBe('Invalid');
    });

    it('should create proper foreign key validation errors', () => {
      const error = new ForeignKeyValidationError('accounts', 'categoryid', 'invalid', 'accountcategories');
      expect(error.message).toContain('does not exist in referenced table');
      expect(error.table).toBe('accounts');
      expect(error.field).toBe('categoryid');
      expect(error.value).toBe('invalid');
    });
  });
});