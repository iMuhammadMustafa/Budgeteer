// Tests for the storage mode manager

import { StorageModeManager } from '../StorageModeManager';
import { StorageMode } from '../types';

// Mock the DIContainer to avoid Supabase imports
jest.mock('../DIContainer', () => ({
  DIContainer: {
    getInstance: () => ({
      setMode: jest.fn(),
      getMode: jest.fn(() => 'cloud'),
      getProvider: jest.fn((entityType) => ({
        entityType,
        mockProvider: true
      })),
      initializeProviders: jest.fn().mockResolvedValue(undefined),
      cleanupProviders: jest.fn().mockResolvedValue(undefined)
    })
  }
}));

describe('StorageModeManager', () => {
  let manager: StorageModeManager;

  beforeEach(() => {
    manager = StorageModeManager.getInstance();
  });

  it('should be a singleton', () => {
    const manager1 = StorageModeManager.getInstance();
    const manager2 = StorageModeManager.getInstance();
    expect(manager1).toBe(manager2);
  });

  it('should initialize with cloud mode by default', () => {
    expect(manager.getMode()).toBe('cloud');
  });

  it('should change storage mode', async () => {
    await manager.setMode('demo');
    expect(manager.getMode()).toBe('demo');
    
    await manager.setMode('cloud');
    expect(manager.getMode()).toBe('cloud');
  });

  it('should provide convenience methods for getting providers', () => {
    expect(() => manager.getAccountProvider()).not.toThrow();
    expect(() => manager.getTransactionProvider()).not.toThrow();
    expect(() => manager.getConfigurationProvider()).not.toThrow();
  });
});