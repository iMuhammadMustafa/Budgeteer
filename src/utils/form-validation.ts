/**
 * Form validation utilities for the forms refactoring
 * This file contains validation functions, built-in validators, and validation helpers
 */

import {
  ValidationRule,
  ValidationResult,
  FormValidationResult,
  ValidationSchema,
} from "../types/components/forms.types";
import { RecurringType } from "../types/recurring";

// ============================================================================
// Built-in Validators
// ============================================================================

/**
 * Validates that a field is not empty
 */
export const requiredValidator = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validates minimum string length
 */
export const minLengthValidator = (value: string, minLength: number): boolean => {
  if (!value) return true; // Let required validator handle empty values
  return value.length >= minLength;
};

/**
 * Validates maximum string length
 */
export const maxLengthValidator = (value: string, maxLength: number): boolean => {
  if (!value) return true; // Let required validator handle empty values
  return value.length <= maxLength;
};

/**
 * Validates minimum numeric value
 */
export const minValidator = (value: number, min: number): boolean => {
  if (value === null || value === undefined) return true; // Let required validator handle empty values
  return value >= min;
};

/**
 * Validates maximum numeric value
 */
export const maxValidator = (value: number, max: number): boolean => {
  if (value === null || value === undefined) return true; // Let required validator handle empty values
  return value <= max;
};

/**
 * Validates against a regular expression pattern
 */
export const patternValidator = (value: string, pattern: RegExp): boolean => {
  if (!value) return true; // Let required validator handle empty values
  return pattern.test(value);
};

/**
 * Validates email format
 */
export const emailValidator = (value: string): boolean => {
  if (!value) return true; // Let required validator handle empty values
  const emailRegex = /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// ============================================================================
// Validation Rule Executor
// ============================================================================

/**
 * Executes a single validation rule against a value
 */
export const executeValidationRule = (rule: ValidationRule, value: any, formData?: any): ValidationResult => {
  let isValid = true;

  switch (rule.type) {
    case "required":
      isValid = requiredValidator(value);
      break;
    case "minLength":
      isValid = minLengthValidator(value, rule.value);
      break;
    case "maxLength":
      isValid = maxLengthValidator(value, rule.value);
      break;
    case "min":
      isValid = minValidator(value, rule.value);
      break;
    case "max":
      isValid = maxValidator(value, rule.value);
      break;
    case "pattern":
      isValid = patternValidator(value, rule.value);
      break;
    case "email":
      isValid = emailValidator(value);
      break;
    case "custom":
      if (rule.validator) {
        isValid = rule.validator(value, formData);
      }
      break;
    default:
      console.warn(`Unknown validation rule type: ${rule.type}`);
      isValid = true;
  }

  return {
    isValid,
    error: isValid ? undefined : rule.message,
  };
};

/**
 * Validates a single field against its validation rules
 */
export const validateField = <T>(
  _fieldName: keyof T,
  value: any,
  validationRules: ValidationRule[],
  formData?: T,
): ValidationResult => {
  for (const rule of validationRules) {
    const result = executeValidationRule(rule, value, formData);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
};

/**
 * Validates an entire form against its validation schema
 */
export const validateForm = <T extends Record<string, any>>(
  formData: T,
  validationSchema: ValidationSchema<T>,
): FormValidationResult<T> => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const fieldName in validationSchema) {
    const fieldRules = validationSchema[fieldName];
    if (fieldRules) {
      const fieldValue = formData[fieldName];
      const fieldResult = validateField(fieldName, fieldValue, fieldRules, formData);

      if (!fieldResult.isValid) {
        errors[fieldName] = fieldResult.error;
        isValid = false;
      }
    }
  }

  return {
    isValid,
    errors,
  };
};

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * Common validation rules for different field types
 */
export const commonValidationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    type: "required",
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: "minLength",
    value: length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: "maxLength",
    value: length,
    message: message || `Must be no more than ${length} characters`,
  }),

  min: (value: number, message?: string): ValidationRule => ({
    type: "min",
    value,
    message: message || `Must be at least ${value}`,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    type: "max",
    value,
    message: message || `Must be no more than ${value}`,
  }),

  email: (message = "Must be a valid email address"): ValidationRule => ({
    type: "email",
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: "pattern",
    value: regex,
    message,
  }),

  custom: (validator: (value: any, formData?: any) => boolean, message: string): ValidationRule => ({
    type: "custom",
    validator,
    message,
  }),
};

// ============================================================================
// Form-Specific Validation Helpers
// ============================================================================

/**
 * Validates that an amount is positive
 */
export const positiveAmountValidator = (value: number): boolean => {
  return value > 0;
};

/**
 * Validates that a date is not in the future (for transaction dates)
 */
export const notFutureDateValidator = (value: string): boolean => {
  if (!value) return true;
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return inputDate <= today;
};

/**
 * Validates that a string contains only alphanumeric characters and common symbols
 */
