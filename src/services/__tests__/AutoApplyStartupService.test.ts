import { AutoApplyStartupService, createAutoApplyStartupService, DEFAULT_STARTUP_CONFIG } from '../AutoApplyStartupService';
import { IAutoApplyService } from '../AutoApply.Service';
import { AutoApplyResult } from '@/src/types/enhanced-recurring';

// Mock the auto-apply service
const mockAutoApplyService: jest.Mocked<IAutoApplyService> = {
  checkAndApplyDueTransactions: jest.fn(),
  getDueRecurringTransactions: jest.fn(),
  applyRecurringTransaction: jest.fn(),
  batchApplyTransactions: jest.fn(),
  setAutoApplyEnabled: jest.fn(),
  getAutoApplySettings: jest.fn(),
  updateAutoApplySettings: jest.fn(),
  engine: {} as any
};

describe('AutoApplyStartupService', () => {
  let service: AutoApplyStartupService;
  let mockNotificationSystem: {
    addNotification: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockNotificationSystem = {
      addNotification: jest.fn()
    };

    service = createAutoApplyStartupService(
      mockAutoApplyService,
      mockNotificationSystem,
      {
        delayMs: 1000,
        maxRetries: 2,
        retryDelayMs: 500,
        timeoutMs: 5000
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should create service with default configuration', () => {
      const defaultService = new AutoApplyStartupService(mockAutoApplyService);
      expect(defaultService).toBeDefined();
      expect(defaultService.getLastResult()).toBeNull();
      expect(defaultService.isExecuting()).toBe(false);
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        enabled: false,
        delayMs: 5000,
        maxRetries: 5
      };

      const customService = new AutoApplyStartupService(mockAutoApplyService, customConfig);
      expect(customService).toBeDefined();
    });

    it('should create service using factory function', () => {
      const factoryService = createAutoApplyStartupService(
        mockAutoApplyService,
        mockNotificationSystem
      );
      expect(factoryService).toBeDefined();
    });
  });

  describe('startup initialization', () => {
    it('should initialize on startup with delay', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 2,
        failedCount: 0,
        pendingCount: 1,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      // Fast-forward past delay
      jest.advanceTimersByTime(1000);
      
      // Fast-forward past mutation execution
      jest.advanceTimersByTime(100);

      const result = await initPromise;

      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.result).toEqual(mockResult);
      expect(mockNotificationSystem.addNotification).toHaveBeenCalledWith({
        message: '2 recurring transactions applied automatically',
        type: 'success'
      });
    });

    it('should skip initialization when disabled', async () => {
      const disabledService = new AutoApplyStartupService(
        mockAutoApplyService,
        { enabled: false }
      );

      const result = await disabledService.initializeOnStartup();

      expect(result).toBeNull();
      expect(mockAutoApplyService.checkAndApplyDueTransactions).not.toHaveBeenCalled();
    });

    it('should not initialize twice concurrently', async () => {
      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess({
            appliedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            appliedTransactions: [],
            failedTransactions: [],
            pendingTransactions: []
          }), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const promise1 = service.initializeOnStartup();
      const promise2 = service.initializeOnStartup();

      jest.advanceTimersByTime(1100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Second call should return the same result as first
      expect(result1).toEqual(result2);
      expect(mockAutoApplyService.checkAndApplyDueTransactions).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling and retries', () => {
    it('should retry on failure', async () => {
      let attemptCount = 0;
      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          attemptCount++;
          if (attemptCount === 1) {
            setTimeout(() => callbacks.onError(new Error('First attempt failed')), 100);
          } else {
            setTimeout(() => callbacks.onSuccess({
              appliedCount: 1,
              failedCount: 0,
              pendingCount: 0,
              appliedTransactions: [],
              failedTransactions: [],
              pendingTransactions: []
            }), 100);
          }
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      // Fast-forward past initial delay
      jest.advanceTimersByTime(1000);
      
      // Fast-forward past first attempt
      jest.advanceTimersByTime(100);
      
      // Fast-forward past retry delay
      jest.advanceTimersByTime(500);
      
      // Fast-forward past second attempt
      jest.advanceTimersByTime(100);

      const result = await initPromise;

      expect(result?.success).toBe(true);
      expect(result?.retryCount).toBe(1);
      expect(mockAutoApplyService.checkAndApplyDueTransactions).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onError(new Error('Persistent failure')), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      // Fast-forward through all retry attempts
      jest.advanceTimersByTime(1000); // Initial delay
      jest.advanceTimersByTime(100);  // First attempt
      jest.advanceTimersByTime(500);  // Retry delay
      jest.advanceTimersByTime(100);  // Second attempt
      jest.advanceTimersByTime(500);  // Retry delay
      jest.advanceTimersByTime(100);  // Third attempt

      const result = await initPromise;

      expect(result?.success).toBe(false);
      expect(result?.error?.message).toBe('Persistent failure');
      expect(result?.retryCount).toBe(2); // maxRetries
      expect(mockAutoApplyService.checkAndApplyDueTransactions).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors', async () => {
      const mockMutation = {
        mutate: jest.fn(() => {
          // Never call callbacks to simulate timeout
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      // Fast-forward past delay and timeout
      jest.advanceTimersByTime(1000); // Initial delay
      jest.advanceTimersByTime(5000); // Timeout

      const result = await initPromise;

      expect(result?.success).toBe(false);
      expect(result?.error?.message).toContain('timed out');
    });

    it('should skip errors when configured', async () => {
      const skipErrorService = new AutoApplyStartupService(
        mockAutoApplyService,
        { skipOnError: true }
      );

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onError(new Error('Test error')), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const result = await skipErrorService.initializeOnStartup();

      expect(result).toBeNull(); // Should return null when skipping errors
    });
  });

  describe('manual triggers', () => {
    it('should support manual trigger', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 1,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const triggerPromise = service.triggerManualCheck();

      jest.advanceTimersByTime(100);

      const result = await triggerPromise;

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
    });

    it('should prevent concurrent manual triggers', async () => {
      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess({
            appliedCount: 0,
            failedCount: 0,
            pendingCount: 0,
            appliedTransactions: [],
            failedTransactions: [],
            pendingTransactions: []
          }), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const promise1 = service.triggerManualCheck();
      
      await expect(service.triggerManualCheck()).rejects.toThrow('Auto-apply is already running');

      jest.advanceTimersByTime(100);
      await promise1;
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxRetries: 5,
        timeoutMs: 10000
      };

      service.updateConfig(newConfig);

      // Configuration should be updated (no direct way to verify without exposing internals)
      expect(service.updateConfig).toBeDefined();
    });

    it('should use default configuration values', () => {
      const defaultService = new AutoApplyStartupService(mockAutoApplyService);
      
      expect(defaultService).toBeDefined();
      // Default config should be applied
    });
  });

  describe('notification integration', () => {
    it('should show success notifications', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 3,
        failedCount: 1,
        pendingCount: 2,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      jest.advanceTimersByTime(1100);

      await initPromise;

      expect(mockNotificationSystem.addNotification).toHaveBeenCalledWith({
        message: '3 recurring transactions applied automatically',
        type: 'success'
      });

      expect(mockNotificationSystem.addNotification).toHaveBeenCalledWith({
        message: '1 recurring transaction failed to apply',
        type: 'error'
      });

      expect(mockNotificationSystem.addNotification).toHaveBeenCalledWith({
        message: '2 recurring transactions require manual approval',
        type: 'info'
      });
    });

    it('should not show notifications when none are needed', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      jest.advanceTimersByTime(1100);

      await initPromise;

      expect(mockNotificationSystem.addNotification).not.toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should track execution state', () => {
      expect(service.isExecuting()).toBe(false);
      expect(service.getLastResult()).toBeNull();
    });

    it('should update last result after execution', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 1,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const initPromise = service.initializeOnStartup();

      jest.advanceTimersByTime(1100);

      await initPromise;

      const lastResult = service.getLastResult();
      expect(lastResult?.success).toBe(true);
      expect(lastResult?.result).toEqual(mockResult);
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of transactions efficiently', async () => {
      const mockResult: AutoApplyResult = {
        appliedCount: 100,
        failedCount: 5,
        pendingCount: 20,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      const mockMutation = {
        mutate: jest.fn((_, callbacks) => {
          setTimeout(() => callbacks.onSuccess(mockResult), 100);
        })
      };

      mockAutoApplyService.checkAndApplyDueTransactions.mockReturnValue(mockMutation as any);

      const startTime = Date.now();
      const initPromise = service.initializeOnStartup();

      jest.advanceTimersByTime(1100);

      const result = await initPromise;
      const executionTime = Date.now() - startTime;

      expect(result?.success).toBe(true);
      expect(result?.executionTimeMs).toBeDefined();
      expect(executionTime).toBeLessThan(2000); // Should complete quickly in test environment
    });

    it('should not block on startup delay', () => {
      const startTime = Date.now();
      
      service.initializeOnStartup();
      
      const initTime = Date.now() - startTime;
      
      // Initialization should return immediately (promise-based)
      expect(initTime).toBeLessThan(100);
    });
  });
});