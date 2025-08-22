# Form System Migration Guide

## Overview

This guide helps developers migrate from the legacy form system to the new unified form architecture. The new system provides better type safety, consistent patterns, improved performance, and enhanced accessibility.

## Migration Timeline

### Phase 1: Foundation ✅
- [x] Base types and interfaces
- [x] Core custom hooks (useFormState, useFormSubmission)
- [x] Validation system
- [x] Shared form components (FormContainer, FormField, FormSection)

### Phase 2: Simple Forms ✅
- [x] ConfigurationForm
- [x] AccountCategoryForm  
- [x] TransactionGroupForm

### Phase 3: Medium Complexity Forms ✅
- [x] TransactionCategoryForm
- [x] AccountForm

### Phase 4: Complex Forms ✅
- [x] TransactionForm
- [x] MultipleTransactions

### Phase 5: Optimization & Testing ✅
- [x] Performance optimizations
- [x] Accessibility improvements
- [x] Comprehensive testing
- [x] Documentation

## Breaking Changes

### 1. Form Component Interface

**Before:**
```tsx
interface OldFormProps {
  data?: SomeType;
  onSave: (data: SomeType) => void;
  onCancel?: () => void;
  loading?: boolean;
}
```

**After:**
```tsx
interface BaseFormProps<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  validationSchema?: ValidationSchema<T>;
}
```

### 2. State Management

**Before:**
```tsx
function OldForm({ data, onSave }) {
  const [formData, setFormData] = useState(data || {});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Manual state management...
}
```

**After:**
```tsx
function NewForm({ initialData, onSubmit }: BaseFormProps<FormData>) {
  const { formState, updateField, validateForm } = useFormState(
    initialData,
    validationSchema
  );
  
  const { submit, isSubmitting } = useFormSubmission(onSubmit);
  
  // Hooks handle state management
}
```

### 3. Validation

**Before:**
```tsx
const validateForm = () => {
  const newErrors = {};
  
  if (!formData.name) {
    newErrors.name = 'Name is required';
  }
  
  if (!formData.email || !isValidEmail(formData.email)) {
    newErrors.email = 'Valid email is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**After:**
```tsx
const validationSchema: ValidationSchema<FormData> = {
  name: [
    commonValidationRules.required('Name is required'),
  ],
  email: [
    commonValidationRules.required('Email is required'),
    commonValidationRules.email('Must be a valid email'),
  ],
};

// Validation handled automatically by useFormState
```

### 4. Field Components

**Before:**
```tsx
<TextInputField
  label="Account Name"
  value={name}
  onChangeText={setName}
  error={errors.name}
  required
/>
```

**After:**
```tsx
<FormField
  config={{
    name: 'name',
    label: 'Account Name',
    type: 'text',
    required: true,
  }}
  value={formState.data.name}
  error={formState.errors.name}
  touched={formState.touched.name}
  onChange={(value) => updateField('name', value)}
/>
```

## Step-by-Step Migration

### Step 1: Update Form Data Types

Create proper TypeScript interfaces for your form data:

```tsx
// Before: Loose typing
interface OldAccountForm {
  data?: any;
  onSave: (data: any) => void;
}

// After: Strict typing
interface AccountFormData extends Omit<Account, 'id' | 'createdat' | 'updatedat'> {
  id?: string;
  runningbalance?: number | null;
  openBalance?: number | null;
  addAdjustmentTransaction?: boolean;
}

interface AccountFormProps extends BaseFormProps<AccountFormData> {}
```

### Step 2: Define Validation Schema

Replace manual validation with schema-based validation:

```tsx
const accountValidationSchema: ValidationSchema<AccountFormData> = {
  name: [
    commonValidationRules.required('Account name is required'),
    commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
    commonValidationRules.maxLength(100, 'Name must be no more than 100 characters'),
  ],
  type: [
    commonValidationRules.required('Account type is required'),
  ],
  categoryid: [
    commonValidationRules.required('Account category is required'),
  ],
  balance: [
    commonValidationRules.required('Initial balance is required'),
    commonValidationRules.min(0, 'Balance cannot be negative'),
  ],
};
```

### Step 3: Replace State Management

Replace manual state management with hooks:

```tsx
// Before
function OldAccountForm({ data, onSave, onCancel }) {
  const [formData, setFormData] = useState(data || defaultAccountData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // Manual validation...
  };

  // ... rest of component
}

