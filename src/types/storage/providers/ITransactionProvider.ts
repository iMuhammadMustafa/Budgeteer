import { IStorageProvider } from '../IStorageProvider';
import { ITransactionRepository } from '../repositories/ITransactionRepository';

/**
 * Provider interface for Transaction entity storage operations
 * Combines storage provider lifecycle with transaction repository operations
 */
export interface ITransactionProvider extends IStorageProvider, ITransactionRepository {
  // This interface inherits all methods from both IStorageProvider and ITransactionRepository
  // No additional methods needed as this is a composition interface
}