/**
 * Enhanced hooks for TanStack Query integration with Repository Manager
 */

import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { RepositoryManager } from '../apis/repositories/RepositoryManager';
import { getQueryInvalidationManager, InvalidationPatterns } from '../utils/QueryInvalidationManager';
import { TableNames } from '@/src/types/db/TableNames';
import { ViewNames } from '@/src/types/db/ViewNames';
import { useAuth } from '@/src/providers/AuthProvider';

/**
 * Enhanced useQuery hook that integrates with Repository Manager
 */
export function useRepositoryQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    entityType?: keyof typeof TableNames | keyof typeof ViewNames;
    storageMode?: string;
  }
) {
  const { entityType, storageMode, ...queryOptions } = options;
  
  return useQuery({
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      entityType,
      storageMode,
    },
  });
}

/**
 * Enhanced useMutation hook with automatic query invalidation
 */
export function useRepositoryMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    invalidationPattern?: keyof typeof InvalidationPatterns;
    customInvalidation?: Array<{
      type: 'entity' | 'specific' | 'predicate';
      target: any;
    }>;
    entityType?: keyof typeof TableNames | keyof typeof ViewNames;
  }
) {
  const { invalidationPattern, customInvalidation, entityType, ...mutationOptions } = options;
  const queryInvalidationManager = getQueryInvalidationManager();

  return useMutation({
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        await mutationOptions.onSuccess(data, variables, context);
      }

      // Handle automatic invalidation
      if (queryInvalidationManager) {
        try {
          if (invalidationPattern && InvalidationPatterns[invalidationPattern]) {
            await queryInvalidationManager.batchInvalidate(InvalidationPatterns[invalidationPattern]);
          } else if (customInvalidation) {
            await queryInvalidationManager.batchInvalidate(customInvalidation);
          } else if (entityType) {
            await queryInvalidationManager.invalidateEntityQueries(entityType);
          }
        } catch (error) {
          console.error('Failed to invalidate queries after mutation:', error);
          // Don't throw - mutation was successful, invalidation failure shouldn't break the flow
        }
      }
    },
    meta: {
      ...mutationOptions.meta,
      entityType,
      invalidationPattern,
    },
  });
}

/**
 * Hook to get repository manager with storage mode awareness
 */
export function useRepositoryManager() {
  const repositoryManager = RepositoryManager.getInstance();
  
  return {
    repositoryManager,
    currentStorageMode: repositoryManager.getCurrentStorageMode(),
    stats: repositoryManager.getRepositoryStats(),
    validateIntegration: () => repositoryManager.validateStorageIntegration(),
    forceRefresh: () => repositoryManager.forceRefreshRepositories(),
  };
}

/**
 * Hook to get query cache information
 */
export function useQueryCacheInfo() {
  const queryInvalidationManager = getQueryInvalidationManager();
  
  if (!queryInvalidationManager) {
    return {
      stats: null,
      clearCache: () => console.warn('Query invalidation manager not available'),
      invalidateAll: () => Promise.resolve(),
    };
  }

  return {
    stats: queryInvalidationManager.getQueryCacheStats(),
    clearCache: () => queryInvalidationManager.clearAllQueries(),
    invalidateAll: () => queryInvalidationManager.invalidateOnModeSwitch(
      queryInvalidationManager.getQueryCacheStats().storageMode
    ),
  };
}

/**
 * Hook for storage mode aware queries
 */
export function useStorageModeQuery<TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const repositoryManager = RepositoryManager.getInstance();
  const currentStorageMode = repositoryManager.getCurrentStorageMode();

  // Include storage mode in query key to ensure cache separation
  const storageAwareQueryKey = [...queryKey, currentStorageMode];

  return useQuery({
    queryKey: storageAwareQueryKey,
    queryFn,
    enabled: !!tenantId && (options?.enabled !== false),
    ...options,
    meta: {
      ...options?.meta,
      storageMode: currentStorageMode,
      tenantId,
    },
  });
}

/**
 * Hook for mutations with storage mode context
 */
export function useStorageModeMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext> & {
    invalidateQueries?: unknown[][];
    entityType?: keyof typeof TableNames | keyof typeof ViewNames;
  }
) {
  const { invalidateQueries, entityType, ...mutationOptions } = options || {};
  const repositoryManager = RepositoryManager.getInstance();
  const currentStorageMode = repositoryManager.getCurrentStorageMode();
  const queryInvalidationManager = getQueryInvalidationManager();

  return useMutation({
    mutationFn,
    ...mutationOptions,
    onSuccess: async (data, variables, context) => {
      // Call original onSuccess if provided
      if (mutationOptions.onSuccess) {
        await mutationOptions.onSuccess(data, variables, context);
      }

      // Handle query invalidation
      if (queryInvalidationManager) {
        try {
          if (invalidateQueries) {
            for (const queryKey of invalidateQueries) {
              await queryInvalidationManager.invalidateSpecificQuery(queryKey);
            }
          } else if (entityType) {
            await queryInvalidationManager.invalidateEntityQueries(entityType);
          }
        } catch (error) {
          console.error('Failed to invalidate queries after mutation:', error);
        }
      }
    },
    meta: {
      ...mutationOptions.meta,
      storageMode: currentStorageMode,
      entityType,
    },
  });
}

/**
 * Hook to handle storage mode switches with query management
 */
export function useStorageModeSwitch() {
  const repositoryManager = RepositoryManager.getInstance();
  const queryInvalidationManager = getQueryInvalidationManager();

  return {
    currentMode: repositoryManager.getCurrentStorageMode(),
    switchMode: async (newMode: string) => {
      const storageManager = repositoryManager['storageManager']; // Access private member
      if (storageManager && typeof storageManager.setMode === 'function') {
        await storageManager.setMode(newMode as any);
      }
    },
    invalidateQueries: async () => {
      if (queryInvalidationManager) {
        const currentMode = repositoryManager.getCurrentStorageMode();
        await queryInvalidationManager.invalidateOnModeSwitch(currentMode);
      }
    },
  };
}