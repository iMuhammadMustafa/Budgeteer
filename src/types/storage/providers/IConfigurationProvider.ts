import { IStorageProvider } from '../IStorageProvider';
import { IConfigurationRepository } from '../repositories/IConfigurationRepository';

/**
 * Provider interface for Configuration entity storage operations
 * Combines storage provider lifecycle with configuration repository operations
 */
export interface IConfigurationProvider extends IStorageProvider, IConfigurationRepository {
  // This interface inherits all methods from both IStorageProvider and IConfigurationRepository
  // No additional methods needed as this is a composition interface
}