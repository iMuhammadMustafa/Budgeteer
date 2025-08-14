/**
 * Automated Test Suite for Storage Validation
 * 
 * This module provides an automated test suite that validates all storage modes
 * (Supabase, Mock, Local) against the same criteria to ensure consistency.
 */

import { StorageValidation, ValidationReport } from './StorageValidation';
import { InterfaceComplianceTests, InterfaceComplianceReport } from './InterfaceComplianceTests';
import { StorageModeManager } from '../StorageModeManager';
import { StorageMode, ProviderRegistry } from '../types';
import { ValidationService } from '../../apis/validation/ValidationService';

export interface TestSuiteConfig {
  modes: StorageMode[];
  skipInterfaceTests?: boolean;
  skipCRUDTests?: boolean;
  skipIntegrityTests?: boolean;
  testTenantId?: string;
  outputFormat?: 'console' | 'json' | 'markdown';
}

export interface TestSuiteReport {
  timestamp: string;
  config: TestSuiteConfig;
  summary: {
    totalModes: number;
    passedModes: number;
    failedModes: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
  };
  validationReports: ValidationReport[];
  complianceReports: InterfaceComplianceReport[];
  crossModeComparison: CrossModeComparisonResult;
  recommendations: string[];
}

export interface CrossModeComparisonResult {
  consistentBehavior: boolean;
  inconsistencies: Inconsistency[];
  performanceComparison: PerformanceComparison[];
}

