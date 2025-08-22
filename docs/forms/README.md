# Form System Documentation

## Overview

The Budgeteer application uses a comprehensive, type-safe form system built with React and React Native best practices. This system provides consistent patterns for form state management, validation, submission handling, and user experience across all forms in the application.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Custom Hooks](#custom-hooks)
- [Validation System](#validation-system)
- [Form Types](#form-types)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Creating a Simple Form

```tsx
import React from 'react';
import { FormContainer, FormField, useFormState, useFormSubmission } from '../components/forms';
import { ValidationSchema } from '../types/components/forms.types';

interface UserFormData {
  name: string;
  email: string;
  age: number;
}

const validationSchema: ValidationSchema<UserFormData> = {
  name: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
  ],
  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Must be a valid email address' },
  ],
  age: [
    { type: 'required', message: 'Age is required' },
    { type: 'min', value: 18, message: 'Must be 18 or older' },
  ],
};

export function UserForm({ initialData, onSubmit, onCancel }: {
  initialData: UserFormData;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { formState, updateField, validateForm, resetForm } = useFormState(
    initialData,
    validationSchema
  );

  const { submit, isSubmitting, error } = useFormSubmission(onSubmit, {
    onSuccess: () => console.log('Form submitted successfully!'),
    resetOnSuccess: true,
  });

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
      submitLabel="Save User"
      showReset={true}
      onReset={resetForm}
    >
      <FormField
        config={{
          name: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name',
        }}
        value={formState.data.name}
        error={formState.errors.name}
        touched={formState.touched.name}
        onChange={(value) => updateField('name', value)}
      />

      <FormField
        config={{
          name: 'email',
          label: 'Email Address',
          type: 'text',
          required: true,
          placeholder: 'Enter your email',
        }}
        value={formState.data.email}
        error={formState.errors.email}
        touched={formState.touched.email}
        onChange={(value) => updateField('email', value)}
      />

      <FormField
        config={{
          name: 'age',
          label: 'Age',
          type: 'number',
          required: true,
        }}
        value={formState.data.age}
        error={formState.errors.age}
        touched={formState.touched.age}
        onChange={(value) => updateField('age', value)}
      />

      {error && <ErrorMessage error={error.message} type="form" />}
    </FormContainer>
  );
}
```

## Architecture

### Form System Layers

```
┌─────────────────────────────────────────┐
│           Form Components               │
│  (AccountForm, TransactionForm, etc.)   │
├─────────────────────────────────────────┤
│           Custom Hooks Layer            │
│     (useFormState, useFormSubmission)   │
├─────────────────────────────────────────┤
│         Shared Components Layer         │
│    (FormField, FormSection, etc.)       │
├─────────────────────────────────────────┤
│           Utilities Layer               │
│   (validation, formatting, types)       │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Type Safety**: All forms use strict TypeScript interfaces
2. **Consistency**: Uniform patterns across all form components
3. **Reusability**: Shared components and hooks eliminate duplication
4. **Performance**: Optimized re-renders and memory usage
5. **Accessibility**: WCAG compliant form interactions
6. **Maintainability**: Clear separation of concerns

## Core Components

### FormContainer

The main wrapper component that provides consistent layout and submission handling.

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
```

**Features:**
- Consistent form layout and styling
- Submit/reset button management
- Loading state handling
- Keyboard navigation support
- Accessibility attributes

### FormField

A flexible field component that handles different input types with consistent styling and validation display.

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
```

**Supported Field Types:**
- `text` - Text input
- `number` - Numeric input
- `select` - Dropdown selection
- `date` - Date picker
- `textarea` - Multi-line text
- `switch` - Boolean toggle
- `multiselect` - Multiple selection

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
```

### Error Components

- **ErrorMessage**: Displays individual field or form errors
- **ErrorSummary**: Shows all form errors in a summary
- **ErrorBoundary**: Catches and handles form component errors
- **ErrorRecovery**: Provides error recovery mechanisms

## Custom Hooks

### useFormState

Manages form state, validation, and field updates.

```tsx
function useFormState<T>(
  initialData: T,
  validationSchema?: ValidationSchema<T>
): UseFormStateReturn<T>
```

**Returns:**
- `formState`: Current form state (data, errors, touched, isValid, isDirty)
- `updateField`: Update a specific field value
- `setFieldTouched`: Mark a field as touched
- `validateForm`: Validate the entire form
- `validateField`: Validate a specific field
- `resetForm`: Reset form to initial state
- `setFormData`: Update multiple fields at once
- `setInitialFormData`: Update initial data and reset form

### useFormSubmission

Handles form submission with loading states and error handling.

```tsx
function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void>,
  options?: UseFormSubmissionOptions
): UseFormSubmissionReturn<T>
```

**Options:**
- `onSuccess`: Callback for successful submission
- `onError`: Callback for submission errors
- `resetOnSuccess`: Whether to reset form after success
- `showSuccessMessage`: Show success notification
- `showErrorMessage`: Show error notification

**Returns:**
- `submit`: Submit function
- `isSubmitting`: Loading state
- `error`: Current error (if any)
- `isSuccess`: Success state
- `reset`: Reset submission state

## Validation System

### Validation Rules

The system supports various built-in validation rules:

```tsx
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any, formData?: any) => boolean;
}
```

### Common Validation Rules

```tsx
import { commonValidationRules } from '../utils/form-validation';

// Required field
commonValidationRules.required('This field is required')

// String length
commonValidationRules.minLength(5, 'Must be at least 5 characters')
commonValidationRules.maxLength(100, 'Must be no more than 100 characters')

// Numeric range
commonValidationRules.min(0, 'Must be positive')
commonValidationRules.max(1000, 'Must be less than 1000')

// Email format
commonValidationRules.email('Must be a valid email')

// Pattern matching
commonValidationRules.pattern(/^\d{3}-\d{3}-\d{4}$/, 'Must be in format XXX-XXX-XXXX')

// Custom validation
commonValidationRules.custom(
  (value, formData) => value === formData.confirmPassword,
  'Passwords must match'
)
```

### Form-Specific Validators

```tsx
// Account name validation
const accountNameRules = createAccountNameValidation();

// Amount validation
const amountRules = createAmountValidation();

// Date validation
const dateRules = createDateValidation();

// Category name validation
const categoryRules = createCategoryNameValidation();

// Description validation (optional/required)
const descriptionRules = createDescriptionValidation(true); // required
const optionalDescriptionRules = createDescriptionValidation(false); // optional
```

## Form Types

### Base Form Interface

All forms extend the base form interface:

```tsx
interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  validationSchema?: ValidationSchema<T>;
}
```

### Form-Specific Types

Each form has its own data type:

```tsx
// Account form
interface AccountFormData extends Omit<Account, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
}

// Transaction form
interface TransactionFormData extends Omit<Transaction, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  amount: number; // Always positive, sign handled by type
}

// And similar types for other forms...
```

## Best Practices

### Form State Management

1. **Use TypeScript interfaces** for all form data types
2. **Initialize with proper default values** to avoid undefined errors
3. **Handle loading and error states** consistently
4. **Validate on field blur and form submit** for good UX

### Performance Optimization

1. **Use React.memo** for form components to prevent unnecessary re-renders
2. **Implement useCallback** for event handlers
3. **Debounce validation** for better performance during typing
4. **Lazy load** complex form sections when possible

### Accessibility

1. **Provide proper labels** for all form fields
2. **Use ARIA attributes** for screen reader support
3. **Implement keyboard navigation** (Tab, Enter, Escape)
4. **Announce validation errors** to screen readers
5. **Maintain focus management** during form interactions

### Error Handling

1. **Show field-level errors** immediately after validation
2. **Display form-level errors** prominently
3. **Provide clear, actionable error messages**
4. **Allow error recovery** with retry mechanisms

### Validation Strategy

1. **Validate on blur** for immediate feedback
2. **Validate on submit** to catch all errors
3. **Clear errors** when fields become valid
4. **Use debounced validation** for performance

## Migration Guide

### From Legacy Forms

If you're migrating from the old form system, follow these steps:

#### 1. Update Form Component Structure

**Before:**
```tsx
function OldAccountForm({ account, onSave }) {
  const [name, setName] = useState(account?.name || '');
  const [errors, setErrors] = useState({});
  
  const handleSubmit = () => {
    // Manual validation logic
    if (!name) {
      setErrors({ name: 'Required' });
      return;
    }
    onSave({ name });
  };

  return (
    <View>
      <TextInput value={name} onChangeText={setName} />
      {errors.name && <Text>{errors.name}</Text>}
      <Button onPress={handleSubmit} title="Save" />
    </View>
  );
}
```

**After:**
```tsx
function AccountForm({ initialData, onSubmit, onCancel }: BaseFormProps<AccountFormData>) {
  const { formState, updateField, validateForm } = useFormState(
    initialData,
    accountValidationSchema
  );

  const { submit, isSubmitting } = useFormSubmission(onSubmit);

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
      <FormField
        config={{ name: 'name', label: 'Account Name', type: 'text', required: true }}
        value={formState.data.name}
        error={formState.errors.name}
        touched={formState.touched.name}
        onChange={(value) => updateField('name', value)}
      />
    </FormContainer>
  );
}
```

#### 2. Define Validation Schema

Create a validation schema for your form:

```tsx
const accountValidationSchema: ValidationSchema<AccountFormData> = {
  name: [
    commonValidationRules.required('Account name is required'),
    commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
  ],
  type: [
    commonValidationRules.required('Account type is required'),
  ],
  // ... other fields
};
```

#### 3. Update Parent Components

Update components that use the form:

```tsx
// Before
<OldAccountForm account={account} onSave={handleSave} />

// After
<AccountForm
  initialData={account || defaultAccountData}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### Breaking Changes

1. **Form props structure changed** - Use `BaseFormProps<T>` interface
2. **Validation is now schema-based** - Define validation rules upfront
3. **State management is handled by hooks** - No manual state management needed
4. **Error handling is centralized** - Use provided error components

## API Reference

### Components

#### FormContainer
- **Props**: `FormContainerProps`
- **Description**: Main form wrapper with submit/reset functionality
- **Usage**: Wrap all form content

#### FormField
- **Props**: `FormFieldProps<T>`
- **Description**: Flexible field component for various input types
- **Usage**: Individual form fields

#### FormSection
- **Props**: `FormSectionProps`
- **Description**: Groups related fields with optional collapsible behavior
- **Usage**: Organize form layout

### Hooks

#### useFormState
- **Signature**: `useFormState<T>(initialData: T, validationSchema?: ValidationSchema<T>)`
- **Returns**: `UseFormStateReturn<T>`
- **Description**: Manages form state and validation

#### useFormSubmission
- **Signature**: `useFormSubmission<T>(onSubmit: (data: T) => Promise<void>, options?: UseFormSubmissionOptions)`
- **Returns**: `UseFormSubmissionReturn<T>`
- **Description**: Handles form submission with loading states

### Utilities

#### Validation Functions
- `validateField<T>(fieldName: keyof T, value: any, rules: ValidationRule[], formData?: T): ValidationResult`
- `validateForm<T>(formData: T, schema: ValidationSchema<T>): FormValidationResult<T>`
- `executeValidationRule(rule: ValidationRule, value: any, formData?: any): ValidationResult`

#### Common Validation Rules
- `commonValidationRules.required(message?: string): ValidationRule`
- `commonValidationRules.minLength(length: number, message?: string): ValidationRule`
- `commonValidationRules.email(message?: string): ValidationRule`
- And more...

## Examples

### Complex Form with Sections

```tsx
function ComplexForm({ initialData, onSubmit }: BaseFormProps<ComplexFormData>) {
  const { formState, updateField, validateForm } = useFormState(
    initialData,
    complexValidationSchema
  );

  return (
    <FormContainer onSubmit={() => validateForm() && onSubmit(formState.data)}>
      <FormSection title="Personal Information" collapsible>
        <FormField
          config={{ name: 'firstName', label: 'First Name', type: 'text', required: true }}
          value={formState.data.firstName}
          error={formState.errors.firstName}
          touched={formState.touched.firstName}
          onChange={(value) => updateField('firstName', value)}
        />
        <FormField
          config={{ name: 'lastName', label: 'Last Name', type: 'text', required: true }}
          value={formState.data.lastName}
          error={formState.errors.lastName}
          touched={formState.touched.lastName}
          onChange={(value) => updateField('lastName', value)}
        />
      </FormSection>

      <FormSection title="Contact Information" collapsible>
        <FormField
          config={{ name: 'email', label: 'Email', type: 'text', required: true }}
          value={formState.data.email}
          error={formState.errors.email}
          touched={formState.touched.email}
          onChange={(value) => updateField('email', value)}
        />
        <FormField
          config={{ name: 'phone', label: 'Phone', type: 'text' }}
          value={formState.data.phone}
          error={formState.errors.phone}
          touched={formState.touched.phone}
          onChange={(value) => updateField('phone', value)}
        />
      </FormSection>
    </FormContainer>
  );
}
```

### Form with Custom Validation

```tsx
const customValidationSchema: ValidationSchema<CustomFormData> = {
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

### Form with Dynamic Fields

```tsx
function DynamicForm({ initialData, onSubmit }: BaseFormProps<DynamicFormData>) {
  const [fieldCount, setFieldCount] = useState(1);
  const { formState, updateField, validateForm } = useFormState(initialData);

  const addField = () => setFieldCount(prev => prev + 1);
  const removeField = (index: number) => {
    setFieldCount(prev => prev - 1);
    // Remove field data
    const newData = { ...formState.data };
    delete newData[`field${index}`];
    setFormData(newData);
  };

  return (
    <FormContainer onSubmit={() => validateForm() && onSubmit(formState.data)}>
      {Array.from({ length: fieldCount }, (_, index) => (
        <View key={index}>
          <FormField
            config={{
              name: `field${index}`,
              label: `Field ${index + 1}`,
              type: 'text',
            }}
            value={formState.data[`field${index}`] || ''}
            onChange={(value) => updateField(`field${index}`, value)}
          />
          {index > 0 && (
            <Button title="Remove" onPress={() => removeField(index)} />
          )}
        </View>
      ))}
      <Button title="Add Field" onPress={addField} />
    </FormContainer>
  );
}
```

## Troubleshooting

### Common Issues

#### Form Not Validating
**Problem**: Form submits without validation
**Solution**: Ensure `validateForm()` is called before submission and returns `true`

```tsx
const handleSubmit = async () => {
  if (!validateForm()) {
    return; // Don't submit if validation fails
  }
  await submit(formState.data);
};
```

#### Field Values Not Updating
**Problem**: Field values don't update when typing
**Solution**: Ensure `onChange` is properly connected to `updateField`

```tsx
<FormField
  // ... other props
  onChange={(value) => updateField('fieldName', value)} // Correct
  // onChange={updateField} // Incorrect - missing field name
/>
```

#### Validation Errors Not Clearing
**Problem**: Errors persist after fixing field values
**Solution**: Ensure validation runs on field updates

```tsx
const { formState, updateField } = useFormState(initialData, validationSchema);
// Validation should run automatically when updateField is called
```

#### Performance Issues
**Problem**: Form re-renders too frequently
**Solution**: Use React.memo and useCallback for optimization

```tsx
const MemoizedFormField = React.memo(FormField);

const handleFieldChange = useCallback((field: string, value: any) => {
  updateField(field, value);
}, [updateField]);
```

#### TypeScript Errors
**Problem**: Type errors with form data
**Solution**: Ensure proper type definitions

```tsx
// Define proper interface
interface MyFormData {
  name: string;
  email: string;
  age: number;
}

// Use with hooks
const { formState } = useFormState<MyFormData>(initialData, schema);
```

### Performance Tips

1. **Memoize form components** to prevent unnecessary re-renders
2. **Use debounced validation** for fields with complex validation
3. **Lazy load form sections** that aren't immediately visible
4. **Optimize validation schemas** by ordering rules from fastest to slowest

### Debugging

Enable form debugging by setting the environment variable:
```
REACT_APP_FORM_DEBUG=true
```

This will log form state changes and validation results to the console.

## Contributing

When contributing to the form system:

1. **Follow TypeScript best practices** - Use strict typing
2. **Write comprehensive tests** - Unit, integration, and accessibility tests
3. **Update documentation** - Keep this guide current
4. **Follow accessibility guidelines** - Ensure WCAG compliance
5. **Performance test** - Verify forms perform well with large datasets

## Support

For questions or issues with the form system:

1. Check this documentation first
2. Look at existing form implementations for examples
3. Check the troubleshooting section
4. Review the test files for usage patterns
5. Create an issue with detailed reproduction steps

---

*Last updated: January 2024*