// After
function AccountForm({ initialData, onSubmit, onCancel }: AccountFormProps) {
  const { formState, updateField, validateForm, resetForm } = useFormState(
    initialData,
    accountValidationSchema
  );

  const { submit, isSubmitting, error } = useFormSubmission(onSubmit, {
    onSuccess: () => console.log('Account saved successfully!'),
    resetOnSuccess: false,
  });

  // ... rest of component
}
```

### Step 4: Update Form Structure

Replace custom form layout with FormContainer:

```tsx
// Before
return (
  <View style={styles.container}>
    <ScrollView>
      {/* Form fields */}
    </ScrollView>
    
    <View style={styles.buttonContainer}>
      <Button 
        title="Save" 
        onPress={handleSave}
        disabled={loading}
      />
      <Button 
        title="Cancel" 
        onPress={onCancel}
      />
    </View>
    
    {loading && <ActivityIndicator />}
  </View>
);

// After
return (
  <FormContainer
    onSubmit={handleSubmit}
    isValid={formState.isValid}
    isLoading={isSubmitting}
    submitLabel={initialData.id ? 'Save Changes' : 'Create Account'}
    showReset={true}
    onReset={resetForm}
  >
    {/* Form fields */}
    
    {error && <ErrorMessage error={error.message} type="form" />}
  </FormContainer>
);
```

### Step 5: Replace Field Components

Update individual field components:

```tsx
// Before
<TextInputField
  label="Account Name"
  value={formData.name}
  onChangeText={(value) => updateField('name', value)}
  error={errors.name}
  required
  placeholder="Enter account name"
/>

<DropDownField
  label="Account Type"
  value={formData.type}
  onValueChange={(value) => updateField('type', value)}
  options={accountTypeOptions}
  error={errors.type}
  required
/>

// After
<FormField
  config={{
    name: 'name',
    label: 'Account Name',
    type: 'text',
    required: true,
    placeholder: 'Enter account name',
  }}
  value={formState.data.name}
  error={formState.errors.name}
  touched={formState.touched.name}
  onChange={(value) => updateField('name', value)}
/>

<FormField
  config={{
    name: 'type',
    label: 'Account Type',
    type: 'select',
    required: true,
    options: accountTypeOptions,
  }}
  value={formState.data.type}
  error={formState.errors.type}
  touched={formState.touched.type}
  onChange={(value) => updateField('type', value)}
/>
```

### Step 6: Update Submission Logic

Replace manual submission handling:

```tsx
// Before
const handleSave = async () => {
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  try {
    await onSave(formData);
    // Handle success
  } catch (error) {
    setErrors({ submit: error.message });
  } finally {
    setLoading(false);
  }
};

// After
const handleSubmit = async () => {
  if (validateForm()) {
    await submit(formState.data);
  }
};
```

## Migration Checklist

For each form being migrated, ensure:

### ✅ Type Safety
- [ ] Form data interface defined
- [ ] Extends BaseFormProps<T>
- [ ] All fields properly typed
- [ ] No `any` types used

### ✅ Validation
- [ ] ValidationSchema defined
- [ ] All required fields validated
- [ ] Custom validation rules implemented
- [ ] Error messages are user-friendly

### ✅ State Management
- [ ] useFormState hook implemented
- [ ] useFormSubmission hook implemented
- [ ] Manual state management removed
- [ ] Form reset functionality works

### ✅ Components
- [ ] FormContainer wrapper added
- [ ] All fields use FormField component
- [ ] FormSection used for grouping (if applicable)
- [ ] Error components implemented

### ✅ Accessibility
- [ ] Proper labels on all fields
- [ ] ARIA attributes present
- [ ] Keyboard navigation works
- [ ] Screen reader support verified

### ✅ Performance
- [ ] React.memo used where appropriate
- [ ] useCallback for event handlers
- [ ] No unnecessary re-renders
- [ ] Large forms optimized

### ✅ Testing
- [ ] Unit tests updated
- [ ] Integration tests added
- [ ] Accessibility tests included
- [ ] Performance tests verified

## Common Migration Patterns

### Pattern 1: Simple Form Migration

```tsx
// 1. Define types
interface SimpleFormData {
  name: string;
  description: string;
}

