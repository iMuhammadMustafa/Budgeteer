import { StorageMode } from './StorageTypes';

/**
 * Base interface that all storage providers must implement
 * Provides lifecycle management for storage implementations
 */
export interface IStorageProvider {
  /**
   * The storage mode this provider implements
   */
  readonly mode: StorageMode;

  /**
   * Initialize the storage provider
   * This method should set up any necessary connections, databases, or data structures
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Clean up resources used by the storage provider
   * This method should close connections, clear caches, or perform other cleanup tasks
   * @returns Promise that resolves when cleanup is complete
   */
  cleanup(): Promise<void>;

  /**
   * Check if the storage provider is ready for use
   * @returns true if the provider is initialized and ready
   */
  isReady(): boolean;
}