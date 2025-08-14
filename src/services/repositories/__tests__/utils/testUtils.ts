/**
 * Test utilities for TanStack Query integration tests
 */

import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, createElement } from 'react';
import { Session } from '@supabase/supabase-js';
import { Account, AccountCategory, Transaction, Inserts } from '@/src/types/db/Tables.Types';
import { TableNames } from '@/src/types/db/TableNames';

/**
 * Creates a test QueryClient with appropriate settings for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for faster tests
        gcTime: 0, // Disable garbage collection for predictable tests
        staleTime: 0, // Always consider data stale for testing
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {}, // Disable logging in tests
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Creates a wrapper component for React Query testing
 */
export function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => 
    createElement(QueryClientProvider, { client: queryClient }, children);
}

/**
 * Mock session for testing
 */
export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    aud: 'supabase',
    role: 'authenticated',
    created_at: '2023-10-01T00:00:00Z',
    app_metadata: {
      provider: 'email',
      roles: ['user'],
    },
    user_metadata: {
      full_name: 'Test User',
      tenantid: 'test-tenant-id',
    },
  },
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'Bearer',
};

/**
 * Creates a mock account for testing
 */
export function createMockAccount(overrides?: Partial<Inserts<TableNames.Accounts>>): Inserts<TableNames.Accounts> {
  return {
    id: 'test-account-id',
    tenantid: 'test-tenant-id',
    name: 'Test Account',
    balance: 1000,
    categoryid: 'test-category-id',
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: 'test-user-id',
    updatedat: new Date().toISOString(),
    updatedby: 'test-user-id',
    ...overrides,
  };
}

/**
 * Creates a mock account category for testing
 */
export function createMockAccountCategory(overrides?: Partial<Inserts<TableNames.AccountCategories>>): Inserts<TableNames.AccountCategories> {
  return {
    id: 'test-category-id',
    tenantid: 'test-tenant-id',
    name: 'Test Category',
    type: 'Asset',
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: 'test-user-id',
    updatedat: new Date().toISOString(),
    updatedby: 'test-user-id',
    ...overrides,
  };
}

/**
 * Creates a mock transaction for testing
 */
export function createMockTransaction(overrides?: Partial<Inserts<TableNames.Transactions>>): Inserts<TableNames.Transactions> {
  return {
    id: 'test-transaction-id',
    tenantid: 'test-tenant-id',
    name: 'Test Transaction',
    date: new Date().toISOString().split('T')[0],
    payee: 'Test Payee',
    description: 'Test Description',
    tags: ['test'],
    notes: 'Test Notes',
    type: 'Expense',
    categoryid: 'test-transaction-category-id',
    isvoid: false,
    amount: -100,
    accountid: 'test-account-id',
    isdeleted: false,
    createdat: new Date().toISOString(),
    createdby: 'test-user-id',
    updatedat: new Date().toISOString(),
    updatedby: 'test-user-id',
    transferaccountid: null,
    transferid: null,
    ...overrides,
  };
}

/**
 * Waits for a specified amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock error for testing error scenarios
 */
export function createMockError(message: string, code?: string): Error {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
}

/**
 * Utility to check if an object has the expected shape
 */
export function hasExpectedShape<T>(obj: any, expectedKeys: (keyof T)[]): obj is T {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return expectedKeys.every(key => key in obj);
}

/**
 * Mock implementation of useAuth hook for testing
 */
export const mockUseAuth = () => ({
  session: mockSession,
  user: mockSession.user,
  loading: false,
  error: null,
});

/**
 * Utility to create a test environment with mocked dependencies
 */
export function createTestEnvironment() {
  // Mock the useAuth hook
  jest.mock('@/src/providers/AuthProvider', () => ({
    useAuth: mockUseAuth,
  }));

  // Mock AsyncStorage for React Native
  const mockAsyncStorage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
  };

  jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

  return {
    mockAsyncStorage,
  };
}

/**
 * Utility to clean up test environment
 */
export function cleanupTestEnvironment() {
  jest.clearAllMocks();
  jest.resetModules();
}

/**
 * Validates that a query result has the expected structure
 */
export function validateQueryResult(result: any) {
  expect(result).toHaveProperty('data');
  expect(result).toHaveProperty('isLoading');
  expect(result).toHaveProperty('isError');
  expect(result).toHaveProperty('isSuccess');
  expect(result).toHaveProperty('error');
}

/**
 * Validates that a mutation result has the expected structure
 */
export function validateMutationResult(result: any) {
  expect(result).toHaveProperty('mutate');
  expect(result).toHaveProperty('mutateAsync');
  expect(result).toHaveProperty('isLoading');
  expect(result).toHaveProperty('isError');
  expect(result).toHaveProperty('isSuccess');
  expect(result).toHaveProperty('error');
  expect(result).toHaveProperty('data');
}

/**
 * Creates a spy on console methods to suppress logs during testing
 */
export function suppressConsoleLogs() {
  const originalConsole = { ...console };
  
  beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
}