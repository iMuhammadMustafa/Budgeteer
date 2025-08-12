import { IStorageProvider } from '../IStorageProvider';
import { IAccountCategoryRepository } from '../repositories/IAccountCategoryRepository';

/**
 * Provider interface for AccountCategory entity storage operations
 * Combines storage provider lifecycle with account category repository operations
 */
export interface IAccountCategoryProvider extends IStorageProvider, IAccountCategoryRepository {
  // This interface inherits all methods from both IStorageProvider and IAccountCategoryRepository
  // No additional methods needed as this is a composition interface
}