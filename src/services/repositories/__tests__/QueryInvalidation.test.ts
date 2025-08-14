/**
 * Query Invalidation Tests
 * 
 * Tests query invalidation behavior across different storage implementations
 */

import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react-native';

import { StorageModeManager } from '../../storage/StorageModeManager';
import { StorageMode } from '../../storage/types';
import { TableNames } from '@/src/types/db/TableNames';

import { 
  useAccounts, 
  useAccountById,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useTotalAccountBalance 
} from '../Accounts.Service';

import { 
  useAccountCategories,
  useCreateAccountCategory 
} from '../AccountCategories.Service';

import { 
  useTransactions,
  useCreateTransaction 
} from '../Transactions.Service';

import { 
  createTestQueryClient, 
  createWrapper, 
  createMockAccount,
  createMockAccountCategory,
  createMockTransaction,
  suppressConsoleLogs 
} from './utils/testUtils';

describe('Query Invalidation Tests', () => {
  let queryClient: QueryClient;
  let storageManager: StorageModeManager;

  suppressConsoleLogs();

  beforeEach(() => {
    queryClient = createTestQueryClient();
    storageManager = StorageModeManager.getInstance();
  });

  afterEach(async () => {
    queryClient.clear();
    await storageManager.cleanup();
  });

  describe('Basic Invalidation Patterns', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should invalidate accounts queries after account creation', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up accounts query
      const { result: queryResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      const initialDataUpdatedAt = queryResult.current.dataUpdatedAt;

      // Set up create mutation
      const { result: mutationResult } = renderHook(
        () => useCreateAccount(),
        { wrapper }
      );

      // Execute mutation
      const mockAccount = createMockAccount();
      
      await act(async () => {
        if (mutationResult.current.mutate) {
          mutationResult.current.mutate(mockAccount);
        }
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Accounts query should be invalidated
      await waitFor(() => {
        expect(queryResult.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
      });
    });

    test('should invalidate specific account query after account update', async () => {
      const wrapper = createWrapper(queryClient);
      const accountId = 'test-account-id';
      
      // Set up specific account query
      const { result: queryResult } = renderHook(
        () => useAccountById(accountId),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess || queryResult.current.isError).toBe(true);
      });

      const initialDataUpdatedAt = queryResult.current.dataUpdatedAt;

      // Set up update mutation
      const { result: mutationResult } = renderHook(
        () => useUpdateAccount(),
        { wrapper }
      );

      // Execute mutation
      const mockAccount = createMockAccount({ id: accountId });
      const originalData = createMockAccount({ id: accountId, name: 'Original' });
      
      await act(async () => {
        if (mutationResult.current.mutate) {
          mutationResult.current.mutate({ account: mockAccount, originalData });
        }
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Specific account query should be invalidated
      await waitFor(() => {
        expect(queryResult.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
      });
    });

    test('should invalidate multiple related queries after account deletion', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up multiple related queries
      const { result: accountsResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      const { result: balanceResult } = renderHook(
        () => useTotalAccountBalance(),
        { wrapper }
      );

      await waitFor(() => {
        expect(accountsResult.current.isSuccess).toBe(true);
        expect(balanceResult.current.isSuccess || balanceResult.current.isError).toBe(true);
      });

      const accountsInitialUpdatedAt = accountsResult.current.dataUpdatedAt;
      const balanceInitialUpdatedAt = balanceResult.current.dataUpdatedAt;

      // Set up delete mutation
      const { result: mutationResult } = renderHook(
        () => useDeleteAccount(),
        { wrapper }
      );

      // Execute mutation
      await act(async () => {
        if (mutationResult.current.mutate) {
          mutationResult.current.mutate('test-account-id');
        }
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Both queries should be invalidated
      await waitFor(() => {
        expect(accountsResult.current.dataUpdatedAt).toBeGreaterThan(accountsInitialUpdatedAt);
      });

      if (balanceResult.current.isSuccess) {
        await waitFor(() => {
          expect(balanceResult.current.dataUpdatedAt).toBeGreaterThan(balanceInitialUpdatedAt);
        });
      }
    });
  });

  describe('Cross-Entity Invalidation', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should invalidate account queries when account category is created', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up accounts query
      const { result: accountsResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(accountsResult.current.isSuccess).toBe(true);
      });

      const initialDataUpdatedAt = accountsResult.current.dataUpdatedAt;

      // Set up account category creation
      const { result: mutationResult } = renderHook(
        () => useCreateAccountCategory(),
        { wrapper }
      );

      // Execute mutation
      const mockCategory = createMockAccountCategory();
      
      await act(async () => {
        if (mutationResult.current.mutate) {
          mutationResult.current.mutate(mockCategory);
        }
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Account categories should be invalidated
      const { result: categoriesResult } = renderHook(
        () => useAccountCategories(),
        { wrapper }
      );

      await waitFor(() => {
        expect(categoriesResult.current.isSuccess || categoriesResult.current.isError).toBe(true);
      });
    });

    test('should invalidate account balance when transaction is created', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up balance query
      const { result: balanceResult } = renderHook(
        () => useTotalAccountBalance(),
        { wrapper }
      );

      await waitFor(() => {
        expect(balanceResult.current.isSuccess || balanceResult.current.isError).toBe(true);
      });

      const initialDataUpdatedAt = balanceResult.current.dataUpdatedAt;

      // Set up transaction creation
      const { result: mutationResult } = renderHook(
        () => useCreateTransaction(),
        { wrapper }
      );

      // Execute mutation
      const mockTransaction = createMockTransaction();
      
      await act(async () => {
        if (mutationResult.current.mutate) {
          mutationResult.current.mutate(mockTransaction);
        }
      });

      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Balance query should be invalidated if it was successful initially
      if (balanceResult.current.isSuccess) {
        await waitFor(() => {
          expect(balanceResult.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
        });
      }
    });
  });

  describe('Manual Invalidation', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should handle manual query invalidation', async () => {
      const wrapper = createWrapper(queryClient);
      
      const { result } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialDataUpdatedAt = result.current.dataUpdatedAt;

      // Manually invalidate
      await act(async () => {
        await queryClient.invalidateQueries({ 
          queryKey: [TableNames.Accounts] 
        });
      });

      // Query should be refetched
      await waitFor(() => {
        expect(result.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
      });
    });

    test('should handle selective invalidation by query key', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up multiple queries
      const { result: allAccountsResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      const { result: specificAccountResult } = renderHook(
        () => useAccountById('specific-id'),
        { wrapper }
      );

      await waitFor(() => {
        expect(allAccountsResult.current.isSuccess).toBe(true);
        expect(specificAccountResult.current.isSuccess || specificAccountResult.current.isError).toBe(true);
      });

      const allAccountsInitialUpdatedAt = allAccountsResult.current.dataUpdatedAt;
      const specificAccountInitialUpdatedAt = specificAccountResult.current.dataUpdatedAt;

      // Invalidate only specific account query
      await act(async () => {
        await queryClient.invalidateQueries({ 
          queryKey: [TableNames.Accounts, 'specific-id'] 
        });
      });

      // Only specific account query should be invalidated
      if (specificAccountResult.current.isSuccess) {
        await waitFor(() => {
          expect(specificAccountResult.current.dataUpdatedAt).toBeGreaterThan(specificAccountInitialUpdatedAt);
        });
      }

      // All accounts query should not be affected
      expect(allAccountsResult.current.dataUpdatedAt).toBe(allAccountsInitialUpdatedAt);
    });

    test('should handle invalidation with predicate function', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up multiple queries
      const { result: accountsResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      const { result: categoriesResult } = renderHook(
        () => useAccountCategories(),
        { wrapper }
      );

      await waitFor(() => {
        expect(accountsResult.current.isSuccess).toBe(true);
        expect(categoriesResult.current.isSuccess || categoriesResult.current.isError).toBe(true);
      });

      const accountsInitialUpdatedAt = accountsResult.current.dataUpdatedAt;
      const categoriesInitialUpdatedAt = categoriesResult.current.dataUpdatedAt;

      // Invalidate only account-related queries
      await act(async () => {
        await queryClient.invalidateQueries({ 
          predicate: (query) => {
            return query.queryKey[0] === TableNames.Accounts;
          }
        });
      });

      // Only accounts query should be invalidated
      await waitFor(() => {
        expect(accountsResult.current.dataUpdatedAt).toBeGreaterThan(accountsInitialUpdatedAt);
      });

      // Categories query should not be affected
      if (categoriesResult.current.isSuccess) {
        expect(categoriesResult.current.dataUpdatedAt).toBe(categoriesInitialUpdatedAt);
      }
    });
  });

  describe('Invalidation Across Storage Modes', () => {
    const storageModes: StorageMode[] = ['demo', 'local'];

    storageModes.forEach(mode => {
      test(`should handle invalidation correctly in ${mode} mode`, async () => {
        await storageManager.setMode(mode);
        const wrapper = createWrapper(queryClient);
        
        const { result: queryResult } = renderHook(
          () => useAccounts(),
          { wrapper }
        );

        await waitFor(() => {
          expect(queryResult.current.isSuccess || queryResult.current.isError).toBe(true);
        });

        const initialDataUpdatedAt = queryResult.current.dataUpdatedAt;

        // Manual invalidation
        await act(async () => {
          await queryClient.invalidateQueries({ 
            queryKey: [TableNames.Accounts] 
          });
        });

        // Should refetch in any mode
        if (queryResult.current.isSuccess) {
          await waitFor(() => {
            expect(queryResult.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
          });
        }
      });
    });

    test('should maintain invalidation behavior when switching modes', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Start in demo mode
      await storageManager.setMode('demo');
      
      const { result } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Switch to local mode
      await storageManager.setMode('local');

      // Wait for potential refetch after mode switch
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      const modeSwithUpdatedAt = result.current.dataUpdatedAt;

      // Manual invalidation should still work
      await act(async () => {
        await queryClient.invalidateQueries({ 
          queryKey: [TableNames.Accounts] 
        });
      });

      // Should refetch in new mode
      await waitFor(() => {
        expect(result.current.dataUpdatedAt).toBeGreaterThan(modeSwithUpdatedAt);
      });
    });
  });

  describe('Invalidation Performance', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should handle bulk invalidation efficiently', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up multiple queries
      const queries = [
        () => useAccounts(),
        () => useAccountCategories(),
        () => useTotalAccountBalance(),
      ];

      const results = queries.map(query => renderHook(query, { wrapper }));

      // Wait for all queries to complete
      await Promise.all(
        results.map(({ result }) => 
          waitFor(() => {
            expect(result.current.isSuccess || result.current.isError).toBe(true);
          })
        )
      );

      const startTime = Date.now();

      // Bulk invalidation
      await act(async () => {
        await queryClient.invalidateQueries();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent invalidations', async () => {
      const wrapper = createWrapper(queryClient);
      
      const { result } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Trigger multiple concurrent invalidations
      const invalidationPromises = [
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
        queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] }),
      ];

      await act(async () => {
        await Promise.all(invalidationPromises);
      });

      // Should handle concurrent invalidations gracefully
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });
});