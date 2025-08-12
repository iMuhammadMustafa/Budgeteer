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
    // Initialize any providers that need setup
    // This will be expanded when local storage providers are implemented
    console.log(`Initializing providers for mode: ${this.currentMode}`);
  }
  
  public async cleanupProviders(): Promise<void> {
    // Cleanup any providers that need teardown
    // This will be expanded when local storage providers are implemented
    this.providers.clear();
    console.log(`Cleaned up providers for mode: ${this.currentMode}`);
  }
}