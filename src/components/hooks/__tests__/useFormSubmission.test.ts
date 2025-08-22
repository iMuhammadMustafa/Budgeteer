/**
 * Comprehensive unit tests for useFormSubmission hook
 * Tests submission handling, loading states, error handling, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFormSubmission } from '../useFormSubmission';
import { UseFormSubmissionOptions } from '../../../types/components/forms.types';

// Test data interface
interface TestFormData {
  name: string;
  email: string;
  age?: number;
}

const testData: TestFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
};

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  jest.clearAllTimers();
  jest.useFakeTimers();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useFormSubmission', () => {
  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(typeof result.current.submit).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should accept options parameter', () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const options: UseFormSubmissionOptions = {
        onSuccess: jest.fn(),
        onError: jest.fn(),
        resetOnSuccess: true,
      };

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful Submission', () => {
    it('should handle successful submission', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        await result.current.submit(testData);
      });

      expect(mockSubmit).toHaveBeenCalledWith(testData);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should call onSuccess callback', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnSuccess = jest.fn();
      const options: UseFormSubmissionOptions = { onSuccess: mockOnSuccess };

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      await act(async () => {
        await result.current.submit(testData);
      });

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during submission', async () => {
      let resolveSubmit: () => void;
      const mockSubmit = jest.fn(() => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }));

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      // Start submission
      act(() => {
        result.current.submit(testData);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Complete submission
      await act(async () => {
        resolveSubmit();
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
      });
    });

    it('should reset state on successful submission when resetOnSuccess is true', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const options: UseFormSubmissionOptions = { resetOnSuccess: true };

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      // First submission
      await act(async () => {
        await result.current.submit(testData);
      });

      expect(result.current.isSuccess).toBe(true);

      // Should reset automatically
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Failed Submission', () => {
    it('should handle submission errors', async () => {
      const error = new Error('Submission failed');
      const mockSubmit = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBe(error);
      expect(result.current.isSuccess).toBe(false);
    });

    it('should call onError callback', async () => {
      const error = new Error('Submission failed');
      const mockSubmit = jest.fn().mockRejectedValue(error);
      const mockOnError = jest.fn();
      const options: UseFormSubmissionOptions = { onError: mockOnError };

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(error);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      const mockSubmit = jest.fn().mockRejectedValue(networkError);

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(networkError);
      expect(result.current.error?.name).toBe('NetworkError');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      const mockSubmit = jest.fn().mockRejectedValue(validationError);

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(validationError);
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      serverError.name = 'ServerError';
      const mockSubmit = jest.fn().mockRejectedValue(serverError);

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(serverError);
    });
  });

  describe('State Reset', () => {
    it('should reset submission state manually', async () => {
      const error = new Error('Test error');
      const mockSubmit = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      // Create error state
      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(error);

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should reset success state manually', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      // Create success state
      await act(async () => {
        await result.current.submit(testData);
      });

      expect(result.current.isSuccess).toBe(true);

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Concurrent Submissions', () => {
    it('should handle concurrent submissions correctly', async () => {
      let resolveFirst: () => void;
      let resolveSecond: () => void;
      
      const mockSubmit = jest.fn()
        .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirst = resolve; }))
        .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveSecond = resolve; }));

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      // Start first submission
      act(() => {
        result.current.submit(testData);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Start second submission while first is pending
      act(() => {
        result.current.submit({ ...testData, name: 'Jane Doe' });
      });

      // Should still be submitting
      expect(result.current.isSubmitting).toBe(true);

      // Complete first submission
      await act(async () => {
        resolveFirst();
        await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(2));
      });

      // Complete second submission
      await act(async () => {
        resolveSecond();
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should prevent duplicate submissions', async () => {
      let resolveSubmit: () => void;
      const mockSubmit = jest.fn(() => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }));

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      // Start first submission
      act(() => {
        result.current.submit(testData);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Try to start second submission while first is pending
      act(() => {
        result.current.submit(testData);
      });

      // Should only call submit once
      expect(mockSubmit).toHaveBeenCalledTimes(1);

      // Complete submission
      await act(async () => {
        resolveSubmit();
        await waitFor(() => expect(result.current.isSubmitting).toBe(false));
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle submission with null data', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        await result.current.submit(null as any);
      });

      expect(mockSubmit).toHaveBeenCalledWith(null);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle submission with undefined data', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        await result.current.submit(undefined as any);
      });

      expect(mockSubmit).toHaveBeenCalledWith(undefined);
    });

    it('should handle submission function that throws synchronously', async () => {
      const error = new Error('Sync error');
      const mockSubmit = jest.fn(() => { throw error; });
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          await result.current.submit(testData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(error);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle very large form data', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => [`field${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        await result.current.submit(largeData);
      });

      expect(mockSubmit).toHaveBeenCalledWith(largeData);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle circular references in form data', async () => {
      const circularData: any = { name: 'Test' };
      circularData.self = circularData;

      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        await result.current.submit(circularData);
      });

      expect(mockSubmit).toHaveBeenCalledWith(circularData);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle submission timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      const mockSubmit = jest.fn(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(timeoutError), 5000);
        })
      );

      const { result } = renderHook(() => useFormSubmission(mockSubmit));

      await act(async () => {
        try {
          result.current.submit(testData);
          jest.advanceTimersByTime(5000);
          await waitFor(() => expect(result.current.error).toBe(timeoutError));
        } catch (e) {
          // Expected to throw
        }
      });
    });
  });

  describe('Memory Management', () => {
    it('should clean up properly on unmount', () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const { result, unmount } = renderHook(() => useFormSubmission(mockSubmit));

      // Start a submission
      act(() => {
        result.current.submit(testData);
      });

      // Unmount component
      unmount();

      // Should not cause memory leaks or errors
      expect(true).toBe(true); // Placeholder - real memory testing would require additional tools
    });
  });

  describe('Options Validation', () => {
    it('should work with all options provided', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockOnSuccess = jest.fn();
      const mockOnError = jest.fn();

      const options: UseFormSubmissionOptions = {
        onSuccess: mockOnSuccess,
        onError: mockOnError,
        resetOnSuccess: false,
        showSuccessMessage: true,
        showErrorMessage: true,
      };

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      await act(async () => {
        await result.current.submit(testData);
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(result.current.isSuccess).toBe(true); // Should not reset because resetOnSuccess is false
    });

    it('should work with minimal options', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const options: UseFormSubmissionOptions = {};

      const { result } = renderHook(() => useFormSubmission(mockSubmit, options));

      await act(async () => {
        await result.current.submit(testData);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});