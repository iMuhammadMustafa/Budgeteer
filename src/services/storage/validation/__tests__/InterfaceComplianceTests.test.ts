/**
 * Interface Compliance Tests
 * 
 * Test suite for the InterfaceComplianceTests class
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InterfaceComplianceTests, InterfaceComplianceReport } from '../InterfaceComplianceTests';
import { ProviderRegistry, StorageMode } from '../../types';

// Mock providers with different compliance levels
const createCompliantProvider = (entityType: string) => {
  const provider: any = {};
  
  switch (entityType) {
    case 'accounts':
      provider.getAllAccounts = jest.fn();
      provider.getAccountById = jest.fn();
      provider.createAccount = jest.fn();
      provider.updateAccount = jest.fn();
      provider.deleteAccount = jest.fn();
      provider.restoreAccount = jest.fn();
      provider.updateAccountBalance = jest.fn();
      provider.getAccountOpenedTransaction = jest.fn();
      provider.getTotalAccountBalance = jest.fn();
      break;
      
    case 'accountCategories':
      provider.getAllAccountCategories = jest.fn();
      provider.getAccountCategoryById = jest.fn();
      provider.createAccountCategory = jest.fn();
      provider.updateAccountCategory = jest.fn();
      provider.deleteAccountCategory = jest.fn();
      provider.restoreAccountCategory = jest.fn();
      break;
      
    case 'transactions':
      provider.getAllTransactions = jest.fn();
      provider.getTransactions = jest.fn();
      provider.getTransactionFullyById = jest.fn();
      provider.getTransactionById = jest.fn();
      provider.getTransactionByTransferId = jest.fn();
      provider.getTransactionsByName = jest.fn();
      provider.createTransaction = jest.fn();
      provider.createTransactions = jest.fn();
      provider.createMultipleTransactions = jest.fn();
      provider.updateTransaction = jest.fn();
      provider.updateTransferTransaction = jest.fn();
      provider.deleteTransaction = jest.fn();
      provider.restoreTransaction = jest.fn();
      break;
      
    case 'stats':
      provider.getStatsDailyTransactions = jest.fn();
      provider.getStatsMonthlyTransactionsTypes = jest.fn();
      provider.getStatsMonthlyCategoriesTransactions = jest.fn();
      provider.getStatsMonthlyAccountsTransactions = jest.fn();
      provider.getStatsNetWorthGrowth = jest.fn();
      break;
      
    default:
      // Add generic methods for other entity types
      const capitalizedEntity = entityType.charAt(0).toUpperCase() + entityType.slice(1);
      const singularEntity = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
      const capitalizedSingular = singularEntity.charAt(0).toUpperCase() + singularEntity.slice(1);
      
      provider[`getAll${capitalizedEntity}`] = jest.fn();
      provider[`get${capitalizedSingular}ById`] = jest.fn();
      provider[`create${capitalizedSingular}`] = jest.fn();
      provider[`update${capitalizedSingular}`] = jest.fn();
      provider[`delete${capitalizedSingular}`] = jest.fn();
      provider[`restore${capitalizedSingular}`] = jest.fn();
      
      // Special handling for recurrings
      if (entityType === 'recurrings') {
        provider.listRecurrings = jest.fn();
        provider.getRecurringById = jest.fn();
        provider.createRecurring = jest.fn();
        provider.updateRecurring = jest.fn();
        provider.deleteRecurring = jest.fn();
        // Remove extra methods that shouldn't be there
        delete provider.getAllRecurrings;
        delete provider.restoreRecurring;
      }
      
      // Special handling for configurations
      if (entityType === 'configurations') {
        provider.getConfiguration = jest.fn();
      }
      break;
  }
  
  return provider;
};

const createNonCompliantProvider = (entityType: string) => {
  const provider = createCompliantProvider(entityType);
  
  // Remove some required methods to make it non-compliant
  switch (entityType) {
    case 'accounts':
      delete provider.updateAccountBalance;
      delete provider.getTotalAccountBalance;
      // Add an extra method that shouldn't be there
      provider.extraMethod = jest.fn();
      break;
      
    case 'transactions':
      delete provider.createTransactions;
      delete provider.updateTransferTransaction;
      provider.unexpectedMethod = jest.fn();
      break;
      
    default:
      // Remove a generic method
      const methods = Object.keys(provider);
      if (methods.length > 0) {
        delete provider[methods[0]];
      }
      provider.extraMethod = jest.fn();
      break;
  }
  
  return provider;
};

const createCompliantProviders = (): ProviderRegistry => ({
  accounts: createCompliantProvider('accounts'),
  accountCategories: createCompliantProvider('accountCategories'),
  transactions: createCompliantProvider('transactions'),
  transactionCategories: createCompliantProvider('transactionCategories'),
  transactionGroups: createCompliantProvider('transactionGroups'),
  configurations: createCompliantProvider('configurations'),
  recurrings: createCompliantProvider('recurrings'),
  stats: createCompliantProvider('stats')
});

const createNonCompliantProviders = (): ProviderRegistry => ({
  accounts: createNonCompliantProvider('accounts'),
  accountCategories: createNonCompliantProvider('accountCategories'),
  transactions: createNonCompliantProvider('transactions'),
  transactionCategories: createNonCompliantProvider('transactionCategories'),
  transactionGroups: createNonCompliantProvider('transactionGroups'),
  configurations: createNonCompliantProvider('configurations'),
  recurrings: createNonCompliantProvider('recurrings'),
  stats: createNonCompliantProvider('stats')
});

describe('InterfaceComplianceTests', () => {
  let complianceTests: InterfaceComplianceTests;

  beforeEach(() => {
    complianceTests = new InterfaceComplianceTests();
  });

  describe('testCompliance', () => {
    it('should pass compliance test for fully compliant providers', async () => {
      const compliantProviders = createCompliantProviders();
      const report = await complianceTests.testCompliance(compliantProviders, 'demo');

      expect(report).toBeDefined();
      expect(report.mode).toBe('demo');
      expect(report.timestamp).toBeDefined();
      expect(report.summary.totalInterfaces).toBe(8); // All entity types
      expect(report.summary.compliantInterfaces).toBe(8);
      expect(report.summary.nonCompliantInterfaces).toBe(0);
      expect(report.violations).toHaveLength(0);
    });

    it('should detect non-compliant providers', async () => {
      const nonCompliantProviders = createNonCompliantProviders();
      const report = await complianceTests.testCompliance(nonCompliantProviders, 'demo');

      expect(report.summary.nonCompliantInterfaces).toBeGreaterThan(0);
      expect(report.violations.length).toBeGreaterThan(0);
      
      // Should have both missing and extra method violations
      const missingViolations = report.violations.filter(v => v.violationType === 'missing');
      const extraViolations = report.violations.filter(v => v.violationType === 'extra');
      
      expect(missingViolations.length).toBeGreaterThan(0);
      expect(extraViolations.length).toBeGreaterThan(0);
    });

    it('should test all entity types', async () => {
      const providers = createCompliantProviders();
      const report = await complianceTests.testCompliance(providers, 'demo');

      const entityTypes = ['accounts', 'accountCategories', 'transactions', 'transactionCategories', 
                          'transactionGroups', 'configurations', 'recurrings', 'stats'];
      
      expect(report.results).toHaveLength(entityTypes.length);
      
      for (const entityType of entityTypes) {
        const result = report.results.find(r => r.entityType === entityType);
        expect(result).toBeDefined();
      }
    });

    it('should identify missing methods correctly', async () => {
      const providers = createCompliantProviders();
      // Remove a specific method from accounts provider
      delete (providers.accounts as any).updateAccountBalance;
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(false);
      expect(accountsResult!.missingMethods).toContain('updateAccountBalance');
      
      const missingViolation = report.violations.find(
        v => v.entityType === 'accounts' && v.method === 'updateAccountBalance' && v.violationType === 'missing'
      );
      expect(missingViolation).toBeDefined();
    });

    it('should identify extra methods correctly', async () => {
      const providers = createCompliantProviders();
      // Add an extra method to accounts provider
      (providers.accounts as any).extraMethod = jest.fn();
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(false);
      expect(accountsResult!.extraMethods).toContain('extraMethod');
      
      const extraViolation = report.violations.find(
        v => v.entityType === 'accounts' && v.method === 'extraMethod' && v.violationType === 'extra'
      );
      expect(extraViolation).toBeDefined();
    });

    it('should ignore utility methods', async () => {
      const providers = createCompliantProviders();
      // Add utility methods that should be ignored
      (providers.accounts as any)._privateMethod = jest.fn();
      (providers.accounts as any).toString = jest.fn();
      (providers.accounts as any).constructor = jest.fn();
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(true);
      expect(accountsResult!.extraMethods).not.toContain('_privateMethod');
      expect(accountsResult!.extraMethods).not.toContain('toString');
      expect(accountsResult!.extraMethods).not.toContain('constructor');
    });

    it('should handle providers with prototype methods', async () => {
      const providers = createCompliantProviders();
      
      // Create a provider class with prototype methods
      class TestProvider {
        getAllAccounts = jest.fn();
        getAccountById = jest.fn();
        createAccount = jest.fn();
        updateAccount = jest.fn();
        deleteAccount = jest.fn();
        restoreAccount = jest.fn();
        updateAccountBalance = jest.fn();
        getAccountOpenedTransaction = jest.fn();
        getTotalAccountBalance = jest.fn();
      }
      
      providers.accounts = new TestProvider();
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(true);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a comprehensive compliance report', async () => {
      const compliantProviders = createCompliantProviders();
      const nonCompliantProviders = createNonCompliantProviders();
      
      const compliantReport = await complianceTests.testCompliance(compliantProviders, 'demo');
      const nonCompliantReport = await complianceTests.testCompliance(nonCompliantProviders, 'local');
      
      const report = complianceTests.generateComplianceReport([compliantReport, nonCompliantReport]);

      expect(report).toContain('# Interface Compliance Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('DEMO Mode');
      expect(report).toContain('LOCAL Mode');
      expect(report).toContain('## Detailed Results');
      expect(report).toContain('## Violations');
    });

    it('should show compliance rates correctly', async () => {
      const compliantProviders = createCompliantProviders();
      const compliantReport = await complianceTests.testCompliance(compliantProviders, 'demo');
      
      const report = complianceTests.generateComplianceReport([compliantReport]);

      expect(report).toContain('Compliance Rate: 100.0%');
    });

    it('should list violations when present', async () => {
      const nonCompliantProviders = createNonCompliantProviders();
      const nonCompliantReport = await complianceTests.testCompliance(nonCompliantProviders, 'demo');
      
      const report = complianceTests.generateComplianceReport([nonCompliantReport]);

      expect(report).toContain('## Violations');
      
      // Should contain specific violation details
      for (const violation of nonCompliantReport.violations) {
        expect(report).toContain(violation.entityType);
        expect(report).toContain(violation.method);
      }
    });

    it('should handle empty reports array', () => {
      const report = complianceTests.generateComplianceReport([]);

      expect(report).toContain('# Interface Compliance Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Detailed Results');
    });

    it('should show correct status indicators', async () => {
      const compliantProviders = createCompliantProviders();
      const nonCompliantProviders = createNonCompliantProviders();
      
      const compliantReport = await complianceTests.testCompliance(compliantProviders, 'demo');
      const nonCompliantReport = await complianceTests.testCompliance(nonCompliantProviders, 'local');
      
      const report = complianceTests.generateComplianceReport([compliantReport, nonCompliantReport]);

      expect(report).toContain('✅ Compliant');
      expect(report).toContain('❌ Non-Compliant');
    });
  });

  describe('Method Detection', () => {
    it('should detect all required methods for each entity type', async () => {
      const providers = createCompliantProviders();
      const report = await complianceTests.testCompliance(providers, 'demo');

      // Check that all required methods are detected for accounts
      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.requiredMethods).toContain('getAllAccounts');
      expect(accountsResult!.requiredMethods).toContain('getAccountById');
      expect(accountsResult!.requiredMethods).toContain('createAccount');
      expect(accountsResult!.requiredMethods).toContain('updateAccount');
      expect(accountsResult!.requiredMethods).toContain('deleteAccount');
      expect(accountsResult!.requiredMethods).toContain('updateAccountBalance');
      expect(accountsResult!.requiredMethods).toContain('getTotalAccountBalance');
    });

    it('should detect implemented methods correctly', async () => {
      const providers = createCompliantProviders();
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      
      // All required methods should be in implemented methods
      for (const requiredMethod of accountsResult!.requiredMethods) {
        expect(accountsResult!.implementedMethods).toContain(requiredMethod);
      }
    });

    it('should handle different entity types correctly', async () => {
      const providers = createCompliantProviders();
      const report = await complianceTests.testCompliance(providers, 'demo');

      // Check stats entity (different method pattern)
      const statsResult = report.results.find(r => r.entityType === 'stats');
      expect(statsResult).toBeDefined();
      expect(statsResult!.requiredMethods).toContain('getStatsDailyTransactions');
      expect(statsResult!.requiredMethods).toContain('getStatsMonthlyTransactionsTypes');
      
      // Check recurrings entity (different method pattern)
      const recurringsResult = report.results.find(r => r.entityType === 'recurrings');
      expect(recurringsResult).toBeDefined();
      expect(recurringsResult!.requiredMethods).toContain('listRecurrings');
      expect(recurringsResult!.requiredMethods).toContain('getRecurringById');
    });
  });

  describe('Edge Cases', () => {
    it('should handle providers with no methods', async () => {
      const providers = createCompliantProviders();
      providers.accounts = {}; // Empty provider
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(false);
      expect(accountsResult!.implementedMethods).toHaveLength(0);
      expect(accountsResult!.missingMethods.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined providers', async () => {
      const providers = createCompliantProviders();
      (providers as any).accounts = null;
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      expect(accountsResult!.isCompliant).toBe(false);
    });

    it('should handle providers with non-function properties', async () => {
      const providers = createCompliantProviders();
      (providers.accounts as any).someProperty = 'not a function';
      (providers.accounts as any).someNumber = 42;
      (providers.accounts as any).someObject = { nested: 'object' };
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      const accountsResult = report.results.find(r => r.entityType === 'accounts');
      expect(accountsResult).toBeDefined();
      
      // Non-function properties should not be included in implemented methods
      expect(accountsResult!.implementedMethods).not.toContain('someProperty');
      expect(accountsResult!.implementedMethods).not.toContain('someNumber');
      expect(accountsResult!.implementedMethods).not.toContain('someObject');
    });
  });
});