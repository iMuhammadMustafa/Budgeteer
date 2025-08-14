/**
 * Validation Framework Integration Tests
 * 
 * End-to-end integration tests for the complete validation framework
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { 
  StorageValidation, 
  InterfaceComplianceTests, 
  AutomatedTestSuite,
  ValidationUtils
} from '../index';
import { StorageModeManager } from '../../StorageModeManager';
import { ProviderRegistry, StorageMode } from '../../types';

// Mock the storage mode manager and providers
jest.mock('../../StorageModeManager');
jest.mock('../../../apis/validation/ValidationService');

// Create comprehensive mock providers that simulate real implementations
const createRealisticMockProvider = (entityType: string, mode: StorageMode) => {
  const provider: any = {};
  const baseDelay = mode === 'cloud' ? 100 : mode === 'local' ? 50 : 10; // Simulate different performance
  
  const mockAsync = (result: any, shouldFail = false) => {
    return jest.fn().mockImplementation(async (...args) => {
      await new Promise(resolve => setTimeout(resolve, baseDelay + Math.random() * 20));
      if (shouldFail) {
        throw new Error(`${entityType} operation failed in ${mode} mode`);
      }
      return result;
    });
  };

  switch (entityType) {
    case 'accounts':
      provider.getAllAccounts = mockAsync([
        { id: 'acc-1', name: 'Test Account 1', tenantid: 'tenant-1', balance: 1000 },
        { id: 'acc-2', name: 'Test Account 2', tenantid: 'tenant-1', balance: 2000 }
      ]);
      provider.getAccountById = mockAsync({ id: 'acc-1', name: 'Test Account 1' });
      provider.createAccount = mockAsync({ id: 'new-acc', name: 'New Account' });
      provider.updateAccount = mockAsync({ id: 'acc-1', name: 'Updated Account' });
      provider.deleteAccount = mockAsync({ success: true });
      provider.restoreAccount = mockAsync({ success: true });
      provider.updateAccountBalance = mockAsync({ success: true, newBalance: 1500 });
      provider.getAccountOpenedTransaction = mockAsync(null);
      provider.getTotalAccountBalance = mockAsync({ totalbalance: 3000 });
      break;

    case 'accountCategories':
      provider.getAllAccountCategories = mockAsync([
        { id: 'cat-1', name: 'Assets', type: 'Asset', tenantid: 'tenant-1' },
        { id: 'cat-2', name: 'Liabilities', type: 'Liability', tenantid: 'tenant-1' }
      ]);
      provider.getAccountCategoryById = mockAsync({ id: 'cat-1', name: 'Assets' });
      provider.createAccountCategory = mockAsync({ id: 'new-cat', name: 'New Category' });
      provider.updateAccountCategory = mockAsync({ id: 'cat-1', name: 'Updated Category' });
      provider.deleteAccountCategory = mockAsync({ success: true });
      provider.restoreAccountCategory = mockAsync({ success: true });
      break;

    case 'transactions':
      provider.getAllTransactions = mockAsync([
        { id: 'tr-1', name: 'Test Transaction', amount: 100, tenantid: 'tenant-1' }
      ]);
      provider.getTransactions = mockAsync([]);
      provider.getTransactionFullyById = mockAsync({ id: 'tr-1', name: 'Test Transaction' });
      provider.getTransactionById = mockAsync({ id: 'tr-1', name: 'Test Transaction' });
      provider.getTransactionByTransferId = mockAsync(null);
      provider.getTransactionsByName = mockAsync([]);
      provider.createTransaction = mockAsync({ id: 'new-tr', name: 'New Transaction' });
      provider.createTransactions = mockAsync([{ id: 'new-tr-1' }, { id: 'new-tr-2' }]);
      provider.createMultipleTransactions = mockAsync([{ id: 'new-tr-3' }]);
      provider.updateTransaction = mockAsync({ id: 'tr-1', name: 'Updated Transaction' });
      provider.updateTransferTransaction = mockAsync({ id: 'tr-1', transferUpdated: true });
      provider.deleteTransaction = mockAsync({ success: true });
      provider.restoreTransaction = mockAsync({ success: true });
      break;

    case 'transactionCategories':
      provider.getAllTransactionCategories = mockAsync([
        { id: 'tcat-1', name: 'Food', type: 'Expense', tenantid: 'tenant-1' }
      ]);
      provider.getTransactionCategoryById = mockAsync({ id: 'tcat-1', name: 'Food' });
      provider.createTransactionCategory = mockAsync({ id: 'new-tcat', name: 'New Category' });
      provider.updateTransactionCategory = mockAsync({ id: 'tcat-1', name: 'Updated Category' });
      provider.deleteTransactionCategory = mockAsync({ success: true });
      provider.restoreTransactionCategory = mockAsync({ success: true });
      break;

    case 'transactionGroups':
      provider.getAllTransactionGroups = mockAsync([
        { id: 'tg-1', name: 'Living Expenses', type: 'Expense', tenantid: 'tenant-1' }
      ]);
      provider.getTransactionGroupById = mockAsync({ id: 'tg-1', name: 'Living Expenses' });
      provider.createTransactionGroup = mockAsync({ id: 'new-tg', name: 'New Group' });
      provider.updateTransactionGroup = mockAsync({ id: 'tg-1', name: 'Updated Group' });
      provider.deleteTransactionGroup = mockAsync({ success: true });
      provider.restoreTransactionGroup = mockAsync({ success: true });
      break;

    case 'configurations':
      provider.getAllConfigurations = mockAsync([
        { id: 'conf-1', key: 'currency', value: 'USD', tenantid: 'tenant-1' }
      ]);
      provider.getConfigurationById = mockAsync({ id: 'conf-1', key: 'currency' });
      provider.getConfiguration = mockAsync({ id: 'conf-1', key: 'currency', value: 'USD' });
      provider.createConfiguration = mockAsync({ id: 'new-conf', key: 'new-key' });
      provider.updateConfiguration = mockAsync({ id: 'conf-1', value: 'EUR' });
      provider.deleteConfiguration = mockAsync({ success: true });
      provider.restoreConfiguration = mockAsync({ success: true });
      break;

    case 'recurrings':
      provider.listRecurrings = mockAsync([
        { id: 'rec-1', name: 'Monthly Salary', amount: 5000, tenantid: 'tenant-1' }
      ]);
      provider.getRecurringById = mockAsync({ id: 'rec-1', name: 'Monthly Salary' });
      provider.createRecurring = mockAsync({ id: 'new-rec', name: 'New Recurring' });
      provider.updateRecurring = mockAsync({ id: 'rec-1', name: 'Updated Recurring' });
      provider.deleteRecurring = mockAsync({ success: true });
      break;

    case 'stats':
      provider.getStatsDailyTransactions = mockAsync([
        { date: '2025-01-01', income: 1000, expense: 500 }
      ]);
      provider.getStatsMonthlyTransactionsTypes = mockAsync([
        { month: '2025-01', income: 5000, expense: 3000 }
      ]);
      provider.getStatsMonthlyCategoriesTransactions = mockAsync([
        { category: 'Food', amount: 500 }
      ]);
      provider.getStatsMonthlyAccountsTransactions = mockAsync([
        { account: 'Checking', amount: 2000 }
      ]);
      provider.getStatsNetWorthGrowth = mockAsync([
        { month: '2025-01', netWorth: 10000 }
      ]);
      break;
  }

  return provider;
};

const createRealisticProviders = (mode: StorageMode): ProviderRegistry => ({
  accounts: createRealisticMockProvider('accounts', mode),
  accountCategories: createRealisticMockProvider('accountCategories', mode),
  transactions: createRealisticMockProvider('transactions', mode),
  transactionCategories: createRealisticMockProvider('transactionCategories', mode),
  transactionGroups: createRealisticMockProvider('transactionGroups', mode),
  configurations: createRealisticMockProvider('configurations', mode),
  recurrings: createRealisticMockProvider('recurrings', mode),
  stats: createRealisticMockProvider('stats', mode)
});

// Mock the StorageModeManager
const mockStorageModeManager = {
  setMode: jest.fn().mockResolvedValue(undefined),
  getAccountProvider: jest.fn(),
  getAccountCategoryProvider: jest.fn(),
  getTransactionProvider: jest.fn(),
  getTransactionCategoryProvider: jest.fn(),
  getTransactionGroupProvider: jest.fn(),
  getConfigurationProvider: jest.fn(),
  getRecurringProvider: jest.fn(),
  getStatsProvider: jest.fn()
};

(StorageModeManager.getInstance as jest.Mock).mockReturnValue(mockStorageModeManager);

describe('Validation Framework Integration', () => {
  let currentMode: StorageMode = 'demo';
  let currentProviders: ProviderRegistry;

  beforeAll(() => {
    // Setup mock to return appropriate providers based on current mode
    mockStorageModeManager.setMode.mockImplementation(async (mode: StorageMode) => {
      currentMode = mode;
      currentProviders = createRealisticProviders(mode);
      
      mockStorageModeManager.getAccountProvider.mockReturnValue(currentProviders.accounts);
      mockStorageModeManager.getAccountCategoryProvider.mockReturnValue(currentProviders.accountCategories);
      mockStorageModeManager.getTransactionProvider.mockReturnValue(currentProviders.transactions);
      mockStorageModeManager.getTransactionCategoryProvider.mockReturnValue(currentProviders.transactionCategories);
      mockStorageModeManager.getTransactionGroupProvider.mockReturnValue(currentProviders.transactionGroups);
      mockStorageModeManager.getConfigurationProvider.mockReturnValue(currentProviders.configurations);
      mockStorageModeManager.getRecurringProvider.mockReturnValue(currentProviders.recurrings);
      mockStorageModeManager.getStatsProvider.mockReturnValue(currentProviders.stats);
    });

    // Initialize with demo mode
    currentProviders = createRealisticProviders('demo');
    mockStorageModeManager.getAccountProvider.mockReturnValue(currentProviders.accounts);
    mockStorageModeManager.getAccountCategoryProvider.mockReturnValue(currentProviders.accountCategories);
    mockStorageModeManager.getTransactionProvider.mockReturnValue(currentProviders.transactions);
    mockStorageModeManager.getTransactionCategoryProvider.mockReturnValue(currentProviders.transactionCategories);
    mockStorageModeManager.getTransactionGroupProvider.mockReturnValue(currentProviders.transactionGroups);
    mockStorageModeManager.getConfigurationProvider.mockReturnValue(currentProviders.configurations);
    mockStorageModeManager.getRecurringProvider.mockReturnValue(currentProviders.recurrings);
    mockStorageModeManager.getStatsProvider.mockReturnValue(currentProviders.stats);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('StorageValidation Integration', () => {
    it('should validate a complete storage implementation', async () => {
      const storageValidation = new StorageValidation();
      const providers = createRealisticProviders('demo');
      
      const report = await storageValidation.validateImplementation(providers, 'demo');

      expect(report).toBeDefined();
      expect(report.mode).toBe('demo');
      expect(report.summary.totalTests).toBeGreaterThan(0);
      expect(report.results.length).toBeGreaterThan(0);
      
      // Should test all entity types
      const entityTypes = ['accounts', 'accountCategories', 'transactions', 'transactionCategories', 
                          'transactionGroups', 'configurations', 'recurrings', 'stats'];
      
      for (const entityType of entityTypes) {
        const entityResults = report.results.filter(r => r.entityType === entityType);
        expect(entityResults.length).toBeGreaterThan(0);
      }
    });

    it('should generate comparison reports across multiple modes', async () => {
      const storageValidation = new StorageValidation();
      
      const demoReport = await storageValidation.validateImplementation(
        createRealisticProviders('demo'), 'demo'
      );
      const localReport = await storageValidation.validateImplementation(
        createRealisticProviders('local'), 'local'
      );
      
      const comparisonReport = await storageValidation.generateComparisonReport([demoReport, localReport]);

      expect(comparisonReport).toContain('# Storage Implementation Validation Report');
      expect(comparisonReport).toContain('DEMO Mode');
      expect(comparisonReport).toContain('LOCAL Mode');
      expect(comparisonReport).toContain('## Detailed Results by Entity');
    });
  });

  describe('InterfaceComplianceTests Integration', () => {
    it('should test interface compliance across all providers', async () => {
      const complianceTests = new InterfaceComplianceTests();
      const providers = createRealisticProviders('demo');
      
      const report = await complianceTests.testCompliance(providers, 'demo');

      expect(report).toBeDefined();
      expect(report.mode).toBe('demo');
      expect(report.summary.totalInterfaces).toBe(8); // All entity types
      expect(report.results.length).toBe(8);
      
      // All providers should be compliant with our realistic mocks
      expect(report.summary.compliantInterfaces).toBe(8);
      expect(report.summary.nonCompliantInterfaces).toBe(0);
      expect(report.violations).toHaveLength(0);
    });

    it('should generate detailed compliance reports', async () => {
      const complianceTests = new InterfaceComplianceTests();
      
      const demoReport = await complianceTests.testCompliance(createRealisticProviders('demo'), 'demo');
      const localReport = await complianceTests.testCompliance(createRealisticProviders('local'), 'local');
      
      const report = complianceTests.generateComplianceReport([demoReport, localReport]);

      expect(report).toContain('# Interface Compliance Report');
      expect(report).toContain('Compliance Rate: 100.0%');
      expect(report).toContain('✅ Compliant');
    });
  });

  describe('AutomatedTestSuite Integration', () => {
    it('should run complete test suite for multiple modes', async () => {
      const testSuite = new AutomatedTestSuite();
      
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'],
        outputFormat: 'console'
      });

      expect(report).toBeDefined();
      expect(report.summary.totalModes).toBe(2);
      expect(report.validationReports).toHaveLength(2);
      expect(report.complianceReports).toHaveLength(2);
      expect(report.crossModeComparison).toBeDefined();
      expect(report.recommendations).toBeDefined();
      
      // Should have switched modes
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('demo');
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('local');
    });

    it('should perform cross-mode comparison analysis', async () => {
      const testSuite = new AutomatedTestSuite();
      
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'],
        outputFormat: 'json'
      });

      expect(report.crossModeComparison.consistentBehavior).toBeDefined();
      expect(report.crossModeComparison.inconsistencies).toBeDefined();
      expect(report.crossModeComparison.performanceComparison).toBeDefined();
      
      // Performance comparison should show different timings
      expect(report.crossModeComparison.performanceComparison.length).toBeGreaterThan(0);
    });

    it('should generate appropriate recommendations', async () => {
      const testSuite = new AutomatedTestSuite();
      
      const report = await testSuite.runTestSuite({
        modes: ['demo'],
        outputFormat: 'markdown'
      });

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      // With our realistic mocks, should get positive feedback
      expect(report.recommendations.some(r => r.includes('Great job') || r.includes('correctly'))).toBe(true);
    });
  });

  describe('ValidationUtils Integration', () => {
    it('should perform quick validation', async () => {
      const result = await ValidationUtils.quickValidate('demo');
      
      expect(typeof result).toBe('boolean');
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('demo');
    });

    it('should test all mode compliance', async () => {
      const reports = await ValidationUtils.testAllModeCompliance();
      
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(3); // cloud, demo, local
      
      // Should have switched to all modes
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('cloud');
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('demo');
      expect(mockStorageModeManager.setMode).toHaveBeenCalledWith('local');
    });

    it('should run full validation suite', async () => {
      const report = await ValidationUtils.runFullValidation();
      
      expect(report).toBeDefined();
      expect(report.summary.totalModes).toBe(3);
      expect(report.config.modes).toEqual(['cloud', 'demo', 'local']);
      expect(report.config.outputFormat).toBe('console');
    });

    it('should run development validation', async () => {
      const report = await ValidationUtils.runDevValidation();
      
      expect(report).toBeDefined();
      expect(report.summary.totalModes).toBe(2); // demo, local (no cloud)
      expect(report.config.modes).toEqual(['demo', 'local']);
      expect(report.config.skipIntegrityTests).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent validations', async () => {
      const testSuite = new AutomatedTestSuite();
      
      // Run multiple validations concurrently
      const promises = [
        testSuite.quickValidation('demo'),
        testSuite.quickValidation('local'),
        ValidationUtils.quickValidate('demo')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => typeof r === 'boolean')).toBe(true);
    });

    it('should measure and report performance differences', async () => {
      const testSuite = new AutomatedTestSuite();
      
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'], // Different performance characteristics
        outputFormat: 'json'
      });

      // Should have performance data
      const performanceData = report.crossModeComparison.performanceComparison;
      expect(performanceData.length).toBeGreaterThan(0);
      
      // Should show timing differences between modes
      for (const perf of performanceData) {
        expect(perf.results).toBeDefined();
        expect(Object.keys(perf.results).length).toBeGreaterThan(1);
      }
    });

    it('should handle large-scale validation efficiently', async () => {
      const storageValidation = new StorageValidation();
      const providers = createRealisticProviders('demo');
      
      const startTime = Date.now();
      const report = await storageValidation.validateImplementation(providers, 'demo');
      const duration = Date.now() - startTime;

      expect(report.summary.totalTests).toBeGreaterThan(20); // Should test many operations
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      // All tests should have reasonable durations
      for (const result of report.results) {
        expect(result.duration).toBeLessThan(1000); // Each test under 1 second
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle provider failures gracefully', async () => {
      const faultyProviders = createRealisticProviders('demo');
      
      // Make some providers fail
      (faultyProviders.accounts.getAllAccounts as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      (faultyProviders.transactions.createTransaction as jest.Mock).mockRejectedValue(new Error('Validation failed'));
      
      const storageValidation = new StorageValidation();
      const report = await storageValidation.validateImplementation(faultyProviders, 'demo');

      expect(report.summary.failed).toBeGreaterThan(0);
      expect(report.errors.length).toBeGreaterThan(0);
      
      // Should still have some passing tests
      expect(report.summary.passed).toBeGreaterThan(0);
    });

    it('should handle mode switching failures', async () => {
      mockStorageModeManager.setMode.mockRejectedValueOnce(new Error('Mode switch failed'));
      
      const testSuite = new AutomatedTestSuite();
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'],
        outputFormat: 'console'
      });

      expect(report.summary.failedModes).toBeGreaterThan(0);
      // Should still complete for other modes
      expect(report.summary.totalModes).toBe(2);
    });

    it('should validate empty or minimal providers', async () => {
      const emptyProviders: ProviderRegistry = {
        accounts: {},
        accountCategories: {},
        transactions: {},
        transactionCategories: {},
        transactionGroups: {},
        configurations: {},
        recurrings: {},
        stats: {}
      } as any;

      const complianceTests = new InterfaceComplianceTests();
      const report = await complianceTests.testCompliance(emptyProviders, 'demo');

      expect(report.summary.nonCompliantInterfaces).toBe(8); // All should be non-compliant
      expect(report.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should simulate a typical development workflow', async () => {
      // 1. Developer runs quick validation during development
      const quickResult = await ValidationUtils.quickValidate('demo');
      expect(typeof quickResult).toBe('boolean');

      // 2. Developer runs interface compliance check
      const complianceReports = await ValidationUtils.testAllModeCompliance();
      expect(complianceReports.length).toBe(3);

      // 3. Before deployment, run full validation
      const fullReport = await ValidationUtils.runFullValidation();
      expect(fullReport.summary.totalModes).toBe(3);
      expect(fullReport.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide actionable feedback for developers', async () => {
      const testSuite = new AutomatedTestSuite();
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'],
        outputFormat: 'markdown'
      });

      // Recommendations should be specific and actionable
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      for (const recommendation of report.recommendations) {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10); // Should be meaningful
      }
    });

    it('should support continuous integration workflows', async () => {
      // Simulate CI environment - run validation with JSON output for parsing
      const testSuite = new AutomatedTestSuite();
      const report = await testSuite.runTestSuite({
        modes: ['demo', 'local'], // Skip cloud in CI
        outputFormat: 'json'
      });

      // Report should be structured for CI consumption
      expect(report.timestamp).toBeDefined();
      expect(report.summary.totalTests).toBeGreaterThan(0);
      expect(typeof report.summary.passedTests).toBe('number');
      expect(typeof report.summary.failedTests).toBe('number');
      
      // Should be able to determine CI success/failure
      const ciSuccess = report.summary.failedTests === 0 && 
                       report.crossModeComparison.inconsistencies.length === 0;
      expect(typeof ciSuccess).toBe('boolean');
    });
  });
});