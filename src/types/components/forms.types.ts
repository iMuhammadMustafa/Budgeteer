/**
 * Foundation types and interfaces for the forms refactoring
 * This file contains base form types, validation interfaces, and error handling types
 */

import { ReactNode } from "react";
import {
  Account,
  AccountCategory,
  Configuration,
  Transaction,
  TransactionCategory,
  TransactionGroup,
} from "../database/Tables.Types";

// ============================================================================
// Base Form Interfaces
// ============================================================================

/**
 * Base props interface that all form components should extend
 */
export interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  validationSchema?: ValidationSchema<T>;
}

/**
 * Form state interface that tracks the current state of a form
 */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Configuration for individual form fields
 */
export interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: "text" | "number" | "select" | "date" | "textarea" | "switch" | "multiselect";
  required?: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  options?: OptionItem[];
  disabled?: boolean;
  description?: string;
  popUp?: boolean;
  group?: string;
  nestedForm?: ReactNode;
  onNestedFormSuccess?: (newItem: any) => void;
}

/**
 * Option item for select and multiselect fields
 */
export interface OptionItem {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

/**
 * Form section configuration for grouping related fields
 */
export interface FormSectionConfig {
  title: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description?: string;
}

/**
 * Complete form configuration
 */
export interface FormConfig<T> {
  fields: FormFieldConfig<T>[];
  sections?: FormSectionConfig[];
  validation: ValidationSchema<T>;
  layout: "single-column" | "two-column" | "responsive";
  submitLabel?: string;
  showReset?: boolean;
}

// ============================================================================
// Validation System Types
// ============================================================================

/**
 * Individual validation rule
 */
export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "min" | "max" | "pattern" | "email" | "custom";
  value?: any;
  message: string;
  validator?: (value: any, formData?: any) => boolean;
}

/**
 * Validation schema for a form
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};

/**
 * Validation result for a single field
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Complete form validation result
 */
export interface FormValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Form error types
 */
export type FormErrorType = "validation" | "submission" | "network" | "server";

/**
 * Individual form error
 */
export interface FormError {
  field?: string;
  message: string;
  type: FormErrorType;
  code?: string;
}

/**
 * Form error state management
 */
export interface FormErrorState {
  errors: FormError[];
  hasErrors: boolean;
  getFieldError: (field: string) => string | undefined;
  getFormErrors: () => FormError[];
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  addError: (error: FormError) => void;
}

// ============================================================================
// Form Component Props
// ============================================================================

/**
 * Props for FormContainer component
 */
export interface FormContainerProps {
  children: ReactNode;
  onSubmit: () => void;
  isValid: boolean;
  isLoading: boolean;
  submitLabel?: string;
  showReset?: boolean;
  onReset?: () => void;
  className?: string;
}

/**
 * Props for FormField component
 */
export interface FormFieldProps<T> {
  config: FormFieldConfig<T>;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (value: any) => void;
  onBlur?: () => void;
  className?: string;
  onNestedFormSuccess?: (newItem: any) => void;
}

/**
 * Props for FormSection component
 */
export interface FormSectionProps {
  title?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description?: string;
  className?: string;
}

/**
 * Props for error display components
 */
export interface ErrorMessageProps {
  error: string;
  type?: "field" | "form" | "global";
  className?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useFormState hook
 */
export interface UseFormStateReturn<T> {
  formState: FormState<T>;
  updateField: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T) => void;
  validateForm: () => boolean;
  validateField: (field: keyof T) => boolean;
  resetForm: () => void;
  setFormData: (data: Partial<T>, options?: { preserveDirtyState?: boolean }) => void;
  setInitialFormData: (data: Partial<T>) => void;
  isDirty: boolean;
  isValid: boolean;
}

/**
 * Options for useFormSubmission hook
 */
export interface UseFormSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}

/**
 * Return type for useFormSubmission hook
 */
export interface UseFormSubmissionReturn<T> {
  submit: (data: T) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
  isSuccess: boolean;
  reset: () => void;
}

// ============================================================================
// Form-Specific Data Types
// ============================================================================

/**
 * Account form data type
 */
export interface AccountFormData extends Omit<Account, "id" | "createdat" | "updatedat"> {
  id?: string;
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
  statementdate?: number | null;
}

/**
 * Transaction form data type
 */
export interface TransactionFormData extends Omit<Transaction, "id" | "createdat" | "updatedat"> {
  id?: string;
  amount: number; // Always positive, sign handled by type
}

/**
 * Transaction Category form data type
 */
export interface TransactionCategoryFormData extends Omit<TransactionCategory, "id" | "createdat" | "updatedat"> {
  id?: string;
}

/**
 * Transaction Group form data type
 */
export interface TransactionGroupFormData extends Omit<TransactionGroup, "id" | "createdat" | "updatedat"> {
  id?: string;
}

/**
 * Account Category form data type
 */
export interface AccountCategoryFormData extends Omit<AccountCategory, "id" | "createdat" | "updatedat"> {
  id?: string;
}

/**
 * Configuration form data type
 */
export interface ConfigurationFormData extends Omit<Configuration, "id" | "createdat" | "updatedat"> {
  id?: string;
}

/**
 * Multiple transactions form data type
 */
export interface MultipleTransactionsFormData {
  originalTransactionId: string | null;
  payee: string;
  date: string; // ISO date string
  description: string;
  type: string;
  isvoid: boolean;
  accountid: string;
  groupid: string;
  transactions: Record<string, MultipleTransactionItemData>;
}

/**
 * Individual transaction item in multiple transactions form
 */
export interface MultipleTransactionItemData {
  name: string;
  amount: number;
  categoryid: string;
  notes: string | null;
  tags: string[] | null;
  groupid: string;
}

// ============================================================================
// Form Mode Types
// ============================================================================

/**
 * Form operation modes
 */
export type FormMode = "create" | "edit" | "view" | "duplicate";

/**
 * Form submission states
 */
export type FormSubmissionState = "idle" | "submitting" | "success" | "error";

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract form data type from a form component
 */
export type ExtractFormData<T> = T extends BaseFormProps<infer U> ? U : never;

/**
 * Make all properties of a form data type optional for partial updates
 */
export type PartialFormData<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Form field value type
 */
export type FormFieldValue = string | number | boolean | string[] | null | undefined;

/**
 * Form data change handler type
 */
export type FormDataChangeHandler<T> = (field: keyof T, value: FormFieldValue) => void;
