/**
 * Jest setup for TanStack Query Integration Tests
 */

import 'react-native-get-random-values';

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (options: any) => options.web || options.default,
  },
  Alert: {
    alert: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    readTransaction: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

// Mock Dexie for IndexedDB
jest.mock('dexie', () => {
  class MockDexie {
    version() {
      return {
        stores: jest.fn().mockReturnThis(),
      };
    }
    
    open() {
      return Promise.resolve();
    }
    
    close() {
      return Promise.resolve();
    }
    
    delete() {
      return Promise.resolve();
    }
  }
  
  return {
    Dexie: MockDexie,
    default: MockDexie,
  };
});

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-v4'),
  v7: jest.fn(() => 'test-uuid-v7'),
}));

// Mock dayjs
jest.mock('dayjs', () => {
  const mockDayjs = (date?: any) => ({
    format: jest.fn(() => '2023-10-01'),
    toISOString: jest.fn(() => '2023-10-01T00:00:00.000Z'),
    valueOf: jest.fn(() => 1696118400000),
  });
  
  mockDayjs.extend = jest.fn();
  return mockDayjs;
});

// Mock AuthProvider
const mockSession = {
  user: {
    id: 'test-user-id',
    user_metadata: {
      tenantid: 'test-tenant-id',
    },
  },
  access_token: 'test-token',
};

jest.mock('@/src/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    session: mockSession,
    user: mockSession.user,
    loading: false,
    error: null,
  })),
}));

// Mock DemoModeGlobal
jest.mock('@/src/providers/DemoModeGlobal', () => ({
  getDemoMode: jest.fn(() => false),
  setDemoMode: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { mockAsyncStorage, mockSession };