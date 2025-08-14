/**
 * Global teardown for TanStack Query Integration Tests
 */

export default async function globalTeardown() {
  console.log('🧹 Cleaning up TanStack Query Integration Tests...');
  
  // Clean up any global state
  if (global.indexedDB) {
    delete global.indexedDB;
  }
  
  if (global.navigator) {
    delete global.navigator;
  }
  
  // Clear any timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  console.log('✅ Global teardown completed');
}