/**
 * Test Runner for TanStack Query Integration Tests
 * 
 * This script runs all TanStack Query integration tests and generates a comprehensive report
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  testSuite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  results: TestResult[];
  summary: string;
}

const TEST_SUITES = [
  'TanStackQueryIntegration.test.ts',
  'QueryCaching.test.ts',
  'ErrorHandling.test.ts',
  'QueryInvalidation.test.ts'
];

/**
 * Runs a single test suite and parses the results
 */
function runTestSuite(testFile: string): TestResult {
  console.log(`Running test suite: ${testFile}`);
  
  const startTime = Date.now();
  let result: TestResult = {
    testSuite: testFile,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    errors: []
  };

  try {
    const output = execSync(
      `npm test -- --testPathPattern="${testFile}" --verbose --json`,
      { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000 // 60 second timeout
      }
    );

    // Parse Jest JSON output
    const lines = output.split('\n');
    const jsonLine = lines.find(line => line.startsWith('{') && line.includes('testResults'));
    
    if (jsonLine) {
      const jestResult = JSON.parse(jsonLine);
      const testResult = jestResult.testResults[0];
      
      if (testResult) {
        result.passed = testResult.numPassingTests || 0;
        result.failed = testResult.numFailingTests || 0;
        result.skipped = testResult.numPendingTests || 0;
        result.duration = testResult.perfStats?.end - testResult.perfStats?.start || 0;
        
        if (testResult.failureMessage) {
          result.errors.push(testResult.failureMessage);
        }
      }
    }

  } catch (error: any) {
    result.failed = 1;
    result.errors.push(`Test suite failed to run: ${error.message}`);
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Generates a comprehensive test report
 */
function generateReport(results: TestResult[]): TestReport {
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const totalTests = totalPassed + totalFailed + totalSkipped;

  let summary = `TanStack Query Integration Test Results\n`;
  summary += `=====================================\n\n`;
  summary += `Total Tests: ${totalTests}\n`;
  summary += `Passed: ${totalPassed}\n`;
  summary += `Failed: ${totalFailed}\n`;
  summary += `Skipped: ${totalSkipped}\n`;
  summary += `Duration: ${(totalDuration / 1000).toFixed(2)}s\n\n`;

  if (totalFailed === 0) {
    summary += `✅ All tests passed! TanStack Query integration is working correctly across all storage modes.\n\n`;
  } else {
    summary += `❌ ${totalFailed} test(s) failed. Please review the errors below.\n\n`;
  }

  summary += `Test Suite Breakdown:\n`;
  summary += `---------------------\n`;
  
  results.forEach(result => {
    const status = result.failed > 0 ? '❌' : '✅';
    summary += `${status} ${result.testSuite}: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped (${(result.duration / 1000).toFixed(2)}s)\n`;
    
    if (result.errors.length > 0) {
      summary += `   Errors:\n`;
      result.errors.forEach(error => {
        summary += `   - ${error.split('\n')[0]}\n`;
      });
    }
  });

  summary += `\nTest Coverage Areas:\n`;
  summary += `-------------------\n`;
  summary += `• Storage mode switching (Cloud, Demo, Local)\n`;
  summary += `• Query caching behavior across storage implementations\n`;
  summary += `• Error handling in TanStack Query with storage architecture\n`;
  summary += `• Query invalidation across all storage modes\n`;
  summary += `• Repository layer integration with dependency injection\n`;
  summary += `• Performance and memory management\n`;
  summary += `• Cross-entity query relationships\n`;

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped,
    totalDuration,
    results,
    summary
  };
}

/**
 * Main test runner function
 */
async function runAllTests(): Promise<void> {
  console.log('Starting TanStack Query Integration Tests...\n');
  
  const results: TestResult[] = [];
  
  for (const testSuite of TEST_SUITES) {
    const result = runTestSuite(testSuite);
    results.push(result);
    
    console.log(`✓ Completed ${testSuite}: ${result.passed} passed, ${result.failed} failed\n`);
  }
  
  const report = generateReport(results);
  
  // Output summary to console
  console.log(report.summary);
  
  // Save detailed report to file
  const reportPath = join(__dirname, 'tanstack-query-test-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  const summaryPath = join(__dirname, 'tanstack-query-test-summary.txt');
  writeFileSync(summaryPath, report.summary);
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
  console.log(`Summary saved to: ${summaryPath}`);
  
  // Exit with appropriate code
  process.exit(report.totalFailed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests, generateReport, runTestSuite };