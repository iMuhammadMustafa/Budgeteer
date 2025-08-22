# Form System API Reference

## Overview

This document provides a comprehensive API reference for the Budgeteer form system, including all components, hooks, utilities, and types.

## Table of Contents

- [Components](#components)
- [Hooks](#hooks)
- [Types](#types)
- [Utilities](#utilities)
- [Validation](#validation)
- [Error Handling](#error-handling)

## Components

### FormContainer

Main wrapper component for forms that provides consistent layout and submission handling.

```tsx
interface FormContainerProps {
  children: ReactNode;
  onSubmit: () => void;
  isValid: boolean;
  isLoading: boolean;
  submitLabel?: string;
  showReset?: boolean;
  onReset?: () => void;
  className?: string;
}

function FormContainer(props: FormContainerProps): JSX.Element
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | ✅ | - | Form content to render |
| `onSubmit` | `() => void` | ✅ | - | Function called when form is submitted |
| `isValid` | `boolean` | ✅ | - | Whether the form is currently valid |
| `isLoading` | `boolean` | ✅ | - | Whether the form is in loading state |
| `submitLabel` | `string` | ❌ | `"Submit"` | Text for the submit button |
| `showReset` | `boolean` | ❌ | `false` | Whether to show reset button |
| `onReset` | `() => void` | ❌ | - | Function called when reset button is pressed |
| `className` | `string` | ❌ | - | Additional CSS classes |

#### Example

```tsx
<FormContainer
  onSubmit={handleSubmit}
  isValid={formState.isValid}
  isLoading={isSubmitting}
  submitLabel="Create Account"
  showReset={true}
  onReset={resetForm}
>
  {/* Form fields */}
</FormContainer>
```

### FormField

Flexible field component that handles different input types with consistent styling and validation display.

```tsx
interface FormFieldProps<T> {
  config: FormFieldConfig<T>;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (value: any) => void;
  onBlur?: () => void;
  className?: string;
}

function FormField<T>(props: FormFieldProps<T>): JSX.Element
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `config` | `FormFieldConfig<T>` | ✅ | - | Field configuration object |
| `value` | `any` | ✅ | - | Current field value |
| `error` | `string` | ❌ | - | Validation error message |
| `touched` | `boolean` | ❌ | `false` | Whether field has been touched |
| `onChange` | `(value: any) => void` | ✅ | - | Function called when value changes |
| `onBlur` | `() => void` | ❌ | - | Function called when field loses focus |
| `className` | `string` | ❌ | - | Additional CSS classes |

#### Field Configuration

```tsx
interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'switch' | 'multiselect';
  required?: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  options?: OptionItem[];
  disabled?: boolean;
  description?: string;
}
```

#### Example

```tsx
<FormField
  config={{
    name: 'name',
    label: 'Account Name',
    type: 'text',
    required: true,
    placeholder: 'Enter account name',
    description: 'Choose a unique name for your account',
  }}
  value={formState.data.name}
  error={formState.errors.name}
  touched={formState.touched.name}
  onChange={(value) => updateField('name', value)}
  onBlur={() => setFieldTouched('name')}
/>
```

### FormSection

Groups related fields with optional collapsible functionality.

```tsx
interface FormSectionProps {
  title?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  description?: string;
  className?: string;
}

function FormSection(props: FormSectionProps): JSX.Element
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ❌ | - | Section title |
| `children` | `ReactNode` | ✅ | - | Section content |
| `collapsible` | `boolean` | ❌ | `false` | Whether section can be collapsed |
| `defaultExpanded` | `boolean` | ❌ | `true` | Initial expanded state |
| `description` | `string` | ❌ | - | Section description |
| `className` | `string` | ❌ | - | Additional CSS classes |

#### Example

```tsx
<FormSection 
  title="Account Details" 
  collapsible={true}
  defaultExpanded={true}
  description="Basic information about your account"
>
  <FormField config={nameConfig} value={name} onChange={setName} />
  <FormField config={typeConfig} value={type} onChange={setType} />
</FormSection>
```

### Error Components

#### ErrorMessage

Displays individual error messages.

```tsx
interface ErrorMessageProps {
  error: string;
  type?: 'field' | 'form' | 'global';
  className?: string;
}

function ErrorMessage(props: ErrorMessageProps): JSX.Element
```

#### ErrorSummary

Displays a summary of all form errors.

```tsx
interface ErrorSummaryProps {
  errors: Record<string, string>;
  onFieldFocus?: (field: string) => void;
  className?: string;
}

function ErrorSummary(props: ErrorSummaryProps): JSX.Element
```

#### ErrorBoundary

Catches and handles form component errors.

```tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: React.ComponentType<{ error: Error }>;
  onError?: (error: Error) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps>
```

## Hooks

### useFormState

Manages form state, validation, and field updates.

```tsx
function useFormState<T>(
  initialData: T,
  validationSchema?: ValidationSchema<T>
): UseFormStateReturn<T>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `initialData` | `T` | ✅ | Initial form data |
| `validationSchema` | `ValidationSchema<T>` | ❌ | Validation rules |

#### Return Value

```tsx
interface UseFormStateReturn<T> {
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
```

#### Methods

##### updateField

Updates a specific field value and triggers validation.

```tsx
updateField: (field: keyof T, value: any) => void
```

##### setFieldTouched

Marks a field as touched (user has interacted with it).

```tsx
setFieldTouched: (field: keyof T) => void
```

##### validateForm

Validates the entire form and returns whether it's valid.

```tsx
validateForm: () => boolean
```

##### validateField

Validates a specific field and returns whether it's valid.

```tsx
validateField: (field: keyof T) => boolean
```

##### resetForm

Resets the form to its initial state.

```tsx
resetForm: () => void
```

##### setFormData

Updates multiple fields at once.

```tsx
setFormData: (
  data: Partial<T>, 
  options?: { preserveDirtyState?: boolean }
) => void
```

##### setInitialFormData

Updates the initial data and resets the form.

```tsx
setInitialFormData: (data: Partial<T>) => void
```

#### Example

```tsx
function MyForm({ initialData }: { initialData: MyFormData }) {
  const {
    formState,
    updateField,
    validateForm,
    resetForm,
    isDirty,
    isValid
  } = useFormState(initialData, validationSchema);

  const handleSubmit = () => {
    if (validateForm()) {
      // Submit form
    }
  };

  return (
    <FormContainer
      onSubmit={handleSubmit}
      isValid={isValid}
      isLoading={false}
      showReset={isDirty}
      onReset={resetForm}
    >
      <FormField
        config={{ name: 'name', label: 'Name', type: 'text' }}
        value={formState.data.name}
        error={formState.errors.name}
        touched={formState.touched.name}
        onChange={(value) => updateField('name', value)}
      />
    </FormContainer>
  );
}
```

### useFormSubmission

Handles form submission with loading states and error handling.

```tsx
function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void>,
  options?: UseFormSubmissionOptions
): UseFormSubmissionReturn<T>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `onSubmit` | `(data: T) => Promise<void>` | ✅ | Submission function |
| `options` | `UseFormSubmissionOptions` | ❌ | Submission options |

#### Options

```tsx
interface UseFormSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  showErrorMessage?: boolean;
}
```

#### Return Value

```tsx
interface UseFormSubmissionReturn<T> {
  submit: (data: T) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
  isSuccess: boolean;
  reset: () => void;
}
```

#### Example

```tsx
function MyForm({ initialData, onSubmit }: FormProps) {
  const { formState, validateForm } = useFormState(initialData);
  
  const { submit, isSubmitting, error, isSuccess } = useFormSubmission(
    onSubmit,
    {
      onSuccess: () => console.log('Form submitted successfully!'),
      onError: (error) => console.error('Submission failed:', error),
      resetOnSuccess: true,
    }
  );

  const handleSubmit = async () => {
    if (validateForm()) {
      await submit(formState.data);
    }
  };

  return (
    <FormContainer
      onSubmit={handleSubmit}
      isValid={formState.isValid}
      isLoading={isSubmitting}
    >
      {/* Form fields */}
      {error && <ErrorMessage error={error.message} type="form" />}
      {isSuccess && <Text>Form submitted successfully!</Text>}
    </FormContainer>
  );
}
```

## Types

### Core Form Types

#### BaseFormProps

Base interface that all form components should extend.

```tsx
interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  validationSchema?: ValidationSchema<T>;
}
```

#### FormState

Represents the current state of a form.

```tsx
interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}
```

#### FormFieldConfig

Configuration for individual form fields.

```tsx
interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'switch' | 'multiselect';
  required?: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  options?: OptionItem[];
  disabled?: boolean;
  description?: string;
}
```

#### OptionItem

Option for select and multiselect fields.

```tsx
interface OptionItem {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
  icon?: string;
  color?: string;
}
```

### Validation Types

#### ValidationSchema

Schema defining validation rules for form fields.

```tsx
type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};
```

#### ValidationRule

Individual validation rule.

```tsx
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData?: any) => boolean;
}
```

#### ValidationResult

Result of validating a field or form.

```tsx
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface FormValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
}
```

### Form-Specific Types

#### AccountFormData

```tsx
interface AccountFormData extends Omit<Account, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
}
```

#### TransactionFormData

```tsx
interface TransactionFormData extends Omit<Transaction, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  amount: number; // Always positive, sign handled by type
}
```

#### TransactionCategoryFormData

```tsx
interface TransactionCategoryFormData extends Omit<TransactionCategory, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
}
```

#### TransactionGroupFormData

```tsx
interface TransactionGroupFormData extends Omit<TransactionGroup, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
}
```

#### AccountCategoryFormData

```tsx
interface AccountCategoryFormData extends Omit<AccountCategory, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
}
```

#### ConfigurationFormData

```tsx
interface ConfigurationFormData extends Omit<Configuration, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
}
```

#### MultipleTransactionsFormData

```tsx
interface MultipleTransactionsFormData {
  originalTransactionId: string | null;
  payee: string;
  date: string;
  description: string;
  type: string;
  isvoid: boolean;
  accountid: string;
  groupid: string;
  transactions: Record<string, MultipleTransactionItemData>;
}