export interface Inconsistency {
  entityType: string;
  operation: string;
  modes: StorageMode[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceComparison {
  entityType: string;
  operation: string;
  results: Record<StorageMode, number>; // Duration in ms
}

/**
 * Main automated test suite class
 */
export class AutomatedTestSuite {
  private storageValidation: StorageValidation;
  private interfaceComplianceTests: InterfaceComplianceTests;
  private storageManager: StorageModeManager;
  private validationService: ValidationService;

  constructor() {
    this.storageValidation = new StorageValidation();
    this.interfaceComplianceTests = new InterfaceComplianceTests();
    this.storageManager = StorageModeManager.getInstance();
    this.validationService = ValidationService.getInstance();
  }

  /**
   * Run the complete automated test suite
   */
  async runTestSuite(config: TestSuiteConfig): Promise<TestSuiteReport> {
    console.log('🚀 Starting Automated Storage Validation Test Suite...');
    console.log('Configuration:', config);

    const report: TestSuiteReport = {
      timestamp: new Date().toISOString(),
      config,
      summary: {
        totalModes: config.modes.length,
        passedModes: 0,
        failedModes: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      validationReports: [],
      complianceReports: [],
      crossModeComparison: {
        consistentBehavior: true,
        inconsistencies: [],
        performanceComparison: []
      },
      recommendations: []
    };

    // Test each storage mode
    for (const mode of config.modes) {
      console.log(`\n📋 Testing ${mode.toUpperCase()} mode...`);
      
      try {
        // Switch to the target mode
        await this.storageManager.setMode(mode);
        
        // Get providers for this mode
        const providers = this.getProvidersForMode(mode);
        
        // Run validation tests
        if (!config.skipCRUDTests || !config.skipIntegrityTests) {
          const validationReport = await this.storageValidation.validateImplementation(providers, mode);
          report.validationReports.push(validationReport);
          
          // Update summary
          report.summary.totalTests += validationReport.summary.totalTests;
          report.summary.passedTests += validationReport.summary.passed;
          report.summary.failedTests += validationReport.summary.failed;
          report.summary.skippedTests += validationReport.summary.skipped;
        }
        
        // Run interface compliance tests
        if (!config.skipInterfaceTests) {
          const complianceReport = await this.interfaceComplianceTests.testCompliance(providers, mode);
          report.complianceReports.push(complianceReport);
        }
        
        // Check if mode passed overall
        const modeValidationReport = report.validationReports.find(r => r.mode === mode);
        const modeComplianceReport = report.complianceReports.find(r => r.mode === mode);
        
        const validationPassed = !modeValidationReport || modeValidationReport.summary.failed === 0;
        const compliancePassed = !modeComplianceReport || modeComplianceReport.summary.nonCompliantInterfaces === 0;
        
        if (validationPassed && compliancePassed) {
          report.summary.passedModes++;
          console.log(`✅ ${mode.toUpperCase()} mode passed all tests`);
        } else {
          report.summary.failedModes++;
          console.log(`❌ ${mode.toUpperCase()} mode failed some tests`);
        }
        
      } catch (error) {
        console.error(`💥 Error testing ${mode} mode:`, error);
        report.summary.failedModes++;
      }
    }

    // Perform cross-mode comparison
    console.log('\n🔍 Performing cross-mode comparison...');
    report.crossModeComparison = await this.performCrossModeComparison(report);

    // Generate recommendations
    console.log('\n💡 Generating recommendations...');
    report.recommendations = this.generateRecommendations(report);

    // Output results
    await this.outputResults(report);

    console.log('\n🎉 Test suite completed!');
    return report;
  }

  /**
   * Get providers for a specific storage mode
   */
  private getProvidersForMode(mode: StorageMode): ProviderRegistry {
    return {
      accounts: this.storageManager.getAccountProvider(),
      accountCategories: this.storageManager.getAccountCategoryProvider(),
      transactions: this.storageManager.getTransactionProvider(),
      transactionCategories: this.storageManager.getTransactionCategoryProvider(),
      transactionGroups: this.storageManager.getTransactionGroupProvider(),
      configurations: this.storageManager.getConfigurationProvider(),
      recurrings: this.storageManager.getRecurringProvider(),
      stats: this.storageManager.getStatsProvider()
    };
  }

  /**
   * Perform cross-mode comparison analysis
   */
  private async performCrossModeComparison(report: TestSuiteReport): Promise<CrossModeComparisonResult> {
    const result: CrossModeComparisonResult = {
      consistentBehavior: true,
      inconsistencies: [],
      performanceComparison: []
    };

    // Compare validation results across modes
    const entityTypes = ['accounts', 'accountCategories', 'transactions', 'transactionCategories', 
                        'transactionGroups', 'configurations', 'recurrings', 'stats'];
    
    for (const entityType of entityTypes) {
      // Check for inconsistent test results
      const operations = ['create', 'read', 'update', 'delete'];
      
      for (const operation of operations) {
        const results = report.validationReports.map(r => ({
          mode: r.mode,
          result: r.results.find(res => res.entityType === entityType && res.operation === operation)
        }));

        // Check if all modes have the same result for this operation
        const statuses = results.map(r => r.result?.status).filter(Boolean);
        const uniqueStatuses = [...new Set(statuses)];
        
        if (uniqueStatuses.length > 1) {
          result.consistentBehavior = false;
          result.inconsistencies.push({
            entityType,
            operation,
            modes: results.filter(r => r.result?.status === 'failed').map(r => r.mode),
            description: `Inconsistent ${operation} operation results across storage modes`,
            severity: this.determineSeverity(operation, uniqueStatuses)
          });
        }

        // Collect performance data
        const performanceData: Record<StorageMode, number> = {} as any;
        for (const { mode, result: operationResult } of results) {
          if (operationResult && operationResult.duration) {
            performanceData[mode] = operationResult.duration;
          }
        }

        if (Object.keys(performanceData).length > 1) {
          result.performanceComparison.push({
            entityType,
            operation,
            results: performanceData
          });
        }
      }
    }

    // Compare interface compliance
    for (const entityType of entityTypes) {
      const complianceResults = report.complianceReports.map(r => ({
        mode: r.mode,
        result: r.results.find(res => res.entityType === entityType)
      }));

      const complianceStatuses = complianceResults.map(r => r.result?.isCompliant);
      const uniqueComplianceStatuses = [...new Set(complianceStatuses)];

      if (uniqueComplianceStatuses.length > 1) {
        result.consistentBehavior = false;
        result.inconsistencies.push({
          entityType,
          operation: 'interface_compliance',
          modes: complianceResults.filter(r => !r.result?.isCompliant).map(r => r.mode),
          description: `Inconsistent interface compliance across storage modes`,
          severity: 'high'
        });
      }
    }

    return result;
  }

  /**
   * Determine severity of an inconsistency
   */
  private determineSeverity(operation: string, statuses: (string | undefined)[]): 'low' | 'medium' | 'high' | 'critical' {
    if (statuses.includes('failed')) {
      if (operation === 'create' || operation === 'read') {
        return 'critical';
      } else if (operation === 'update' || operation === 'delete') {
        return 'high';
      }
    }
    return 'medium';
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(report: TestSuiteReport): string[] {
    const recommendations: string[] = [];

    // Check overall success rate
    const successRate = (report.summary.passedTests / report.summary.totalTests) * 100;
    if (successRate < 90) {
      recommendations.push(`Overall test success rate is ${successRate.toFixed(1)}%. Consider addressing failing tests to improve reliability.`);
    }

    // Check for failed modes
    if (report.summary.failedModes > 0) {
      recommendations.push(`${report.summary.failedModes} storage mode(s) failed tests. Review the detailed reports to identify and fix issues.`);
    }

    // Check for interface compliance issues
    const nonCompliantModes = report.complianceReports.filter(r => r.summary.nonCompliantInterfaces > 0);
    if (nonCompliantModes.length > 0) {
      recommendations.push(`Interface compliance issues found in ${nonCompliantModes.map(r => r.mode).join(', ')} mode(s). Ensure all providers implement the required interfaces.`);
    }

    // Check for cross-mode inconsistencies
    if (!report.crossModeComparison.consistentBehavior) {
      const criticalInconsistencies = report.crossModeComparison.inconsistencies.filter(i => i.severity === 'critical');
      if (criticalInconsistencies.length > 0) {
        recommendations.push(`Critical inconsistencies found between storage modes. These must be addressed immediately to ensure data integrity.`);
      }
      
      const highInconsistencies = report.crossModeComparison.inconsistencies.filter(i => i.severity === 'high');
      if (highInconsistencies.length > 0) {
        recommendations.push(`High-priority inconsistencies found between storage modes. Consider standardizing behavior across all implementations.`);
      }
    }

    // Performance recommendations
    const performanceIssues = report.crossModeComparison.performanceComparison.filter(p => {
      const times = Object.values(p.results);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      return maxTime > minTime * 3; // If max is 3x slower than min
    });

    if (performanceIssues.length > 0) {
      recommendations.push(`Significant performance differences detected between storage modes. Consider optimizing slower implementations.`);
    }

    // If no issues found
    if (recommendations.length === 0) {
      recommendations.push('All storage implementations are working correctly and consistently. Great job!');
    }

    return recommendations;
  }

  /**
   * Output test results in the specified format
   */
  private async outputResults(report: TestSuiteReport): Promise<void> {
    const format = report.config.outputFormat || 'console';

    switch (format) {
      case 'console':
        this.outputToConsole(report);
        break;
      case 'json':
        console.log('\n📄 JSON Report:');
        console.log(JSON.stringify(report, null, 2));
        break;
      case 'markdown':
        const markdownReport = this.generateMarkdownReport(report);
        console.log('\n📄 Markdown Report:');
        console.log(markdownReport);
        break;
    }
  }

  /**
   * Output results to console
   */
  private outputToConsole(report: TestSuiteReport): void {
    console.log('\n📊 TEST SUITE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Modes Tested: ${report.summary.totalModes}`);
    console.log(`Passed Modes: ${report.summary.passedModes}`);
    console.log(`Failed Modes: ${report.summary.failedModes}`);
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed Tests: ${report.summary.passedTests}`);
    console.log(`Failed Tests: ${report.summary.failedTests}`);
    console.log(`Skipped Tests: ${report.summary.skippedTests}`);
    
    const successRate = (report.summary.passedTests / report.summary.totalTests) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);

    if (report.crossModeComparison.inconsistencies.length > 0) {
      console.log('\n⚠️  INCONSISTENCIES FOUND');
      console.log('-'.repeat(30));
      for (const inconsistency of report.crossModeComparison.inconsistencies) {
        console.log(`${inconsistency.severity.toUpperCase()}: ${inconsistency.description}`);
        console.log(`  Entity: ${inconsistency.entityType}, Operation: ${inconsistency.operation}`);
        console.log(`  Affected Modes: ${inconsistency.modes.join(', ')}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('-'.repeat(20));
      for (const recommendation of report.recommendations) {
        console.log(`• ${recommendation}`);
      }
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: TestSuiteReport): string {
    let markdown = '# Storage Validation Test Suite Report\n\n';
    markdown += `**Generated:** ${report.timestamp}\n\n`;

    // Summary
    markdown += '## Summary\n\n';
    markdown += `- **Total Modes Tested:** ${report.summary.totalModes}\n`;
    markdown += `- **Passed Modes:** ${report.summary.passedModes}\n`;
    markdown += `- **Failed Modes:** ${report.summary.failedModes}\n`;
    markdown += `- **Total Tests:** ${report.summary.totalTests}\n`;
    markdown += `- **Passed Tests:** ${report.summary.passedTests}\n`;
    markdown += `- **Failed Tests:** ${report.summary.failedTests}\n`;
    markdown += `- **Skipped Tests:** ${report.summary.skippedTests}\n`;
    
    const successRate = (report.summary.passedTests / report.summary.totalTests) * 100;
    markdown += `- **Success Rate:** ${successRate.toFixed(1)}%\n\n`;

    // Validation results
    if (report.validationReports.length > 0) {
      markdown += '## Validation Results by Mode\n\n';
      for (const validationReport of report.validationReports) {
        markdown += `### ${validationReport.mode.toUpperCase()} Mode\n\n`;
        markdown += `- Total Tests: ${validationReport.summary.totalTests}\n`;
        markdown += `- Passed: ${validationReport.summary.passed}\n`;
        markdown += `- Failed: ${validationReport.summary.failed}\n`;
        markdown += `- Skipped: ${validationReport.summary.skipped}\n\n`;
      }
    }

    // Interface compliance
    if (report.complianceReports.length > 0) {
      markdown += '## Interface Compliance\n\n';
      for (const complianceReport of report.complianceReports) {
        const complianceRate = (complianceReport.summary.compliantInterfaces / complianceReport.summary.totalInterfaces) * 100;
        markdown += `### ${complianceReport.mode.toUpperCase()} Mode\n\n`;
        markdown += `- Compliance Rate: ${complianceRate.toFixed(1)}%\n`;
        markdown += `- Compliant Interfaces: ${complianceReport.summary.compliantInterfaces}\n`;
        markdown += `- Non-Compliant Interfaces: ${complianceReport.summary.nonCompliantInterfaces}\n\n`;
      }
    }

    // Inconsistencies
    if (report.crossModeComparison.inconsistencies.length > 0) {
      markdown += '## Cross-Mode Inconsistencies\n\n';
      for (const inconsistency of report.crossModeComparison.inconsistencies) {
        markdown += `### ${inconsistency.severity.toUpperCase()}: ${inconsistency.entityType}.${inconsistency.operation}\n\n`;
        markdown += `${inconsistency.description}\n\n`;
        markdown += `**Affected Modes:** ${inconsistency.modes.join(', ')}\n\n`;
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      markdown += '## Recommendations\n\n';
      for (const recommendation of report.recommendations) {
        markdown += `- ${recommendation}\n`;
      }
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Run a quick validation test for a specific mode
   */
  async quickValidation(mode: StorageMode): Promise<boolean> {
    try {
      await this.storageManager.setMode(mode);
      const providers = this.getProvidersForMode(mode);
      
      // Run a minimal test suite
      const report = await this.storageValidation.validateImplementation(providers, mode);
      
      return report.summary.failed === 0;
    } catch (error) {
      console.error(`Quick validation failed for ${mode}:`, error);
      return false;
    }
  }

  /**
   * Run interface compliance test only
   */
  async testInterfaceCompliance(modes: StorageMode[]): Promise<InterfaceComplianceReport[]> {
    const reports: InterfaceComplianceReport[] = [];
    
    for (const mode of modes) {
      await this.storageManager.setMode(mode);
      const providers = this.getProvidersForMode(mode);
      const report = await this.interfaceComplianceTests.testCompliance(providers, mode);
      reports.push(report);
    }
    
    return reports;
  }
}