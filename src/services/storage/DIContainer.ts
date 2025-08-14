// Dependency injection container for managing provider instances

import { StorageMode, EntityType, ProviderRegistry } from './types';
import { ProviderFactory } from './ProviderFactory';

export class DIContainer {
  private static instance: DIContainer;
  private providers: Map<EntityType, any> = new Map();
  private currentMode: StorageMode = 'cloud';
  private factory: ProviderFactory;
  
  private constructor() {
    this.factory = ProviderFactory.getInstance();
  }
  
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }
  
  public setMode(mode: StorageMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      // Clear existing providers to force recreation with new mode
      this.providers.clear();
    }
  }
  
  public getMode(): StorageMode {
    return this.currentMode;
  }
  
  public getProvider<T extends EntityType>(entityType: T): ProviderRegistry[T] {
    if (!this.providers.has(entityType)) {
      const provider = this.factory.createProvider(entityType, this.currentMode);
      this.providers.set(entityType, provider);
    }
    return this.providers.get(entityType) as ProviderRegistry[T];
  }
  
  public clearProviders(): void {
    this.providers.clear();
  }
  
  public async initializeProviders(): Promise<void> {
    console.log(`Initializing providers for mode: ${this.currentMode}`);
    
    try {
      switch (this.currentMode) {
        case 'local':
          await this.initializeLocalStorage();
          break;
        case 'demo':
          await this.initializeDemoStorage();
          break;
        case 'cloud':
          await this.initializeCloudStorage();
          break;
        default:
          throw new Error(`Unknown storage mode: ${this.currentMode}`);
      }
      
      console.log(`Successfully initialized providers for mode: ${this.currentMode}`);
    } catch (error) {
      console.error(`Failed to initialize providers for mode ${this.currentMode}:`, error);
      throw error;
    }
  }
  
  public async cleanupProviders(): Promise<void> {
    console.log(`Cleaning up providers for mode: ${this.currentMode}`);
    
    try {
      switch (this.currentMode) {
        case 'local':
          await this.cleanupLocalStorage();
          break;
        case 'demo':
          await this.cleanupDemoStorage();
          break;
        case 'cloud':
          await this.cleanupCloudStorage();
          break;
      }
      
      // Clear provider instances
      this.providers.clear();
      console.log(`Successfully cleaned up providers for mode: ${this.currentMode}`);
    } catch (error) {
      console.error(`Failed to cleanup providers for mode ${this.currentMode}:`, error);
      // Still clear providers even if cleanup fails
      this.providers.clear();
      throw error;
    }
  }

  private async initializeLocalStorage(): Promise<void> {
    const { Platform } = require('react-native');
    
    if (Platform.OS === 'web') {
      // Initialize IndexedDB
      const { localStorageProvider } = require('../apis/local/LocalStorageProvider');
      await localStorageProvider.initialize();
      console.log('IndexedDB initialized for web platform');
    } else {
      // Initialize SQLite for native platforms
      const { sqliteStorageProvider } = require('../apis/local/SQLiteStorageProvider');
      await sqliteStorageProvider.initialize();
      console.log('SQLite initialized for native platform');
    }
  }

  private async cleanupLocalStorage(): Promise<void> {
    const { Platform } = require('react-native');
    
    if (Platform.OS === 'web') {
      // Cleanup IndexedDB
      const { localStorageProvider } = require('../apis/local/LocalStorageProvider');
      await localStorageProvider.cleanup();
      console.log('IndexedDB cleaned up for web platform');
    } else {
      // Cleanup SQLite for native platforms
      const { sqliteStorageProvider } = require('../apis/local/SQLiteStorageProvider');
      await sqliteStorageProvider.cleanup();
      console.log('SQLite cleaned up for native platform');
    }
  }

  private async initializeDemoStorage(): Promise<void> {
    // Demo mode uses in-memory storage, no special initialization needed
    console.log('Demo storage initialized (in-memory)');
  }

  private async cleanupDemoStorage(): Promise<void> {
    // Demo mode cleanup - clear any cached data
    console.log('Demo storage cleaned up');
  }

  private async initializeCloudStorage(): Promise<void> {
    // Cloud mode uses Supabase, no special initialization needed
    // The Supabase client is initialized globally
    console.log('Cloud storage initialized (Supabase)');
  }

  private async cleanupCloudStorage(): Promise<void> {
    // Cloud mode cleanup - no special cleanup needed
    console.log('Cloud storage cleaned up');
  }

  public async getStorageInfo(): Promise<any> {
    const info: any = {
      mode: this.currentMode,
      providerCount: this.providers.size,
      providers: Array.from(this.providers.keys())
    };

    try {
      switch (this.currentMode) {
        case 'local':
          const { Platform } = require('react-native');
          if (Platform.OS === 'web') {
            const { localStorageProvider } = require('../apis/local/LocalStorageProvider');
            info.storage = await localStorageProvider.getDatabaseInfo();
          } else {
            const { sqliteStorageProvider } = require('../apis/local/SQLiteStorageProvider');
            info.storage = await sqliteStorageProvider.getDatabaseInfo();
          }
          break;
        case 'demo':
          info.storage = { type: 'in-memory', description: 'Demo data stored in memory' };
          break;
        case 'cloud':
          info.storage = { type: 'supabase', description: 'Data stored in Supabase cloud database' };
          break;
      }
    } catch (error) {
      info.storageError = (error as Error).message;
    }

    return info;
  }
}