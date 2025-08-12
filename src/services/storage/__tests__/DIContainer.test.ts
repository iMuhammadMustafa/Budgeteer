// Tests for the dependency injection container

import { DIContainer } from '../DIContainer';
import { StorageMode } from '../types';

// Mock the ProviderFactory to avoid Supabase imports
jest.mock('../ProviderFactory', () => ({
  ProviderFactory: {
    getInstance: () => ({
      createProvider: jest.fn((entityType, mode) => ({
        entityType,
        mode,
        mockProvider: true
      }))
    })
  }
}));

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = DIContainer.getInstance();
    container.clearProviders();
  });

  afterEach(() => {
    container.clearProviders();
  });

  it('should be a singleton', () => {
    const container1 = DIContainer.getInstance();
    const container2 = DIContainer.getInstance();
    expect(container1).toBe(container2);
  });

  it('should set and get storage mode', () => {
    container.setMode('demo');
    expect(container.getMode()).toBe('demo');
    
    container.setMode('cloud');
    expect(container.getMode()).toBe('cloud');
  });

  it('should clear providers when mode changes', () => {
    // Get a provider to populate the cache
    container.setMode('demo');
    const provider1 = container.getProvider('accounts');
    
    // Change mode should clear cache
    container.setMode('cloud');
    const provider2 = container.getProvider('accounts');
    
    // Providers should be different instances
    expect(provider1).not.toBe(provider2);
  });

  it('should return same provider instance for same entity type and mode', () => {
    container.setMode('demo');
    const provider1 = container.getProvider('accounts');
    const provider2 = container.getProvider('accounts');
    
    expect(provider1).toBe(provider2);
  });

  it('should return different providers for different entity types', () => {
    container.setMode('demo');
    const accountProvider = container.getProvider('accounts');
    const transactionProvider = container.getProvider('transactions');
    
    expect(accountProvider).not.toBe(transactionProvider);
  });
});