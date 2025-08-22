/**
 * Unit tests for form error handling utilities
 */

import {
  createFormErrorState,
  updateErrorState,
  createValidationError,
  createSubmissionError,
  createNetworkError,
  createServerError,
  formatErrorMessage,
  getUserFriendlyErrorMessage,
  isRecoverableError,
  getRetryDelay,
  convertApiErrorToFormError,
  convertValidationErrorsToFormErrors,
  convertFormErrorsToValidationErrors,
  logFormError,
  reportFormError,
  groupErrorsByType,
  getMostCriticalError,
  hasCriticalErrors,
} from '../form-errors';
import { FormError, FormErrorState } from '../../types/components/forms.types';

describe('Error State Management', () => {
  describe('createFormErrorState', () => {
    it('should create initial error state', () => {
      const errorState = createFormErrorState();
      
      expect(errorState.errors).toEqual([]);
      expect(errorState.hasErrors).toBe(false);
      expect(errorState.getFieldError('test')).toBeUndefined();
      expect(errorState.getFormErrors()).toEqual([]);
    });

    it('should add and retrieve field errors', () => {
      const errorState = createFormErrorState();
      const error = createValidationError('name', 'Name is required');
      
      errorState.addError(error);
      
      expect(errorState.getFieldError('name')).toBe('Name is required');
      expect(errorState.errors).toHaveLength(1);
    });

    it('should replace existing field error', () => {
      const errorState = createFormErrorState();
      const error1 = createValidationError('name', 'Name is required');
      const error2 = createValidationError('name', 'Name is too short');
      
      errorState.addError(error1);
      errorState.addError(error2);
      
      expect(errorState.getFieldError('name')).toBe('Name is too short');
      expect(errorState.errors).toHaveLength(1);
    });

    it('should clear field errors', () => {
      const errorState = createFormErrorState();
      const error = createValidationError('name', 'Name is required');
      
      errorState.addError(error);
      errorState.clearFieldError('name');
      
      expect(errorState.getFieldError('name')).toBeUndefined();
      expect(errorState.errors).toHaveLength(0);
    });

    it('should clear all errors', () => {
      const errorState = createFormErrorState();
      const error1 = createValidationError('name', 'Name is required');
      const error2 = createValidationError('email', 'Email is invalid');
      
      errorState.addError(error1);
      errorState.addError(error2);
      errorState.clearErrors();
      
      expect(errorState.errors).toHaveLength(0);
    });

    it('should get form-level errors', () => {
      const errorState = createFormErrorState();
      const fieldError = createValidationError('name', 'Name is required');
      const formError = createSubmissionError('Form submission failed');
      
      errorState.addError(fieldError);
      errorState.addError(formError);
      
      const formErrors = errorState.getFormErrors();
      expect(formErrors).toHaveLength(1);
      expect(formErrors[0]).toBe(formError);
    });
  });

  describe('updateErrorState', () => {
    it('should update hasErrors property', () => {
      const errorState = createFormErrorState();
      const error = createValidationError('name', 'Name is required');
      
      errorState.addError(error);
      const updatedState = updateErrorState(errorState);
      
      expect(updatedState.hasErrors).toBe(true);
    });

    it('should set hasErrors to false when no errors', () => {
      const errorState = createFormErrorState();
      const updatedState = updateErrorState(errorState);
      
      expect(updatedState.hasErrors).toBe(false);
    });
  });
});

describe('Error Creation Helpers', () => {
  describe('createValidationError', () => {
    it('should create validation error', () => {
      const error = createValidationError('name', 'Name is required');
      
      expect(error).toEqual({
        field: 'name',
        message: 'Name is required',
        type: 'validation',
      });
    });
  });

  describe('createSubmissionError', () => {
    it('should create submission error without field', () => {
      const error = createSubmissionError('Submission failed');
      
      expect(error).toEqual({
        field: undefined,
        message: 'Submission failed',
        type: 'submission',
      });
    });

    it('should create submission error with field', () => {
      const error = createSubmissionError('Field submission failed', 'name');
      
      expect(error).toEqual({
        field: 'name',
        message: 'Field submission failed',
        type: 'submission',
      });
    });
  });

  describe('createNetworkError', () => {
    it('should create network error with default message', () => {
      const error = createNetworkError();
      
      expect(error).toEqual({
        message: 'Network error occurred',
        type: 'network',
      });
    });

    it('should create network error with custom message', () => {
      const error = createNetworkError('Connection timeout');
      
      expect(error).toEqual({
        message: 'Connection timeout',
        type: 'network',
      });
    });
  });

  describe('createServerError', () => {
    it('should create server error without code', () => {
      const error = createServerError('Internal server error');
      
      expect(error).toEqual({
        message: 'Internal server error',
        type: 'server',
        code: undefined,
      });
    });

    it('should create server error with code', () => {
      const error = createServerError('Internal server error', '500');
      
      expect(error).toEqual({
        message: 'Internal server error',
        type: 'server',
        code: '500',
      });
    });
  });
});

