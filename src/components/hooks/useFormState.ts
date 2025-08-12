/**
 * useFormState hook - Core form state management hook
 * Provides state management, field updates, and validation for forms
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  FormState, 
  ValidationSchema, 
  UseFormStateReturn,
  FormFieldValue 
} from '../../types/components/forms.types';
import { validateForm, validateField } from '../../utils/form-validation';

/**
 * Custom hook for managing form state with validation
 * @param initialData - Initial form data
 * @param validationSchema - Optional validation schema for the form
 * @returns Form state management functions and current state
 */
export function useFormState<T extends Record<string, any>>(
  initialData: T,
  validationSchema?: ValidationSchema<T>
): UseFormStateReturn<T> {
  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() => ({
    data: { ...initialData },
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  }));

  // Update a single field value
  const updateField = useCallback((field: keyof T, value: FormFieldValue) => {
    setFormState(prevState => {
      const newData = { ...prevState.data, [field]: value };
      const newTouched = { ...prevState.touched, [field]: true };
      
      // Validate the field if validation schema exists
      let newErrors = { ...prevState.errors };
      if (validationSchema && validationSchema[field]) {
        const fieldValidation = validateField(field, value, validationSchema[field]!, newData);
        if (fieldValidation.isValid) {
          delete newErrors[field];
        } else {
          newErrors[field] = fieldValidation.error;
        }
      }

      // Check if form is dirty (different from initial data)
      const isDirty = Object.keys(newData).some(key => 
        newData[key as keyof T] !== initialData[key as keyof T]
      );

      // Check if form is valid (no errors)
      const isValid = Object.keys(newErrors).length === 0;

      return {
        data: newData,
        errors: newErrors,
        touched: newTouched,
        isValid,
        isDirty,
      };
    });
  }, [initialData, validationSchema]);

  // Mark a field as touched
  const setFieldTouched = useCallback((field: keyof T) => {
    setFormState(prevState => ({
      ...prevState,
      touched: { ...prevState.touched, [field]: true },
    }));
  }, []);

  // Validate entire form
  const validateFormData = useCallback((): boolean => {
    if (!validationSchema) return true;

    const validationResult = validateForm(formState.data, validationSchema);
    
    setFormState(prevState => ({
      ...prevState,
      errors: validationResult.errors,
      isValid: validationResult.isValid,
      // Mark all fields as touched when validating entire form
      touched: Object.keys(prevState.data).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>),
    }));

    return validationResult.isValid;
  }, [formState.data, validationSchema]);

  // Validate a single field
  const validateSingleField = useCallback((field: keyof T): boolean => {
    if (!validationSchema || !validationSchema[field]) return true;

    const fieldValidation = validateField(field, formState.data[field], validationSchema[field]!, formState.data);
    
    setFormState(prevState => {
      const newErrors = { ...prevState.errors };
      if (fieldValidation.isValid) {
        delete newErrors[field];
      } else {
        newErrors[field] = fieldValidation.error;
      }

      const isValid = Object.keys(newErrors).length === 0;

      return {
        ...prevState,
        errors: newErrors,
        isValid,
        touched: { ...prevState.touched, [field]: true },
      };
    });

    return fieldValidation.isValid;
  }, [formState.data, validationSchema]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState({
      data: { ...initialData },
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, [initialData]);

  // Set form data (bulk update)
  const setFormData = useCallback((data: Partial<T>) => {
    setFormState(prevState => {
      const newData = { ...prevState.data, ...data };
      
      // Validate all updated fields if validation schema exists
      let newErrors = { ...prevState.errors };
      if (validationSchema) {
        Object.keys(data).forEach(key => {
          const field = key as keyof T;
          if (validationSchema[field]) {
            const fieldValidation = validateField(field, newData[field], validationSchema[field]!, newData);
            if (fieldValidation.isValid) {
              delete newErrors[field];
            } else {
              newErrors[field] = fieldValidation.error;
            }
          }
        });
      }

      // Check if form is dirty
      const isDirty = Object.keys(newData).some(key => 
        newData[key as keyof T] !== initialData[key as keyof T]
      );

      // Check if form is valid
      const isValid = Object.keys(newErrors).length === 0;

      return {
        data: newData,
        errors: newErrors,
        touched: prevState.touched,
        isValid,
        isDirty,
      };
    });
  }, [initialData, validationSchema]);

  // Memoized computed values
  const isDirty = useMemo(() => formState.isDirty, [formState.isDirty]);
  const isValid = useMemo(() => formState.isValid, [formState.isValid]);

  return {
    formState,
    updateField,
    setFieldTouched,
    validateForm: validateFormData,
    validateField: validateSingleField,
    resetForm,
    setFormData,
    isDirty,
    isValid,
  };
}