// 2. Define validation
const validationSchema: ValidationSchema<SimpleFormData> = {
  name: [commonValidationRules.required('Name is required')],
};

// 3. Implement component
function SimpleForm({ initialData, onSubmit }: BaseFormProps<SimpleFormData>) {
  const { formState, updateField, validateForm } = useFormState(initialData, validationSchema);
  const { submit, isSubmitting } = useFormSubmission(onSubmit);

  return (
    <FormContainer
      onSubmit={() => validateForm() && submit(formState.data)}
      isValid={formState.isValid}
      isLoading={isSubmitting}
    >
      <FormField
        config={{ name: 'name', label: 'Name', type: 'text', required: true }}
        value={formState.data.name}
        error={formState.errors.name}
        touched={formState.touched.name}
        onChange={(value) => updateField('name', value)}
      />
    </FormContainer>
  );
}
```

### Pattern 2: Complex Form with Sections

```tsx
function ComplexForm({ initialData, onSubmit }: BaseFormProps<ComplexFormData>) {
  const { formState, updateField, validateForm } = useFormState(initialData, validationSchema);
  const { submit, isSubmitting } = useFormSubmission(onSubmit);

  return (
    <FormContainer
      onSubmit={() => validateForm() && submit(formState.data)}
      isValid={formState.isValid}
      isLoading={isSubmitting}
    >
      <FormSection title="Basic Information" collapsible>
        {/* Basic fields */}
      </FormSection>
      
      <FormSection title="Advanced Settings" collapsible defaultExpanded={false}>
        {/* Advanced fields */}
      </FormSection>
    </FormContainer>
  );
}
```

### Pattern 3: Dynamic Form Fields

```tsx
function DynamicForm({ initialData, onSubmit }: BaseFormProps<DynamicFormData>) {
  const [items, setItems] = useState(initialData.items || []);
  const { formState, updateField, setFormData, validateForm } = useFormState(initialData, validationSchema);
  const { submit, isSubmitting } = useFormSubmission(onSubmit);

  const addItem = () => {
    const newItems = [...items, { id: generateId(), name: '', amount: 0 }];
    setItems(newItems);
    setFormData({ ...formState.data, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setFormData({ ...formState.data, items: newItems });
  };

  return (
    <FormContainer
      onSubmit={() => validateForm() && submit(formState.data)}
      isValid={formState.isValid}
      isLoading={isSubmitting}
    >
      {items.map((item, index) => (
        <View key={item.id}>
          <FormField
            config={{ name: `items.${index}.name`, label: 'Item Name', type: 'text' }}
            value={item.name}
            onChange={(value) => {
              const newItems = [...items];
              newItems[index].name = value;
              setItems(newItems);
              setFormData({ ...formState.data, items: newItems });
            }}
          />
          <Button title="Remove" onPress={() => removeItem(index)} />
        </View>
      ))}
      <Button title="Add Item" onPress={addItem} />
    </FormContainer>
  );
}
```

## Troubleshooting Migration Issues

### Issue 1: TypeScript Errors

**Problem**: Type errors after migration
**Solution**: Ensure proper type definitions

```tsx
// Make sure form data interface is complete
interface AccountFormData {
  name: string;           // Required field
  type: string;           // Required field
  categoryid: string;     // Required field
  balance: number;        // Required field
  description?: string;   // Optional field
}

// Use proper generic typing
const { formState } = useFormState<AccountFormData>(initialData, schema);
```

### Issue 2: Validation Not Working

**Problem**: Form submits without validation
**Solution**: Ensure validation is called before submission

```tsx
const handleSubmit = async () => {
  // Must call validateForm() and check result
  if (!validateForm()) {
    return; // Don't submit if validation fails
  }
  await submit(formState.data);
};
```

### Issue 3: Field Values Not Updating

**Problem**: Form fields don't update when typing
**Solution**: Check onChange implementation

```tsx
// Correct: Pass field name to updateField
onChange={(value) => updateField('fieldName', value)}

// Incorrect: Missing field name
onChange={updateField}
```

### Issue 4: Performance Issues

**Problem**: Form re-renders too frequently
**Solution**: Optimize with memoization

```tsx
// Memoize form component
const MemoizedForm = React.memo(MyForm);

// Use useCallback for handlers
const handleFieldChange = useCallback((field: string, value: any) => {
  updateField(field, value);
}, [updateField]);
```

### Issue 5: Initial Data Not Loading

**Problem**: Form doesn't show initial data
**Solution**: Ensure proper data structure

```tsx
// Make sure initialData matches form interface
const defaultData: AccountFormData = {
  name: '',
  type: '',
  categoryid: '',
  balance: 0,
  description: '',
};

// Pass complete data to form
<AccountForm
  initialData={account || defaultData}
  onSubmit={handleSubmit}
/>
```

## Testing Migration

### Unit Tests

Update unit tests to use new patterns:

```tsx
// Before
describe('OldAccountForm', () => {
  it('should validate required fields', () => {
    const { getByText } = render(<OldAccountForm data={{}} onSave={jest.fn()} />);
    fireEvent.press(getByText('Save'));
    expect(getByText('Name is required')).toBeTruthy();
  });
});

// After
describe('AccountForm', () => {
  it('should validate required fields', () => {
    const { getByText } = render(
      <AccountForm
        initialData={{} as AccountFormData}
        onSubmit={jest.fn()}
      />
    );
    fireEvent.press(getByText('Create Account'));
    expect(getByText('Account name is required')).toBeTruthy();
  });
});
```

### Integration Tests

Test complete form workflows:

```tsx
describe('AccountForm Integration', () => {
  it('should complete create workflow', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByDisplayValue, getByText } = render(
      <AccountForm
        initialData={{} as AccountFormData}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill form
    fireEvent.changeText(getByDisplayValue(''), 'Test Account');
    
    // Submit
    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Account' })
      );
    });
  });
});
```

## Performance Considerations

### Before Migration
- Manual state management causes unnecessary re-renders
- No memoization of components
- Validation runs on every render
- No debouncing of user input

### After Migration
- Optimized state updates with hooks
- React.memo prevents unnecessary re-renders
- Validation only runs when needed
- Debounced validation for better performance

### Measuring Performance

Use the performance monitoring utilities:

```tsx
import { performanceMonitor } from '../utils/performance-monitor';

