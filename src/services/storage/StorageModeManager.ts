// Storage mode manager for handling mode selection and provider instantiation

import { StorageMode, EntityType, ProviderRegistry, IStorageProvider } from './types';
import { DIContainer } from './DIContainer';

export class StorageModeManager implements IStorageProvider {
  private static instance: StorageModeManager;
  private container: DIContainer;
  public mode: StorageMode;
  private onModeChange?: () => void;
  
  private constructor() {
    this.container = DIContainer.getInstance();
    this.mode = 'cloud'; // Default mode
  }
  
  public static getInstance(): StorageModeManager {
    if (!StorageModeManager.instance) {
      StorageModeManager.instance = new StorageModeManager();
    }
    return StorageModeManager.instance;
  }
  
  public async setMode(mode: StorageMode): Promise<void> {
    if (this.mode !== mode) {
      // Cleanup current mode
      await this.cleanup();
      
      // Set new mode
      this.mode = mode;
      this.container.setMode(mode);
      
      // Clear repository instances to force recreation with new providers
      // Note: We'll handle repository clearing through a callback to avoid circular imports
      if (this.onModeChange) {
        this.onModeChange();
      }
      
      // Initialize new mode
      await this.initialize();
    }
  }
  
  public getMode(): StorageMode {
    return this.mode;
  }
  
  public getProvider<T extends EntityType>(entityType: T): ProviderRegistry[T] {
    return this.container.getProvider(entityType);
  }
  
  public async initialize(): Promise<void> {
    await this.container.initializeProviders();
    console.log(`Storage mode manager initialized with mode: ${this.mode}`);
  }
  
  public async cleanup(): Promise<void> {
    await this.container.cleanupProviders();
    console.log(`Storage mode manager cleaned up for mode: ${this.mode}`);
  }
  
  // Convenience methods for getting specific providers
  public getAccountProvider() {
    return this.getProvider('accounts');
  }
  
  public getAccountCategoryProvider() {
    return this.getProvider('accountCategories');
  }
  
  public getTransactionProvider() {
    return this.getProvider('transactions');
  }
  
  public getTransactionCategoryProvider() {
    return this.getProvider('transactionCategories');
  }
  
  public getTransactionGroupProvider() {
    return this.getProvider('transactionGroups');
  }
  
  public getConfigurationProvider() {
    return this.getProvider('configurations');
  }
  
  public getRecurringProvider() {
    return this.getProvider('recurrings');
  }
  
  public getStatsProvider() {
    return this.getProvider('stats');
  }
  
  public setModeChangeCallback(callback: () => void) {
    this.onModeChange = callback;
  }
}