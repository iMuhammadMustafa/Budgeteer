/**
 * Form error handling utilities
 * This file contains error handling functions, error state management, and error display helpers
 */

import { FormError, FormErrorState, FormErrorType } from '../types/components/forms.types';

// ============================================================================
// Error State Management
// ============================================================================

/**
 * Creates a new form error state
 */
export const createFormErrorState = (): FormErrorState => {
  const errors: FormError[] = [];

  return {
    errors,
    hasErrors: false,
    
    getFieldError: (field: string): string | undefined => {
      const fieldError = errors.find(error => error.field === field);
      return fieldError?.message;
    },
    
    getFormErrors: (): FormError[] => {
      return errors.filter(error => !error.field);
    },
    
    clearErrors: (): void => {
      errors.length = 0;
    },
    
    clearFieldError: (field: string): void => {
      const index = errors.findIndex(error => error.field === field);
      if (index !== -1) {
        errors.splice(index, 1);
      }
    },
    
    addError: (error: FormError): void => {
      // Remove existing error for the same field
      if (error.field) {
        const existingIndex = errors.findIndex(e => e.field === error.field);
        if (existingIndex !== -1) {
          errors.splice(existingIndex, 1);
        }
      }
      
      errors.push(error);
    },
  };
};

/**
 * Updates the hasErrors property based on current errors
 */
export const updateErrorState = (errorState: FormErrorState): FormErrorState => {
  return {
    ...errorState,
    hasErrors: errorState.errors.length > 0,
  };
};

// ============================================================================
// Error Creation Helpers
// ============================================================================

/**
 * Creates a validation error for a specific field
 */
export const createValidationError = (field: string, message: string): FormError => ({
  field,
  message,
  type: 'validation',
});

/**
 * Creates a submission error
 */
export const createSubmissionError = (message: string, field?: string): FormError => ({
  field,
  message,
  type: 'submission',
});

/**
 * Creates a network error
 */
export const createNetworkError = (message: string = 'Network error occurred'): FormError => ({
  message,
  type: 'network',
});

/**
 * Creates a server error
 */
export const createServerError = (message: string, code?: string): FormError => ({
  message,
  type: 'server',
  code,
});

// ============================================================================
// Error Message Formatting
// ============================================================================

/**
 * Formats error messages for display
 */
export const formatErrorMessage = (error: FormError): string => {
  const baseMessage = error.message.charAt(0).toUpperCase() + error.message.slice(1);
  
  switch (error.type) {
    case 'validation':
      return baseMessage;
    case 'submission':
      return `Submission failed: ${baseMessage}`;
    case 'network':
      return `Network error: ${baseMessage}`;
    case 'server':
      return error.code ? `Server error (${error.code}): ${baseMessage}` : `Server error: ${baseMessage}`;
    default:
      return baseMessage;
  }
};

/**
 * Gets user-friendly error messages for common error scenarios
 */
export const getUserFriendlyErrorMessage = (error: Error | string): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (lowerMessage.includes('timeout')) {
    return 'The request took too long to complete. Please try again.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Permission errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
    return 'You do not have permission to perform this action.';
  }

  // Server errors
  if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
    return 'A server error occurred. Please try again later.';
  }

  // Not found errors
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return 'The requested resource was not found.';
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
};

// ============================================================================
// Error Recovery Helpers
// ============================================================================

/**
 * Determines if an error is recoverable (user can retry)
 */
export const isRecoverableError = (error: FormError): boolean => {
  switch (error.type) {
    case 'network':
      return true;
    case 'server':
      // 5xx errors are typically recoverable
      return error.code ? error.code.startsWith('5') : true;
    case 'submission':
      return true;
    case 'validation':
      return false; // User needs to fix input
    default:
      return true;
  }
};

/**
 * Gets retry delay for recoverable errors (in milliseconds)
 */
export const getRetryDelay = (error: FormError, attemptNumber: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  
  switch (error.type) {
    case 'network':
      // Exponential backoff for network errors
      return Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay);
    case 'server':
      // Linear backoff for server errors
      return Math.min(baseDelay * attemptNumber, maxDelay);
    default:
      return baseDelay;
  }
};

// ============================================================================
// Error Conversion Utilities
// ============================================================================

/**
 * Converts API errors to form errors
 */
export const convertApiErrorToFormError = (apiError: any): FormError => {
  if (typeof apiError === 'string') {
    return createServerError(apiError);
  }

  if (apiError && typeof apiError === 'object') {
    const message = apiError.message || apiError.error || 'Unknown server error';
    const code = apiError.code || apiError.status;
    
    if (apiError.field) {
      return {
        field: apiError.field,
        message,
        type: 'server',
        code,
      };
    }
    
    return createServerError(message, code);
  }

  return createServerError('Unknown server error');
};

/**
 * Converts validation errors to form errors
 */
export const convertValidationErrorsToFormErrors = <T>(
  validationErrors: Partial<Record<keyof T, string>>
): FormError[] => {
  const formErrors: FormError[] = [];
  
  for (const [field, message] of Object.entries(validationErrors)) {
    if (message && typeof message === 'string') {
      formErrors.push(createValidationError(field, message));
    }
  }
  
  return formErrors;
};

/**
 * Converts form errors to validation error format
 */
export const convertFormErrorsToValidationErrors = <T>(
  formErrors: FormError[]
): Partial<Record<keyof T, string>> => {
  const validationErrors: Partial<Record<keyof T, string>> = {};
  
  formErrors.forEach(error => {
    if (error.field && error.type === 'validation') {
      validationErrors[error.field as keyof T] = error.message;
    }
  });
  
  return validationErrors;
};

// ============================================================================
// Error Logging and Reporting
// ============================================================================

/**
 * Logs form errors for debugging
 */
export const logFormError = (error: FormError, context?: string): void => {
  const logMessage = context 
    ? `Form Error [${context}]: ${formatErrorMessage(error)}`
    : `Form Error: ${formatErrorMessage(error)}`;
    
  console.error(logMessage, error);
};

/**
 * Reports form errors to error tracking service (placeholder)
 */
export const reportFormError = (error: FormError, context?: any): void => {
  // This would integrate with your error tracking service (e.g., Sentry, Bugsnag)
  // For now, just log to console
  console.error('Reporting form error:', {
    error,
    context,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// Error Aggregation Utilities
// ============================================================================

/**
 * Groups errors by type
 */
export const groupErrorsByType = (errors: FormError[]): Record<FormErrorType, FormError[]> => {
  const grouped: Record<FormErrorType, FormError[]> = {
    validation: [],
    submission: [],
    network: [],
    server: [],
  };
  
  errors.forEach(error => {
    grouped[error.type].push(error);
  });
  
  return grouped;
};

/**
 * Gets the most critical error from a list of errors
 */
export const getMostCriticalError = (errors: FormError[]): FormError | null => {
  if (errors.length === 0) return null;
  
  // Priority order: server > network > submission > validation
  const priorityOrder: FormErrorType[] = ['server', 'network', 'submission', 'validation'];
  
  for (const type of priorityOrder) {
    const errorOfType = errors.find(error => error.type === type);
    if (errorOfType) return errorOfType;
  }
  
  return errors[0];
};

/**
 * Checks if errors contain any critical errors that should block form submission
 */
export const hasCriticalErrors = (errors: FormError[]): boolean => {
  return errors.some(error => error.type === 'validation');
};