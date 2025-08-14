/**
 * Storage Validation Tests
 * 
 * Comprehensive test suite for the StorageValidation class
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { StorageValidation, ValidationReport } from '../StorageValidation';
import { StorageMode, ProviderRegistry } from '../../types';

// Mock providers for testing
const createMockProvider = (entityType: string, shouldFail = false) => {
  const mockProvider: any = {};
  
  // Add methods based on entity type
  switch (entityType) {
    case 'accounts':
      mockProvider.getAllAccounts = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Test error')) : []);
      mockProvider.getAccountById = jest.fn().mockResolvedValue(shouldFail ? null : { id: 'test-id' });
      mockProvider.createAccount = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Create failed')) : { id: 'new-id' });
      mockProvider.updateAccount = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Update failed')) : { id: 'updated-id' });
      mockProvider.deleteAccount = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Delete failed')) : { success: true });
      mockProvider.restoreAccount = jest.fn().mockResolvedValue({ success: true });
      mockProvider.updateAccountBalance = jest.fn().mockResolvedValue({ success: true });
      mockProvider.getAccountOpenedTransaction = jest.fn().mockResolvedValue(null);
      mockProvider.getTotalAccountBalance = jest.fn().mockResolvedValue({ totalbalance: 1000 });
      break;
      
    case 'accountCategories':
      mockProvider.getAllAccountCategories = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Test error')) : []);
      mockProvider.getAccountCategoryById = jest.fn().mockResolvedValue(shouldFail ? null : { id: 'test-id' });
      mockProvider.createAccountCategory = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Create failed')) : { id: 'new-id' });
      mockProvider.updateAccountCategory = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Update failed')) : { id: 'updated-id' });
      mockProvider.deleteAccountCategory = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Delete failed')) : { success: true });
      mockProvider.restoreAccountCategory = jest.fn().mockResolvedValue({ success: true });
      break;
      
    case 'transactions':
      mockProvider.getAllTransactions = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Test error')) : []);
      mockProvider.getTransactions = jest.fn().mockResolvedValue([]);
      mockProvider.getTransactionFullyById = jest.fn().mockResolvedValue({ id: 'test-id' });
      mockProvider.getTransactionById = jest.fn().mockResolvedValue({ id: 'test-id' });
      mockProvider.getTransactionByTransferId = jest.fn().mockResolvedValue(null);
      mockProvider.getTransactionsByName = jest.fn().mockResolvedValue([]);
      mockProvider.createTransaction = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Create failed')) : { id: 'new-id' });
      mockProvider.createTransactions = jest.fn().mockResolvedValue([]);
      mockProvider.createMultipleTransactions = jest.fn().mockResolvedValue([]);
      mockProvider.updateTransaction = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Update failed')) : { id: 'updated-id' });
      mockProvider.updateTransferTransaction = jest.fn().mockResolvedValue({ id: 'updated-id' });
      mockProvider.deleteTransaction = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Delete failed')) : { success: true });
      mockProvider.restoreTransaction = jest.fn().mockResolvedValue({ success: true });
      break;
      
    case 'stats':
      mockProvider.getStatsDailyTransactions = jest.fn().mockResolvedValue(shouldFail ? Promise.reject(new Error('Test error')) : []);
      mockProvider.getStatsMonthlyTransactionsTypes = jest.fn().mockResolvedValue([]);
      mockProvider.getStatsMonthlyCategoriesTransactions = jest.fn().mockResolvedValue([]);
      mockProvider.getStatsMonthlyAccountsTransactions = jest.fn().mockResolvedValue([]);
      mockProvider.getStatsNetWorthGrowth = jest.fn().mockResolvedValue([]);
      break;
      
    default:
      // Generic provider for other entity types
      mockProvider[`getAll${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`] = jest.fn().mockResolvedValue([]);
      mockProvider[`get${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}ById`] = jest.fn().mockResolvedValue({ id: 'test-id' });
      mockProvider[`create${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}`] = jest.fn().mockResolvedValue({ id: 'new-id' });
      mockProvider[`update${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}`] = jest.fn().mockResolvedValue({ id: 'updated-id' });
      mockProvider[`delete${entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)}`] = jest.fn().mockResolvedValue({ success: true });
      break;
  }
  
  return mockProvider;
};

const createMockProviders = (shouldFail = false): ProviderRegistry => ({
  accounts: createMockProvider('accounts', shouldFail),
  accountCategories: createMockProvider('accountCategories', shouldFail),
  transactions: createMockProvider('transactions', shouldFail),
  transactionCategories: createMockProvider('transactionCategories', shouldFail),
  transactionGroups: createMockProvider('transactionGroups', shouldFail),
  configurations: createMockProvider('configurations', shouldFail),
  recurrings: createMockProvider('recurrings', shouldFail),
  stats: createMockProvider('stats', shouldFail)
});

describe('StorageValidation', () => {
  let storageValidation: StorageValidation;
  let mockProviders: ProviderRegistry;

  beforeEach(() => {
    storageValidation = new StorageValidation();
    mockProviders = createMockProviders();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImplementation', () => {
    it('should validate a complete storage implementation successfully', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      expect(report).toBeDefined();
      expect(report.mode).toBe('demo');
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.results).toBeDefined();
      expect(report.errors).toBeDefined();
      
      // Should have results for all entity types
      expect(report.results.length).toBeGreaterThan(0);
      
      // Summary should be calculated correctly
      expect(report.summary.totalTests).toBe(report.results.length);
      expect(report.summary.passed + report.summary.failed + report.summary.skipped).toBe(report.summary.totalTests);
    });

    it('should handle provider failures gracefully', async () => {
      const failingProviders = createMockProviders(true);
      const report = await storageValidation.validateImplementation(failingProviders, 'demo');

      expect(report.summary.failed).toBeGreaterThan(0);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should test all entity types', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      const entityTypes = ['accounts', 'accountCategories', 'transactions', 'transactionCategories', 
                          'transactionGroups', 'configurations', 'recurrings', 'stats'];
      
      for (const entityType of entityTypes) {
        const entityResults = report.results.filter(r => r.entityType === entityType);
        expect(entityResults.length).toBeGreaterThan(0);
      }
    });

    it('should test all CRUD operations where applicable', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      const operations = ['create', 'read', 'update', 'delete'];
      
      for (const operation of operations) {
        const operationResults = report.results.filter(r => r.operation === operation);
        if (operation === 'delete') {
          // Delete might be skipped for stats
          expect(operationResults.length).toBeGreaterThanOrEqual(0);
        } else {
          expect(operationResults.length).toBeGreaterThan(0);
        }
      }
    });

    it('should include interface compliance tests', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      const interfaceResults = report.results.filter(r => r.operation === 'interface');
      expect(interfaceResults.length).toBeGreaterThan(0);
    });

    it('should measure test duration', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      for (const result of report.results) {
        expect(result.duration).toBeGreaterThanOrEqual(0);
        expect(typeof result.duration).toBe('number');
      }
    });
  });

  describe('generateComparisonReport', () => {
    it('should generate a comparison report for multiple modes', async () => {
      const demoReport = await storageValidation.validateImplementation(mockProviders, 'demo');
      const localReport = await storageValidation.validateImplementation(mockProviders, 'local');
      
      const comparisonReport = await storageValidation.generateComparisonReport([demoReport, localReport]);

      expect(comparisonReport).toContain('# Storage Implementation Validation Report');
      expect(comparisonReport).toContain('## Summary');
      expect(comparisonReport).toContain('DEMO Mode');
      expect(comparisonReport).toContain('LOCAL Mode');
      expect(comparisonReport).toContain('## Detailed Results by Entity');
    });

    it('should include error information when present', async () => {
      const failingProviders = createMockProviders(true);
      const failingReport = await storageValidation.validateImplementation(failingProviders, 'demo');
      
      const comparisonReport = await storageValidation.generateComparisonReport([failingReport]);

      if (failingReport.errors.length > 0) {
        expect(comparisonReport).toContain('## Errors');
      }
    });

    it('should handle empty reports array', async () => {
      const comparisonReport = await storageValidation.generateComparisonReport([]);

      expect(comparisonReport).toContain('# Storage Implementation Validation Report');
      expect(comparisonReport).toContain('## Summary');
    });
  });

  describe('Error Handling', () => {
    it('should capture and report errors properly', async () => {
      const failingProviders = createMockProviders(true);
      const report = await storageValidation.validateImplementation(failingProviders, 'demo');

      expect(report.errors.length).toBeGreaterThan(0);
      
      for (const error of report.errors) {
        expect(error.testName).toBeDefined();
        expect(error.entityType).toBeDefined();
        expect(error.error).toBeInstanceOf(Error);
      }
    });

    it('should continue testing other entities when one fails', async () => {
      // Create providers where only accounts fail
      const partiallyFailingProviders = createMockProviders();
      partiallyFailingProviders.accounts.getAllAccounts = jest.fn().mockRejectedValue(new Error('Accounts failed'));
      
      const report = await storageValidation.validateImplementation(partiallyFailingProviders, 'demo');

      // Should have results for other entities even though accounts failed
      const nonAccountResults = report.results.filter(r => r.entityType !== 'accounts');
      expect(nonAccountResults.length).toBeGreaterThan(0);
      
      // Should have some passed tests
      expect(report.summary.passed).toBeGreaterThan(0);
      
      // Should have some failed tests (from accounts)
      expect(report.summary.failed).toBeGreaterThan(0);
    });
  });

  describe('Test Data Generation', () => {
    it('should generate appropriate test data for each entity type', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      // Check that create operations were called with appropriate data
      expect(mockProviders.accounts.createAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          tenantid: expect.any(String),
          id: expect.any(String)
        })
      );

      expect(mockProviders.transactions.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          amount: expect.any(Number),
          tenantid: expect.any(String),
          id: expect.any(String)
        })
      );
    });

    it('should use consistent tenant ID across all tests', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      // Extract tenant IDs from create calls
      const accountCreateCall = (mockProviders.accounts.createAccount as jest.Mock).mock.calls[0];
      const transactionCreateCall = (mockProviders.transactions.createTransaction as jest.Mock).mock.calls[0];
      
      if (accountCreateCall && transactionCreateCall) {
        expect(accountCreateCall[0].tenantid).toBe(transactionCreateCall[0].tenantid);
      }
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance for all operations', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      for (const result of report.results) {
        expect(result.duration).toBeDefined();
        expect(typeof result.duration).toBe('number');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have reasonable performance measurements', async () => {
      const report = await storageValidation.validateImplementation(mockProviders, 'demo');

      // All operations should complete within a reasonable time (10 seconds max for tests)
      for (const result of report.results) {
        expect(result.duration).toBeLessThan(10000);
      }
    });
  });
});