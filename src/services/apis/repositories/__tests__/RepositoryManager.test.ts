import { RepositoryManager } from '../RepositoryManager';
import { StorageModeManager } from '../../../storage/StorageModeManager';

describe('RepositoryManager', () => {
  let repositoryManager: RepositoryManager;
  let storageModeManager: StorageModeManager;

  beforeEach(() => {
    repositoryManager = RepositoryManager.getInstance();
    storageModeManager = StorageModeManager.getInstance();
  });

  it('should return singleton instance', () => {
    const instance1 = RepositoryManager.getInstance();
    const instance2 = RepositoryManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should provide account repository', () => {
    const accountRepo = repositoryManager.getAccountRepository();
    expect(accountRepo).toBeDefined();
    expect(typeof accountRepo.getAllAccounts).toBe('function');
  });

  it('should provide transaction repository', () => {
    const transactionRepo = repositoryManager.getTransactionRepository();
    expect(transactionRepo).toBeDefined();
    expect(typeof transactionRepo.getAllTransactions).toBe('function');
  });

  it('should provide all repository types', () => {
    expect(repositoryManager.getAccountRepository()).toBeDefined();
    expect(repositoryManager.getAccountCategoryRepository()).toBeDefined();
    expect(repositoryManager.getTransactionRepository()).toBeDefined();
    expect(repositoryManager.getTransactionCategoryRepository()).toBeDefined();
    expect(repositoryManager.getTransactionGroupRepository()).toBeDefined();
    expect(repositoryManager.getConfigurationRepository()).toBeDefined();
    expect(repositoryManager.getRecurringRepository()).toBeDefined();
    expect(repositoryManager.getStatsRepository()).toBeDefined();
  });

  it('should clear repositories when requested', () => {
    // Get repositories to create instances
    const accountRepo1 = repositoryManager.getAccountRepository();
    
    // Clear repositories
    repositoryManager.clearRepositories();
    
    // Get repository again - should be a new instance
    const accountRepo2 = repositoryManager.getAccountRepository();
    
    // They should be different instances (new ones created after clearing)
    expect(accountRepo1).not.toBe(accountRepo2);
  });
});