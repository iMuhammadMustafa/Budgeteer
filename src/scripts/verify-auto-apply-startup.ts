/**
 * Verification script for auto-apply startup functionality
 * This script can be run to verify that the auto-apply startup integration is working correctly
 */

import { AutoApplyStartupService, createAutoApplyStartupService } from '../services/AutoApplyStartupService';
import { IAutoApplyService } from '../services/AutoApply.Service';
import { AutoApplyResult } from '../types/recurring';

// Mock auto-apply service for verification
const createMockAutoApplyService = (): IAutoApplyService => {
  const mockMutation = {
    mutate: (_, callbacks: any) => {
      // Simulate successful auto-apply after a short delay
      setTimeout(() => {
        const mockResult: AutoApplyResult = {
          appliedCount: 2,
          failedCount: 0,
          pendingCount: 1,
          appliedTransactions: [],
          failedTransactions: [],
          pendingTransactions: []
        };
        callbacks.onSuccess(mockResult);
      }, 100);
    }
  };

  return {
    checkAndApplyDueTransactions: () => mockMutation as any,
    getDueRecurringTransactions: jest.fn(),
    applyRecurringTransaction: jest.fn(),
    batchApplyTransactions: jest.fn(),
    setAutoApplyEnabled: jest.fn(),
    getAutoApplySettings: jest.fn(),
    updateAutoApplySettings: jest.fn(),
    engine: {} as any
  };
};

// Mock notification system
const createMockNotificationSystem = () => {
  const notifications: Array<{ message: string; type: string }> = [];
  
  return {
    addNotification: (notification: { message: string; type: string }) => {
      notifications.push(notification);
      console.log(`📱 Notification [${notification.type.toUpperCase()}]: ${notification.message}`);
    },
    getNotifications: () => notifications,
    clearNotifications: () => notifications.splice(0, notifications.length)
  };
};

/**
 * Verify basic auto-apply startup functionality
 */
async function verifyBasicStartup() {
  console.log('🔍 Verifying basic auto-apply startup functionality...');
  
  const mockAutoApplyService = createMockAutoApplyService();
  const mockNotificationSystem = createMockNotificationSystem();
  
  const startupService = createAutoApplyStartupService(
    mockAutoApplyService,
    mockNotificationSystem,
    {
      delayMs: 500,
      enableLogging: true,
      skipOnError: true
    }
  );

  try {
    const result = await startupService.initializeOnStartup();
    
    if (result?.success) {
      console.log('✅ Basic startup verification passed');
      console.log(`   - Applied: ${result.result?.appliedCount || 0}`);
      console.log(`   - Failed: ${result.result?.failedCount || 0}`);
      console.log(`   - Pending: ${result.result?.pendingCount || 0}`);
      console.log(`   - Execution time: ${result.executionTimeMs}ms`);
      return true;
    } else {
      console.log('❌ Basic startup verification failed');
      console.log(`   - Error: ${result?.error?.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Basic startup verification threw error:', error);
    return false;
  }
}

/**
 * Verify error handling in auto-apply startup
 */
async function verifyErrorHandling() {
  console.log('🔍 Verifying error handling...');
  
  const mockAutoApplyService: IAutoApplyService = {
    checkAndApplyDueTransactions: () => ({
      mutate: (_, callbacks: any) => {
        setTimeout(() => {
          callbacks.onError(new Error('Simulated network error'));
        }, 100);
      }
    }) as any,
    getDueRecurringTransactions: jest.fn(),
    applyRecurringTransaction: jest.fn(),
    batchApplyTransactions: jest.fn(),
    setAutoApplyEnabled: jest.fn(),
    getAutoApplySettings: jest.fn(),
    updateAutoApplySettings: jest.fn(),
    engine: {} as any
  };

  const mockNotificationSystem = createMockNotificationSystem();
  
  const startupService = createAutoApplyStartupService(
    mockAutoApplyService,
    mockNotificationSystem,
    {
      delayMs: 500,
      maxRetries: 1,
      enableLogging: true,
      skipOnError: true
    }
  );

  try {
    const result = await startupService.initializeOnStartup();
    
    if (!result?.success && result?.error) {
      console.log('✅ Error handling verification passed');
      console.log(`   - Error handled: ${result.error.message}`);
      console.log(`   - Retry count: ${result.retryCount}`);
      return true;
    } else {
      console.log('❌ Error handling verification failed - expected error but got success');
      return false;
    }
  } catch (error) {
    console.log('❌ Error handling verification threw unexpected error:', error);
    return false;
  }
}

/**
 * Verify configuration options
 */
async function verifyConfiguration() {
  console.log('🔍 Verifying configuration options...');
  
  const mockAutoApplyService = createMockAutoApplyService();
  const mockNotificationSystem = createMockNotificationSystem();
  
  // Test with disabled configuration
  const disabledService = createAutoApplyStartupService(
    mockAutoApplyService,
    mockNotificationSystem,
    {
      enabled: false,
      enableLogging: true
    }
  );

  try {
    const result = await disabledService.initializeOnStartup();
    
    if (result === null) {
      console.log('✅ Configuration verification passed');
      console.log('   - Disabled service correctly returned null');
      return true;
    } else {
      console.log('❌ Configuration verification failed - disabled service should return null');
      return false;
    }
  } catch (error) {
    console.log('❌ Configuration verification threw error:', error);
    return false;
  }
}

/**
 * Verify performance characteristics
 */
async function verifyPerformance() {
  console.log('🔍 Verifying performance characteristics...');
  
  const mockAutoApplyService = createMockAutoApplyService();
  const mockNotificationSystem = createMockNotificationSystem();
  
  const startupService = createAutoApplyStartupService(
    mockAutoApplyService,
    mockNotificationSystem,
    {
      delayMs: 100,
      enableLogging: false // Disable logging for performance test
    }
  );

  const startTime = Date.now();
  
  try {
    const result = await startupService.initializeOnStartup();
    const totalTime = Date.now() - startTime;
    
    if (result?.success && totalTime < 1000) {
      console.log('✅ Performance verification passed');
      console.log(`   - Total time: ${totalTime}ms`);
      console.log(`   - Execution time: ${result.executionTimeMs}ms`);
      return true;
    } else {
      console.log('❌ Performance verification failed');
      console.log(`   - Total time: ${totalTime}ms (should be < 1000ms)`);
      return false;
    }
  } catch (error) {
    console.log('❌ Performance verification threw error:', error);
    return false;
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('🚀 Starting Auto-Apply Startup Verification\n');
  
  const tests = [
    { name: 'Basic Startup', fn: verifyBasicStartup },
    { name: 'Error Handling', fn: verifyErrorHandling },
    { name: 'Configuration', fn: verifyConfiguration },
    { name: 'Performance', fn: verifyPerformance }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} verification threw unexpected error:`, error);
      failed++;
    }
    console.log(''); // Add spacing between tests
  }

  console.log('📊 Verification Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All verifications passed! Auto-apply startup integration is working correctly.');
  } else {
    console.log('\n⚠️  Some verifications failed. Please review the implementation.');
  }

  return failed === 0;
}

// Export for use in other scripts or tests
export {
  runVerification,
  verifyBasicStartup,
  verifyErrorHandling,
  verifyConfiguration,
  verifyPerformance
};

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification script failed:', error);
    process.exit(1);
  });
}