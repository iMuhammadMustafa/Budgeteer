/**
 * useFormSubmission hook - Form submission handling with loading states and error recovery
 * Provides submission handling, loading states, error handling, success callbacks, and retry mechanisms
 */

import { useState, useCallback, useRef } from 'react';
import { 
  UseFormSubmissionReturn, 
  UseFormSubmissionOptions 
} from '../../types/components/forms.types';
import { 
  getUserFriendlyErrorMessage, 
  isRecoverableError, 
  getRetryDelay,
  createNetworkError,
  createSubmissionError,
  logFormError,
  reportFormError
} from '../../utils/form-errors';

/**
 * Custom hook for handling form submissions with error recovery and retry mechanisms
 * @param onSubmit - Function to handle form submission
 * @param options - Optional configuration for submission behavior
 * @returns Form submission functions and state
 */
export function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void>,
  options: UseFormSubmissionOptions = {}
): UseFormSubmissionReturn<T> {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    showSuccessMessage = false,
    showErrorMessage = true,
  } = options;

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Refs for tracking retry attempts and cleanup
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Clear any pending retry timeout
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Reset submission state
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(false);
    retryCountRef.current = 0;
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  // Handle submission success
  const handleSuccess = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(true);
    retryCountRef.current = 0;
    clearRetryTimeout();

    if (showSuccessMessage) {
      // You could integrate with a notification system here
      console.log('Form submitted successfully');
    }

    if (onSuccess) {
      onSuccess();
    }

    if (resetOnSuccess) {
      // Reset success state after a brief delay to allow UI feedback
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }
  }, [onSuccess, resetOnSuccess, showSuccessMessage, clearRetryTimeout]);

  // Handle submission error
  const handleError = useCallback((submitError: Error, data: T) => {
    const friendlyMessage = getUserFriendlyErrorMessage(submitError);
    const formError = submitError.name === 'NetworkError' 
      ? createNetworkError(friendlyMessage)
      : createSubmissionError(friendlyMessage);

    setError(submitError);
    setIsSuccess(false);

    // Log error for debugging
    logFormError(formError, 'Form Submission');

    // Report error to tracking service
    reportFormError(formError, { formData: data, retryCount: retryCountRef.current });

    if (showErrorMessage) {
      // You could integrate with a notification system here
      console.error('Form submission failed:', friendlyMessage);
    }

    if (onError) {
      onError(submitError);
    }

    // Attempt retry for recoverable errors
    if (isRecoverableError(formError) && retryCountRef.current < maxRetries) {
      const retryDelay = getRetryDelay(formError, retryCountRef.current + 1);
      
      console.log(`Retrying submission in ${retryDelay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current += 1;
        submitInternal(data);
      }, retryDelay);
    } else {
      setIsSubmitting(false);
    }
  }, [onError, showErrorMessage, maxRetries]);

  // Internal submission function with error handling
  const submitInternal = useCallback(async (data: T) => {
    try {
      await onSubmit(data);
      handleSuccess();
    } catch (submitError) {
      const error = submitError instanceof Error ? submitError : new Error(String(submitError));
      handleError(error, data);
    }
  }, [onSubmit, handleSuccess, handleError]);

  // Main submit function
  const submit = useCallback(async (data: T): Promise<void> => {
    // Clear any previous state
    setError(null);
    setIsSuccess(false);
    clearRetryTimeout();
    
    // Don't allow multiple simultaneous submissions
    if (isSubmitting) {
      console.warn('Form submission already in progress');
      return;
    }

    setIsSubmitting(true);
    retryCountRef.current = 0;

    // Validate data is not null/undefined
    if (!data || typeof data !== 'object') {
      const validationError = new Error('Invalid form data provided');
      handleError(validationError, data);
      return;
    }

    await submitInternal(data);
  }, [isSubmitting, submitInternal, handleError, clearRetryTimeout]);

  // Cleanup effect would be handled by the component using this hook
  // We provide the cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    clearRetryTimeout();
  }, [clearRetryTimeout]);

  return {
    submit,
    isSubmitting,
    error,
    isSuccess,
    reset,
    // Internal cleanup function for advanced usage
    _cleanup: cleanup,
  } as UseFormSubmissionReturn<T> & { _cleanup: () => void };
}