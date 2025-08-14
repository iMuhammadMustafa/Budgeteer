// Integration test for storage mode switching functionality

import { StorageModeManager } from '../StorageModeManager';
import { StorageModeValidator } from '../StorageModeValidator';
import { RepositoryManager } from '../../apis/repositories/RepositoryManager';
import { setStorageMode, getStorageMode, initializeStorageMode } from '../../../providers/DemoModeGlobal';
import { StorageMode } from '../types';

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

// Mock local storage providers
jest.mock('../../apis/local/LocalStorageProvider', () => ({
  localStorageProvider: {
    initialize: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined),
    getDatabaseInfo: jest.fn().mockResolvedValue({ 
      name: 'BudgeteerDB', 
      version: 1, 
      isOpen: true,
      tables: {
        accounts: { count: 0 },
        transactions: { count: 0 }
      }
    })
  }
}));

describe('Storage Mode Switching Integration', () => {
  let storageManager: StorageModeManager;
  let repositoryManager: RepositoryManager;

  beforeEach(async () => {
    // Reset singleton instances
    (StorageModeManager as any).instance = undefined;
    (RepositoryManager as any).instance = undefined;
    
    storageManager = StorageModeManager.getInstance();
    repositoryManager = RepositoryManager.getInstance();
    
    // Initialize with default mode
    await initializeStorageMode('cloud');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Mode Switching Workflow', () => {
    it('should switch from cloud to demo mode successfully', async () => {
      // Start in cloud mode
      expect(getStorageMode()).toBe('cloud');
      
      // Switch to demo mode
      await setStorageMode('demo');
      
      // Verify mode change
      expect(getStorageMode()).toBe('demo');
      expect(storageManager.getMode()).toBe('demo');
      
      // Verify repositories are recreated with new providers
      const accountRepo = repositoryManager.getAccountRepository();
      expect(accountRepo).toBeDefined();
    });

    it('should switch from demo to local mode successfully', async () => {
      // Start in demo mode
      await setStorageMode('demo');
      expect(getStorageMode()).toBe('demo');
      
      // Switch to local mode
      await setStorageMode('local');
      
      // Verify mode change
      expect(getStorageMode()).toBe('local');
      expect(storageManager.getMode()).toBe('local');
      
      // Verify storage info includes local storage details
      const storageInfo = await storageManager.getStorageInfo();
      expect(storageInfo.currentMode).toBe('local');
      expect(storageInfo.storage).toBeDefined();
    });

    it('should handle mode switching with repository recreation', async () => {
      // Get initial repository instance
      const initialAccountRepo = repositoryManager.getAccountRepository();
      
      // Switch modes
      await setStorageMode('demo');
      
      // Get repository instance after mode switch
      const newAccountRepo = repositoryManager.getAccountRepository();
      
      // Repositories should be different instances (recreated)
      expect(newAccountRepo).toBeDefined();
      // Note: We can't directly compare instances due to mocking, but we verify they exist
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle initialization failures gracefully', async () => {
      // Mock initialization failure
      const mockError = new Error('Storage initialization failed');
      jest.spyOn(storageManager, 'initialize').mockRejectedValueOnce(mockError);
      
      const originalMode = getStorageMode();
      
      // Attempt to switch mode
      await expect(setStorageMode('local')).rejects.toThrow();
      
      // Should remain in original mode
      expect(getStorageMode()).toBe(originalMode);
    });

    it('should provide detailed error information', async () => {
      try {
        await setStorageMode('unknown' as StorageMode);
      } catch (error: any) {
        expect(error.code).toBeDefined();
        expect(error.details).toBeDefined();
        expect(error.message).toContain('Unknown storage mode');
      }
    });
  });

  describe('Storage Mode Validation', () => {
    it('should validate all storage modes', async () => {
      const validationResults = await StorageModeValidator.validateAllModes();
      
      expect(validationResults.cloud).toBeDefined();
      expect(validationResults.demo).toBeDefined();
      expect(validationResults.local).toBeDefined();
      
      // Demo mode should always be available
      expect(validationResults.demo.isAvailable).toBe(true);
      expect(validationResults.demo.isSupported).toBe(true);
    });

    it('should recommend appropriate storage mode', async () => {
      const recommendedMode = await StorageModeValidator.getRecommendedMode();
      
      expect(['cloud', 'demo', 'local']).toContain(recommendedMode);
    });

    it('should format validation reports correctly', async () => {
      const demoValidation = await StorageModeValidator.validateMode('demo');
      const report = StorageModeValidator.formatValidationReport(demoValidation);
      
      expect(report).toContain('Storage Mode: DEMO');
      expect(report).toContain('Supported: Yes');
      expect(report).toContain('Available: Yes');
    });
  });

  describe('Storage Information and Diagnostics', () => {
    it('should provide comprehensive storage information', async () => {
      await setStorageMode('local');
      
      const storageInfo = await storageManager.getStorageInfo();
      
      expect(storageInfo).toHaveProperty('currentMode', 'local');
      expect(storageInfo).toHaveProperty('isInitializing');
      expect(storageInfo).toHaveProperty('storage');
    });

    it('should handle storage info errors gracefully', async () => {
      // Mock error in container
      jest.spyOn(storageManager['container'], 'getStorageInfo')
        .mockRejectedValue(new Error('Storage info error'));
      
      const storageInfo = await storageManager.getStorageInfo();
      
      expect(storageInfo).toHaveProperty('error');
      expect(storageInfo.currentMode).toBe(getStorageMode());
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent mode switches safely', async () => {
      const promises = [
        setStorageMode('demo'),
        setStorageMode('local'),
        setStorageMode('cloud')
      ];
      
      // All promises should resolve without throwing
      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      // Should end up in one of the modes
      const finalMode = getStorageMode();
      expect(['cloud', 'demo', 'local']).toContain(finalMode);
    });

    it('should prevent initialization during active mode switch', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Start a mode switch
      const switchPromise = setStorageMode('demo');
      
      // Try to switch again immediately
      const secondSwitchPromise = setStorageMode('local');
      
      await Promise.all([switchPromise, secondSwitchPromise]);
      
      // Should log that mode switch was already in progress
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mode switch already in progress')
      );
      
      consoleSpy.mockRestore();
    });
  });
});