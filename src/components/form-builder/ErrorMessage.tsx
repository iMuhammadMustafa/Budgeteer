import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ErrorMessageProps } from '@/src/types/components/forms.types';

/**
 * ErrorMessage component displays individual error messages with consistent styling
 * and accessibility support. Supports different error types (field, form, global).
 */
export default function ErrorMessage({
  error,
  type = 'field',
  className = '',
}: ErrorMessageProps) {
  if (!error) return null;

  const getErrorStyles = () => {
    switch (type) {
      case 'field':
        return 'text-red-500 text-sm mt-1';
      case 'form':
        return 'text-red-600 text-base p-3 bg-red-50 border border-red-200 rounded-md';
      case 'global':
        return 'text-red-700 text-base p-4 bg-red-100 border border-red-300 rounded-lg shadow-sm';
      default:
        return 'text-red-500 text-sm';
    }
  };

  const getAccessibilityRole = () => {
    switch (type) {
      case 'field':
        return 'alert';
      case 'form':
      case 'global':
        return 'alert';
      default:
        return 'text';
    }
  };

  return (
    <Text
      className={`${getErrorStyles()} ${className}`}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Error: ${error}`}
    >
      {error}
    </Text>
  );
}