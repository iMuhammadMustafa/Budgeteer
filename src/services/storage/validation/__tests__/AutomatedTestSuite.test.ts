/**
 * Automated Test Suite Tests
 * 
 * Test suite for the AutomatedTestSuite class
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { AutomatedTestSuite, TestSuiteConfig, TestSuiteReport } from '../AutomatedTestSuite';
import { StorageMode } from '../../types';

// Mock dependencies
jest.mock('../StorageValidation');
jest.mock('../InterfaceComplianceTests');
jest.mock('../../StorageModeManager');
jest.mock('../../../apis/validation/ValidationService');

import { StorageValidation } from '../StorageValidation';
import { InterfaceComplianceTests } from '../InterfaceComplianceTests';
import { StorageModeManager } from '../../StorageModeManager';

// Mock implementations
const mockStorageValidation = {
  validateImplementation: jest.fn().mockResolvedValue({
    mode: 'demo',
    timestamp: '2025-01-01T00:00:00Z',
    summary: { totalTests: 10, passed: 8, failed: 2, skipped: 0 },
    results: [
      { testName: 'Test 1', entityType: 'accounts', operation: 'create', status: 'passed', duration: 100 },
      { testName: 'Test 2', entityType: 'accounts', operation: 'read', status: 'failed', duration: 50 }
    ],
    errors: []
  })
};

const mockInterfaceComplianceTests = {
  testCompliance: jest.fn().mockResolvedValue({
    mode: 'demo',
    timestamp: '2025-01-01T00:00:00Z',
    summary: { totalInterfaces: 8, compliantInterfaces: 7, nonCompliantInterfaces: 1 },
    results: [
      { entityType: 'accounts', isCompliant: true, requiredMethods: [], implementedMethods: [], missingMethods: [], extraMethods: [] }
    ],
    violations: []
  })
};

const mockStorageModeManager = {
  getInstance: jest.fn().mockReturnValue({
    setMode: jest.fn().mockResolvedValue(undefined),
    getAccountProvider: jest.fn().mockReturnValue({}),
    getAccountCategoryProvider: jest.fn().mockReturnValue({}),
    getTransactionProvider: jest.fn().mockReturnValue({}),
    getTransactionCategoryProvider: jest.fn().mockReturnValue({}),
    getTransactionGroupProvider: jest.fn().mockReturnValue({}),
    getConfigurationProvider: jest.fn().mockReturnValue({}),
    getRecurringProvider: jest.fn().mockReturnValue({}),
    getStatsProvider: jest.fn().mockReturnValue({})
  })
};

// Apply mocks
(StorageValidation as jest.Mock).mockImplementation(() => mockStorageValidation);
(InterfaceComplianceTests as jest.Mock).mockImplementation(() => mockInterfaceComplianceTests);
(StorageModeManager.getInstance as jest.Mock).mockImplementation(() => mockStorageModeManager.getInstance());

describe('AutomatedTestSuite', () => {
  let testSuite: AutomatedTestSuite;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    testSuite = new AutomatedTestSuite();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('runTestSuite', () => {
    const defaultConfig: TestSuiteConfig = {
      modes: ['demo', 'local'],
      outputFormat: 'console'
    };

    it('should run test suite for all specified modes', async () => {
      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report).toBeDefined();
      expect(report.config).toEqual(defaultConfig);
      expect(report.summary.totalModes).toBe(2);
      expect(report.validationReports).toHaveLength(2);
      expect(report.complianceReports).toHaveLength(2);
      
      // Should have called setMode for each mode
      expect(mockStorageModeManager.getInstance().setMode).toHaveBeenCalledWith('demo');
      expect(mockStorageModeManager.getInstance().setMode).toHaveBeenCalledWith('local');
    });

    it('should skip CRUD tests when configured', async () => {
      const config: TestSuiteConfig = {
        modes: ['demo'],
        skipCRUDTests: true,
        skipIntegrityTests: true
      };

      const report = await testSuite.runTestSuite(config);

      expect(report.validationReports).toHaveLength(0);
      expect(mockStorageValidation.validateImplementation).not.toHaveBeenCalled();
    });

    it('should skip interface tests when configured', async () => {
      const config: TestSuiteConfig = {
        modes: ['demo'],
        skipInterfaceTests: true
      };

      const report = await testSuite.runTestSuite(config);

      expect(report.complianceReports).toHaveLength(0);
      expect(mockInterfaceComplianceTests.testCompliance).not.toHaveBeenCalled();
    });

    it('should calculate summary correctly', async () => {
      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.summary.totalModes).toBe(2);
      expect(report.summary.totalTests).toBe(20); // 10 tests per mode * 2 modes
      expect(report.summary.passedTests).toBe(16); // 8 passed per mode * 2 modes
      expect(report.summary.failedTests).toBe(4); // 2 failed per mode * 2 modes
      expect(report.summary.skippedTests).toBe(0);
    });

    it('should handle mode switching errors gracefully', async () => {
      mockStorageModeManager.getInstance().setMode.mockRejectedValueOnce(new Error('Mode switch failed'));

      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.summary.failedModes).toBeGreaterThan(0);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Error testing')
      );
    });

    it('should perform cross-mode comparison', async () => {
      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.crossModeComparison).toBeDefined();
      expect(report.crossModeComparison.consistentBehavior).toBeDefined();
      expect(report.crossModeComparison.inconsistencies).toBeDefined();
      expect(report.crossModeComparison.performanceComparison).toBeDefined();
    });

    it('should generate recommendations', async () => {
      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should output results in console format by default', async () => {
      await testSuite.runTestSuite(defaultConfig);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('TEST SUITE SUMMARY')
      );
    });

    it('should output results in JSON format when configured', async () => {
      const config: TestSuiteConfig = {
        modes: ['demo'],
        outputFormat: 'json'
      };

      await testSuite.runTestSuite(config);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('JSON Report')
      );
    });

    it('should output results in markdown format when configured', async () => {
      const config: TestSuiteConfig = {
        modes: ['demo'],
        outputFormat: 'markdown'
      };

      await testSuite.runTestSuite(config);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Markdown Report')
      );
    });
  });

  describe('quickValidation', () => {
    it('should perform quick validation for a single mode', async () => {
      const result = await testSuite.quickValidation('demo');

      expect(result).toBe(true); // Mock returns successful validation
      expect(mockStorageModeManager.getInstance().setMode).toHaveBeenCalledWith('demo');
      expect(mockStorageValidation.validateImplementation).toHaveBeenCalled();
    });

    it('should return false when validation fails', async () => {
      mockStorageValidation.validateImplementation.mockResolvedValueOnce({
        summary: { failed: 1 }
      });

      const result = await testSuite.quickValidation('demo');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockStorageModeManager.getInstance().setMode.mockRejectedValueOnce(new Error('Test error'));

      const result = await testSuite.quickValidation('demo');

      expect(result).toBe(false);
    });
  });

  describe('testInterfaceCompliance', () => {
    it('should test interface compliance for multiple modes', async () => {
      const modes: StorageMode[] = ['demo', 'local'];
      const reports = await testSuite.testInterfaceCompliance(modes);

      expect(reports).toHaveLength(2);
      expect(mockStorageModeManager.getInstance().setMode).toHaveBeenCalledWith('demo');
      expect(mockStorageModeManager.getInstance().setMode).toHaveBeenCalledWith('local');
      expect(mockInterfaceComplianceTests.testCompliance).toHaveBeenCalledTimes(2);
    });

    it('should return empty array for empty modes array', async () => {
      const reports = await testSuite.testInterfaceCompliance([]);

      expect(reports).toHaveLength(0);
      expect(mockInterfaceComplianceTests.testCompliance).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Mode Comparison', () => {
    it('should detect inconsistencies between modes', async () => {
      // Mock different results for different modes
      mockStorageValidation.validateImplementation
        .mockResolvedValueOnce({
          mode: 'demo',
          summary: { totalTests: 10, passed: 10, failed: 0, skipped: 0 },
          results: [
            { testName: 'Test 1', entityType: 'accounts', operation: 'create', status: 'passed', duration: 100 }
          ],
          errors: []
        })
        .mockResolvedValueOnce({
          mode: 'local',
          summary: { totalTests: 10, passed: 9, failed: 1, skipped: 0 },
          results: [
            { testName: 'Test 1', entityType: 'accounts', operation: 'create', status: 'failed', duration: 200 }
          ],
          errors: []
        });

      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.crossModeComparison.consistentBehavior).toBe(false);
      expect(report.crossModeComparison.inconsistencies.length).toBeGreaterThan(0);
    });

    it('should track performance differences', async () => {
      mockStorageValidation.validateImplementation
        .mockResolvedValueOnce({
          mode: 'demo',
          results: [
            { testName: 'Test 1', entityType: 'accounts', operation: 'create', status: 'passed', duration: 100 }
          ]
        })
        .mockResolvedValueOnce({
          mode: 'local',
          results: [
            { testName: 'Test 1', entityType: 'accounts', operation: 'create', status: 'passed', duration: 300 }
          ]
        });

      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.crossModeComparison.performanceComparison.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    it('should recommend addressing failing tests when success rate is low', async () => {
      mockStorageValidation.validateImplementation.mockResolvedValue({
        summary: { totalTests: 10, passed: 5, failed: 5, skipped: 0 }
      });

      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      expect(report.recommendations.some(r => r.includes('success rate'))).toBe(true);
    });

    it('should recommend fixing interface compliance issues', async () => {
      mockInterfaceComplianceTests.testCompliance.mockResolvedValue({
        summary: { totalInterfaces: 8, compliantInterfaces: 6, nonCompliantInterfaces: 2 },
        violations: [{ entityType: 'accounts', method: 'test', violationType: 'missing', details: 'test' }]
      });

      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      expect(report.recommendations.some(r => r.includes('Interface compliance'))).toBe(true);
    });

    it('should provide positive feedback when all tests pass', async () => {
      mockStorageValidation.validateImplementation.mockResolvedValue({
        summary: { totalTests: 10, passed: 10, failed: 0, skipped: 0 }
      });

      mockInterfaceComplianceTests.testCompliance.mockResolvedValue({
        summary: { totalInterfaces: 8, compliantInterfaces: 8, nonCompliantInterfaces: 0 },
        violations: []
      });

      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      expect(report.recommendations.some(r => r.includes('Great job'))).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('should generate markdown report with all sections', async () => {
      const report = await testSuite.runTestSuite({
        modes: ['demo'],
        outputFormat: 'markdown'
      });

      // The markdown report should be logged to console
      const markdownCalls = mockConsoleLog.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('#')
      );
      
      expect(markdownCalls.length).toBeGreaterThan(0);
    });

    it('should include timestamp in report', async () => {
      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp)).toBeInstanceOf(Date);
    });

    it('should preserve config in report', async () => {
      const config: TestSuiteConfig = {
        modes: ['demo', 'local'],
        skipCRUDTests: true,
        outputFormat: 'json'
      };

      const report = await testSuite.runTestSuite(config);

      expect(report.config).toEqual(config);
    });
  });

  describe('Error Handling', () => {
    it('should continue testing other modes when one fails', async () => {
      mockStorageModeManager.getInstance().setMode
        .mockResolvedValueOnce(undefined) // First mode succeeds
        .mockRejectedValueOnce(new Error('Second mode fails')); // Second mode fails

      const report = await testSuite.runTestSuite(defaultConfig);

      expect(report.summary.totalModes).toBe(2);
      expect(report.summary.failedModes).toBe(1);
      expect(report.validationReports.length).toBe(1); // Only successful mode
    });

    it('should handle validation errors gracefully', async () => {
      mockStorageValidation.validateImplementation.mockRejectedValueOnce(new Error('Validation failed'));

      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      expect(report.summary.failedModes).toBe(1);
    });

    it('should handle interface compliance errors gracefully', async () => {
      mockInterfaceComplianceTests.testCompliance.mockRejectedValueOnce(new Error('Compliance test failed'));

      const report = await testSuite.runTestSuite({ modes: ['demo'] });

      // Should still complete the test suite
      expect(report).toBeDefined();
      expect(report.summary.totalModes).toBe(1);
    });
  });
});