/**
 * Unit tests for ErrorBoundary component
 * Note: These tests focus on the component's props, behavior, and integration patterns
 * Full rendering tests would require a proper React Native testing environment
 */

import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { createServerError, getUserFriendlyErrorMessage, logFormError } from '@/src/utils/form-errors';

// Mock the form-errors utilities
jest.mock('@/src/utils/form-errors', () => ({
  createServerError: jest.fn(),
  getUserFriendlyErrorMessage: jest.fn(),
  logFormError: jest.fn(),
}));

const mockCreateServerError = createServerError as jest.MockedFunction<typeof createServerError>;
const mockGetUserFriendlyErrorMessage = getUserFriendlyErrorMessage as jest.MockedFunction<typeof getUserFriendlyErrorMessage>;
const mockLogFormError = logFormError as jest.MockedFunction<typeof logFormError>;

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return React.createElement('Text', {}, 'No error');
};

// Custom fallback component for testing
const CustomFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) =>
  React.createElement('View', {}, [
    React.createElement('Text', { key: 'error' }, `Custom error: ${error.message}`),
    React.createElement('Text', { key: 'retry', onPress: retry }, 'Custom retry'),
  ]);

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateServerError.mockReturnValue({
      message: 'Test error message',
      type: 'server',
    });
    mockGetUserFriendlyErrorMessage.mockReturnValue('An unexpected error occurred. Please try again.');
  });

  describe('Component Structure', () => {
    it('should be a React component class', () => {
      expect(typeof ErrorBoundary).toBe('function');
      expect(ErrorBoundary.prototype.render).toBeDefined();
      expect(ErrorBoundary.prototype.componentDidCatch).toBeDefined();
    });

    it('should have static getDerivedStateFromError method', () => {
      expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
    });
  });

  describe('Error State Management', () => {
    it('should initialize with no error state', () => {
      const boundary = new ErrorBoundary({ children: null });
      
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();
      expect(boundary.state.errorId).toBe('');
    });

    it('should update state when error occurs', () => {
      const testError = new Error('Test error');
      const newState = ErrorBoundary.getDerivedStateFromError(testError);
      
      expect(newState.hasError).toBe(true);
      expect(newState.error).toBe(testError);
      expect(newState.errorId).toMatch(/^error-\d+-[a-z0-9]+$/);
    });

    it('should reset state on retry', () => {
      const boundary = new ErrorBoundary({ children: null });
      boundary.state = {
        hasError: true,
        error: new Error('Test'),
        errorId: 'test-id',
      };

      boundary.handleRetry();

      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();
      expect(boundary.state.errorId).toBe('');
    });
  });

  describe('Error Logging and Reporting', () => {
    it('should call error utilities when error occurs', () => {
      const boundary = new ErrorBoundary({ children: null });
      const testError = new Error('Test error');
      const errorInfo = { componentStack: 'test stack' };

      boundary.componentDidCatch(testError, errorInfo);

      expect(mockCreateServerError).toHaveBeenCalledWith('Test error');
      expect(mockLogFormError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message', type: 'server' }),
        'ErrorBoundary'
      );
    });

    it('should call onError callback when provided', () => {
      const onError = jest.fn();
      const boundary = new ErrorBoundary({ children: null, onError });
      const testError = new Error('Test error');
      const errorInfo = { componentStack: 'test stack' };

      boundary.componentDidCatch(testError, errorInfo);

      expect(onError).toHaveBeenCalledWith(testError, errorInfo);
    });

    it('should log error details to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const boundary = new ErrorBoundary({ children: null });
      const testError = new Error('Test error');
      const errorInfo = { componentStack: 'test stack' };

      boundary.componentDidCatch(testError, errorInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.objectContaining({
          error: testError,
          errorInfo,
          componentStack: 'test stack',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Component Handling', () => {
    it('should use default fallback when none provided', () => {
      const boundary = new ErrorBoundary({ children: null });
      boundary.state = {
        hasError: true,
        error: new Error('Test error'),
        errorId: 'test-id',
      };

      const result = boundary.render();
      
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should use custom fallback when provided', () => {
      const boundary = new ErrorBoundary({ 
        children: null, 
        fallback: CustomFallback 
      });
      boundary.state = {
        hasError: true,
        error: new Error('Test error'),
        errorId: 'test-id',
      };

      const result = boundary.render();
      
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should render children when no error', () => {
      const testChild = React.createElement('Text', {}, 'Test child');
      const boundary = new ErrorBoundary({ children: testChild });
      
      const result = boundary.render();
      
      expect(result).toBe(testChild);
    });
  });

  describe('Props Handling', () => {
    it('should handle className prop', () => {
      const boundary = new ErrorBoundary({ 
        children: null, 
        className: 'custom-class' 
      });
      boundary.state = {
        hasError: true,
        error: new Error('Test error'),
        errorId: 'test-id',
      };

      expect(() => boundary.render()).not.toThrow();
    });

    it('should handle missing optional props', () => {
      const boundary = new ErrorBoundary({ children: null });
      
      expect(() => boundary.render()).not.toThrow();
    });
  });

  describe('Integration with Error Utilities', () => {
    it('should integrate with getUserFriendlyErrorMessage', () => {
      const boundary = new ErrorBoundary({ children: null });
      boundary.state = {
        hasError: true,
        error: new Error('Network timeout'),
        errorId: 'test-id',
      };

      boundary.render();

      expect(mockGetUserFriendlyErrorMessage).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });

    it('should integrate with createServerError', () => {
      const boundary = new ErrorBoundary({ children: null });
      const testError = new Error('Test error');
      const errorInfo = { componentStack: 'test stack' };

      boundary.componentDidCatch(testError, errorInfo);

      expect(mockCreateServerError).toHaveBeenCalledWith('Test error');
    });
  });
});