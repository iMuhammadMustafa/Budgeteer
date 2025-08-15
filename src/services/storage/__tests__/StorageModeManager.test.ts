// Unmock StorageModeManager for this test file to test the actual implementation
jest.unmock('../StorageModeManager');

import { StorageModeManager } from '../StorageModeManager';
import { StorageMode, StorageError } from '../types';

// Mock the dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

// Mock window.indexedDB for local mode tests
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: jest.fn(),
    deleteDatabase: jest.fn(),
  },
  writable: true
});

jest.mock('../../apis/local/LocalStorageProvider', () => ({
  localStorageProvider: {
    initialize: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    getDatabaseInfo: jest.fn().mockResolvedValue({ name: 'test', version: 1 })
  }
}));

jest.mock('../../apis/local/SQLiteStorageProvider', () => ({
  sqliteStorageProvider: {
    initialize: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    getDatabaseInfo: jest.fn().mockResolvedValue({ name: 'test.db' })
  }
}));

jest.mock('../DIContainer', () => ({
  DIContainer: {
    getInstance: jest.fn(() => ({
      setMode: jest.fn(),
      getProvider: jest.fn(() => ({})),
      initializeProviders: jest.fn().mockResolvedValue(undefined),
      cleanupProviders: jest.fn().mockResolvedValue(undefined),
      getStorageInfo: jest.fn().mockResolvedValue({ 
        mode: 'demo',
        providerCount: 0,
        providers: []
      })
    }))
  }
}));

describe('StorageModeManager', () => {
  let storageManager: StorageModeManager;

  beforeEach(() => {
    // Reset singleton instance
    (StorageModeManager as any).instance = undefined;
    storageManager = StorageModeManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mode Switching', () => {
    it('should initialize with cloud mode by default', () => {
      expect(storageManager.getMode()).toBe('cloud');
    });

    it('should switch to demo mode successfully', async () => {
      await storageManager.setMode('demo');
      expect(storageManager.getMode()).toBe('demo');
    });

    it('should switch to local mode successfully', async () => {
      await storageManager.setMode('local');
      expect(storageManager.getMode()).toBe('local');
    });

    it('should not switch if already in the same mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await storageManager.setMode('cloud');
      await storageManager.setMode('cloud');
      
      expect(consoleSpy).toHaveBeenCalledWith('Already in cloud mode');
      consoleSpy.mockRestore();
    });

    it('should handle concurrent mode switches', async () => {
      const promise1 = storageManager.setMode('demo');
      const promise2 = storageManager.setMode('local');
      
      await Promise.all([promise1, promise2]);
      
      // Should end up in one of the modes (the order is not guaranteed)
      expect(['demo', 'local']).toContain(storageManager.getMode());
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageError for unknown mode', async () => {
      await expect(storageManager.setMode('unknown' as StorageMode))
        .rejects.toThrow(StorageError);
    });

    it('should rollback to previous mode on initialization failure', async () => {
      // Mock initialization failure for local mode
      const mockError = new Error('Initialization failed');
      const originalMode = storageManager.getMode();
      
      // Mock the container's initializeProviders to fail once
      const mockContainer = storageManager['container'];
      const originalInitialize = mockContainer.initializeProviders;
      mockContainer.initializeProviders = jest.fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValue(undefined);
      
      await expect(storageManager.setMode('local')).rejects.toThrow(StorageError);
      expect(storageManager.getMode()).toBe(originalMode);
      
      // Restore the original mock
      mockContainer.initializeProviders = originalInitialize;
    });
  });

  describe('Storage Info', () => {
    it('should return storage information', async () => {
      const info = await storageManager.getStorageInfo();
      
      expect(info).toHaveProperty('currentMode');
      expect(info).toHaveProperty('isInitializing');
      expect(info.currentMode).toBe(storageManager.getMode());
    });

    it('should handle storage info errors gracefully', async () => {
      // Mock error in getting storage info
      jest.spyOn(storageManager['container'], 'getStorageInfo')
        .mockRejectedValue(new Error('Storage info error'));
      
      const info = await storageManager.getStorageInfo();
      
      expect(info).toHaveProperty('error');
      expect(info.error).toBe('Storage info error');
    });
  });

  describe('Data Migration', () => {
    it('should handle migration between different modes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await storageManager.migrateData('cloud', 'demo');
      
      expect(consoleSpy).toHaveBeenCalledWith('Migrating data from cloud to demo');
      expect(consoleSpy).toHaveBeenCalledWith('Switching to demo mode - using sample data');
      
      consoleSpy.mockRestore();
    });

    it('should skip migration for same mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await storageManager.migrateData('cloud', 'cloud');
      
      expect(consoleSpy).toHaveBeenCalledWith('No migration needed - same storage mode');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Provider Access', () => {
    it('should provide access to all entity providers', () => {
      expect(storageManager.getAccountProvider()).toBeDefined();
      expect(storageManager.getAccountCategoryProvider()).toBeDefined();
      expect(storageManager.getTransactionProvider()).toBeDefined();
      expect(storageManager.getTransactionCategoryProvider()).toBeDefined();
      expect(storageManager.getTransactionGroupProvider()).toBeDefined();
      expect(storageManager.getConfigurationProvider()).toBeDefined();
      expect(storageManager.getRecurringProvider()).toBeDefined();
      expect(storageManager.getStatsProvider()).toBeDefined();
    });
  });
});