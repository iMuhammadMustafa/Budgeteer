/**
 * Forms module index - exports all form-related types and utilities
 * This file provides a single entry point for importing form-related functionality
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Base form interfaces
  BaseFormProps,
  FormState,
  FormFieldConfig,
  OptionItem,
  FormSectionConfig,
  FormConfig,
  
  // Validation types
  ValidationRule,
  ValidationSchema,
  ValidationResult,
  FormValidationResult,
  
  // Error handling types
  FormErrorType,
  FormError,
  FormErrorState,
  
  // Component props
  FormContainerProps,
  FormFieldProps,
  FormSectionProps,
  ErrorMessageProps,
  
  // Hook return types
  UseFormStateReturn,
  UseFormSubmissionOptions,
  UseFormSubmissionReturn,
  
  // Form-specific data types
  AccountFormData,
  TransactionFormData,
  TransactionCategoryFormData,
  TransactionGroupFormData,
  AccountCategoryFormData,
  ConfigurationFormData,
  MultipleTransactionsFormData,
  MultipleTransactionItemData,
  
  // Form mode and state types
  FormMode,
  FormSubmissionState,
  
  // Utility types
  ExtractFormData,
  PartialFormData,
  FormFieldValue,
  FormDataChangeHandler,
} from './forms.types';

// ============================================================================
// Validation Utilities Exports
// ============================================================================

export {
  // Built-in validators
  requiredValidator,
  minLengthValidator,
  maxLengthValidator,
  minValidator,
  maxValidator,
  patternValidator,
  emailValidator,
  
  // Validation execution
  executeValidationRule,
  validateField,
  validateForm,
  
  // Common validation rules
  commonValidationRules,
  
  // Form-specific validators
  positiveAmountValidator,
  notFutureDateValidator,
  safeStringValidator,
  numericStringValidator,
  
  // Validation schema builders
  createAccountNameValidation,
  createAmountValidation,
  createDateValidation,
  createCategoryNameValidation,
  createDescriptionValidation,
  
  // Utility functions
  createDebouncedValidator,
  formatValidationError,
  hasValidationErrors,
  getFirstValidationError,
} from '../../utils/form-validation';

// ============================================================================
// Validation Schemas Exports
// ============================================================================

export {
  // Individual validation schemas
  accountFormValidationSchema,
  transactionFormValidationSchema,
  transactionCategoryFormValidationSchema,
  transactionGroupFormValidationSchema,
  accountCategoryFormValidationSchema,
  configurationFormValidationSchema,
  multipleTransactionsFormValidationSchema,
  multipleTransactionItemValidationSchema,
  
  // Schema registry
  validationSchemas,
  getValidationSchema,
  
  // Types
  type ValidationSchemaKey,
} from '../../utils/form-schemas';

// ============================================================================
// Error Handling Exports
// ============================================================================

export {
  // Error state management
  createFormErrorState,
  updateErrorState,
  
  // Error creation helpers
  createValidationError,
  createSubmissionError,
  createNetworkError,
  createServerError,
  
  // Error formatting
  formatErrorMessage,
  getUserFriendlyErrorMessage,
  
  // Error recovery
  isRecoverableError,
  getRetryDelay,
  
  // Error conversion
  convertApiErrorToFormError,
  convertValidationErrorsToFormErrors,
  convertFormErrorsToValidationErrors,
  
  // Error logging
  logFormError,
  reportFormError,
  
  // Error aggregation
  groupErrorsByType,
  getMostCriticalError,
  hasCriticalErrors,
} from '../../utils/form-errors';

// ============================================================================
// Re-exports for Convenience
// ============================================================================

// Re-export commonly used database types
export type {
  Account,
  Transaction,
  TransactionCategory,
  TransactionGroup,
  AccountCategory,
  Configuration,
} from '../db/Tables.Types';

// Re-export commonly used enums
export type {
  AccountType,
  TransactionStatus,
  TransactionType,
} from '../db/Tables.Types';