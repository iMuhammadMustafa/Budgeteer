import { StorageModeManager } from '../../storage/StorageModeManager';
import { AccountRepository } from './AccountRepository';
import { AccountCategoryRepository } from './AccountCategoryRepository';
import { TransactionRepository } from './TransactionRepository';
import { TransactionCategoryRepository } from './TransactionCategoryRepository';
import { TransactionGroupRepository } from './TransactionGroupRepository';
import { ConfigurationRepository } from './ConfigurationRepository';
import { RecurringRepository } from './RecurringRepository';
import { StatsRepository } from './StatsRepository';
import { QueryInvalidationManager } from '../utils/QueryInvalidationManager';
import { StorageMode } from '../../storage/types';

export class RepositoryManager {
  private static instance: RepositoryManager;
  private storageManager: StorageModeManager;
  private queryInvalidationManager?: QueryInvalidationManager;
  
  // Repository instances
  private accountRepository?: AccountRepository;
  private accountCategoryRepository?: AccountCategoryRepository;
  private transactionRepository?: TransactionRepository;
  private transactionCategoryRepository?: TransactionCategoryRepository;
  private transactionGroupRepository?: TransactionGroupRepository;
  private configurationRepository?: ConfigurationRepository;
  private recurringRepository?: RecurringRepository;
  private statsRepository?: StatsRepository;
  
  // Track current storage mode for debugging
  private currentStorageMode?: StorageMode;
  
  private constructor() {
    this.storageManager = StorageModeManager.getInstance();
    this.currentStorageMode = this.storageManager.getMode();
    
    // Register callback to handle storage mode changes
    this.storageManager.setModeChangeCallback(() => this.handleStorageModeChange());
  }
  
