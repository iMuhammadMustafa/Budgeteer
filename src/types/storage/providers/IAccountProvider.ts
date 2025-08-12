import { IStorageProvider } from '../IStorageProvider';
import { IAccountRepository } from '../repositories/IAccountRepository';

/**
 * Provider interface for Account entity storage operations
 * Combines storage provider lifecycle with account repository operations
 */
export interface IAccountProvider extends IStorageProvider, IAccountRepository {
  // This interface inherits all methods from both IStorageProvider and IAccountRepository
  // No additional methods needed as this is a composition interface
}