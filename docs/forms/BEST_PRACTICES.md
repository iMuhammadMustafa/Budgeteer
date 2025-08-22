# Form Development Best Practices

## Overview

This guide outlines best practices for developing forms using the Budgeteer form system. Following these practices ensures consistent, performant, accessible, and maintainable forms across the application.

## Table of Contents

- [Code Organization](#code-organization)
- [Type Safety](#type-safety)
- [State Management](#state-management)
- [Validation](#validation)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Security](#security)
- [Internationalization](#internationalization)

## Code Organization

### File Structure

Organize form-related files consistently:

```
src/
├── components/
│   └── forms/
│       ├── __tests__/
│       │   ├── AccountForm.test.tsx
│       │   ├── integration.test.tsx
│       │   └── accessibility.test.tsx
│       ├── AccountForm.tsx
│       ├── TransactionForm.tsx
│       └── index.ts
├── types/
│   └── components/
│       └── forms.types.ts
├── utils/
│   ├── form-validation.ts
│   └── form-schemas.ts
└── docs/
    └── forms/
        ├── README.md
        ├── MIGRATION_GUIDE.md
        └── BEST_PRACTICES.md
```

### Component Naming

Use consistent naming conventions:

```tsx
// ✅ Good: Descriptive, follows pattern
AccountForm.tsx
TransactionCategoryForm.tsx
MultipleTransactionsForm.tsx

// ❌ Bad: Inconsistent, unclear
AccForm.tsx
TxnCat.tsx
MultiTrans.tsx
```

### Export Patterns

Use consistent export patterns:

```tsx
// ✅ Good: Named export with type
export interface AccountFormProps extends BaseFormProps<AccountFormData> {}

export function AccountForm({ initialData, onSubmit, onCancel }: AccountFormProps) {
  // Implementation
}

// ✅ Good: Default export for main component
export default AccountForm;

// ✅ Good: Re-export from index
export { AccountForm } from './AccountForm';
export type { AccountFormProps, AccountFormData } from './AccountForm';
```

## Type Safety

### Strict TypeScript Configuration

Use strict TypeScript settings:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Form Data Interfaces

Define comprehensive form data interfaces:

```tsx
// ✅ Good: Complete interface with proper types
interface AccountFormData extends Omit<Account, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  name: string;
  type: AccountType;
  categoryid: string;
  balance: number;
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
}

// ❌ Bad: Loose typing
interface AccountFormData {
  [key: string]: any;
}
```

### Generic Type Usage

Use generics properly for reusable components:

```tsx
// ✅ Good: Proper generic usage
interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
}

function useFormState<T>(
  initialData: T,
  validationSchema?: ValidationSchema<T>
): UseFormStateReturn<T> {
  // Implementation
}

// ❌ Bad: No generics, loses type safety
interface BaseFormProps {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
}
```

### Type Guards

Use type guards for runtime type checking:

```tsx
// ✅ Good: Type guard for validation
function isValidAccountType(value: string): value is AccountType {
  return ['checking', 'savings', 'credit', 'investment'].includes(value);
}

// Usage in validation
const validateAccountType = (value: string): boolean => {
  return isValidAccountType(value);
};
```

## State Management

### Hook Usage Patterns

Use hooks consistently and efficiently:

```tsx
// ✅ Good: Proper hook usage
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const { formState, updateField, validateForm, resetForm } = useFormState(
    initialData,
    accountValidationSchema
  );

  const { submit, isSubmitting, error } = useFormSubmission(onSubmit, {
    onSuccess: () => showSuccessMessage('Account saved successfully!'),
    resetOnSuccess: false,
  });

  // Memoized handlers
  const handleFieldChange = useCallback((field: keyof AccountFormData, value: any) => {
    updateField(field, value);
  }, [updateField]);

  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      await submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);

  // Component JSX
}

// ❌ Bad: Inefficient hook usage
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  // Creating new objects on every render
  const { formState, updateField } = useFormState(initialData, {
    name: [{ type: 'required', message: 'Required' }], // New object every render
  });

  // No memoization
  const handleSubmit = () => {
    if (validateForm()) {
      submit(formState.data);
    }
  };
}
```

### State Updates

Handle state updates efficiently:

```tsx
// ✅ Good: Batch updates when possible
const handleBulkUpdate = useCallback((updates: Partial<AccountFormData>) => {
  setFormData(updates);
}, [setFormData]);

// ✅ Good: Optimistic updates for better UX
const handleFieldChange = useCallback((field: string, value: any) => {
  updateField(field, value);
  // Validation happens automatically
}, [updateField]);

// ❌ Bad: Multiple individual updates
const handleBulkUpdate = (updates: Partial<AccountFormData>) => {
  Object.entries(updates).forEach(([key, value]) => {
    updateField(key, value); // Multiple re-renders
  });
};
```

### Initial Data Handling

Handle initial data properly:

```tsx
// ✅ Good: Proper default values
const defaultAccountData: AccountFormData = {
  name: '',
  type: 'checking',
  categoryid: '',
  balance: 0,
  runningbalance: null,
  openBalance: null,
  addAdjustmentTransaction: false,
};

function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const formData = useMemo(() => ({
    ...defaultAccountData,
    ...initialData,
  }), [initialData]);

  const { formState } = useFormState(formData, validationSchema);
}

// ❌ Bad: No defaults, potential undefined errors
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const { formState } = useFormState(initialData || {}, validationSchema);
  // Fields might be undefined
}
```

## Validation

### Schema Definition

Define comprehensive validation schemas:

```tsx
// ✅ Good: Complete validation schema
const accountValidationSchema: ValidationSchema<AccountFormData> = {
  name: [
    commonValidationRules.required('Account name is required'),
    commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
    commonValidationRules.maxLength(100, 'Name must be no more than 100 characters'),
    commonValidationRules.custom(
      (value) => !value.includes('<script>'),
      'Name contains invalid characters'
    ),
  ],
  type: [
    commonValidationRules.required('Account type is required'),
    commonValidationRules.custom(
      (value) => isValidAccountType(value),
      'Please select a valid account type'
    ),
  ],
  balance: [
    commonValidationRules.required('Initial balance is required'),
    commonValidationRules.custom(
      (value) => typeof value === 'number' && !isNaN(value),
      'Balance must be a valid number'
    ),
  ],
};

// ❌ Bad: Minimal validation
const accountValidationSchema: ValidationSchema<AccountFormData> = {
  name: [{ type: 'required', message: 'Required' }],
};
```

### Custom Validation Rules

Create reusable custom validation rules:

```tsx
// ✅ Good: Reusable validation utilities
export const createUniqueNameValidator = (
  existingNames: string[],
  currentName?: string
) => commonValidationRules.custom(
  (value: string) => {
    if (!value) return true; // Let required validator handle empty
    if (currentName && value === currentName) return true; // Allow current name
    return !existingNames.includes(value);
  },
  'Name already exists'
);

export const createAmountRangeValidator = (min: number, max: number) => [
  commonValidationRules.min(min, `Amount must be at least ${min}`),
  commonValidationRules.max(max, `Amount must be no more than ${max}`),
];

// Usage
const validationSchema: ValidationSchema<AccountFormData> = {
  name: [
    ...createAccountNameValidation(),
    createUniqueNameValidator(existingAccountNames, initialData.name),
  ],
  balance: [
    ...createAmountValidation(),
    ...createAmountRangeValidator(0, 1000000),
  ],
};
```

### Validation Timing

Implement appropriate validation timing:

```tsx
// ✅ Good: Strategic validation timing
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const { formState, updateField, validateField, validateForm } = useFormState(
    initialData,
    validationSchema
  );

  // Validate on blur for immediate feedback
  const handleFieldBlur = useCallback((field: keyof AccountFormData) => {
    if (formState.touched[field]) {
      validateField(field);
    }
  }, [formState.touched, validateField]);

  // Validate on change for fields that were previously invalid
  const handleFieldChange = useCallback((field: keyof AccountFormData, value: any) => {
    updateField(field, value);
    
    // If field had error, validate immediately to clear it
    if (formState.errors[field]) {
      setTimeout(() => validateField(field), 0);
    }
  }, [updateField, formState.errors, validateField]);

  // Always validate before submission
  const handleSubmit = useCallback(async () => {
    if (validateForm()) {
      await submit(formState.data);
    }
  }, [validateForm, submit, formState.data]);
}
```

## Performance

### Component Memoization

Use React.memo strategically:

```tsx
// ✅ Good: Memoize expensive components
const FormField = React.memo<FormFieldProps<any>>(
  ({ config, value, error, touched, onChange, onBlur }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison for complex props
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.touched === nextProps.touched &&
      JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
    );
  }
);

// ✅ Good: Memoize form sections
const FormSection = React.memo<FormSectionProps>(({ title, children, collapsible }) => {
  // Implementation
});
```

### Callback Optimization

Use useCallback for event handlers:

```tsx
// ✅ Good: Memoized callbacks
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const { formState, updateField } = useFormState(initialData, validationSchema);

  const handleNameChange = useCallback((value: string) => {
    updateField('name', value);
  }, [updateField]);

  const handleTypeChange = useCallback((value: string) => {
    updateField('type', value);
  }, [updateField]);

  // Generic handler with useCallback
  const handleFieldChange = useCallback((field: keyof AccountFormData) => 
    (value: any) => updateField(field, value)
  , [updateField]);

  return (
    <FormContainer>
      <FormField
        config={{ name: 'name', label: 'Name', type: 'text' }}
        value={formState.data.name}
        onChange={handleNameChange}
      />
    </FormContainer>
  );
}
```

### Debounced Validation

Implement debounced validation for expensive operations:

```tsx
// ✅ Good: Debounced validation for async checks
function useAsyncValidation<T>(
  formData: T,
  asyncValidators: Record<keyof T, (value: any) => Promise<boolean>>,
  delay = 500
) {
  const [asyncErrors, setAsyncErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const debouncedValidate = useMemo(
    () => debounce(async (field: keyof T, value: any) => {
      try {
        const isValid = await asyncValidators[field]?.(value);
        if (!isValid) {
          setAsyncErrors(prev => ({
            ...prev,
            [field]: 'Validation failed',
          }));
        } else {
          setAsyncErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      } catch (error) {
        setAsyncErrors(prev => ({
          ...prev,
          [field]: 'Validation error occurred',
        }));
      }
    }, delay),
    [asyncValidators, delay]
  );

  return { asyncErrors, debouncedValidate };
}
```

### Lazy Loading

Implement lazy loading for large forms:

```tsx
// ✅ Good: Lazy load form sections
const LazyAdvancedSection = React.lazy(() => import('./AdvancedFormSection'));

function ComplexForm({ initialData, onSubmit }: ComplexFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <FormContainer>
      {/* Basic fields always loaded */}
      <BasicFormSection />
      
      {/* Advanced section loaded on demand */}
      {showAdvanced && (
        <Suspense fallback={<LoadingSpinner />}>
          <LazyAdvancedSection />
        </Suspense>
      )}
      
      <Button 
        title="Show Advanced Options" 
        onPress={() => setShowAdvanced(true)} 
      />
    </FormContainer>
  );
}
```

## Accessibility

### Semantic HTML and ARIA

Use proper semantic elements and ARIA attributes:

```tsx
// ✅ Good: Proper accessibility attributes
function FormField({ config, value, error, onChange }: FormFieldProps) {
  const fieldId = `field-${config.name}`;
  const errorId = `error-${config.name}`;
  const descriptionId = `desc-${config.name}`;

  return (
    <View role="group">
      <Text 
        id={`label-${config.name}`}
        accessibilityRole="text"
      >
        {config.label}
        {config.required && <Text aria-label="required"> *</Text>}
      </Text>
      
      <TextInput
        id={fieldId}
        value={value}
        onChangeText={onChange}
        accessibilityLabel={config.label}
        accessibilityRequired={config.required}
        accessibilityInvalid={!!error}
        accessibilityDescribedBy={`${descriptionId} ${error ? errorId : ''}`}
        aria-labelledby={`label-${config.name}`}
      />
      
      {config.description && (
        <Text 
          id={descriptionId}
          accessibilityRole="text"
        >
          {config.description}
        </Text>
      )}
      
      {error && (
        <Text
          id={errorId}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
```

### Keyboard Navigation

Implement comprehensive keyboard support:

```tsx
// ✅ Good: Keyboard navigation support
function FormContainer({ children, onSubmit, onCancel }: FormContainerProps) {
  const formRef = useRef<View>(null);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onSubmit();
        }
        break;
      case 'Escape':
        event.preventDefault();
        onCancel?.();
        break;
      case 'Tab':
        // Let default tab behavior work, but ensure proper focus order
        break;
    }
  }, [onSubmit, onCancel]);

  return (
    <View
      ref={formRef}
      role="form"
      onKeyPress={handleKeyPress}
      accessibilityLabel="Form"
    >
      {children}
    </View>
  );
}
```

### Focus Management

Implement proper focus management:

```tsx
// ✅ Good: Focus management
function useFormFocus<T>(formState: FormState<T>) {
  const fieldRefs = useRef<Record<keyof T, RefObject<any>>>({} as any);

  const focusFirstError = useCallback(() => {
    const firstErrorField = Object.keys(formState.errors)[0] as keyof T;
    if (firstErrorField && fieldRefs.current[firstErrorField]?.current) {
      fieldRefs.current[firstErrorField].current.focus();
    }
  }, [formState.errors]);

  const registerField = useCallback((fieldName: keyof T, ref: RefObject<any>) => {
    fieldRefs.current[fieldName] = ref;
  }, []);

  return { focusFirstError, registerField };
}
```

## Error Handling

### Error Display Strategy

Implement consistent error display:

```tsx
// ✅ Good: Comprehensive error handling
function FormWithErrorHandling({ initialData, onSubmit }: FormProps) {
  const { formState, validateForm } = useFormState(initialData, validationSchema);
  const { submit, isSubmitting, error } = useFormSubmission(onSubmit);

  return (
    <FormContainer>
      {/* Field-level errors */}
      <FormField
        config={{ name: 'name', label: 'Name', type: 'text' }}
        value={formState.data.name}
        error={formState.errors.name}
        touched={formState.touched.name}
        onChange={(value) => updateField('name', value)}
      />

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
        <ErrorSummary 
          errors={formState.errors}
          onFieldFocus={(field) => focusField(field)}
        />
      )}
    </FormContainer>
  );
}
```

### Error Recovery

Implement error recovery mechanisms:

```tsx
// ✅ Good: Error recovery with retry logic
function useFormSubmissionWithRetry<T>(
  onSubmit: (data: T) => Promise<void>,
  maxRetries = 3
) {
  const [retryCount, setRetryCount] = useState(0);
  
  const { submit: baseSubmit, isSubmitting, error } = useFormSubmission(
    async (data: T) => {
      try {
        await onSubmit(data);
        setRetryCount(0); // Reset on success
      } catch (err) {
        if (retryCount < maxRetries && isRetryableError(err)) {
          setRetryCount(prev => prev + 1);
          throw err;
        }
        throw err;
      }
    }
  );

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      // Retry logic
    }
  }, [retryCount, maxRetries]);

  return {
    submit: baseSubmit,
    isSubmitting,
    error,
    canRetry: retryCount < maxRetries && isRetryableError(error),
    retry,
    retryCount,
  };
}
```

## Testing

### Unit Testing Strategy

Write comprehensive unit tests:

```tsx
// ✅ Good: Comprehensive unit tests
describe('AccountForm', () => {
  const defaultProps = {
    initialData: {} as AccountFormData,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { getByText, getByLabelText } = render(
        <AccountForm {...defaultProps} />
      );

      fireEvent.press(getByText('Create Account'));

      await waitFor(() => {
        expect(getByText('Account name is required')).toBeTruthy();
      });
    });

    it('should clear errors when field becomes valid', async () => {
      const { getByLabelText, queryByText } = render(
        <AccountForm {...defaultProps} />
      );

      const nameInput = getByLabelText('Account Name');
      
      // Trigger error
      fireEvent.changeText(nameInput, '');
      fireEvent(nameInput, 'blur');
      
      await waitFor(() => {
        expect(queryByText('Account name is required')).toBeTruthy();
      });

      // Fix error
      fireEvent.changeText(nameInput, 'Valid Name');
      
      await waitFor(() => {
        expect(queryByText('Account name is required')).toBeFalsy();
      });
    });
  });

  describe('Submission', () => {
    it('should submit valid form data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const { getByLabelText, getByText } = render(
        <AccountForm {...defaultProps} onSubmit={mockOnSubmit} />
      );

      // Fill valid data
      fireEvent.changeText(getByLabelText('Account Name'), 'Test Account');
      // ... fill other required fields

      fireEvent.press(getByText('Create Account'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Account',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      const { getByLabelText } = render(
        <AccountForm {...defaultProps} />
      );

      const nameInput = getByLabelText('Account Name');
      expect(nameInput).toHaveProp('accessibilityRequired', true);
    });
  });
});
```

### Integration Testing

Test complete workflows:

```tsx
// ✅ Good: Integration tests
describe('AccountForm Integration', () => {
  it('should complete full create workflow', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    
    const { getByLabelText, getByText } = render(
      <TestWrapper>
        <AccountForm
          initialData={{} as AccountFormData}
          onSubmit={mockOnSubmit}
        />
      </TestWrapper>
    );

    // Step 1: Fill form
    fireEvent.changeText(getByLabelText('Account Name'), 'New Account');
    fireEvent.press(getByLabelText('Account Type'));
    fireEvent.press(getByText('Checking'));
    
    // Step 2: Submit
    fireEvent.press(getByText('Create Account'));

    // Step 3: Verify success
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(getByText('Account created successfully!')).toBeTruthy();
    });
  });
});
```

### Performance Testing

Test form performance:

```tsx
// ✅ Good: Performance tests
describe('AccountForm Performance', () => {
  it('should render within performance threshold', () => {
    const startTime = performance.now();
    
    render(<AccountForm {...defaultProps} />);
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
  });

  it('should handle rapid input changes efficiently', async () => {
    const { getByLabelText } = render(<AccountForm {...defaultProps} />);
    const nameInput = getByLabelText('Account Name');

    const startTime = performance.now();
    
    // Simulate rapid typing
    for (let i = 0; i < 100; i++) {
      fireEvent.changeText(nameInput, `Name ${i}`);
    }
    
    const inputTime = performance.now() - startTime;
    expect(inputTime).toBeLessThan(500); // Should handle 100 changes in less than 500ms
  });
});
```

## Security

### Input Sanitization

Sanitize user inputs:

```tsx
// ✅ Good: Input sanitization
const sanitizeInput = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

const createSafeStringValidator = (message: string) => 
  commonValidationRules.custom(
    (value: string) => {
      if (!value) return true;
      const sanitized = sanitizeInput(value);
      return sanitized === value; // Value should not change after sanitization
    },
    message
  );

// Usage in validation schema
const validationSchema: ValidationSchema<FormData> = {
  name: [
    commonValidationRules.required('Name is required'),
    createSafeStringValidator('Name contains invalid characters'),
  ],
};
```

### XSS Prevention

Prevent XSS attacks:

```tsx
// ✅ Good: XSS prevention
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Use in display components
function SafeText({ children }: { children: string }) {
  return <Text>{escapeHtml(children)}</Text>;
}

// Validate against dangerous patterns
const xssValidation = commonValidationRules.custom(
  (value: string) => {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(value));
  },
  'Input contains potentially dangerous content'
);
```

### Data Validation

Validate data types and ranges:

```tsx
// ✅ Good: Comprehensive data validation
const createSecureAmountValidator = () => [
  commonValidationRules.required('Amount is required'),
  commonValidationRules.custom(
    (value: any) => typeof value === 'number' && !isNaN(value),
    'Amount must be a valid number'
  ),
  commonValidationRules.custom(
    (value: number) => Number.isFinite(value),
    'Amount must be finite'
  ),
  commonValidationRules.min(0.01, 'Amount must be positive'),
  commonValidationRules.max(999999999.99, 'Amount exceeds maximum limit'),
];

const createSecureDateValidator = () => [
  commonValidationRules.required('Date is required'),
  commonValidationRules.custom(
    (value: string) => {
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    },
    'Invalid date format'
  ),
  commonValidationRules.custom(
    (value: string) => {
      const date = new Date(value);
      const minDate = new Date('1900-01-01');
      const maxDate = new Date('2100-12-31');
      return date >= minDate && date <= maxDate;
    },
    'Date must be between 1900 and 2100'
  ),
];
```

## Internationalization

### Text Externalization

Externalize all user-facing text:

```tsx
// ✅ Good: Externalized text
import { useTranslation } from 'react-i18next';

function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const { t } = useTranslation('forms');

  const validationSchema: ValidationSchema<AccountFormData> = useMemo(() => ({
    name: [
      commonValidationRules.required(t('validation.required', { field: t('fields.accountName') })),
      commonValidationRules.minLength(2, t('validation.minLength', { field: t('fields.accountName'), length: 2 })),
    ],
  }), [t]);

  return (
    <FormContainer
      submitLabel={initialData.id ? t('actions.saveChanges') : t('actions.createAccount')}
    >
      <FormField
        config={{
          name: 'name',
          label: t('fields.accountName'),
          type: 'text',
          required: true,
          placeholder: t('placeholders.enterAccountName'),
        }}
        // ... other props
      />
    </FormContainer>
  );
}

// ❌ Bad: Hard-coded text
function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  return (
    <FormField
      config={{
        name: 'name',
        label: 'Account Name', // Hard-coded
        placeholder: 'Enter account name', // Hard-coded
      }}
    />
  );
}
```

### Locale-Aware Validation

Implement locale-aware validation:

```tsx
// ✅ Good: Locale-aware validation
function useLocaleValidation() {
  const { i18n } = useTranslation();
  
  const createLocalizedAmountValidator = useCallback(() => {
    const locale = i18n.language;
    const formatter = new Intl.NumberFormat(locale);
    
    return commonValidationRules.custom(
      (value: string) => {
        try {
          // Parse number according to locale
          const parsed = parseLocaleNumber(value, locale);
          return !isNaN(parsed);
        } catch {
          return false;
        }
      },
      'Invalid number format for current locale'
    );
  }, [i18n.language]);

  const createLocalizedDateValidator = useCallback(() => {
    const locale = i18n.language;
    
    return commonValidationRules.custom(
      (value: string) => {
        try {
          const parsed = parseLocaleDate(value, locale);
          return parsed instanceof Date && !isNaN(parsed.getTime());
        } catch {
          return false;
        }
      },
      'Invalid date format for current locale'
    );
  }, [i18n.language]);

  return {
    createLocalizedAmountValidator,
    createLocalizedDateValidator,
  };
}
```

### RTL Support

Support right-to-left languages:

```tsx
// ✅ Good: RTL support
function FormField({ config, value, onChange }: FormFieldProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <View style={[styles.fieldContainer, isRTL && styles.rtl]}>
      <Text style={[styles.label, isRTL && styles.labelRTL]}>
        {config.label}
      </Text>
      <TextInput
        style={[styles.input, isRTL && styles.inputRTL]}
        value={value}
        onChangeText={onChange}
        textAlign={isRTL ? 'right' : 'left'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: 'column',
  },
  rtl: {
    flexDirection: 'column-reverse',
  },
  label: {
    textAlign: 'left',
  },
  labelRTL: {
    textAlign: 'right',
  },
  input: {
    textAlign: 'left',
  },
  inputRTL: {
    textAlign: 'right',
  },
});
```

## Summary

Following these best practices ensures:

- **Consistent code quality** across all forms
- **Type safety** that catches errors at compile time
- **Performance optimization** for smooth user experience
- **Accessibility compliance** for all users
- **Security** against common vulnerabilities
- **Maintainability** for long-term development
- **Internationalization** support for global users

Remember to:
1. Always use TypeScript strictly
2. Implement comprehensive validation
3. Optimize for performance
4. Ensure accessibility compliance
5. Write thorough tests
6. Follow security best practices
7. Support internationalization

---

*Best practices guide last updated: January 2024*