interface MultipleTransactionItemData {
  name: string;
  amount: number;
  categoryid: string;
  notes: string | null;
  tags: string[] | null;
  groupid: string;
}
```

## Utilities

### Validation Functions

#### executeValidationRule

Executes a single validation rule against a value.

```tsx
function executeValidationRule(
  rule: ValidationRule,
  value: any,
  formData?: any
): ValidationResult
```

#### validateField

Validates a single field against its validation rules.

```tsx
function validateField<T>(
  fieldName: keyof T,
  value: any,
  validationRules: ValidationRule[],
  formData?: T
): ValidationResult
```

#### validateForm

Validates an entire form against its validation schema.

```tsx
function validateForm<T extends Record<string, any>>(
  formData: T,
  validationSchema: ValidationSchema<T>
): FormValidationResult<T>
```

### Built-in Validators

#### requiredValidator

```tsx
function requiredValidator(value: any): boolean
```

Validates that a field is not empty.

#### minLengthValidator

```tsx
function minLengthValidator(value: string, minLength: number): boolean
```

Validates minimum string length.

#### maxLengthValidator

```tsx
function maxLengthValidator(value: string, maxLength: number): boolean
```

Validates maximum string length.

#### minValidator

```tsx
function minValidator(value: number, min: number): boolean
```

Validates minimum numeric value.

#### maxValidator

```tsx
function maxValidator(value: number, max: number): boolean
```

Validates maximum numeric value.

#### patternValidator

```tsx
function patternValidator(value: string, pattern: RegExp): boolean
```

Validates against a regular expression pattern.

#### emailValidator

```tsx
function emailValidator(value: string): boolean
```

Validates email format.

### Common Validation Rules

#### commonValidationRules

Object containing factory functions for common validation rules.

```tsx
const commonValidationRules = {
  required: (message?: string) => ValidationRule,
  minLength: (length: number, message?: string) => ValidationRule,
  maxLength: (length: number, message?: string) => ValidationRule,
  min: (value: number, message?: string) => ValidationRule,
  max: (value: number, message?: string) => ValidationRule,
  email: (message?: string) => ValidationRule,
  pattern: (regex: RegExp, message: string) => ValidationRule,
  custom: (validator: (value: any, formData?: any) => boolean, message: string) => ValidationRule,
};
```

#### Example Usage

```tsx
const validationSchema: ValidationSchema<MyFormData> = {
  name: [
    commonValidationRules.required('Name is required'),
    commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
  ],
  email: [
    commonValidationRules.required('Email is required'),
    commonValidationRules.email('Must be a valid email address'),
  ],
  age: [
    commonValidationRules.required('Age is required'),
    commonValidationRules.min(18, 'Must be 18 or older'),
    commonValidationRules.max(120, 'Age must be realistic'),
  ],
  password: [
    commonValidationRules.required('Password is required'),
    commonValidationRules.minLength(8, 'Password must be at least 8 characters'),
    commonValidationRules.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  ],
  confirmPassword: [
    commonValidationRules.required('Please confirm your password'),
    commonValidationRules.custom(
      (value, formData) => value === formData?.password,
      'Passwords must match'
    ),
  ],
};
```

### Form-Specific Validators

#### positiveAmountValidator

```tsx
function positiveAmountValidator(value: number): boolean
```

Validates that an amount is positive.

#### notFutureDateValidator

```tsx
function notFutureDateValidator(value: string): boolean
```

Validates that a date is not in the future.

#### safeStringValidator

```tsx
function safeStringValidator(value: string): boolean
```

Validates that a string contains only safe characters.

#### numericStringValidator

```tsx
function numericStringValidator(value: string): boolean
```

Validates that a string can be parsed as a valid number.

### Validation Schema Builders

#### createAccountNameValidation

```tsx
function createAccountNameValidation(): ValidationRule[]
```

Creates validation rules for account names.

#### createAmountValidation

```tsx
function createAmountValidation(): ValidationRule[]
```

Creates validation rules for transaction amounts.

#### createDateValidation

```tsx
function createDateValidation(): ValidationRule[]
```

Creates validation rules for transaction dates.

#### createCategoryNameValidation

```tsx
function createCategoryNameValidation(): ValidationRule[]
```

Creates validation rules for category names.

#### createDescriptionValidation

```tsx
function createDescriptionValidation(required?: boolean): ValidationRule[]
```

Creates validation rules for descriptions and notes.

### Utility Functions

#### createDebouncedValidator

```tsx
function createDebouncedValidator<T>(
  validator: (data: T) => FormValidationResult<T>,
  delay?: number
): (data: T) => Promise<FormValidationResult<T>>
```

Creates a debounced version of a validator function.

#### formatValidationError

```tsx
function formatValidationError(error: string): string
```

Formats validation error messages for display.

#### hasValidationErrors

```tsx
function hasValidationErrors<T>(errors: Partial<Record<keyof T, string>>): boolean
```

Checks if a form has any validation errors.

#### getFirstValidationError

```tsx
function getFirstValidationError<T>(errors: Partial<Record<keyof T, string>>): string | undefined
```

Gets the first validation error from a form.

## Error Handling

### Error Types

#### FormError

```tsx
interface FormError {
  field?: string;
  message: string;
  type: FormErrorType;
  code?: string;
}

