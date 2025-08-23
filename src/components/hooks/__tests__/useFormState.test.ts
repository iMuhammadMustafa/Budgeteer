/**
 * Comprehensive unit tests for useFormState hook
 * Tests hook behavior, validation, state management, and edge cases
 */

import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../useFormState';
import { ValidationSchema } from '../../../types/components/forms.types';
import { commonValidationRules } from '../../../utils/form-validation';

// Test data interface
interface TestFormData {
  name: string;
  email: string;
  age: number;
  description?: string;
  isActive: boolean;
  tags: string[];
}

// Test validation schema
const testValidationSchema: ValidationSchema<TestFormData> = {
  name: [
    commonValidationRules.required('Name is required'),
    commonValidationRules.minLength(2, 'Name must be at least 2 characters'),
  ],
  email: [
    commonValidationRules.required('Email is required'),
    commonValidationRules.email('Must be a valid email'),
  ],
  age: [
    commonValidationRules.required('Age is required'),
    commonValidationRules.min(0, 'Age must be positive'),
  ],
};

const initialData: TestFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25,
  description: 'Test description',
  isActive: true,
  tags: ['tag1', 'tag2'],
};

describe('useFormState', () => {
  describe('Hook Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      expect(result.current.formState.data).toEqual(initialData);
      expect(result.current.formState.errors).toEqual({});
      expect(result.current.formState.touched).toEqual({});
      expect(result.current.formState.isDirty).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('should initialize without validation schema', () => {
      const { result } = renderHook(() => useFormState(initialData));

      expect(result.current.formState.data).toEqual(initialData);
      expect(result.current.formState.errors).toEqual({});
      expect(result.current.formState.touched).toEqual({});
    });

    it('should handle empty initial data', () => {
      const emptyData = {} as TestFormData;
      const { result } = renderHook(() => useFormState(emptyData));

      expect(result.current.formState.data).toEqual(emptyData);
      expect(result.current.formState.isDirty).toBe(false);
    });
  });

  describe('Field Updates', () => {
    it('should update field values correctly', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('name', 'Jane Doe');
      });

      expect(result.current.formState.data.name).toBe('Jane Doe');
      expect(result.current.formState.isDirty).toBe(true);
      expect(result.current.isDirty).toBe(true);
    });

    it('should mark field as touched when updated', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('name', 'Jane Doe');
      });

      expect(result.current.formState.touched.name).toBe(true);
    });

    it('should validate field on update when validation schema exists', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('name', ''); // Invalid - required field
      });

      expect(result.current.formState.errors.name).toBe('Name is required');
      expect(result.current.formState.isValid).toBe(false);
      expect(result.current.isValid).toBe(false);
    });

    it('should handle complex field types (arrays, objects)', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('tags', ['new-tag1', 'new-tag2']);
      });

      expect(result.current.formState.data.tags).toEqual(['new-tag1', 'new-tag2']);
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('description', null);
      });

      expect(result.current.formState.data.description).toBeNull();

      act(() => {
        result.current.updateField('description', undefined);
      });

      expect(result.current.formState.data.description).toBeUndefined();
    });
  });

  describe('Field Validation', () => {
    it('should validate individual fields correctly', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        const isValid = result.current.validateField('name');
        expect(isValid).toBe(true);
      });

      act(() => {
        result.current.updateField('name', '');
        const isValid = result.current.validateField('name');
        expect(isValid).toBe(false);
      });

      expect(result.current.formState.errors.name).toBe('Name is required');
    });

    it('should validate email format correctly', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('email', 'invalid-email');
        result.current.validateField('email');
      });

      expect(result.current.formState.errors.email).toBe('Must be a valid email');
    });

    it('should validate numeric constraints', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('age', -5);
        result.current.validateField('age');
      });

      expect(result.current.formState.errors.age).toBe('Age must be positive');
    });

    it('should clear field errors when field becomes valid', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      // Make field invalid
      act(() => {
        result.current.updateField('name', '');
        result.current.validateField('name');
      });

      expect(result.current.formState.errors.name).toBe('Name is required');

      // Make field valid again
      act(() => {
        result.current.updateField('name', 'Valid Name');
        result.current.validateField('name');
      });

      expect(result.current.formState.errors.name).toBeUndefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate entire form correctly', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });

      act(() => {
        result.current.updateField('name', '');
        result.current.updateField('email', 'invalid');
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });

      expect(result.current.formState.errors.name).toBe('Name is required');
      expect(result.current.formState.errors.email).toBe('Must be a valid email');
    });

    it('should handle form validation without schema', () => {
      const { result } = renderHook(() => useFormState(initialData));

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true); // No validation rules, so always valid
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      // Make changes
      act(() => {
        result.current.updateField('name', 'Changed Name');
        result.current.updateField('email', 'changed@example.com');
      });

      expect(result.current.formState.isDirty).toBe(true);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formState.data).toEqual(initialData);
      expect(result.current.formState.errors).toEqual({});
      expect(result.current.formState.touched).toEqual({});
      expect(result.current.formState.isDirty).toBe(false);
    });

    it('should clear validation errors on reset', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      // Create validation errors
      act(() => {
        result.current.updateField('name', '');
        result.current.validateForm();
      });

      expect(result.current.formState.errors.name).toBeDefined();

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formState.errors).toEqual({});
    });
  });

  describe('Bulk Data Updates', () => {
    it('should update multiple fields with setFormData', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      const newData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      act(() => {
        result.current.setFormData(newData);
      });

      expect(result.current.formState.data.name).toBe('Updated Name');
      expect(result.current.formState.data.email).toBe('updated@example.com');
      expect(result.current.formState.data.age).toBe(25); // Unchanged
      expect(result.current.formState.isDirty).toBe(true);
    });

    it('should preserve dirty state when specified', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      const newData = {
        name: 'Updated Name',
      };

      act(() => {
        result.current.setFormData(newData, { preserveDirtyState: true });
      });

      expect(result.current.formState.data.name).toBe('Updated Name');
      expect(result.current.formState.isDirty).toBe(false); // Preserved
    });

    it('should update initial data with setInitialFormData', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      const newInitialData = {
        name: 'New Initial Name',
        email: 'newinitial@example.com',
      };

      act(() => {
        result.current.setInitialFormData(newInitialData);
      });

      expect(result.current.formState.data.name).toBe('New Initial Name');
      expect(result.current.formState.data.email).toBe('newinitial@example.com');
      expect(result.current.formState.isDirty).toBe(false); // Should not be dirty after setting initial data
    });
  });

  describe('Touched State Management', () => {
    it('should set field as touched manually', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.setFieldTouched('name');
      });

      expect(result.current.formState.touched.name).toBe(true);
    });

    it('should not validate untouched fields in some scenarios', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      // Set invalid value but don't touch the field
      act(() => {
        result.current.updateField('name', '');
      });

      // Field should be automatically touched when updated
      expect(result.current.formState.touched.name).toBe(true);
      expect(result.current.formState.errors.name).toBe('Name is required');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive updates', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        result.current.updateField('name', 'A');
        result.current.updateField('name', 'AB');
        result.current.updateField('name', 'ABC');
        result.current.updateField('name', 'ABCD');
      });

      expect(result.current.formState.data.name).toBe('ABCD');
      expect(result.current.formState.isDirty).toBe(true);
    });

    it('should handle updating non-existent fields gracefully', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      act(() => {
        // This should not crash
        result.current.updateField('nonExistentField' as any, 'value');
      });

      expect(result.current.formState.data).toHaveProperty('nonExistentField', 'value');
    });

    it('should handle circular references in form data', () => {
      const circularData: any = { name: 'Test' };
      circularData.self = circularData;

      expect(() => {
        renderHook(() => useFormState(circularData));
      }).not.toThrow();
    });

    it('should handle very large form data', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => [`field${i}`, `value${i}`])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as any;

      const { result } = renderHook(() => useFormState(largeData));

      act(() => {
        result.current.updateField('field500', 'updated');
      });

      expect(result.current.formState.data.field500).toBe('updated');
    });

    it('should handle validation schema changes', () => {
      let schema = testValidationSchema;
      const { result, rerender } = renderHook(
        ({ validationSchema }) => useFormState(initialData, validationSchema),
        { initialProps: { validationSchema: schema } }
      );

      // Change validation schema
      schema = {
        name: [commonValidationRules.required('New name error message')],
      };

      rerender({ validationSchema: schema });

      act(() => {
        result.current.updateField('name', '');
        result.current.validateField('name');
      });

      expect(result.current.formState.errors.name).toBe('New name error message');
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useFormState(initialData, testValidationSchema);
      });

      const initialRenderCount = renderCount;

      // Multiple updates in the same act should not cause multiple renders
      act(() => {
        result.current.updateField('name', 'New Name');
        result.current.setFieldTouched('email');
      });

      expect(renderCount).toBe(initialRenderCount + 1);
    });

    it('should handle debounced validation efficiently', () => {
      const { result } = renderHook(() => useFormState(initialData, testValidationSchema));

      // Rapid updates should not cause performance issues
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateField('name', `Name ${i}`);
        }
      });

      expect(result.current.formState.data.name).toBe('Name 99');
    });
  });
});