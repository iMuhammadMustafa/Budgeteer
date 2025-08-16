/**
 * Query Invalidation Manager for handling TanStack Query cache invalidation
 * across storage mode switches and repository operations
 */

import { QueryClient } from '@tanstack/react-query';
import { TableNames } from '@/src/types/db/TableNames';
import { ViewNames } from '@/src/types/db/ViewNames';
import { StorageMode } from '@/src/services/storage/types';

export interface QueryInvalidationOptions {
  /**
   * Whether to invalidate all queries or just specific ones
   */
  invalidateAll?: boolean;
  
  /**
   * Specific query keys to invalidate
   */
  queryKeys?: string[][];
  
  /**
   * Whether to refetch queries immediately after invalidation
   */
  refetchActive?: boolean;
  
  /**
   * Storage mode context for mode-specific invalidation
   */
  storageMode?: StorageMode;
}

export class QueryInvalidationManager {
  private static instance: QueryInvalidationManager;
  private queryClient: QueryClient;
  private currentStorageMode: StorageMode = 'cloud';

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  public static getInstance(queryClient?: QueryClient): QueryInvalidationManager {
    if (!QueryInvalidationManager.instance) {
      if (!queryClient) {
        throw new Error('QueryClient must be provided when creating QueryInvalidationManager instance');
      }
      QueryInvalidationManager.instance = new QueryInvalidationManager(queryClient);
    }
    return QueryInvalidationManager.instance;
  }

  /**
   * Set the current storage mode for context-aware invalidation
   */
  public setStorageMode(mode: StorageMode): void {
    this.currentStorageMode = mode;
  }

  /**
   * Invalidate all queries when switching storage modes
   */
  public async invalidateOnModeSwitch(newMode: StorageMode, previousMode?: StorageMode): Promise<void> {
    console.log(`Invalidating queries for storage mode switch: ${previousMode} -> ${newMode}`);
    
    try {
      // Clear all queries to ensure fresh data from new storage mode
      await this.queryClient.invalidateQueries();
      
      // Remove any stale data from previous mode
      this.queryClient.clear();
      
      // Update current mode
      this.setStorageMode(newMode);
      
      console.log(`Successfully invalidated queries for mode switch to ${newMode}`);
    } catch (error) {
      console.error(`Failed to invalidate queries during mode switch:`, error);
      throw error;
    }
  }

