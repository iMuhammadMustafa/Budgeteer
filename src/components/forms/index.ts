/**
 * Enhanced form components for the forms refactoring
 * This file exports all the form components for easy importing
 */

export { default as FormContainer } from './FormContainer';
export { default as FormField } from './FormField';
export { default as FormSection } from './FormSection';
export { default as LazyFormSection, createLazyFormSection } from './LazyFormSection';

// Error handling components
export { default as ErrorMessage } from './ErrorMessage';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ErrorSummary } from './ErrorSummary';
export { default as ErrorRecovery } from './ErrorRecovery';

// Re-export types for convenience
export type {
  FormContainerProps,
  FormFieldProps,
  FormSectionProps,
  FormFieldConfig,
  OptionItem,
  ErrorMessageProps,
  FormError,
  FormErrorState,
} from '../../types/components/forms.types';