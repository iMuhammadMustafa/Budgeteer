/**
 * useFormState hook - Core form state management hook
 * Provides state management, field updates, and validation for forms
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { FormState, ValidationSchema, UseFormStateReturn, FormFieldValue } from "../../types/components/forms.types";
import { validateForm, validateField } from "../../utils/form-validation";
import { debounce } from "../../utils/debounce";

/**
 * Custom hook for managing form state with validation
 * @param initialData - Initial form data
 * @param validationSchema - Optional validation schema for the form
 * @returns Form state management functions and current state
 */
export function useFormState<T extends Record<string, any>>(
  initialData: T,
  validationSchema?: ValidationSchema<T>,
): UseFormStateReturn<T> {
  // Keep track of the initial data for comparison
  const initialDataRef = useRef<T>(initialData);

  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() => ({
    data: { ...initialData },
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  }));

  // Update form state when initial data changes (for edit mode)
  useEffect(() => {
    // Deep comparison to avoid unnecessary updates
    const hasChanged = JSON.stringify(initialDataRef.current) !== JSON.stringify(initialData);

    if (hasChanged) {
      initialDataRef.current = initialData;
      setFormState(prevState => ({
        ...prevState,
        data: { ...initialData },
        isDirty: false, // Reset dirty state when initial data changes
        errors: {}, // Clear errors when data changes
        touched: {}, // Reset touched state
      }));
    }
  }, [initialData]);

  // Debounced validation for performance optimization
  const debouncedValidateField = useMemo(
    () =>
      debounce((field: keyof T, value: FormFieldValue, schema: ValidationSchema<T>[keyof T], data: T) => {
        if (!schema) return;

        const fieldValidation = validateField(field, value, schema, data);

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
          };
        });
      }, 300),
    [],
  );

  // Update a single field value with optimized validation
  const updateField = useCallback(
    (field: keyof T, value: FormFieldValue) => {
      setFormState(prevState => {
        const newData = { ...prevState.data, [field]: value };
        const newTouched = { ...prevState.touched, [field]: true };

        // Check if form is dirty (different from initial data)
        const isDirty = Object.keys(newData).some(
          key => newData[key as keyof T] !== initialDataRef.current[key as keyof T],
        );

        // Immediate state update without validation for better UX
        const newState = {
          data: newData,
          errors: prevState.errors, // Keep existing errors for now
          touched: newTouched,
          isValid: prevState.isValid, // Keep existing validity for now
          isDirty,
        };

        // Trigger debounced validation if schema exists
        if (validationSchema && validationSchema[field]) {
          debouncedValidateField(field, value, validationSchema[field]!, newData);
        }

        return newState;
      });
    },
    [validationSchema, debouncedValidateField],
  );

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
      touched: Object.keys(prevState.data).reduce(
        (acc, key) => {
          acc[key as keyof T] = true;
          return acc;
        },
        {} as Partial<Record<keyof T, boolean>>,
      ),
    }));

    return validationResult.isValid;
  }, [formState.data, validationSchema]);

  // Validate a single field
  const validateSingleField = useCallback(
    (field: keyof T): boolean => {
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
    },
    [formState.data, validationSchema],
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState({
      data: { ...initialDataRef.current },
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, []);

  // Set initial form data (doesn't trigger dirty state)
  const setInitialFormData = useCallback((data: Partial<T>) => {
    // Update the initial data reference
    initialDataRef.current = { ...initialDataRef.current, ...data };

    setFormState(prevState => ({
      ...prevState,
      data: { ...prevState.data, ...data },
      isDirty: false, // Explicitly set to false since this is initial data
      errors: {}, // Clear errors when setting initial data
      touched: {}, // Reset touched state for new initial data
    }));
  }, []);

  // Set form data (bulk update)
  const setFormData = useCallback(
    (data: Partial<T>, options?: { preserveDirtyState?: boolean }) => {
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

        // Check if form is dirty (unless preserveDirtyState is true)
        const isDirty = options?.preserveDirtyState
          ? prevState.isDirty
          : Object.keys(newData).some(key => newData[key as keyof T] !== initialDataRef.current[key as keyof T]);

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
    },
    [initialData, validationSchema],
  );

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
    setInitialFormData,
    isDirty,
    isValid,
  };
}