  public static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }
  
  public getAccountRepository(): AccountRepository {
    if (!this.accountRepository) {
      const provider = this.storageManager.getAccountProvider();
      this.accountRepository = new AccountRepository(provider);
    }
    return this.accountRepository;
  }
  
  public getAccountCategoryRepository(): AccountCategoryRepository {
    if (!this.accountCategoryRepository) {
      const provider = this.storageManager.getAccountCategoryProvider();
      this.accountCategoryRepository = new AccountCategoryRepository(provider);
    }
    return this.accountCategoryRepository;
  }
  
  public getTransactionRepository(): TransactionRepository {
    if (!this.transactionRepository) {
      const provider = this.storageManager.getTransactionProvider();
      this.transactionRepository = new TransactionRepository(provider);
    }
    return this.transactionRepository;
  }
  
  public getTransactionCategoryRepository(): TransactionCategoryRepository {
    if (!this.transactionCategoryRepository) {
      const provider = this.storageManager.getTransactionCategoryProvider();
      this.transactionCategoryRepository = new TransactionCategoryRepository(provider);
    }
    return this.transactionCategoryRepository;
  }
  
  public getTransactionGroupRepository(): TransactionGroupRepository {
    if (!this.transactionGroupRepository) {
      const provider = this.storageManager.getTransactionGroupProvider();
      this.transactionGroupRepository = new TransactionGroupRepository(provider);
    }
    return this.transactionGroupRepository;
  }
  
  public getConfigurationRepository(): ConfigurationRepository {
    if (!this.configurationRepository) {
      const provider = this.storageManager.getConfigurationProvider();
      this.configurationRepository = new ConfigurationRepository(provider);
    }
    return this.configurationRepository;
  }
  
  public getRecurringRepository(): RecurringRepository {
    if (!this.recurringRepository) {
      const provider = this.storageManager.getRecurringProvider();
      this.recurringRepository = new RecurringRepository(provider);
    }
    return this.recurringRepository;
  }
  
  public getStatsRepository(): StatsRepository {
    if (!this.statsRepository) {
      const provider = this.storageManager.getStatsProvider();
      this.statsRepository = new StatsRepository(provider);
    }
    return this.statsRepository;
  }
  
  // Clear all repository instances when storage mode changes
  public clearRepositories(): void {
    console.log('Clearing repository instances due to storage mode change');
    
    this.accountRepository = undefined;
    this.accountCategoryRepository = undefined;
    this.transactionRepository = undefined;
    this.transactionCategoryRepository = undefined;
    this.transactionGroupRepository = undefined;
    this.configurationRepository = undefined;
    this.recurringRepository = undefined;
    this.statsRepository = undefined;
    
    console.log('Repository instances cleared');
  }

  /**
   * Handle storage mode changes with proper query invalidation
   */
  private async handleStorageModeChange(): Promise<void> {
    const previousMode = this.currentStorageMode;
    const newMode = this.storageManager.getMode();
    
    console.log(`RepositoryManager handling storage mode change: ${previousMode} -> ${newMode}`);
    
    try {
      // Clear repository instances first
      this.clearRepositories();
      
      // Update current mode
      this.currentStorageMode = newMode;
      
      // Invalidate queries if query manager is available
      if (this.queryInvalidationManager) {
        await this.queryInvalidationManager.invalidateOnModeSwitch(newMode, previousMode);
      }
      
      console.log(`Successfully handled storage mode change to ${newMode}`);
    } catch (error) {
      console.error(`Failed to handle storage mode change:`, error);
      // Don't throw - we want the mode change to continue even if query invalidation fails
    }
  }

  /**
   * Set the query invalidation manager for handling cache invalidation
   */
  public setQueryInvalidationManager(manager: QueryInvalidationManager): void {
    this.queryInvalidationManager = manager;
    // Update the manager with current storage mode
    if (this.currentStorageMode) {
      manager.setStorageMode(this.currentStorageMode);
    }
  }

  /**
   * Get the current storage mode
   */
  public getCurrentStorageMode(): StorageMode {
    return this.currentStorageMode || this.storageManager.getMode();
  }

  /**
   * Get repository statistics for debugging
   */
  public getRepositoryStats(): {
    storageMode: StorageMode;
    repositoriesLoaded: string[];
    totalRepositories: number;
  } {
    const loadedRepositories: string[] = [];
    
    if (this.accountRepository) loadedRepositories.push('accounts');
    if (this.accountCategoryRepository) loadedRepositories.push('accountCategories');
    if (this.transactionRepository) loadedRepositories.push('transactions');
    if (this.transactionCategoryRepository) loadedRepositories.push('transactionCategories');
    if (this.transactionGroupRepository) loadedRepositories.push('transactionGroups');
    if (this.configurationRepository) loadedRepositories.push('configurations');
    if (this.recurringRepository) loadedRepositories.push('recurrings');
    if (this.statsRepository) loadedRepositories.push('stats');
    
    return {
      storageMode: this.getCurrentStorageMode(),
      repositoriesLoaded: loadedRepositories,
      totalRepositories: loadedRepositories.length,
    };
  }

  /**
   * Force refresh all repository instances (useful for testing)
   */
  public forceRefreshRepositories(): void {
    console.log('Force refreshing all repository instances');
    this.clearRepositories();
  }

  /**
   * Validate that the storage manager is properly initialized
   */
  public validateStorageIntegration(): boolean {
    try {
      // Check if storage manager is available
      if (!this.storageManager) {
        console.error('StorageModeManager is not available');
        return false;
      }

      // Check if we can get the current mode
      const mode = this.storageManager.getMode();
      if (!mode) {
        console.error('Storage mode is not set');
        return false;
      }

      // Try to get a provider to ensure DI container is working
      try {
        const accountProvider = this.storageManager.getAccountProvider();
        if (!accountProvider) {
          console.error('Account provider is not available');
          return false;
        }
      } catch (error) {
        console.error('Failed to get account provider:', error);
        return false;
      }

      console.log(`Storage integration validated successfully for mode: ${mode}`);
      return true;
    } catch (error) {
      console.error('Storage integration validation failed:', error);
      return false;
    }
  }
}