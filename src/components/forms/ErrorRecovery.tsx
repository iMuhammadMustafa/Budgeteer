import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FormError } from '@/src/types/components/forms.types';
import { 
  isRecoverableError, 
  getRetryDelay, 
  getUserFriendlyErrorMessage,
  formatErrorMessage 
} from '@/src/utils/form-errors';
import ErrorMessage from './ErrorMessage';

/**
 * Props for ErrorRecovery component
 */
interface ErrorRecoveryProps {
  error: FormError;
  onRetry: () => void;
  onCancel?: () => void;
  maxRetries?: number;
  autoRetry?: boolean;
  className?: string;
}

/**
 * ErrorRecovery component provides automatic and manual retry mechanisms
 * for recoverable errors with exponential backoff and user feedback.
 */
export default function ErrorRecovery({
  error,
  onRetry,
  onCancel,
  maxRetries = 3,
  autoRetry = false,
  className = '',
}: ErrorRecoveryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const isRecoverable = isRecoverableError(error);
  const canRetry = isRecoverable && retryCount < maxRetries;
  const shouldAutoRetry = autoRetry && canRetry && retryCount === 0;

  useEffect(() => {
    if (shouldAutoRetry) {
      const delay = getRetryDelay(error, retryCount + 1);
      setCountdown(Math.ceil(delay / 1000));
      setIsRetrying(true);

      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [shouldAutoRetry, error, retryCount]);

  const handleRetry = async () => {
    if (!canRetry || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleManualRetry = () => {
    setCountdown(0);
    handleRetry();
  };

  const handleCancel = () => {
    setCountdown(0);
    setIsRetrying(false);
    if (onCancel) {
      onCancel();
    }
  };

  if (!error) return null;

  return (
    <View 
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="Error recovery options"
    >
      {/* Error Message */}
      <ErrorMessage
        error={getUserFriendlyErrorMessage(error.message)}
        type="form"
        className="mb-3"
      />

      {/* Recovery Status */}
      {isRecoverable ? (
        <View className="mb-3">
          <Text className="text-gray-700 text-sm">
            {retryCount > 0 
              ? `Retry attempt ${retryCount} of ${maxRetries}`
              : 'This error can be resolved by trying again'
            }
          </Text>
          
          {countdown > 0 && (
            <Text 
              className="text-blue-600 text-sm mt-1"
              accessibilityLiveRegion="polite"
            >
              Retrying automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
            </Text>
          )}
        </View>
      ) : (
        <View className="mb-3">
          <Text className="text-gray-700 text-sm">
            This error requires manual correction. Please check your input and try again.
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row justify-end space-x-3">
        {onCancel && (
          <Pressable
            onPress={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            disabled={isRetrying}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel operation"
            accessibilityHint="Cancels the current operation and dismisses the error"
          >
            <Text className={`text-center font-medium ${
              isRetrying ? 'text-gray-400' : 'text-gray-700'
            }`}>
              Cancel
            </Text>
          </Pressable>
        )}

        {canRetry && (
          <Pressable
            onPress={handleManualRetry}
            className={`px-4 py-2 rounded-md ${
              isRetrying 
                ? 'bg-gray-400' 
                : 'bg-red-600'
            }`}
            disabled={isRetrying}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isRetrying ? 'Retrying...' : 'Retry operation'}
            accessibilityHint="Attempts to retry the failed operation"
          >
            <Text className="text-white font-medium text-center">
              {isRetrying 
                ? (countdown > 0 ? `Retrying in ${countdown}s` : 'Retrying...') 
                : 'Try Again'
              }
            </Text>
          </Pressable>
        )}

        {!canRetry && isRecoverable && (
          <Text className="text-gray-500 text-sm py-2">
            Maximum retry attempts reached
          </Text>
        )}
      </View>

      {/* Technical Details (for debugging) */}
      {__DEV__ && (
        <View className="mt-3 pt-3 border-t border-red-200">
          <Text className="text-gray-500 text-xs">
            Debug: {formatErrorMessage(error)}
          </Text>
          <Text className="text-gray-500 text-xs">
            Type: {error.type}, Recoverable: {isRecoverable ? 'Yes' : 'No'}
          </Text>
        </View>
      )}
    </View>
  );
}