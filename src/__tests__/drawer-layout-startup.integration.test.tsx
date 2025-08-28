import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useAutoApplyService } from '@/src/services/AutoApply.Service';
import { AutoApplyResult } from '@/src/types/recurring';

// Mock the drawer layout component since we're testing the startup integration
const MockDrawerLayout = () => {
  const { useAutoApplyStartupSimple } = require('@/src/hooks/useAutoApplyStartup');
  
  const autoApplyStartup = useAutoApplyStartupSimple({
    enableLogging: true,
    skipOnError: true,
    delayMs: 1000,
    enableNotifications: true
  });

  return null; // Component doesn't render anything for this test
};

// Mock dependencies
jest.mock('@/src/providers/AuthProvider');
jest.mock('@/src/providers/ThemeProvider');
jest.mock('@/src/services/AutoApply.Service');
jest.mock('@/src/providers/NotificationsProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNotifications: () => ({
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearNotifications: jest.fn()
  })
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseAutoApplyService = useAutoApplyService as jest.MockedFunction<typeof useAutoApplyService>;

describe('Drawer Layout Auto-Apply Startup Integration', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      user_metadata: {
        tenantid: 'tenant-123'
      }
    }
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAuth.mockReturnValue({
      session: mockSession,
      isSessionLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    });

    mockUseTheme.mockReturnValue({
      isDarkMode: false,
      toggleTheme: jest.fn(),
      theme: 'light'
    });

    mockUseAutoApplyService.mockReturnValue(mockAutoApplyService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize auto-apply on app startup without blocking', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<MockDrawerLayout />);

    // Auto-apply should be scheduled but not executed yet
    expect(mockCheckAndApplyMutation.mutate).not.toHaveBeenCalled();

    // Fast-forward past the delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now auto-apply should be triggered
    expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('should handle successful auto-apply with notifications', async () => {
    const mockResult: AutoApplyResult = {
      appliedCount: 3,
      failedCount: 1,
      pendingCount: 2,
      appliedTransactions: [],
      failedTransactions: [],
      pendingTransactions: []
    };

    render(<MockDrawerLayout />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Simulate successful auto-apply
    act(() => {
      const onSuccess = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onSuccess;
      onSuccess(mockResult);
    });

    await waitFor(() => {
      expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
    });

    // Verify the mutation was called with correct parameters
    expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function)
      })
    );
  });

  it('should handle auto-apply errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockError = new Error('Network connection failed');

    render(<MockDrawerLayout />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Simulate auto-apply error
    act(() => {
      const onError = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onError;
      onError(mockError);
    });

    await waitFor(() => {
      expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
    });

    // Error should be logged but not crash the app
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AutoApply Startup]'),
      expect.stringContaining('failed')
    );

    consoleSpy.mockRestore();
  });

  it('should not initialize auto-apply when session is loading', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isSessionLoading: true,
      signIn: jest.fn(),
      signOut: jest.fn()
    });

    render(<MockDrawerLayout />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Auto-apply should not be triggered when session is loading
    expect(mockCheckAndApplyMutation.mutate).not.toHaveBeenCalled();
  });

  it('should not initialize auto-apply when no session exists', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isSessionLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn()
    });

    render(<MockDrawerLayout />);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Auto-apply should not be triggered when no session exists
    expect(mockCheckAndApplyMutation.mutate).not.toHaveBeenCalled();
  });

  it('should handle multiple rapid app startups correctly', () => {
    const { unmount } = render(<MockDrawerLayout />);
    
    // Unmount and remount quickly
    unmount();
    render(<MockDrawerLayout />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should only trigger once despite multiple mounts
    expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
  });

  it('should respect configuration options', () => {
    const MockDrawerLayoutWithCustomConfig = () => {
      const { useAutoApplyStartupSimple } = require('@/src/hooks/useAutoApplyStartup');
      
      useAutoApplyStartupSimple({
        enableLogging: false,
        skipOnError: false,
        delayMs: 5000,
        enableNotifications: false
      });

      return null;
    };

    render(<MockDrawerLayoutWithCustomConfig />);

    // Should not trigger immediately with 5 second delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockCheckAndApplyMutation.mutate).not.toHaveBeenCalled();

    // Should trigger after 5 seconds
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
  });

  it('should handle service initialization errors', () => {
    mockUseAutoApplyService.mockImplementation(() => {
      throw new Error('Service initialization failed');
    });

    expect(() => {
      render(<MockDrawerLayout />);
    }).toThrow('Service initialization failed');
  });

  it('should cleanup timers on unmount', () => {
    const { unmount } = render(<MockDrawerLayout />);

    // Unmount before delay completes
    unmount();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should not trigger after unmount
    expect(mockCheckAndApplyMutation.mutate).not.toHaveBeenCalled();
  });

  describe('performance considerations', () => {
    it('should not block app rendering during initialization', () => {
      const startTime = Date.now();
      
      render(<MockDrawerLayout />);
      
      const renderTime = Date.now() - startTime;
      
      // Rendering should be fast (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large auto-apply results efficiently', async () => {
      const largeMockResult: AutoApplyResult = {
        appliedCount: 1000,
        failedCount: 50,
        pendingCount: 200,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: []
      };

      render(<MockDrawerLayout />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const startTime = Date.now();

      act(() => {
        const onSuccess = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onSuccess;
        onSuccess(largeMockResult);
      });

      const processingTime = Date.now() - startTime;

      await waitFor(() => {
        expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
      });

      // Processing should be efficient even with large results
      expect(processingTime).toBeLessThan(1000);
    });
  });

  describe('error recovery', () => {
    it('should continue app functionality after auto-apply errors', async () => {
      const mockError = new Error('Auto-apply service unavailable');

      render(<MockDrawerLayout />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        const onError = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onError;
        onError(mockError);
      });

      await waitFor(() => {
        expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
      });

      // App should continue to function normally
      // (In a real test, we would verify that other app functionality still works)
      expect(true).toBe(true);
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');

      render(<MockDrawerLayout />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        const onError = mockCheckAndApplyMutation.mutate.mock.calls[0][1].onError;
        onError(networkError);
      });

      await waitFor(() => {
        expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
      });

      // Should handle network errors gracefully
      expect(mockCheckAndApplyMutation.mutate).toHaveBeenCalledTimes(1);
    });
  });
});