export const safeStringValidator = (value: string): boolean => {
  if (!value) return true;
  // Reject strings with HTML tags, newlines, tabs, and other dangerous characters
  const dangerousPattern = /[<>\n\t\r]/;
  if (dangerousPattern.test(value)) return false;

  // Allow only safe characters
  const safePattern = /^[a-zA-Z0-9\s\-_.,!?()'":&@#$%]+$/;
  return safePattern.test(value);
};

/**
 * Validates that a numeric string can be parsed as a valid number
 */
export const numericStringValidator = (value: string): boolean => {
  if (!value) return true;

  // Reject strings with whitespace
  if (/\s/.test(value)) return false;

  // Reject scientific notation, Infinity, and NaN
  if (/[eE]/.test(value) || value === "Infinity" || value === "-Infinity" || value === "NaN") return false;

  // Must match a strict numeric pattern
  const numericPattern = /^-?\d+(\.\d+)?$/;
  if (!numericPattern.test(value)) return false;

  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};

// ============================================================================
// Validation Schema Builders
// ============================================================================

/**
 * Creates validation rules for account names
 */
export const createAccountNameValidation = (): ValidationRule[] => [
  commonValidationRules.required("Account name is required"),
  commonValidationRules.minLength(2, "Account name must be at least 2 characters"),
  commonValidationRules.maxLength(100, "Account name must be no more than 100 characters"),
  commonValidationRules.custom(safeStringValidator, "Account name contains invalid characters"),
];

/**
 * Creates validation rules for transaction amounts
 */
export const createAmountValidation = (): ValidationRule[] => [
  commonValidationRules.required("Amount is required"),
  commonValidationRules.min(0.01, "Amount must be greater than 0"),
  commonValidationRules.max(999999999.99, "Amount is too large"),
];

/**
 * Creates validation rules for transaction dates
 */
export const createDateValidation = (): ValidationRule[] => [
  commonValidationRules.required("Date is required"),
  commonValidationRules.custom(notFutureDateValidator, "Date cannot be in the future"),
];

/**
 * Creates validation rules for category names
 */
export const createCategoryNameValidation = (): ValidationRule[] => [
  commonValidationRules.required("Category name is required"),
  commonValidationRules.minLength(2, "Category name must be at least 2 characters"),
  commonValidationRules.maxLength(50, "Category name must be no more than 50 characters"),
  commonValidationRules.custom(safeStringValidator, "Category name contains invalid characters"),
];

/**
 * Creates validation rules for descriptions and notes
 */
export const createDescriptionValidation = (required = false): ValidationRule[] => {
  const rules: ValidationRule[] = [];

  if (required) {
    rules.push(commonValidationRules.required("Description is required"));
  }

  rules.push(
    commonValidationRules.maxLength(500, "Description must be no more than 500 characters"),
    commonValidationRules.custom(safeStringValidator, "Description contains invalid characters"),
  );

  return rules;
};

/**
 * Creates validation rules for recurring transactions
 */
export const createRecurringValidation = (): ValidationRule[] => [
  // intervalmonths: must be between 1 and 24 if present
  commonValidationRules.custom(
    (value, formData) =>
      value === undefined || value === null || (typeof value === "number" && value >= 1 && value <= 24),
    "Interval months must be between 1 and 24",
  ),

  // recurringtype: must be a valid RecurringType
  commonValidationRules.custom(
    value => value === undefined || value === null || Object.values(RecurringType).includes(value),
    "Invalid recurring type",
  ),

  // transferaccountid: required if recurringtype is Transfer
  commonValidationRules.custom(
    (_value, formData) => formData?.recurringtype !== RecurringType.Transfer || !!formData?.transferaccountid,
    "Transfer account is required for transfers",
  ),

  // transferaccountid: must be different from sourceaccountid if both are present
  commonValidationRules.custom(
    (_value, formData) =>
      !formData?.transferaccountid ||
      !formData?.sourceaccountid ||
      formData.transferaccountid !== formData.sourceaccountid,
    "Source account and transfer account must be different",
  ),

  // categoryid: required
  commonValidationRules.custom(
    (_value, formData) => !!formData?.categoryid,
    "Category is required for credit card payments",
  ),

  // amount: required if not flexible and not a credit card payment
  commonValidationRules.custom(
    (_value, formData) =>
      formData?.isamountflexible ||
      formData?.recurringtype === RecurringType.CreditCardPayment ||
      (formData.amount !== undefined && formData.amount !== null),
    "Amount is required",
  ),

  // nextoccurrencedate: required if not flexible
  commonValidationRules.custom(
    (_value, formData) => formData?.isdateflexible || !!formData?.nextoccurrencedate,
    "Date is required",
  ),
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounces validation to improve performance
 */
export const createDebouncedValidator = <T>(validator: (data: T) => FormValidationResult<T>, delay = 300) => {
  let timeoutId: any;

  return (data: T): Promise<FormValidationResult<T>> => {
    return new Promise(resolve => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validator(data));
      }, delay);
    });
  };
};

/**
 * Formats validation errors for display
 */
export const formatValidationError = (error: string): string => {
  return error.charAt(0).toUpperCase() + error.slice(1);
};

/**
 * Checks if a form has any validation errors
 */
export const hasValidationErrors = <T>(errors: Partial<Record<keyof T, string>>): boolean => {
  return Object.values(errors).some(error => error !== undefined && error !== "");
};

/**
 * Gets the first validation error from a form
 */
export const getFirstValidationError = <T>(errors: Partial<Record<keyof T, string>>): string | {} | undefined => {
  for (const error of Object.values(errors)) {
    if (error) return error;
  }
  return undefined;
};
