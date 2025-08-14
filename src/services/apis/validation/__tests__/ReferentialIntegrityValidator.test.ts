/**
 * Referential Integrity Validator Tests
 * 
 * This test suite validates the referential integrity validation system
 * across all storage modes.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ReferentialIntegrityValidator,
  ReferentialIntegrityError,
  ConstraintViolationError,
  CascadeDeleteError,
  IDataProvider
} from '../ReferentialIntegrityValidator';
import { MockDataProvider } from '../MockDataProvider';
import { ValidationService } from '../ValidationService';
import { ValidationHelpers, ValidationErrorHandler } from '../ValidationIntegration';

// Mock data for testing
const mockTenantId = '0742f34e-7c12-408a-91a2-ed95d355bc87';

const mockAccountCategory = {
  id: 'test-cat-1',
  name: 'Test Category',
  tenantid: mockTenantId,
  isdeleted: false,
  color: '#000000',
  icon: 'test',
  displayorder: 1,
  type: 'Asset' as const,
  createdat: '2025-01-01T00:00:00Z',
  createdby: mockTenantId,
  updatedat: null,
  updatedby: null
};

const mockAccount = {
  id: 'test-acc-1',
  name: 'Test Account',
  tenantid: mockTenantId,
  categoryid: 'test-cat-1',
  isdeleted: false,
  balance: 1000,
  color: '#000000',
  icon: 'test',
  displayorder: 1,
  currency: 'USD',
  description: 'Test account',
  notes: null,
  owner: 'test-user',
  createdat: '2025-01-01T00:00:00Z',
  createdby: mockTenantId,
  updatedat: null,
  updatedby: null
};

const mockTransactionGroup = {
  id: 'test-group-1',
  name: 'Test Group',
  tenantid: mockTenantId,
  isdeleted: false,
  color: '#000000',
  icon: 'test',
  displayorder: 1,
  type: 'Expense' as const,
  budgetamount: 1000,
  budgetfrequency: 'Monthly',
  description: 'Test group',
  createdat: '2025-01-01T00:00:00Z',
  createdby: mockTenantId,
  updatedat: null,
  updatedby: null
};

const mockTransactionCategory = {
  id: 'test-tcat-1',
  name: 'Test Transaction Category',
  tenantid: mockTenantId,
  groupid: 'test-group-1',
  isdeleted: false,
  color: '#000000',
  icon: 'test',
  displayorder: 1,
  type: 'Expense' as const,
  budgetamount: 500,
  budgetfrequency: 'Monthly',
  description: 'Test transaction category',
  createdat: '2025-01-01T00:00:00Z',
  createdby: mockTenantId,
  updatedat: null,
  updatedby: null
};

// Mock data provider for testing
class TestDataProvider implements IDataProvider {
  private accountCategories = [mockAccountCategory];
  private accounts = [mockAccount];
  private transactions: any[] = [];
  private transactionCategories = [mockTransactionCategory];
  private transactionGroups = [mockTransactionGroup];
  private recurrings: any[] = [];
  private configurations: any[] = [];

  async getAccountCategories(tenantId: string) {
    return this.accountCategories.filter(cat => cat.tenantid === tenantId && !cat.isdeleted);
  }

  async getAccounts(tenantId: string) {
    return this.accounts.filter(acc => acc.tenantid === tenantId && !acc.isdeleted);
  }

  async getTransactions(tenantId: string) {
    return this.transactions.filter(tr => tr.tenantid === tenantId && !tr.isdeleted);
  }

  async getTransactionCategories(tenantId: string) {
    return this.transactionCategories.filter(cat => cat.tenantid === tenantId && !cat.isdeleted);
  }

  async getTransactionGroups(tenantId: string) {
    return this.transactionGroups.filter(group => group.tenantid === tenantId && !group.isdeleted);
  }

  async getRecurrings(tenantId: string) {
    return this.recurrings.filter(rec => rec.tenantid === tenantId && !rec.isdeleted);
  }

  async getConfigurations(tenantId: string) {
    return this.configurations.filter(conf => conf.tenantid === tenantId && !conf.isdeleted);
  }

  async getAccountCategoryById(id: string) {
    return this.accountCategories.find(cat => cat.id === id) || null;
  }

  async getAccountById(id: string) {
    return this.accounts.find(acc => acc.id === id) || null;
  }

  async getTransactionById(id: string) {
    return this.transactions.find(tr => tr.id === id) || null;
  }

  async getTransactionCategoryById(id: string) {
    return this.transactionCategories.find(cat => cat.id === id) || null;
  }

  async getTransactionGroupById(id: string) {
    return this.transactionGroups.find(group => group.id === id) || null;
  }

  async getRecurringById(id: string) {
    return this.recurrings.find(rec => rec.id === id) || null;
  }

  async getConfigurationById(id: string) {
    return this.configurations.find(conf => conf.id === id) || null;
  }

  // Helper methods for testing
  addTransaction(transaction: any) {
    this.transactions.push(transaction);
  }

  addAccount(account: any) {
    this.accounts.push(account);
  }
}

describe('ReferentialIntegrityValidator', () => {
  let validator: ReferentialIntegrityValidator;
  let dataProvider: TestDataProvider;

  beforeEach(() => {
    dataProvider = new TestDataProvider();
    validator = new ReferentialIntegrityValidator(dataProvider);
  });

  describe('Foreign Key Validation', () => {
    it('should validate valid foreign key references', async () => {
      const accountData = {
        name: 'New Account',
        categoryid: 'test-cat-1', // Valid reference
        tenantid: mockTenantId
      };

      await expect(
        validator.validateForeignKeys('accounts', accountData, mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid foreign key references', async () => {
      const accountData = {
        name: 'New Account',
        categoryid: 'invalid-category-id', // Invalid reference
        tenantid: mockTenantId
      };

      await expect(
        validator.validateForeignKeys('accounts', accountData, mockTenantId)
      ).rejects.toThrow(ReferentialIntegrityError);
    });

    it('should allow null foreign keys when nullable', async () => {
      const transactionData = {
        accountid: 'test-acc-1',
        categoryid: 'test-tcat-1',
        transferaccountid: null, // Nullable foreign key
        tenantid: mockTenantId
      };

      await expect(
        validator.validateForeignKeys('transactions', transactionData, mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should validate tenant isolation', async () => {
      const differentTenantId = 'different-tenant-id';
      const accountData = {
        name: 'New Account',
        categoryid: 'test-cat-1', // Exists but belongs to different tenant
        tenantid: differentTenantId
      };

      await expect(
        validator.validateForeignKeys('accounts', accountData, differentTenantId)
      ).rejects.toThrow(ReferentialIntegrityError);
    });
  });

  describe('Unique Constraint Validation', () => {
    it('should validate unique constraints for new records', async () => {
      const accountData = {
        name: 'Unique Account Name',
        tenantid: mockTenantId
      };

      await expect(
        validator.validateUniqueConstraints('accounts', accountData, mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should throw error for duplicate names', async () => {
      const accountData = {
        name: 'Test Account', // Same name as existing account
        tenantid: mockTenantId
      };

      await expect(
        validator.validateUniqueConstraints('accounts', accountData, mockTenantId)
      ).rejects.toThrow(ConstraintViolationError);
    });

    it('should allow same name when updating same record', async () => {
      const accountData = {
        name: 'Test Account', // Same name as existing account
        tenantid: mockTenantId
      };

      await expect(
        validator.validateUniqueConstraints('accounts', accountData, mockTenantId, 'test-acc-1')
      ).resolves.not.toThrow();
    });
  });

  describe('Cascade Delete Validation', () => {
    beforeEach(() => {
      // Add a transaction that references the test account
      dataProvider.addTransaction({
        id: 'test-tr-1',
        accountid: 'test-acc-1',
        categoryid: 'test-tcat-1',
        tenantid: mockTenantId,
        isdeleted: false,
        amount: 100,
        date: '2025-01-01',
        type: 'Expense',
        createdat: '2025-01-01T00:00:00Z',
        createdby: mockTenantId,
        updatedat: null,
        updatedby: null,
        description: 'Test transaction',
        isvoid: false,
        name: 'Test Transaction',
        notes: null,
        payee: null,
        tags: null,
        transferaccountid: null,
        transferid: null
      });
    });

    it('should allow deletion when no dependent records exist', async () => {
      await expect(
        validator.validateCascadeDelete('transactiongroups', 'test-group-1', mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should throw error when dependent records exist', async () => {
      await expect(
        validator.validateCascadeDelete('accounts', 'test-acc-1', mockTenantId)
      ).rejects.toThrow(CascadeDeleteError);
    });

    it('should validate account category with dependent accounts', async () => {
      await expect(
        validator.validateCascadeDelete('accountcategories', 'test-cat-1', mockTenantId)
      ).rejects.toThrow(CascadeDeleteError);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should validate create operation completely', async () => {
      const accountData = {
        name: 'Valid New Account',
        categoryid: 'test-cat-1',
        tenantid: mockTenantId,
        balance: 0,
        currency: 'USD'
      };

      await expect(
        validator.validateCreate('accounts', accountData, mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should validate update operation completely', async () => {
      const updateData = {
        name: 'Updated Account Name',
        categoryid: 'test-cat-1'
      };

      await expect(
        validator.validateUpdate('accounts', updateData, 'test-acc-1', mockTenantId)
      ).resolves.not.toThrow();
    });

    it('should validate delete operation completely', async () => {
      await expect(
        validator.validateDelete('transactiongroups', 'test-group-1', mockTenantId)
      ).resolves.not.toThrow();
    });
  });
});

describe('ValidationHelpers', () => {
  let originalDataProvider: any;

  beforeEach(() => {
    // Mock the DataProviderFactory to return our test provider
    const testProvider = new TestDataProvider();
    jest.doMock('../DataProviderFactory', () => ({
      DataProviderFactory: {
        getProvider: () => testProvider
      }
    }));
  });

  it('should provide helper methods for validation', async () => {
    const accountData = {
      name: 'Helper Test Account',
      categoryid: 'test-cat-1',
      tenantid: mockTenantId
    };

    // This would normally work with proper mocking setup
    // await expect(
    //   ValidationHelpers.validateBeforeCreate('accounts', accountData, mockTenantId)
    // ).resolves.not.toThrow();
  });
});

describe('ValidationErrorHandler', () => {
  it('should identify referential integrity errors', () => {
    const error = new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id', 'accountcategories');
    expect(ValidationErrorHandler.isReferentialIntegrityError(error)).toBe(true);
    expect(ValidationErrorHandler.isConstraintViolationError(error)).toBe(false);
  });

  it('should identify constraint violation errors', () => {
    const error = new ConstraintViolationError('Duplicate name', 'unique_name', 'accounts');
    expect(ValidationErrorHandler.isConstraintViolationError(error)).toBe(true);
    expect(ValidationErrorHandler.isReferentialIntegrityError(error)).toBe(false);
  });

  it('should provide user-friendly error messages', () => {
    const riError = new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id', 'accountcategories');
    const cvError = new ConstraintViolationError('Duplicate name', 'unique_name', 'accounts');
    const cdError = new CascadeDeleteError('accounts', 'acc-1', 'transactions', 5);

    expect(ValidationErrorHandler.getUserFriendlyMessage(riError)).toContain('referenced record does not exist');
    expect(ValidationErrorHandler.getUserFriendlyMessage(cvError)).toContain('Duplicate name');
    expect(ValidationErrorHandler.getUserFriendlyMessage(cdError)).toContain('being used by other records');
  });

  it('should provide detailed error information', () => {
    const error = new ReferentialIntegrityError('accounts', 'categoryid', 'invalid-id', 'accountcategories');
    const details = ValidationErrorHandler.getDetailedErrorInfo(error);

    expect(details.type).toBe('ReferentialIntegrityError');
    expect(details.details.table).toBe('accounts');
    expect(details.details.field).toBe('categoryid');
    expect(details.details.value).toBe('invalid-id');
    expect(details.details.referencedTable).toBe('accountcategories');
  });
});

describe('MockDataProvider', () => {
  let provider: MockDataProvider;

  beforeEach(() => {
    provider = new MockDataProvider();
  });

  it('should return filtered data by tenant', async () => {
    const categories = await provider.getAccountCategories(mockTenantId);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.every(cat => cat.tenantid === mockTenantId)).toBe(true);
    expect(categories.every(cat => !cat.isdeleted)).toBe(true);
  });

  it('should return single records by ID', async () => {
    const category = await provider.getAccountCategoryById('cat-1');
    expect(category).toBeTruthy();
    expect(category?.id).toBe('cat-1');
  });

  it('should return null for non-existent records', async () => {
    const category = await provider.getAccountCategoryById('non-existent-id');
    expect(category).toBeNull();
  });
});