# Form Development Guidelines

## Overview

This document provides comprehensive guidelines for developing forms in the Budgeteer application. It covers coding standards, architectural patterns, testing requirements, and quality assurance practices specific to the form system.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing Requirements](#testing-requirements)
- [Performance Guidelines](#performance-guidelines)
- [Accessibility Requirements](#accessibility-requirements)
- [Security Guidelines](#security-guidelines)
- [Review Process](#review-process)
- [Quality Assurance](#quality-assurance)

## Development Workflow

### 1. Planning Phase

Before starting form development:

1. **Define Requirements**
   - Identify all form fields and their types
   - Determine validation rules
   - Specify user interactions and workflows
   - Document accessibility requirements

2. **Design Data Model**
   - Create TypeScript interfaces for form data
   - Define validation schemas
   - Plan error handling strategies

3. **Create Technical Specification**
   - Document component structure
   - Define props interfaces
   - Plan testing approach

### 2. Implementation Phase

Follow this order for implementation:

1. **Types and Interfaces** (First)
   ```tsx
   // Define form data interface
   interface MyFormData {
     field1: string;
     field2: number;
     // ... other fields
   }
   
   // Define validation schema
   const validationSchema: ValidationSchema<MyFormData> = {
     // ... validation rules
   };
   ```

2. **Form Component** (Second)
   ```tsx
   function MyForm({ initialData, onSubmit }: BaseFormProps<MyFormData>) {
     // Implementation
   }
   ```

3. **Tests** (Third)
   - Unit tests for validation
   - Component tests for rendering
   - Integration tests for workflows

4. **Documentation** (Fourth)
   - Update API documentation
   - Add usage examples
   - Document any special considerations

### 3. Review and Testing Phase

1. **Self Review**
   - Run all tests
   - Check TypeScript compilation
   - Verify accessibility compliance
   - Test performance

2. **Code Review**
   - Submit pull request
   - Address review feedback
   - Ensure all checks pass

3. **Quality Assurance**
   - Manual testing
   - Cross-platform verification
   - Performance validation

## Code Standards

### File Organization

```
src/components/forms/
├── __tests__/
│   ├── MyForm.test.tsx
│   ├── MyForm.integration.test.tsx
│   └── MyForm.accessibility.test.tsx
├── MyForm.tsx
└── index.ts
```

### Naming Conventions

```tsx
// ✅ Good: Descriptive, consistent naming
interface AccountFormData { }
function AccountForm() { }
const accountValidationSchema: ValidationSchema<AccountFormData> = { };

// ❌ Bad: Abbreviated, inconsistent naming
interface AccData { }
function AccForm() { }
const accSchema = { };
```

### Import Organization

```tsx
// ✅ Good: Organized imports
// React imports first
import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';

// Third-party imports
import dayjs from 'dayjs';

// Internal imports (grouped by type)
import { BaseFormProps, ValidationSchema } from '@/types/components/forms.types';
import { useFormState, useFormSubmission } from '@/components/hooks';
import { FormContainer, FormField } from '@/components/forms';
import { commonValidationRules } from '@/utils/form-validation';

// ❌ Bad: Unorganized imports
import { FormContainer } from '@/components/forms';
import React from 'react';
import { useFormState } from '@/components/hooks';
import { View } from 'react-native';
```

### Component Structure

```tsx
// ✅ Good: Consistent component structure
interface MyFormProps extends BaseFormProps<MyFormData> {
  // Additional props if needed
}

function MyForm({ initialData, onSubmit, onCancel }: MyFormProps) {
  // 1. Hooks (in order of dependency)
  const { formState, updateField, validateForm } = useFormState(
    initialData,
    validationSchema
  );
  
  const { submit, isSubmitting, error } = useFormSubmission(onSubmit);
  
  // 2. Memoized values
  const fieldConfigs = useMemo(() => ({
    // Field configurations
  }), []);
  
  // 3. Event handlers (memoized)
  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      await submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);
  
  const handleFieldChange = useCallback((field: keyof MyFormData) => 
    (value: any) => updateField(field, value)
  , [updateField]);
  
  // 4. Render
  return (
    <FormContainer
      onSubmit={handleSubmit}
      isValid={formState.isValid}
      isLoading={isSubmitting}
    >
      {/* Form fields */}
    </FormContainer>
  );
}

// 5. Export
export default React.memo(MyForm);
```

### TypeScript Standards

```tsx
// ✅ Good: Strict typing
interface FormData {
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

function MyForm({ initialData }: BaseFormProps<FormData>) {
  const { formState } = useFormState<FormData>(initialData, schema);
  // Type is inferred correctly
}

// ❌ Bad: Loose typing
function MyForm({ initialData }: { initialData: any }) {
  const { formState } = useFormState(initialData as any, schema);
  // No type safety
}
```

## Architecture Guidelines

### Component Hierarchy

```
FormContainer (Layout & Submission)
├── FormSection (Grouping)
│   ├── FormField (Individual Fields)
│   └── FormField
├── FormSection
│   └── FormField
└── ErrorSummary (Error Display)
```

### State Management

```tsx
// ✅ Good: Use provided hooks
function MyForm({ initialData }: FormProps) {
  const { formState, updateField } = useFormState(initialData, schema);
  const { submit, isSubmitting } = useFormSubmission(onSubmit);
  
  // Form logic using hooks
}

// ❌ Bad: Manual state management
function MyForm({ initialData }: FormProps) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Manual validation and submission logic
}
```

### Validation Strategy

```tsx
// ✅ Good: Schema-based validation
const validationSchema: ValidationSchema<FormData> = {
  name: [
    commonValidationRules.required('Name is required'),
    commonValidationRules.minLength(2, 'Name too short'),
  ],
  email: [
    commonValidationRules.required('Email is required'),
    commonValidationRules.email('Invalid email format'),
  ],
};

// ❌ Bad: Manual validation
function validateForm(data: FormData) {
  const errors: any = {};
  if (!data.name) errors.name = 'Name is required';
  if (!data.email) errors.email = 'Email is required';
  return errors;
}
```

### Error Handling

```tsx
// ✅ Good: Comprehensive error handling
function MyForm({ initialData, onSubmit }: FormProps) {
  const { formState } = useFormState(initialData, schema);
  const { submit, isSubmitting, error } = useFormSubmission(onSubmit, {
    onError: (error) => {
      // Log error for debugging
      console.error('Form submission failed:', error);
      
      // Show user-friendly message
      if (error.name === 'NetworkError') {
        showNotification('Network error. Please check your connection.');
      } else {
        showNotification('An error occurred. Please try again.');
      }
    },
  });

  return (
    <FormContainer>
      {/* Form fields */}
      
      {/* Field-level errors */}
      {formState.errors.name && (
        <ErrorMessage error={formState.errors.name} type="field" />
      )}
      
      {/* Form-level errors */}
      {error && (
        <ErrorMessage 
          error={error.message} 
          type="form"
          onRetry={() => submit(formState.data)}
        />
      )}
      
      {/* Error summary for accessibility */}
      {Object.keys(formState.errors).length > 0 && (
        <ErrorSummary errors={formState.errors} />
      )}
    </FormContainer>
  );
}
```

## Testing Requirements

### Test Coverage Requirements

- **Unit Tests**: 90%+ coverage for all form components
- **Integration Tests**: All user workflows covered
- **Accessibility Tests**: WCAG compliance verified
- **Performance Tests**: Render and validation benchmarks

### Test Structure

```tsx
describe('MyForm', () => {
  // Test data setup
  const defaultProps = {
    initialData: {} as MyFormData,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all required fields', () => {
      // Test rendering
    });

    it('should display initial data correctly', () => {
      // Test data display
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      // Test validation
    });

    it('should clear errors when fields become valid', () => {
      // Test error clearing
    });
  });

  describe('Submission', () => {
    it('should submit valid form data', () => {
      // Test submission
    });

    it('should handle submission errors', () => {
      // Test error handling
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Test accessibility
    });

    it('should support keyboard navigation', () => {
      // Test keyboard support
    });
  });

  describe('Performance', () => {
    it('should render within performance threshold', () => {
      // Test performance
    });
  });
});
```

### Required Test Types

1. **Unit Tests**
   - Component rendering
   - Validation logic
   - Event handling
   - State management

2. **Integration Tests**
   - Complete form workflows
   - Service integration
   - Error scenarios

3. **Accessibility Tests**
   - WCAG compliance
   - Screen reader support
   - Keyboard navigation

4. **Performance Tests**
   - Render time benchmarks
   - Memory usage
   - Large form handling

## Performance Guidelines

### Optimization Requirements

- **Initial Render**: < 100ms for simple forms, < 200ms for complex forms
- **Field Updates**: < 10ms per field update
- **Validation**: < 50ms for complete form validation
- **Memory**: No memory leaks, efficient cleanup

### Implementation Patterns

```tsx
// ✅ Good: Optimized component
const MyForm = React.memo(({ initialData, onSubmit }: FormProps) => {
  const { formState, updateField } = useFormState(initialData, schema);
  
  // Memoized field configurations
  const fieldConfigs = useMemo(() => ({
    name: { name: 'name', label: 'Name', type: 'text' },
    email: { name: 'email', label: 'Email', type: 'text' },
  }), []);
  
  // Memoized event handlers
  const handleFieldChange = useCallback((field: keyof FormData) => 
    (value: any) => updateField(field, value)
  , [updateField]);
  
  return (
    <FormContainer>
      <FormField
        config={fieldConfigs.name}
        value={formState.data.name}
        onChange={handleFieldChange('name')}
      />
    </FormContainer>
  );
});

// ❌ Bad: Unoptimized component
function MyForm({ initialData, onSubmit }: FormProps) {
  const { formState, updateField } = useFormState(initialData, schema);
  
  return (
    <FormContainer>
      <FormField
        config={{ name: 'name', label: 'Name', type: 'text' }} // New object every render
        value={formState.data.name}
        onChange={(value) => updateField('name', value)} // New function every render
      />
    </FormContainer>
  );
}
```

### Performance Monitoring

```tsx
// Add performance monitoring to forms
function MyForm({ initialData, onSubmit }: FormProps) {
  const { measureRender, recordMetrics } = useFormPerformanceMonitor('MyForm');
  
  useEffect(() => {
    const endMeasurement = measureRender();
    return () => {
      const renderTime = endMeasurement();
      recordMetrics({ renderTime });
    };
  });
  
  // Rest of component
}
```

## Accessibility Requirements

### WCAG Compliance

All forms must meet WCAG 2.1 AA standards:

- **Perceivable**: Clear labels, sufficient contrast, scalable text
- **Operable**: Keyboard navigation, no seizure-inducing content
- **Understandable**: Clear instructions, consistent navigation
- **Robust**: Compatible with assistive technologies

### Implementation Checklist

```tsx
// ✅ Required accessibility features
function AccessibleForm({ initialData, onSubmit }: FormProps) {
  return (
    <FormContainer>
      <FormField
        config={{
          name: 'name',
          label: 'Full Name', // ✅ Clear label
          type: 'text',
          required: true, // ✅ Required indication
          description: 'Enter your legal name', // ✅ Help text
        }}
        value={formState.data.name}
        error={formState.errors.name} // ✅ Error association
        touched={formState.touched.name}
        onChange={handleChange}
        onBlur={handleBlur} // ✅ Blur handling
      />
      
      {/* ✅ Error summary for screen readers */}
      {Object.keys(formState.errors).length > 0 && (
        <ErrorSummary 
          errors={formState.errors}
          onFieldFocus={focusField} // ✅ Focus management
        />
      )}
    </FormContainer>
  );
}
```

### Testing Accessibility

```tsx
// Required accessibility tests
describe('Form Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    const { getByLabelText } = render(<MyForm {...props} />);
    
    const nameInput = getByLabelText('Full Name');
    expect(nameInput).toHaveProp('accessibilityRequired', true);
    expect(nameInput).toHaveProp('accessibilityLabel', 'Full Name');
  });

  it('should announce validation errors', async () => {
    const { getByText } = render(<MyForm {...props} />);
    
    fireEvent.press(getByText('Submit'));
    
    await waitFor(() => {
      const errorElement = getByText('Name is required');
      expect(errorElement).toHaveProp('accessibilityLiveRegion', 'assertive');
    });
  });
});
```

## Security Guidelines

### Input Validation

```tsx
// ✅ Good: Comprehensive validation
const secureValidationSchema: ValidationSchema<FormData> = {
  name: [
    commonValidationRules.required('Name is required'),
    commonValidationRules.maxLength(100, 'Name too long'),
    commonValidationRules.custom(
      (value) => !/<script|javascript:|on\w+=/i.test(value),
      'Name contains invalid characters'
    ),
  ],
  amount: [
    commonValidationRules.required('Amount is required'),
    commonValidationRules.custom(
      (value) => typeof value === 'number' && Number.isFinite(value),
      'Amount must be a valid number'
    ),
    commonValidationRules.min(0.01, 'Amount must be positive'),
    commonValidationRules.max(999999999.99, 'Amount exceeds limit'),
  ],
};
```

### Data Sanitization

```tsx
// ✅ Good: Input sanitization
const sanitizeInput = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

// Use in form submission
const handleSubmit = useCallback(async () => {
  const sanitizedData = {
    ...formState.data,
    name: sanitizeInput(formState.data.name),
    description: sanitizeInput(formState.data.description || ''),
  };
  
  if (validateForm()) {
    await submit(sanitizedData);
  }
}, [formState.data, validateForm, submit]);
```

### Security Testing

```tsx
// Required security tests
describe('Form Security', () => {
  it('should prevent XSS attacks', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    
    const { getByLabelText } = render(<MyForm {...props} />);
    const nameInput = getByLabelText('Name');
    
    fireEvent.changeText(nameInput, maliciousInput);
    
    // Should be sanitized or rejected
    expect(nameInput.props.value).not.toContain('<script>');
  });

  it('should validate data types strictly', () => {
    const { getByLabelText } = render(<MyForm {...props} />);
    const amountInput = getByLabelText('Amount');
    
    fireEvent.changeText(amountInput, 'not-a-number');
    
    // Should show validation error
    expect(getByText('Amount must be a valid number')).toBeTruthy();
  });
});
```

## Review Process

### Code Review Checklist

#### Functionality
- [ ] All form fields work correctly
- [ ] Validation triggers appropriately
- [ ] Submission handles success/error cases
- [ ] Form reset functionality works
- [ ] Loading states display correctly

#### Code Quality
- [ ] TypeScript types are strict and accurate
- [ ] Components are properly memoized
- [ ] Event handlers use useCallback
- [ ] No unused imports or variables
- [ ] Consistent naming conventions

#### Performance
- [ ] Initial render time is acceptable
- [ ] No unnecessary re-renders
- [ ] Memory usage is efficient
- [ ] Large forms remain responsive

#### Accessibility
- [ ] All fields have proper labels
- [ ] ARIA attributes are correct
- [ ] Keyboard navigation works
- [ ] Error announcements function
- [ ] Focus management is proper

#### Security
- [ ] Input validation is comprehensive
- [ ] XSS prevention is implemented
- [ ] Data sanitization is applied
- [ ] Type validation is strict

#### Testing
- [ ] Unit test coverage > 90%
- [ ] Integration tests cover workflows
- [ ] Accessibility tests pass
- [ ] Performance benchmarks met

### Review Process Steps

1. **Automated Checks**
   - TypeScript compilation
   - ESLint rules
   - Test coverage
   - Performance benchmarks

2. **Manual Review**
   - Code quality assessment
   - Architecture compliance
   - Security review
   - Accessibility check

3. **Testing Verification**
   - Run all test suites
   - Manual testing
   - Cross-platform verification

4. **Documentation Review**
   - API documentation updated
   - Usage examples provided
   - Migration notes added

## Quality Assurance

### Definition of Done

A form is considered complete when:

- [ ] All functional requirements implemented
- [ ] TypeScript compilation passes with no errors
- [ ] All tests pass with required coverage
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Security review completed
- [ ] Code review approved
- [ ] Documentation updated

### Quality Metrics

Track these metrics for each form:

- **Code Quality**: TypeScript errors, ESLint warnings, complexity
- **Performance**: Render time, memory usage, validation speed
- **Accessibility**: WCAG compliance score, keyboard navigation
- **Security**: Vulnerability scan results, input validation coverage
- **Testing**: Unit test coverage, integration test coverage

### Continuous Monitoring

```tsx
// Add monitoring to production forms
function MonitoredForm({ initialData, onSubmit }: FormProps) {
  const { recordMetrics } = useFormPerformanceMonitor('ProductionForm');
  
  useEffect(() => {
    // Record usage metrics
    recordMetrics({
      formLoaded: Date.now(),
      initialDataSize: JSON.stringify(initialData).length,
    });
  }, [initialData, recordMetrics]);
  
  // Rest of component
}
```

### Error Tracking

```tsx
// Add error tracking
function TrackedForm({ initialData, onSubmit }: FormProps) {
  const { submit, error } = useFormSubmission(onSubmit, {
    onError: (error) => {
      // Track errors in production
      analytics.track('form_error', {
        formName: 'MyForm',
        errorType: error.name,
        errorMessage: error.message,
        timestamp: Date.now(),
      });
    },
  });
  
  // Rest of component
}
```

## Conclusion

Following these guidelines ensures:

- **Consistent Quality**: All forms meet the same high standards
- **Maintainability**: Code is easy to understand and modify
- **Performance**: Forms are fast and responsive
- **Accessibility**: All users can interact with forms effectively
- **Security**: Forms are protected against common vulnerabilities
- **Reliability**: Comprehensive testing catches issues early

Remember to:
1. Always start with proper planning and design
2. Follow TypeScript best practices strictly
3. Implement comprehensive testing
4. Ensure accessibility compliance
5. Monitor performance continuously
6. Keep security in mind throughout development

---

*Development guidelines last updated: January 2024*