describe('Error Message Formatting', () => {
  describe('formatErrorMessage', () => {
    it('should format validation error', () => {
      const error = createValidationError('name', 'name is required');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe('Name is required');
    });

    it('should format submission error', () => {
      const error = createSubmissionError('failed to submit');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe('Submission failed: Failed to submit');
    });

    it('should format network error', () => {
      const error = createNetworkError('connection failed');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe('Network error: Connection failed');
    });

    it('should format server error with code', () => {
      const error = createServerError('internal error', '500');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe('Server error (500): Internal error');
    });

    it('should format server error without code', () => {
      const error = createServerError('internal error');
      const formatted = formatErrorMessage(error);
      
      expect(formatted).toBe('Server error: Internal error');
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should handle network errors', () => {
      expect(getUserFriendlyErrorMessage('Network error occurred')).toContain('Unable to connect');
      expect(getUserFriendlyErrorMessage('Fetch failed')).toContain('Unable to connect');
    });

    it('should handle timeout errors', () => {
      expect(getUserFriendlyErrorMessage('Request timeout')).toContain('took too long');
    });

    it('should handle validation errors', () => {
      expect(getUserFriendlyErrorMessage('Validation failed')).toContain('check your input');
      expect(getUserFriendlyErrorMessage('Invalid data')).toContain('check your input');
    });

    it('should handle permission errors', () => {
      expect(getUserFriendlyErrorMessage('Unauthorized')).toContain('do not have permission');
      expect(getUserFriendlyErrorMessage('Forbidden')).toContain('do not have permission');
    });

    it('should handle server errors', () => {
      expect(getUserFriendlyErrorMessage('Server error')).toContain('server error occurred');
      expect(getUserFriendlyErrorMessage('500 Internal Server Error')).toContain('server error occurred');
    });

    it('should handle not found errors', () => {
      expect(getUserFriendlyErrorMessage('Not found')).toContain('not found');
      expect(getUserFriendlyErrorMessage('404 error')).toContain('not found');
    });

    it('should handle unknown errors', () => {
      expect(getUserFriendlyErrorMessage('Unknown error')).toContain('unexpected error');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error message');
      expect(getUserFriendlyErrorMessage(error)).toContain('unexpected error');
    });
  });
});

describe('Error Recovery Helpers', () => {
  describe('isRecoverableError', () => {
    it('should identify recoverable errors', () => {
      expect(isRecoverableError(createNetworkError())).toBe(true);
      expect(isRecoverableError(createServerError('Error', '500'))).toBe(true);
      expect(isRecoverableError(createSubmissionError('Failed'))).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      expect(isRecoverableError(createValidationError('name', 'Required'))).toBe(false);
    });

    it('should handle server errors with different codes', () => {
      expect(isRecoverableError(createServerError('Error', '500'))).toBe(true);
      expect(isRecoverableError(createServerError('Error', '400'))).toBe(false);
      expect(isRecoverableError(createServerError('Error'))).toBe(true);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff for network errors', () => {
      const networkError = createNetworkError();
      
      expect(getRetryDelay(networkError, 1)).toBe(1000);
      expect(getRetryDelay(networkError, 2)).toBe(2000);
      expect(getRetryDelay(networkError, 3)).toBe(4000);
    });

    it('should calculate linear backoff for server errors', () => {
      const serverError = createServerError('Error');
      
      expect(getRetryDelay(serverError, 1)).toBe(1000);
      expect(getRetryDelay(serverError, 2)).toBe(2000);
      expect(getRetryDelay(serverError, 3)).toBe(3000);
    });

    it('should cap delay at maximum', () => {
      const networkError = createNetworkError();
      
      expect(getRetryDelay(networkError, 10)).toBe(30000);
    });

    it('should use base delay for other error types', () => {
      const validationError = createValidationError('name', 'Required');
      
      expect(getRetryDelay(validationError, 1)).toBe(1000);
    });
  });
});

