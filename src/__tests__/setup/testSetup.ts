/**
 * Test Setup Configuration
 *
 * This file configures the test environment to handle common issues
 * and provides mocks for React Native and Supabase dependencies.
 */

import "@testing-library/jest-native/extend-expect";

/**
 * Mock React Native Safe Area Context (all entry points)
 */
jest.mock("react-native-safe-area-context", () => {
  const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => children;
  SafeAreaProvider.displayName = "SafeAreaProvider";
  const SafeAreaView = ({ children }: { children: React.ReactNode }) => children;
  SafeAreaView.displayName = "SafeAreaView";
  return {
    SafeAreaProvider,
    SafeAreaView,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 667 }),
  };
});

/**
 * Mock React Native CSS Interop
 * Use a simple object to avoid out-of-scope variable issues.
 */
jest.mock("react-native-css-interop", () => ({
  cssInterop: jest.fn(),
  createInteropElement: jest.fn(),
}));

// Optionally, mock only specific APIs if needed, but do not mock the entire "react-native" module.

// Mock React Native URL Polyfill
jest.mock("react-native-url-polyfill/auto", () => {});

// Mock React Native Get Random Values
jest.mock("react-native-get-random-values", () => {});

// Mock Expo modules
jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: "https://test.supabase.co",
        supabaseAnonKey: "test-key",
      },
    },
  },
}));

jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    })),
    closeSync: jest.fn(),
  })),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Dexie for IndexedDB
jest.mock("dexie", () => {
  const mockTable = {
    add: jest.fn(() => Promise.resolve("mock-id")),
    put: jest.fn(() => Promise.resolve("mock-id")),
    get: jest.fn(() => Promise.resolve(null)),
    where: jest.fn(() => ({
      equals: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([])),
        first: jest.fn(() => Promise.resolve(null)),
        modify: jest.fn(() => Promise.resolve(0)),
        delete: jest.fn(() => Promise.resolve(0)),
      })),
      anyOf: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([])),
      })),
    })),
    toArray: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  class MockDexie {
    accounts = mockTable;
    accountCategories = mockTable;
    transactions = mockTable;
    transactionCategories = mockTable;
    transactionGroups = mockTable;
    configurations = mockTable;
    recurrings = mockTable;

    version() {
      return {
        stores: jest.fn(),
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
    Table: jest.fn(),
  };
});

// Mock the BudgeteerDatabase to prevent Dexie inheritance issues
jest.mock("../../services/apis/local/BudgeteerDatabase", () => {
  const mockTable = {
    add: jest.fn(() => Promise.resolve("mock-id")),
    put: jest.fn(() => Promise.resolve("mock-id")),
    get: jest.fn(() => Promise.resolve(null)),
    where: jest.fn(() => ({
      equals: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([])),
        first: jest.fn(() => Promise.resolve(null)),
        modify: jest.fn(() => Promise.resolve(0)),
        delete: jest.fn(() => Promise.resolve(0)),
      })),
    })),
    toArray: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  return {
    BudgeteerDatabase: jest.fn().mockImplementation(() => ({
      accounts: mockTable,
      accountCategories: mockTable,
      transactions: mockTable,
      transactionCategories: mockTable,
      transactionGroups: mockTable,
      configurations: mockTable,
      recurrings: mockTable,
      open: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      migrate: jest.fn(() => Promise.resolve()),
    })),
  };
});

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));

// Mock UUID
jest.mock("uuid", () => ({
  v4: jest.fn(() => "00000000-0000-0000-0000-000000000000"),
  v7: jest.fn(() => "00000000-0000-0000-0000-000000000000"),
}));

// Set up environment variables before any imports
(process.env as any).NODE_ENV = "test";
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});

export {};
// Mock Storage Providers to prevent import issues
jest.mock("../../services/storage/StorageModeManager", () => {
  const instance = {
    setMode: jest.fn(() => Promise.resolve()),
    getCurrentMode: jest.fn(() => "demo"),
    cleanup: jest.fn(() => Promise.resolve()),
    getStorageInfo: jest.fn(() => Promise.resolve({ mode: "demo" })),
  };
  return {
    StorageModeManager: {
      getInstance: jest.fn(() => instance),
    },
  };
});

jest.mock("../../services/storage/DIContainer", () => ({
  DIContainer: jest.fn().mockImplementation(() => ({
    getProvider: jest.fn(entityType => {
      const mockProvider = {
        getAllAccounts: jest.fn(() => Promise.resolve([])),
        getAccountById: jest.fn(() => Promise.resolve(null)),
        createAccount: jest.fn(data => Promise.resolve({ ...data, id: data.id || "mock-id" })),
        updateAccount: jest.fn(data => Promise.resolve({ ...data })),
        deleteAccount: jest.fn(() => Promise.resolve()),
        restoreAccount: jest.fn(() => Promise.resolve()),
        updateAccountBalance: jest.fn(() => Promise.resolve()),
        getTotalAccountBalance: jest.fn(() => Promise.resolve({ totalbalance: 0 })),

        getAllTransactions: jest.fn(() => Promise.resolve([])),
        getTransactionById: jest.fn(() => Promise.resolve(null)),
        createTransaction: jest.fn(data => Promise.resolve({ ...data, id: data.id || "mock-id" })),
        updateTransaction: jest.fn(data => Promise.resolve({ ...data })),
        deleteTransaction: jest.fn(() => Promise.resolve()),
        restoreTransaction: jest.fn(() => Promise.resolve()),

        getAllAccountCategories: jest.fn(() => Promise.resolve([])),
        getAccountCategoryById: jest.fn(() => Promise.resolve(null)),
        createAccountCategory: jest.fn(data => Promise.resolve({ ...data, id: data.id || "mock-id" })),
        updateAccountCategory: jest.fn(data => Promise.resolve({ ...data })),
        deleteAccountCategory: jest.fn(() => Promise.resolve()),
        restoreAccountCategory: jest.fn(() => Promise.resolve()),

        getAllTransactionCategories: jest.fn(() => Promise.resolve([])),
        getTransactionCategoryById: jest.fn(() => Promise.resolve(null)),
        createTransactionCategory: jest.fn(data => Promise.resolve({ ...data, id: data.id || "mock-id" })),
        updateTransactionCategory: jest.fn(data => Promise.resolve({ ...data })),
        deleteTransactionCategory: jest.fn(() => Promise.resolve()),
        restoreTransactionCategory: jest.fn(() => Promise.resolve()),
      };
      return mockProvider;
    }),
  })),
}));

// Mock the local storage providers
jest.mock("../../services/apis/local/Accounts.local", () => ({
  AccountsLocal: jest.fn(),
}));

jest.mock("../../services/apis/local/AccountCategories.local", () => ({
  AccountCategoriesLocal: jest.fn(),
}));

jest.mock("../../services/apis/local/Transactions.local", () => ({
  TransactionsLocal: jest.fn(),
}));

jest.mock("../../services/apis/local/TransactionCategories.local", () => ({
  TransactionCategoriesLocal: jest.fn(),
}));
