import {
  FormError,
  FormErrorState,
  UseErrorDisplayOptions,
  UseErrorDisplayReturn,
} from "@/src/types/components/forms.types";
import {
  createFormErrorState,
  getRetryDelay,
  isRecoverableError,
  logFormError,
  reportFormError,
} from "@/src/utils/form-errors";
import React, { useCallback, useRef, useState } from "react";

/**
 * Custom hook for managing error display and recovery in forms
 * Provides comprehensive error handling with retry mechanisms and user feedback
 */
export function useErrorDisplay(options: UseErrorDisplayOptions = {}): UseErrorDisplayReturn {
  const {
    maxRetries = 3,
    autoRetry = false,
    logErrors = true,
    reportErrors = false,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [errorState, setErrorState] = useState<FormErrorState>(() => createFormErrorState());
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Forward declare retryError for use in showError
  const retryErrorRef = useRef<((error: FormError) => Promise<void>) | undefined>(undefined);

  /**
   * Shows a single error
   */
  const showError = useCallback(
    (error: FormError) => {
      setErrorState(prevState => {
        const newState = { ...prevState };
        newState.addError(error);
        return { ...newState };
      });

      // Log error if enabled
      if (logErrors) {
        logFormError(error, "useErrorDisplay");
      }

      // Report error if enabled
      if (reportErrors) {
        reportFormError(error, { retryCount, maxRetries });
      }

      // Auto-retry if enabled and error is recoverable
      if (autoRetry && isRecoverableError(error) && retryCount < maxRetries && onRetry && retryErrorRef.current) {
        const delay = getRetryDelay(error, retryCount + 1);

        retryTimeoutRef.current = setTimeout(() => {
          retryErrorRef.current?.(error);
        }, delay);
      }
    },
    [logErrors, reportErrors, autoRetry, retryCount, maxRetries, onRetry],
  );

  /**
   * Shows multiple errors
   */
  const showErrors = useCallback(
    (errors: FormError[]) => {
      setErrorState(prevState => {
        const newState = { ...prevState };
        errors.forEach(error => newState.addError(error));
        return { ...newState };
      });

      // Log and report errors
      errors.forEach(error => {
        if (logErrors) {
          logFormError(error, "useErrorDisplay");
        }
        if (reportErrors) {
          reportFormError(error, { retryCount, maxRetries });
        }
      });
    },
    [logErrors, reportErrors, retryCount, maxRetries],
  );

  /**
   * Clears a specific field error or all errors
   */
  const clearError = useCallback((field?: string) => {
    setErrorState(prevState => {
      const newState = { ...prevState };
      if (field) {
        newState.clearFieldError(field);
      } else {
        newState.clearErrors();
      }
      return { ...newState };
    });

    // Clear retry timeout if clearing all errors
    if (!field && retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      setRetryCount(0);
      setIsRetrying(false);
    }
  }, []);

  /**
   * Clears all errors
   */
  const clearAllErrors = useCallback(() => {
    clearError();
  }, [clearError]);

  /**
   * Retries a failed operation for a specific error
   */
  const retryError = useCallback(
    async (error: FormError) => {
      if (!isRecoverableError(error) || retryCount >= maxRetries || !onRetry) {
        return;
      }

      setIsRetrying(true);
      setRetryCount(prev => prev + 1);

      try {
        await onRetry(error);

        // Clear the error if retry was successful
        if (error.field) {
          clearError(error.field);
        } else {
          clearAllErrors();
        }

        // Reset retry count on success
        setRetryCount(0);
      } catch (retryErrorException) {
        const newRetryCount = retryCount + 1;

        if (newRetryCount >= maxRetries) {
          // Max retries reached
          if (onMaxRetriesReached) {
            onMaxRetriesReached(error);
          }

          if (logErrors) {
            logFormError(error, `Max retries (${maxRetries}) reached`);
          }
        } else {
          // Schedule next retry
          const delay = getRetryDelay(error, newRetryCount + 1);
          retryTimeoutRef.current = setTimeout(() => {
            retryErrorRef.current?.(error);
          }, delay);
        }
      } finally {
        setIsRetrying(false);
      }
    },
    [retryCount, maxRetries, onRetry, onMaxRetriesReached, logErrors, clearError, clearAllErrors],
  );

  // Assign retryError to ref for use in showError
  retryErrorRef.current = retryError;

  /**
   * Checks if an error can be retried
   */
  const canRetry = useCallback(
    (error: FormError) => {
      return isRecoverableError(error) && retryCount < maxRetries;
    },
    [retryCount, maxRetries],
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    errorState,
    showError,
    showErrors,
    clearError,
    clearAllErrors,
    retryError,
    isRetrying,
    retryCount,
    canRetry,
  };
}
