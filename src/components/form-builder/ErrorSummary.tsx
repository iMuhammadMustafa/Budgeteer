import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FormError } from '@/src/types/components/forms.types';
import { formatErrorMessage, groupErrorsByType, getMostCriticalError } from '@/src/utils/form-errors';
import ErrorMessage from './ErrorMessage';

/**
 * Props for ErrorSummary component
 */
interface ErrorSummaryProps {
  errors: FormError[];
  onDismiss?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  maxHeight?: number;
  className?: string;
}

/**
 * ErrorSummary component displays a summary of all form errors
 * with options to dismiss or retry. Provides accessible error navigation.
 */
export default function ErrorSummary({
  errors,
  onDismiss,
  onRetry,
  showRetry = false,
  maxHeight = 200,
  className = '',
}: ErrorSummaryProps) {
  if (!errors || errors.length === 0) return null;

  const groupedErrors = groupErrorsByType(errors);
  const criticalError = getMostCriticalError(errors);
  const hasMultipleErrors = errors.length > 1;

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const renderErrorGroup = (type: string, groupErrors: FormError[]) => {
    if (groupErrors.length === 0) return null;

    const typeLabels = {
      validation: 'Validation Errors',
      submission: 'Submission Errors',
      network: 'Network Errors',
      server: 'Server Errors',
    };

    return (
      <View key={type} className="mb-3">
        <Text className="text-red-700 font-semibold text-sm mb-1">
          {typeLabels[type as keyof typeof typeLabels] || 'Errors'}
        </Text>
        {groupErrors.map((error, index) => (
          <View key={`${type}-${index}`} className="ml-2 mb-1">
            <ErrorMessage
              error={formatErrorMessage(error)}
              type="form"
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View 
      className={`bg-red-50 border border-red-200 rounded-lg p-4 mb-4 ${className}`}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Form has ${errors.length} error${errors.length > 1 ? 's' : ''}`}
      accessibilityLiveRegion="polite"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-red-800 font-semibold text-base">
          {hasMultipleErrors 
            ? `${errors.length} Errors Found` 
            : 'Error Found'
          }
        </Text>
        
        {onDismiss && (
          <Pressable
            onPress={handleDismiss}
            className="p-1"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss errors"
            accessibilityHint="Closes the error summary"
          >
            <Text className="text-red-600 text-lg font-bold">×</Text>
          </Pressable>
        )}
      </View>

      {/* Critical Error (if single error) */}
      {!hasMultipleErrors && criticalError && (
        <ErrorMessage
          error={formatErrorMessage(criticalError)}
          type="form"
          className="mb-3"
        />
      )}

      {/* Multiple Errors List */}
      {hasMultipleErrors && (
        <ScrollView 
          style={{ maxHeight }}
          showsVerticalScrollIndicator={true}
          accessible={true}
          accessibilityLabel="Error list"
        >
          {Object.entries(groupedErrors).map(([type, groupErrors]) =>
            renderErrorGroup(type, groupErrors)
          )}
        </ScrollView>
      )}

      {/* Actions */}
      {(showRetry && onRetry) && (
        <View className="flex-row justify-end mt-3 pt-3 border-t border-red-200">
          <Pressable
            onPress={handleRetry}
            className="bg-red-600 px-4 py-2 rounded-md"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry operation"
            accessibilityHint="Attempts to retry the failed operation"
          >
            <Text className="text-white font-medium">
              Try Again
            </Text>
          </Pressable>
        </View>
      )}

      {/* Screen Reader Instructions */}
      <Text 
        className="sr-only"
        accessibilityLabel={`To fix these errors: ${errors.map(e => formatErrorMessage(e)).join('. ')}`}
      />
    </View>
  );
}