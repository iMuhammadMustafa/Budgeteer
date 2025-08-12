import { IStorageProvider } from '../IStorageProvider';
import { ITransactionCategoryRepository } from '../repositories/ITransactionCategoryRepository';

/**
 * Provider interface for TransactionCategory entity storage operations
 * Combines storage provider lifecycle with transaction category repository operations
 */
export interface ITransactionCategoryProvider extends IStorageProvider, ITransactionCategoryRepository {
  // This interface inherits all methods from both IStorageProvider and ITransactionCategoryRepository
  // No additional methods needed as this is a composition interface
}