  /**
   * Invalidate queries related to a specific entity type
   */
  public async invalidateEntityQueries(
    entityType: keyof typeof TableNames | keyof typeof ViewNames,
    options: QueryInvalidationOptions = {}
  ): Promise<void> {
    const { refetchActive = true } = options;
    
    try {
      await this.queryClient.invalidateQueries({
        queryKey: [entityType],
        refetchType: refetchActive ? 'active' : 'none'
      });
      
      console.log(`Invalidated queries for entity: ${entityType}`);
    } catch (error) {
      console.error(`Failed to invalidate queries for entity ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate specific query by key
   */
  public async invalidateSpecificQuery(
    queryKey: unknown[],
    options: QueryInvalidationOptions = {}
  ): Promise<void> {
    const { refetchActive = true } = options;
    
    try {
      await this.queryClient.invalidateQueries({
        queryKey,
        refetchType: refetchActive ? 'active' : 'none'
      });
      
      console.log(`Invalidated specific query:`, queryKey);
    } catch (error) {
      console.error(`Failed to invalidate specific query:`, error);
      throw error;
    }
  }

  /**
   * Invalidate related queries after a mutation
   */
  public async invalidateRelatedQueries(
    primaryEntity: keyof typeof TableNames | keyof typeof ViewNames,
    relatedEntities: (keyof typeof TableNames | keyof typeof ViewNames)[] = [],
    options: QueryInvalidationOptions = {}
  ): Promise<void> {
    const { refetchActive = true } = options;
    
    try {
      // Invalidate primary entity
      await this.invalidateEntityQueries(primaryEntity, { refetchActive });
      
      // Invalidate related entities
      for (const entity of relatedEntities) {
        await this.invalidateEntityQueries(entity, { refetchActive });
      }
      
      console.log(`Invalidated related queries for ${primaryEntity} and related entities:`, relatedEntities);
    } catch (error) {
      console.error(`Failed to invalidate related queries:`, error);
      throw error;
    }
  }

  /**
   * Invalidate queries with a predicate function
   */
  public async invalidateQueriesWithPredicate(
    predicate: (query: any) => boolean,
    options: QueryInvalidationOptions = {}
  ): Promise<void> {
    const { refetchActive = true } = options;
    
    try {
      await this.queryClient.invalidateQueries({
        predicate,
        refetchType: refetchActive ? 'active' : 'none'
      });
      
      console.log(`Invalidated queries with custom predicate`);
    } catch (error) {
      console.error(`Failed to invalidate queries with predicate:`, error);
      throw error;
    }
  }

  /**
   * Get query cache statistics for debugging
   */
  public getQueryCacheStats(): {
    totalQueries: number;
    activeQueries: number;
    staleQueries: number;
    storageMode: StorageMode;
  } {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      storageMode: this.currentStorageMode
    };
  }

  /**
   * Clear all queries (useful for testing or complete reset)
   */
  public clearAllQueries(): void {
    this.queryClient.clear();
    console.log('Cleared all queries from cache');
  }

  /**
   * Prefetch data for a new storage mode
   */
  public async prefetchForStorageMode(
    mode: StorageMode,
    tenantId: string,
    entities: (keyof typeof TableNames)[] = []
  ): Promise<void> {
    console.log(`Prefetching data for storage mode: ${mode}`);
    
    try {
      // This would be implemented to prefetch common queries
      // for the new storage mode to improve user experience
      const prefetchPromises = entities.map(entity => {
        return this.queryClient.prefetchQuery({
          queryKey: [entity, tenantId],
          queryFn: async () => {
            // This would call the appropriate repository method
            // based on the storage mode and entity type
            return [];
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      });
      
      await Promise.all(prefetchPromises);
      console.log(`Successfully prefetched data for ${entities.length} entities in ${mode} mode`);
    } catch (error) {
      console.error(`Failed to prefetch data for storage mode ${mode}:`, error);
      // Don't throw - prefetching is optional
    }
  }

  /**
   * Handle concurrent invalidations safely
   */
  public async batchInvalidate(
    invalidations: Array<{
      type: 'entity' | 'specific' | 'predicate';
      target: any;
      options?: QueryInvalidationOptions;
    }>
  ): Promise<void> {
    console.log(`Batch invalidating ${invalidations.length} query groups`);
    
    try {
      const promises = invalidations.map(async ({ type, target, options = {} }) => {
        switch (type) {
          case 'entity':
            return this.invalidateEntityQueries(target, options);
          case 'specific':
            return this.invalidateSpecificQuery(target, options);
          case 'predicate':
            return this.invalidateQueriesWithPredicate(target, options);
          default:
            console.warn(`Unknown invalidation type: ${type}`);
        }
      });
      
      await Promise.all(promises);
      console.log(`Successfully completed batch invalidation`);
    } catch (error) {
      console.error(`Failed to complete batch invalidation:`, error);
      throw error;
    }
  }
}

// Export a default instance factory
export function createQueryInvalidationManager(queryClient: QueryClient): QueryInvalidationManager {
  return QueryInvalidationManager.getInstance(queryClient);
}

// Export common invalidation patterns
export const InvalidationPatterns = {
  /**
   * Account-related invalidations
   */
  ACCOUNT_OPERATIONS: [
    { type: 'entity' as const, target: TableNames.Accounts },
    { type: 'entity' as const, target: 'Stats_TotalAccountBalance' },
  ],
  
  /**
   * Transaction-related invalidations
   */
  TRANSACTION_OPERATIONS: [
    { type: 'entity' as const, target: ViewNames.TransactionsView },
    { type: 'entity' as const, target: TableNames.Transactions },
    { type: 'entity' as const, target: TableNames.Accounts }, // For balance updates
  ],
  
  /**
   * Category-related invalidations
   */
  CATEGORY_OPERATIONS: [
    { type: 'entity' as const, target: TableNames.AccountCategories },
    { type: 'entity' as const, target: TableNames.TransactionCategories },
    { type: 'entity' as const, target: TableNames.Accounts }, // Accounts depend on categories
  ],
  
  /**
   * Configuration-related invalidations
   */
  CONFIGURATION_OPERATIONS: [
    { type: 'entity' as const, target: TableNames.Configurations },
  ],
} as const;