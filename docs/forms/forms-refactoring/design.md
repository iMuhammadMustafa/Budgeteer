# Design Document

## Overview

This design outlines a comprehensive refactoring approach for the Budgeteer application's form components. The refactoring will establish consistent patterns, improve type safety, enhance error handling, and create reusable abstractions while maintaining backward compatibility with existing functionality.

The current forms exhibit several issues:
- Inconsistent state management patterns
- Duplicated validation and submission logic
- Mixed error handling approaches
- Varying prop interfaces and naming conventions
- Performance optimization opportunities
- Accessibility gaps

## Architecture

### Form Architecture Layers

```
┌─────────────────────────────────────────┐
│           Form Components               │
│  (AccountForm, TransactionForm, etc.)   │
├─────────────────────────────────────────┤
│           Custom Hooks Layer            │
│     (useFormState, useFormValidation)   │
├─────────────────────────────────────────┤
│         Shared Components Layer         │
│    (FormField, FormSection, etc.)       │
├─────────────────────────────────────────┤
│           Utilities Layer               │
│   (validation, formatting, types)       │
└─────────────────────────────────────────┘
```

### Core Design Principles

1. **Consistency**: All forms follow the same structural patterns
2. **Reusability**: Common logic extracted into hooks and components
3. **Type Safety**: Strict TypeScript interfaces throughout
4. **Performance**: Optimized re-renders and memory usage
5. **Accessibility**: WCAG compliant form interactions
6. **Maintainability**: Clear separation of concerns

## Components and Interfaces

### 1. Base Form Types and Interfaces

```typescript
// Base form interfaces
interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  validationSchema?: ValidationSchema<T>;
}

interface FormFieldConfig<T> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  options?: OptionItem[]; // For select fields
}

interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}
```

### 2. Custom Hooks

#### useFormState Hook
```typescript
function useFormState<T>(
  initialData: T,
  validationSchema?: ValidationSchema<T>
): {
  formState: FormState<T>;
  updateField: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  setFormData: (data: Partial<T>) => void;
}
```

#### useFormSubmission Hook
```typescript
function useFormSubmission<T>(
  onSubmit: (data: T) => Promise<void>,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    resetOnSuccess?: boolean;
  }
): {
  submit: (data: T) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}
```

### 3. Enhanced Form Components

#### FormContainer Component
```typescript
interface FormContainerProps {
  children: React.ReactNode;
  onSubmit: () => void;
  isValid: boolean;
  isLoading: boolean;
  submitLabel?: string;
  showReset?: boolean;
  onReset?: () => void;
}
```

#### FormField Component
```typescript
interface FormFieldProps<T> {
  config: FormFieldConfig<T>;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (value: any) => void;
  onBlur?: () => void;
}
```

#### FormSection Component
```typescript
interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}
```

### 4. Validation System

#### Validation Schema Structure
```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule[];
}
```

#### Built-in Validators
- Required field validation
- String length validation
- Numeric range validation
- Email format validation
- Custom validation functions

## Data Models

### Form-Specific Types

```typescript
// Enhanced form types with validation
interface AccountFormData extends Omit<Account, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  // Add computed fields if needed
  running_balance?: number | null;
}

interface TransactionFormData extends Omit<Transaction, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  amount: number; // Always positive, sign handled by mode
}

// Form configuration types
interface FormConfig<T> {
  fields: FormFieldConfig<T>[];
  sections?: FormSectionConfig[];
  validation: ValidationSchema<T>;
  layout: 'single-column' | 'two-column' | 'responsive';
}
```

### Error Handling Types

```typescript
interface FormError {
  field?: string;
  message: string;
  type: 'validation' | 'submission' | 'network';
}

interface FormErrorState {
  errors: FormError[];
  hasErrors: boolean;
  getFieldError: (field: string) => string | undefined;
}
```

## Error Handling

### Error Handling Strategy

