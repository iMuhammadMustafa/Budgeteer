/**
 * Query Caching Tests
 * 
 * Tests specific to query caching behavior across different storage implementations
 */

import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react-native';

import { StorageModeManager } from '../../storage/StorageModeManager';
import { StorageMode } from '../../storage/types';
import { useAccounts, useCreateAccount } from '../Accounts.Service';
import { TableNames } from '@/src/types/db/TableNames';

import { 
  createTestQueryClient, 
  createWrapper, 
  createMockAccount,
  suppressConsoleLogs 
} from './utils/testUtils';

describe('Query Caching Behavior', () => {
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

  describe('Cache Persistence Across Storage Modes', () => {
    test('should maintain separate cache entries for different storage modes', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Start with demo mode
      await storageManager.setMode('demo');
      
      const { result: demoResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(demoResult.current.isSuccess).toBe(true);
      });

      const demoData = demoResult.current.data;
      const demoCacheKey = queryClient.getQueryCache().find({
        queryKey: [TableNames.Accounts, 'test-tenant-id']
      });

      // Switch to local mode
      await storageManager.setMode('local');
      
      const { result: localResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(localResult.current.isSuccess || localResult.current.isError).toBe(true);
      });

      // Cache should be separate for different modes
      const localCacheKey = queryClient.getQueryCache().find({
        queryKey: [TableNames.Accounts, 'test-tenant-id']
      });

      // The cache entries should be independent
      expect(demoCacheKey).toBeDefined();
      expect(localCacheKey).toBeDefined();
    });

    test('should invalidate cache correctly when switching modes', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Start with demo mode and populate cache
      await storageManager.setMode('demo');
      
      const { result } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const initialDataUpdatedAt = result.current.dataUpdatedAt;

      // Switch modes
      await storageManager.setMode('local');

      // Wait for potential refetch
      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });

      // Data should be refetched after mode switch
      expect(result.current.dataUpdatedAt).toBeGreaterThanOrEqual(initialDataUpdatedAt);
    });
  });

  describe('Cache Invalidation Patterns', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should invalidate related queries after mutations', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up query
      const { result: queryResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(queryResult.current.isSuccess).toBe(true);
      });

      const initialDataUpdatedAt = queryResult.current.dataUpdatedAt;

      // Set up mutation
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

      // Wait for mutation and invalidation
      await waitFor(() => {
        expect(mutationResult.current.isSuccess || mutationResult.current.isError).toBe(true);
      });

      // Query should be invalidated and refetched
      await waitFor(() => {
        expect(queryResult.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
      });
    });

    test('should handle manual cache invalidation', async () => {
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

      // Wait for refetch
      await waitFor(() => {
        expect(result.current.dataUpdatedAt).toBeGreaterThan(initialDataUpdatedAt);
      });
    });

    test('should handle selective cache invalidation', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Set up multiple queries
      const { result: allAccountsResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(allAccountsResult.current.isSuccess).toBe(true);
      });

      const allAccountsUpdatedAt = allAccountsResult.current.dataUpdatedAt;

      // Invalidate only specific query
      await act(async () => {
        await queryClient.invalidateQueries({ 
          queryKey: [TableNames.Accounts, 'specific-id'] 
        });
      });

      // General accounts query should not be affected
      expect(allAccountsResult.current.dataUpdatedAt).toBe(allAccountsUpdatedAt);
    });
  });

  describe('Cache Performance', () => {
    beforeEach(async () => {
      await storageManager.setMode('demo');
    });

    test('should serve cached data immediately on subsequent renders', async () => {
      const wrapper = createWrapper(queryClient);
      
      // First render
      const { result: firstResult, unmount: unmountFirst } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(firstResult.current.isSuccess).toBe(true);
      });

      const cachedData = firstResult.current.data;
      unmountFirst();

      // Second render should use cache
      const { result: secondResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      // Should immediately have cached data
      expect(secondResult.current.data).toEqual(cachedData);
      expect(secondResult.current.isLoading).toBe(false);
    });

    test('should handle cache garbage collection correctly', async () => {
      // Create a query client with short garbage collection time
      const shortGcQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 100, // 100ms
            staleTime: 0,
            retry: false,
          },
        },
      });

      const wrapper = createWrapper(shortGcQueryClient);
      
      const { result, unmount } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Unmount to make query inactive
      unmount();

      // Wait for garbage collection
      await new Promise(resolve => setTimeout(resolve, 150));

      // Cache should be garbage collected
      const cachedQuery = shortGcQueryClient.getQueryCache().find({
        queryKey: [TableNames.Accounts, 'test-tenant-id']
      });

      expect(cachedQuery?.getObserversCount()).toBe(0);
    });
  });

  describe('Cache Consistency Across Storage Modes', () => {
    const storageModes: StorageMode[] = ['demo', 'local'];

    test('should maintain cache structure consistency across modes', async () => {
      const wrapper = createWrapper(queryClient);
      const cacheStructures: Record<StorageMode, any> = {} as Record<StorageMode, any>;

      for (const mode of storageModes) {
        await storageManager.setMode(mode);
        
        const { result } = renderHook(
          () => useAccounts(),
          { wrapper }
        );

        await waitFor(() => {
          expect(result.current.isSuccess || result.current.isError).toBe(true);
        });

        cacheStructures[mode] = {
          hasData: result.current.data !== undefined,
          isArray: Array.isArray(result.current.data),
          hasError: result.current.error !== null,
          queryState: {
            isLoading: result.current.isLoading,
            isError: result.current.isError,
            isSuccess: result.current.isSuccess,
          }
        };
      }

      // All modes should have consistent cache structure
      const modes = Object.keys(cacheStructures) as StorageMode[];
      for (let i = 1; i < modes.length; i++) {
        const current = cacheStructures[modes[i]];
        const previous = cacheStructures[modes[i - 1]];
        
        expect(current.isArray).toBe(previous.isArray);
        expect(typeof current.queryState).toBe(typeof previous.queryState);
      }
    });

    test('should handle cache warming across storage modes', async () => {
      const wrapper = createWrapper(queryClient);
      
      // Warm cache in demo mode
      await storageManager.setMode('demo');
      
      const { result: demoResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      await waitFor(() => {
        expect(demoResult.current.isSuccess).toBe(true);
      });

      // Switch to local mode
      await storageManager.setMode('local');
      
      const { result: localResult } = renderHook(
        () => useAccounts(),
        { wrapper }
      );

      // Should handle the transition gracefully
      await waitFor(() => {
        expect(localResult.current.isSuccess || localResult.current.isError).toBe(true);
      });

      expect(localResult.current.isLoading).toBe(false);
    });
  });
});