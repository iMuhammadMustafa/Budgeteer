import { IStorageProvider } from '../IStorageProvider';
import { ITransactionGroupRepository } from '../repositories/ITransactionGroupRepository';

/**
 * Provider interface for TransactionGroup entity storage operations
 * Combines storage provider lifecycle with transaction group repository operations
 */
export interface ITransactionGroupProvider extends IStorageProvider, ITransactionGroupRepository {
  // This interface inherits all methods from both IStorageProvider and ITransactionGroupRepository
  // No additional methods needed as this is a composition interface
}