describe('Error Conversion Utilities', () => {
  describe('convertApiErrorToFormError', () => {
    it('should convert string error', () => {
      const result = convertApiErrorToFormError('API error');
      
      expect(result).toEqual({
        message: 'API error',
        type: 'server',
        code: undefined,
      });
    });

    it('should convert object error with message', () => {
      const apiError = {
        message: 'Validation failed',
        code: '400',
      };
      const result = convertApiErrorToFormError(apiError);
      
      expect(result).toEqual({
        message: 'Validation failed',
        type: 'server',
        code: '400',
      });
    });

    it('should convert object error with field', () => {
      const apiError = {
        field: 'name',
        message: 'Name is required',
        code: '400',
      };
      const result = convertApiErrorToFormError(apiError);
      
      expect(result).toEqual({
        field: 'name',
        message: 'Name is required',
        type: 'server',
        code: '400',
      });
    });

    it('should handle unknown error format', () => {
      const result = convertApiErrorToFormError(null);
      
      expect(result).toEqual({
        message: 'Unknown server error',
        type: 'server',
        code: undefined,
      });
    });
  });

  describe('convertValidationErrorsToFormErrors', () => {
    it('should convert validation errors object', () => {
      const validationErrors = {
        name: 'Name is required',
        email: 'Email is invalid',
      };
      const result = convertValidationErrorsToFormErrors(validationErrors);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        field: 'name',
        message: 'Name is required',
        type: 'validation',
      });
      expect(result[1]).toEqual({
        field: 'email',
        message: 'Email is invalid',
        type: 'validation',
      });
    });

    it('should skip empty error messages', () => {
      const validationErrors = {
        name: 'Name is required',
        email: '',
        age: undefined,
      };
      const result = convertValidationErrorsToFormErrors(validationErrors);
      
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('name');
    });
  });

  describe('convertFormErrorsToValidationErrors', () => {
    it('should convert form errors to validation errors', () => {
      const formErrors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createValidationError('email', 'Email is invalid'),
        createNetworkError('Network failed'),
      ];
      const result = convertFormErrorsToValidationErrors(formErrors);
      
      expect(result).toEqual({
        name: 'Name is required',
        email: 'Email is invalid',
      });
    });
  });
});

describe('Error Logging and Reporting', () => {
  describe('logFormError', () => {
    it('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = createValidationError('name', 'Name is required');
      
      logFormError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('Form Error: Name is required', error);
      
      consoleSpy.mockRestore();
    });

    it('should log error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = createValidationError('name', 'Name is required');
      
      logFormError(error, 'AccountForm');
      
      expect(consoleSpy).toHaveBeenCalledWith('Form Error [AccountForm]: Name is required', error);
      
      consoleSpy.mockRestore();
    });
  });

  describe('reportFormError', () => {
    it('should report error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = createValidationError('name', 'Name is required');
      
      reportFormError(error, { formName: 'AccountForm' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Reporting form error:', {
        error,
        context: { formName: 'AccountForm' },
        timestamp: expect.any(String),
      });
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Error Aggregation Utilities', () => {
  describe('groupErrorsByType', () => {
    it('should group errors by type', () => {
      const errors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createValidationError('email', 'Email is invalid'),
        createNetworkError('Network failed'),
        createServerError('Server error'),
      ];
      
      const grouped = groupErrorsByType(errors);
      
      expect(grouped.validation).toHaveLength(2);
      expect(grouped.network).toHaveLength(1);
      expect(grouped.server).toHaveLength(1);
      expect(grouped.submission).toHaveLength(0);
    });
  });

  describe('getMostCriticalError', () => {
    it('should return null for empty array', () => {
      expect(getMostCriticalError([])).toBeNull();
    });

    it('should return server error as most critical', () => {
      const errors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createNetworkError('Network failed'),
        createServerError('Server error'),
      ];
      
      const critical = getMostCriticalError(errors);
      expect(critical?.type).toBe('server');
    });

    it('should return network error when no server error', () => {
      const errors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createNetworkError('Network failed'),
      ];
      
      const critical = getMostCriticalError(errors);
      expect(critical?.type).toBe('network');
    });

    it('should return first error when all same priority', () => {
      const errors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createValidationError('email', 'Email is invalid'),
      ];
      
      const critical = getMostCriticalError(errors);
      expect(critical?.field).toBe('name');
    });
  });

  describe('hasCriticalErrors', () => {
    it('should return true for validation errors', () => {
      const errors: FormError[] = [
        createValidationError('name', 'Name is required'),
        createNetworkError('Network failed'),
      ];
      
      expect(hasCriticalErrors(errors)).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      const errors: FormError[] = [
        createNetworkError('Network failed'),
        createServerError('Server error'),
      ];
      
      expect(hasCriticalErrors(errors)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasCriticalErrors([])).toBe(false);
    });
  });
});