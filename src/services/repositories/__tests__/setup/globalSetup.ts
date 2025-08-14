/**
 * Global setup for TanStack Query Integration Tests
 */

export default async function globalSetup() {
  console.log('🚀 Setting up TanStack Query Integration Tests...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  
  // Mock global objects that might be needed
  global.window = global.window || {};
  global.document = global.document || {};
  
  // Mock IndexedDB for web storage tests
  if (!global.indexedDB) {
    global.indexedDB = {
      open: jest.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: {
          createObjectStore: jest.fn(),
          transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
              add: jest.fn(),
              get: jest.fn(),
              put: jest.fn(),
              delete: jest.fn(),
              getAll: jest.fn(),
            })),
          })),
        },
      })),
      deleteDatabase: jest.fn(),
    };
  }
  
  // Mock navigator for network status
  if (!global.navigator) {
    global.navigator = {
      onLine: true,
      userAgent: 'test-user-agent',
    } as any;
  }
  
  console.log('✅ Global setup completed');
}