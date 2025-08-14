#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script runs all tests in the project, generates reports,
 * and provides a comprehensive overview of test results.
 * 
 * Usage: npm run test:all or node src/__tests__/runAllTests.ts
 */

import { runComprehensiveTests, TestRunner } from './TestRunner';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🚀 Starting comprehensive test suite...\n');

  try {
    // Run all tests
    const report = await runComprehensiveTests();

    // Display summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`Total Test Suites: ${report.totalSuites}`);
    console.log(`✅ Passed: ${report.passedSuites}`);
    console.log(`❌ Failed: ${report.failedSuites}`);
    console.log(`⏭️  Skipped: ${report.skippedSuites}`);
    console.log(`\nTotal Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`\n${report.summary}\n`);

    // Display detailed results
    console.log('📋 Detailed Results:');
    console.log('====================');
    
    report.results.forEach(result => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : '⏭️';
      
      console.log(`${statusIcon} ${result.suiteName} (${result.duration}ms)`);
      
      if (result.warnings.length > 0) {
        console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
        result.warnings.forEach(warning => {
          console.log(`      - ${warning}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.log(`   ❌ Errors: ${result.errors.length}`);
        result.errors.forEach((error, index) => {
          if (index === 0) {
            console.log(`      - ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
          }
        });
      }
    });

    // Generate recommendations
    console.log('\n💡 Recommendations:');
    console.log('===================');
    
    if (report.failedSuites > 0) {
      console.log('❌ Some test suites failed. Consider:');
      console.log('   - Reviewing error messages in the detailed report');
      console.log('   - Checking environment setup and dependencies');
      console.log('   - Running individual test suites to isolate issues');
    }
    
    if (report.passedSuites === report.totalSuites) {
      console.log('✅ All test suites passed! Great job!');
      console.log('   - Consider adding more edge case tests');
      console.log('   - Review code coverage reports');
      console.log('   - Consider performance optimization tests');
    }

    const passRate = report.totalSuites > 0 ? (report.passedSuites / report.totalSuites) * 100 : 0;
    if (passRate >= 80) {
      console.log(`✅ Good test pass rate: ${passRate.toFixed(1)}%`);
    } else if (passRate >= 60) {
      console.log(`⚠️  Moderate test pass rate: ${passRate.toFixed(1)}% - Consider fixing failing tests`);
    } else {
      console.log(`❌ Low test pass rate: ${passRate.toFixed(1)}% - Immediate attention needed`);
    }

    // File locations
    console.log('\n📁 Report Files:');
    console.log('================');
    console.log(`📄 JSON Report: ${path.resolve('test-report.json')}`);
    console.log(`🌐 HTML Report: ${path.resolve('test-report.html')}`);

    // Exit with appropriate code
    process.exit(report.failedSuites > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { main as runAllTests };