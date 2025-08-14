/**
 * Data Provider Factory
 * 
 * This factory creates the appropriate data provider instance based on the current storage mode.
 * It integrates with the existing DemoModeGlobal system to determine which provider to use.
 */

import { IDataProvider } from './ReferentialIntegrityValidator';
import { MockDataProvider } from './MockDataProvider';
import { SupabaseDataProvider } from './SupabaseDataProvider';
import { LocalDataProvider } from './LocalDataProvider';
import { DemoModeGlobal } from '../DemoModeGlobal';

export type StorageMode = 'cloud' | 'demo' | 'local';

export class DataProviderFactory {
  private static mockProvider: MockDataProvider | null = null;
  private static supabaseProvider: SupabaseDataProvider | null = null;
  private static localProvider: LocalDataProvider | null = null;

  /**
   * Get the appropriate data provider based on current storage mode
   */
  static getProvider(): IDataProvider {
    const currentMode = DataProviderFactory.getCurrentStorageMode();
    
    switch (currentMode) {
      case 'demo':
        if (!DataProviderFactory.mockProvider) {
          DataProviderFactory.mockProvider = new MockDataProvider();
        }
        return DataProviderFactory.mockProvider;
        
      case 'cloud':
        if (!DataProviderFactory.supabaseProvider) {
          DataProviderFactory.supabaseProvider = new SupabaseDataProvider();
        }
        return DataProviderFactory.supabaseProvider;
        
      case 'local':
        if (!DataProviderFactory.localProvider) {
          DataProviderFactory.localProvider = new LocalDataProvider();
        }
        return DataProviderFactory.localProvider;
        
      default:
        throw new Error(`Unknown storage mode: ${currentMode}`);
    }
  }

  /**
   * Get a specific provider instance (useful for testing)
   */
  static getProviderForMode(mode: StorageMode): IDataProvider {
    switch (mode) {
      case 'demo':
        return new MockDataProvider();
      case 'cloud':
        return new SupabaseDataProvider();
      case 'local':
        return new LocalDataProvider();
      default:
        throw new Error(`Unknown storage mode: ${mode}`);
    }
  }

  /**
   * Determine current storage mode based on DemoModeGlobal state
   */
  private static getCurrentStorageMode(): StorageMode {
    // Check if we're in demo mode
    if (DemoModeGlobal.isDemoMode) {
      return 'demo';
    }
    
    // Check if we're in local mode (this would be determined by app configuration)
    // For now, we'll assume local mode is indicated by a specific environment variable
    // or configuration setting. This can be enhanced based on the actual implementation.
    if (process.env.EXPO_PUBLIC_STORAGE_MODE === 'local') {
      return 'local';
    }
    
    // Default to cloud mode (Supabase)
    return 'cloud';
  }

  /**
   * Reset all provider instances (useful for testing or mode switching)
   */
  static resetProviders(): void {
    DataProviderFactory.mockProvider = null;
    DataProviderFactory.supabaseProvider = null;
    DataProviderFactory.localProvider = null;
  }
}