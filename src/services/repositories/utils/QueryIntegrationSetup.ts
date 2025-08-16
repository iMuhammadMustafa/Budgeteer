/**
 * Query Integration Setup utility for connecting TanStack Query with Repository Manager
 */

import { QueryClient } from '@tanstack/react-query';
import { RepositoryManager } from '../apis/repositories/RepositoryManager';
import { QueryInvalidationManager } from './QueryInvalidationManager';
import { StorageModeManager } from '../storage/StorageModeManager';

export interface QueryIntegrationConfig {
  queryClient: QueryClient;
  enableAutoInvalidation?: boolean;
  enablePrefetching?: boolean;
  debugMode?: boolean;
}

export class QueryIntegrationSetup {
  private static isInitialized = false;
  private static queryInvalidationManager?: QueryInvalidationManager;

  /**
   * Initialize the integration between TanStack Query and Repository Manager
   */
  public static initialize(config: QueryIntegrationConfig): void {
    if (QueryIntegrationSetup.isInitialized) {
      console.log('Query integration already initialized');
      return;
    }

    const { queryClient, enableAutoInvalidation = true, debugMode = false } = config;

    try {
      // Create query invalidation manager
      QueryIntegrationSetup.queryInvalidationManager = QueryInvalidationManager.getInstance(queryClient);

      // Connect with repository manager
      const repositoryManager = RepositoryManager.getInstance();
      repositoryManager.setQueryInvalidationManager(QueryIntegrationSetup.queryInvalidationManager);

      // Set up storage mode tracking
      const storageManager = StorageModeManager.getInstance();
      const currentMode = storageManager.getMode();
      QueryIntegrationSetup.queryInvalidationManager.setStorageMode(currentMode);

      if (enableAutoInvalidation) {
        QueryIntegrationSetup.setupAutoInvalidation();
      }

      if (debugMode) {
        QueryIntegrationSetup.setupDebugLogging();
      }

      QueryIntegrationSetup.isInitialized = true;
      console.log('Query integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize query integration:', error);
      throw error;
    }
  }

  /**
   * Get the query invalidation manager instance
   */
  public static getQueryInvalidationManager(): QueryInvalidationManager | undefined {
    return QueryIntegrationSetup.queryInvalidationManager;
  }

  /**
   * Check if the integration is initialized
   */
  public static isReady(): boolean {
    return QueryIntegrationSetup.isInitialized && !!QueryIntegrationSetup.queryInvalidationManager;
  }

  /**
   * Reset the integration (useful for testing)
   */
  public static reset(): void {
    QueryIntegrationSetup.isInitialized = false;
    QueryIntegrationSetup.queryInvalidationManager = undefined;
    console.log('Query integration reset');
  }

  /**
   * Set up automatic query invalidation on storage mode changes
   */
  private static setupAutoInvalidation(): void {
    if (!QueryIntegrationSetup.queryInvalidationManager) {
      throw new Error('Query invalidation manager not initialized');
    }

    console.log('Setting up automatic query invalidation');
    
    // The invalidation is already handled by RepositoryManager.handleStorageModeChange()
    // This method can be extended for additional auto-invalidation logic
  }

  /**
   * Set up debug logging for query operations
   */
  private static setupDebugLogging(): void {
    if (!QueryIntegrationSetup.queryInvalidationManager) {
      throw new Error('Query invalidation manager not initialized');
    }

    console.log('Setting up debug logging for query operations');
    
    // Log query cache statistics periodically
    setInterval(() => {
      const stats = QueryIntegrationSetup.queryInvalidationManager!.getQueryCacheStats();
      console.log('Query Cache Stats:', stats);
    }, 30000); // Every 30 seconds
  }

  /**
   * Validate the integration is working correctly
   */
  public static async validateIntegration(): Promise<boolean> {
    try {
      if (!QueryIntegrationSetup.isReady()) {
        console.error('Query integration not initialized');
        return false;
      }

      // Check repository manager integration
      const repositoryManager = RepositoryManager.getInstance();
      if (!repositoryManager.validateStorageIntegration()) {
        console.error('Repository manager storage integration failed');
        return false;
      }

      // Check query invalidation manager
      const stats = QueryIntegrationSetup.queryInvalidationManager!.getQueryCacheStats();
      console.log('Query integration validation passed:', stats);
      
      return true;
    } catch (error) {
      console.error('Query integration validation failed:', error);
      return false;
    }
  }

  /**
   * Handle storage mode switch with proper query management
   */
  public static async handleStorageModeSwitch(
    newMode: string,
    previousMode?: string
  ): Promise<void> {
    if (!QueryIntegrationSetup.isReady()) {
      console.warn('Query integration not ready, skipping query invalidation');
      return;
    }

    try {
      await QueryIntegrationSetup.queryInvalidationManager!.invalidateOnModeSwitch(
        newMode as any,
        previousMode as any
      );
      console.log(`Successfully handled query invalidation for mode switch: ${previousMode} -> ${newMode}`);
    } catch (error) {
      console.error('Failed to handle query invalidation during mode switch:', error);
      throw error;
    }
  }

  /**
   * Get integration status for debugging
   */
  public static getIntegrationStatus(): {
    initialized: boolean;
    queryManagerReady: boolean;
    repositoryManagerReady: boolean;
    storageManagerReady: boolean;
    currentStorageMode?: string;
  } {
    const repositoryManager = RepositoryManager.getInstance();
    const storageManager = StorageModeManager.getInstance();

    return {
      initialized: QueryIntegrationSetup.isInitialized,
      queryManagerReady: !!QueryIntegrationSetup.queryInvalidationManager,
      repositoryManagerReady: repositoryManager.validateStorageIntegration(),
      storageManagerReady: !!storageManager,
      currentStorageMode: repositoryManager.getCurrentStorageMode(),
    };
  }
}

/**
 * Convenience function to initialize query integration
 */
export function initializeQueryIntegration(config: QueryIntegrationConfig): void {
  QueryIntegrationSetup.initialize(config);
}

/**
 * Convenience function to get query invalidation manager
 */
export function getQueryInvalidationManager(): QueryInvalidationManager | undefined {
  return QueryIntegrationSetup.getQueryInvalidationManager();
}

/**
 * Convenience function to validate integration
 */
export async function validateQueryIntegration(): Promise<boolean> {
  return QueryIntegrationSetup.validateIntegration();
}