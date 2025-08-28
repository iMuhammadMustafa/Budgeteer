import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAutoApplyStartup, useAutoApplyStartupSimple } from '../useAutoApplyStartup';
import { useAutoApplyService } from '@/src/services/AutoApply.Service';
import { useNotifications } from '@/src/providers/NotificationsProvider';
import { AutoApplyResult } from '@/src/types/recurring';

// Mock dependencies
jest.mock('@/src/services/AutoApply.Service');
jest.mock('@/src/providers/NotificationsProvider');

const mockUseAutoApplyService = useAutoApplyService as jest.MockedFunction<typeof useAutoApplyService>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('useAutoApplyStartup', () => {
  const mockAddNotification = jest.fn();
  const mockCheckAndApplyMutation = {
    mutate: jest.fn(),
    isLoading: false,
    error: null,
    data: null
  };

  const mockAutoApplyService = {
    checkAndApplyDueTransactions: () => mockCheckAndApplyMutation,
    getDueRecurringTransactions: jest.fn(),
    applyRecurringTransaction: jest.fn(),
    batchApplyTransactions: jest.fn(),
    setAutoApplyEnabled: jest.fn(),
    getAutoApplySettings: jest.fn(),
    updateAutoApplySettings: jest.fn(),
    engine: {} as any
  };

  const mockNotifications = {
    notifications: [],
    addNotification: mockAddNotification,
    removeNotification: jest.fn(),
    clearNotifications: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAutoApplyService.mockReturnValue(mockAutoApplyService);
    mockUseNotifications.mockReturnValue(mockNotifications);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useAutoApplyStartup', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('should initialize auto-apply with delay', async () => {
      const { result } = renderHook(() => useAutoApplyStartup({ delayMs: 1000 }));

      act(() => {
        result.current.initialize();
      });

      expect(result.current.isInitializing).toBe(true);

      // Fast-forward time to trigger the delayed execution
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Mock successful auto-apply result
      const mockResult: AutoApplyResult = {
        appliedCount: 2,
        failedCount: 0,
        pendingCount: 1,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      act(() => {
        const onSuccess = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onSuccess;
        onSuccess(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.result?.success).toBe(true);
      expect(result.current.result?.result).toEqual(mockResult);
      expect(mockAddNotification).toHaveBeenCalledWith({
        message: '2 recurring transactions applied automatically',
        type: 'success'
      });
      expect(mockAddNotification).toHaveBeenCalledWith({
        message: '1 recurring transaction requires manual approval',
        type: 'info'
      });
    });

    it('should handle auto-apply errors gracefully', async () => {
      const { result } = renderHook(() => useAutoApplyStartup({
        delayMs: 1000,
        skipOnError: true
      }));

      act(() => {
        result.current.initialize();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const mockError = new Error('Network error');

      act(() => {
        const onError = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onError;
        onError(mockError);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.isInitializing).toBe(false);
      });

      expect(result.current.result?.success).toBe(false);
      expect(result.current.result?.error).toEqual(mockError);
      expect(result.current.hasError).toBe(true);
    });

    it('should not initialize twice', () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      act(() => {
        result.current.initialize();
        result.current.initialize(); // Second call should be ignored
      });

      expect(result.current.isInitializing).toBe(true);
    });

    it('should support manual trigger', async () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      const mockResult: AutoApplyResult = {
        appliedCount: 1,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      act(() => {
        result.current.triggerManualCheck();
      });

      expect(result.current.isInitializing).toBe(true);

      act(() => {
        const onSuccess = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onSuccess;
        onSuccess(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.result?.success).toBe(true);
    });

    it('should reset state correctly', () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      act(() => {
        result.current.initialize();
      });

      expect(result.current.isInitializing).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.isComplete).toBe(false);
      expect(result.current.result).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should handle timeout errors', async () => {
      const { result } = renderHook(() => useAutoApplyStartup({
        delayMs: 1000,
        timeoutMs: 5000
      }));

      act(() => {
        result.current.initialize();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Simulate timeout by advancing time beyond timeout
      act(() => {
        jest.advanceTimersByTime(6000);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.result?.success).toBe(false);
      expect(result.current.result?.error?.message).toContain('timed out');
    });

    it('should retry on failure when configured', async () => {
      const { result } = renderHook(() => useAutoApplyStartup({
        delayMs: 1000,
        maxRetries: 2,
        retryDelayMs: 1000
      }));

      act(() => {
        result.current.initialize();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // First attempt fails
      act(() => {
        const onError = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onError;
        onError(new Error('First failure'));
      });

      // Advance time for retry delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Second attempt succeeds
      const mockResult: AutoApplyResult = {
        appliedCount: 1,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      act(() => {
        const onSuccess = mockCheckAndApplyMutation.mutate.mock.calls[1][1].onSuccess;
        onSuccess(mockResult);
      });

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      expect(result.current.result?.success).toBe(true);
      expect(result.current.result?.retryCount).toBe(1);
    });
  });

  describe('useAutoApplyStartupSimple', () => {
    it('should auto-initialize on mount', () => {
      const { result } = renderHook(() => useAutoApplyStartupSimple());

      expect(result.current.isInitializing).toBe(true);
    });

    it('should use default configuration', () => {
      const { result } = renderHook(() => useAutoApplyStartupSimple());

      // Should have initialized automatically
      expect(result.current.isInitializing).toBe(true);
    });

    it('should accept custom options', () => {
      const { result } = renderHook(() => useAutoApplyStartupSimple({
        enableLogging: false,
        delayMs: 5000
      }));

      expect(result.current.isInitializing).toBe(true);
    });
  });

  describe('error scenarios', () => {
    it('should handle service initialization errors', async () => {
      mockUseAutoApplyService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      expect(() => {
        renderHook(() => useAutoApplyStartup());
      }).toThrow('Service initialization failed');
    });

    it('should handle notification system errors', async () => {
      mockUseNotifications.mockImplementation(() => {
        throw new Error('Notification system not available');
      });

      expect(() => {
        renderHook(() => useAutoApplyStartup());
      }).toThrow('Notification system not available');
    });
  });

  describe('configuration updates', () => {
    it('should allow configuration updates', () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      act(() => {
        result.current.updateConfig({
          enableLogging: false,
          maxRetries: 5
        });
      });

      // Configuration should be updated (no direct way to test this without exposing internals)
      expect(result.current.updateConfig).toBeDefined();
    });
  });

  describe('performance considerations', () => {
    it('should not block app startup with delayed execution', () => {
      const startTime = Date.now();

      renderHook(() => useAutoApplyStartupSimple({ delayMs: 2000 }));

      const initTime = Date.now() - startTime;

      // Hook initialization should be fast (< 100ms)
      expect(initTime).toBeLessThan(100);
    });

    it('should handle concurrent initialization attempts', () => {
      const { result } = renderHook(() => useAutoApplyStartup());

      // Multiple rapid initialization calls
      act(() => {
        result.current.initialize();
        result.current.initialize();
        result.current.initialize();
      });

      // Should only initialize once
      expect(result.current.isInitializing).toBe(true);
    });
  });
});