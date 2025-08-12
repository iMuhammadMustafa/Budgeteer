import { IStorageProvider } from '../IStorageProvider';
import { IStatsRepository } from '../repositories/IStatsRepository';

/**
 * Provider interface for Statistics entity storage operations
 * Combines storage provider lifecycle with stats repository operations
 */
export interface IStatsProvider extends IStorageProvider, IStatsRepository {
  // This interface inherits all methods from both IStorageProvider and IStatsRepository
  // No additional methods needed as this is a composition interface
}