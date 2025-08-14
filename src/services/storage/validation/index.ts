/**
 * Storage Validation Framework
 * 
 * Comprehensive validation and testing framework for all storage implementations
 * to ensure consistency across Supabase, Mock, and Local storage modes.
 */

// Main validation classes
export { StorageValidation } from './StorageValidation';
export { InterfaceComplianceTests } from './InterfaceComplianceTests';
export { AutomatedTestSuite } from './AutomatedTestSuite';

// Types and interfaces
export type {
  ValidationReport,
  ValidationResult,
  ValidationError,
  CRUDTestData
} from './StorageValidation';

export type {
  InterfaceComplianceReport,
  InterfaceComplianceResult,
  InterfaceViolation,
  MethodSignature,
  ParameterInfo
} from './InterfaceComplianceTests';

export type {
  TestSuiteConfig,
  TestSuiteReport,
  CrossModeComparisonResult,
  Inconsistency,
  PerformanceComparison
} from './AutomatedTestSuite';

// Convenience functions for common validation tasks
export const ValidationUtils = {
  /**
   * Quick validation of a single storage mode
   */
  async quickValidate(mode: 'cloud' | 'demo' | 'local'): Promise<boolean> {
    const testSuite = new AutomatedTestSuite();
    return await testSuite.quickValidation(mode);
  },

  /**
   * Run interface compliance tests for all modes
   */
  async testAllModeCompliance(): Promise<InterfaceComplianceReport[]> {
    const testSuite = new AutomatedTestSuite();
    return await testSuite.testInterfaceCompliance(['cloud', 'demo', 'local']);
  },

  /**
   * Run full validation suite with default configuration
   */
  async runFullValidation(): Promise<TestSuiteReport> {
    const testSuite = new AutomatedTestSuite();
    return await testSuite.runTestSuite({
      modes: ['cloud', 'demo', 'local'],
      outputFormat: 'console'
    });
  },

  /**
   * Run validation for development (skip slow tests)
   */
  async runDevValidation(): Promise<TestSuiteReport> {
    const testSuite = new AutomatedTestSuite();
    return await testSuite.runTestSuite({
      modes: ['demo', 'local'], // Skip cloud for faster dev testing
      skipIntegrityTests: true, // Skip slower integrity tests
      outputFormat: 'console'
    });
  }
};

// Re-export validation classes for direct instantiation
import { StorageValidation } from './StorageValidation';
import { InterfaceComplianceTests } from './InterfaceComplianceTests';
import { AutomatedTestSuite } from './AutomatedTestSuite';

export {
  StorageValidation,
  InterfaceComplianceTests,
  AutomatedTestSuite
};