1. **Client-Side Validation**: Real-time validation with immediate feedback
2. **Server-Side Error Handling**: Graceful handling of API errors
3. **Network Error Recovery**: Retry mechanisms and offline support
4. **User-Friendly Messages**: Clear, actionable error messages

### Error Display Patterns

```typescript
// Error display components
interface ErrorMessageProps {
  error: string;
  type?: 'field' | 'form' | 'global';
}

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{error: Error}>;
  onError?: (error: Error) => void;
}
```

### Error Recovery Mechanisms

- Automatic retry for network failures
- Form state preservation during errors
- Progressive enhancement for offline scenarios
- Graceful degradation for validation failures

## Testing Strategy

### Unit Testing Approach

1. **Hook Testing**: Test custom hooks in isolation
2. **Component Testing**: Test form components with various props
3. **Integration Testing**: Test form submission flows
4. **Validation Testing**: Test all validation rules and edge cases

### Test Structure

```typescript
// Example test structure
describe('useFormState', () => {
  it('should initialize with correct default state');
  it('should update field values correctly');
  it('should validate fields on change');
  it('should handle form reset');
});

describe('AccountForm', () => {
  it('should render all required fields');
  it('should validate form on submission');
  it('should handle submission success');
  it('should handle submission errors');
});
```

### Testing Tools and Utilities

- React Testing Library for component testing
- Jest for unit testing
- MSW (Mock Service Worker) for API mocking
- Custom test utilities for form testing patterns

## Performance Optimizations

### Re-render Optimization

1. **Memoization Strategy**: Use React.memo for form components
2. **Callback Optimization**: Use useCallback for event handlers
3. **State Segmentation**: Split form state to minimize re-renders
4. **Field-Level Updates**: Update only changed fields

### Memory Management

1. **Cleanup Patterns**: Proper cleanup of subscriptions and timers
2. **Lazy Loading**: Load form sections and validation rules on demand
3. **Debounced Validation**: Debounce validation for better performance
4. **Efficient Data Structures**: Use efficient data structures for form state

### Bundle Size Optimization

1. **Tree Shaking**: Ensure unused validation rules are tree-shaken
2. **Code Splitting**: Split form components by route
3. **Lazy Imports**: Lazy load complex form components
4. **Shared Dependencies**: Maximize sharing of common dependencies

## Accessibility Enhancements

### WCAG Compliance

1. **Keyboard Navigation**: Full keyboard accessibility
2. **Screen Reader Support**: Proper ARIA labels and descriptions
3. **Focus Management**: Logical focus order and focus indicators
4. **Error Announcements**: Screen reader announcements for errors

### Accessibility Features

```typescript
// Accessibility props interface
interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  role?: string;
}
```

### Implementation Details

- Semantic HTML elements
- Proper form labeling
- Error message association
- Focus management during validation
- High contrast mode support

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
- Create base types and interfaces
- Implement core custom hooks
- Set up validation system
- Create shared form components

### Phase 2: Simple Forms (Week 3)
- Refactor ConfigurationForm (simplest)
- Refactor AccountCategoryForm
- Refactor TransactionGroupForm

### Phase 3: Complex Forms (Week 4-5)
- Refactor TransactionCategoryForm
- Refactor AccountForm
- Refactor TransactionForm

### Phase 4: Advanced Forms (Week 6)
- Refactor MultipleTransactions (most complex)
- Performance optimization
- Accessibility audit

### Phase 5: Testing and Polish (Week 7)
- Comprehensive testing
- Documentation updates
- Performance monitoring
- Bug fixes and refinements

## Backward Compatibility

### Compatibility Strategy

1. **Gradual Migration**: Migrate forms one at a time
2. **Interface Preservation**: Maintain existing prop interfaces during transition
3. **Feature Parity**: Ensure all existing functionality is preserved
4. **Fallback Mechanisms**: Provide fallbacks for edge cases

### Migration Checklist

- [ ] All existing props supported
- [ ] All existing functionality preserved
- [ ] Performance maintained or improved
- [ ] No breaking changes to parent components
- [ ] Comprehensive test coverage