// Monitor form performance
performanceMonitor.recordFormPerformance('AccountForm', {
  renderTime: 15,
  validationTime: 5,
  submissionTime: 200,
});

// Get performance statistics
const stats = performanceMonitor.getFormStatistics('AccountForm');
console.log('Average render time:', stats.averageRenderTime);
```

## Rollback Plan

If issues arise during migration:

### 1. Immediate Rollback
- Keep old form components alongside new ones
- Use feature flags to switch between implementations
- Monitor error rates and performance metrics

### 2. Gradual Rollback
- Roll back one form at a time if needed
- Identify and fix specific issues
- Re-migrate with fixes applied

### 3. Emergency Rollback
- Revert to previous commit
- Disable new form system entirely
- Investigate issues in development environment

## Post-Migration Validation

After migrating each form:

### ✅ Functional Testing
- [ ] All form fields work correctly
- [ ] Validation triggers appropriately
- [ ] Submission handles success/error cases
- [ ] Form reset functionality works
- [ ] Loading states display correctly

### ✅ Performance Testing
- [ ] Form renders within acceptable time
- [ ] No memory leaks detected
- [ ] Validation performs efficiently
- [ ] Large forms remain responsive

### ✅ Accessibility Testing
- [ ] Screen reader compatibility verified
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Error announcements work

### ✅ Cross-Platform Testing
- [ ] Works on web platform
- [ ] Works on mobile platforms
- [ ] Responsive design maintained
- [ ] Platform-specific features work

## Support and Resources

### Documentation
- [Form System README](./README.md)
- [API Reference](./API_REFERENCE.md)
- [Best Practices Guide](./BEST_PRACTICES.md)

### Examples
- Check existing migrated forms for patterns
- Review test files for usage examples
- Look at form component implementations

### Getting Help
1. Check this migration guide first
2. Review existing form implementations
3. Check the troubleshooting section
4. Create an issue with detailed information

---

*Migration guide last updated: January 2024*