type FormErrorType = 'validation' | 'submission' | 'network' | 'server';
```

#### FormErrorState

```tsx
interface FormErrorState {
  errors: FormError[];
  hasErrors: boolean;
  getFieldError: (field: string) => string | undefined;
  getFormErrors: () => FormError[];
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  addError: (error: FormError) => void;
}
```

### Error Utilities

#### useErrorDisplay

```tsx
function useErrorDisplay(): {
  showError: (error: FormError) => void;
  clearError: (field?: string) => void;
  errors: FormError[];
}
```

Hook for managing error display state.

#### ErrorRecovery

```tsx
interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onCancel?: () => void;
}

function ErrorRecovery(props: ErrorRecoveryProps): JSX.Element
```

Component for handling error recovery.

## Performance Utilities

### Performance Monitoring

#### performanceMonitor

```tsx
const performanceMonitor = {
  recordFormPerformance: (
    formName: string,
    metrics: {
      renderTime?: number;
      validationTime?: number;
      submissionTime?: number;
      fieldUpdateTime?: number;
    },
    fieldCount?: number,
    validationRuleCount?: number
  ) => void;
  
  getFormStatistics: (formName: string) => {
    averageRenderTime: number;
    averageValidationTime: number;
    averageSubmissionTime: number;
    averageFieldUpdateTime: number;
    totalMeasurements: number;
  };
  
  clearPerformanceData: () => void;
};
```

#### useFormPerformanceMonitor

```tsx
function useFormPerformanceMonitor(formName: string): {
  measureRender: () => () => number;
  measureValidation: () => () => number;
  measureSubmission: () => () => number;
  recordMetrics: (metrics: Record<string, number>) => void;
}
```

Hook for monitoring form performance.

### Debounce Utility

#### debounce

```tsx
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void
```

Creates a debounced version of a function.

## Accessibility Utilities

### Focus Management

#### focusManager

```tsx
const focusManager = {
  setFocusOrder: (elements: HTMLElement[]) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  getCurrentFocusIndex: () => number;
  reset: () => void;
};
```

### Accessibility Audit

#### FormAccessibilityAuditor

```tsx
class FormAccessibilityAuditor {
  auditFormComponent: (props: any, componentType: string) => {
    passed: boolean;
    score: number;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      rule: string;
      message: string;
    }>;
    recommendations: string[];
  };
  
  generateAxeReport: (axeResults: any) => {
    criticalIssues: number;
    passedChecks: number;
    overallScore: number;
  };
}
```

#### generateAccessibilityReport

```tsx
function generateAccessibilityReport(auditResults: any[]): string
```

Generates a comprehensive accessibility report.

#### accessibilityMatchers

```tsx
const accessibilityMatchers = {
  toBeAccessible: (received: any, componentType: string) => jest.CustomMatcherResult;
  toHaveAccessibilityScore: (received: any, componentType: string, expectedScore: number) => jest.CustomMatcherResult;
};
```

Jest matchers for accessibility testing.

---

*API Reference last updated: January 2024*