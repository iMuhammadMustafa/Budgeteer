import { StorageModeManager } from '../../storage/StorageModeManager';
import { AccountRepository } from './AccountRepository';
import { AccountCategoryRepository } from './AccountCategoryRepository';
import { TransactionRepository } from './TransactionRepository';
import { TransactionCategoryRepository } from './TransactionCategoryRepository';
import { TransactionGroupRepository } from './TransactionGroupRepository';
import { ConfigurationRepository } from './ConfigurationRepository';
import { RecurringRepository } from './RecurringRepository';
import { StatsRepository } from './StatsRepository';

export class RepositoryManager {
  private static instance: RepositoryManager;
  private storageManager: StorageModeManager;
  
  // Repository instances
  private accountRepository?: AccountRepository;
  private accountCategoryRepository?: AccountCategoryRepository;
  private transactionRepository?: TransactionRepository;
  private transactionCategoryRepository?: TransactionCategoryRepository;
  private transactionGroupRepository?: TransactionGroupRepository;
  private configurationRepository?: ConfigurationRepository;
  private recurringRepository?: RecurringRepository;
  private statsRepository?: StatsRepository;
  
  private constructor() {
    this.storageManager = StorageModeManager.getInstance();
    // Register callback to clear repositories when storage mode changes
    this.storageManager.setModeChangeCallback(() => this.clearRepositories());
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
    this.accountRepository = undefined;
    this.accountCategoryRepository = undefined;
    this.transactionRepository = undefined;
    this.transactionCategoryRepository = undefined;
    this.transactionGroupRepository = undefined;
    this.configurationRepository = undefined;
    this.recurringRepository = undefined;
    this.statsRepository = undefined;
  }
}