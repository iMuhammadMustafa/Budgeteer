import { IStorageProvider } from '../IStorageProvider';
import { IRecurringRepository } from '../repositories/IRecurringRepository';

/**
 * Provider interface for Recurring entity storage operations
 * Combines storage provider lifecycle with recurring repository operations
 */
export interface IRecurringProvider extends IStorageProvider, IRecurringRepository {
  // This interface inherits all methods from both IStorageProvider and IRecurringRepository
  // No additional methods needed as this is a composition interface
}