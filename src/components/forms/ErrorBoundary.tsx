import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FormError } from '@/src/types/components/forms.types';
import { createServerError, getUserFriendlyErrorMessage, logFormError } from '@/src/utils/form-errors';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

/**
 * Default fallback component for error boundary
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <View className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
    <Text className="text-red-800 text-lg font-semibold mb-2">
      Something went wrong
    </Text>
    <Text className="text-red-700 mb-4">
      {getUserFriendlyErrorMessage(error)}
    </Text>
    <Pressable
      className="bg-red-600 px-4 py-2 rounded-md"
      onPress={retry}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Try again"
      accessibilityHint="Attempts to recover from the error"
    >
      <Text className="text-white font-medium text-center">
        Try Again
      </Text>
    </Pressable>
  </View>
);

/**
 * ErrorBoundary component catches JavaScript errors in form components
 * and displays a fallback UI with recovery options.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    const formError = createServerError(error.message);
    logFormError(formError, 'ErrorBoundary');

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log additional error info for debugging
    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <View 
          className={this.props.className}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="An error occurred in the form"
        >
          <FallbackComponent 
            error={this.state.error} 
            retry={this.handleRetry}
          />
        </View>
      );
    }

    return this.props.children;
  }
}