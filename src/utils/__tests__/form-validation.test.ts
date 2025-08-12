/**
 * Unit tests for form validation utilities
 */

import {
  requiredValidator,
  minLengthValidator,
  maxLengthValidator,
  minValidator,
  maxValidator,
  patternValidator,
  emailValidator,
  executeValidationRule,
  validateField,
  validateForm,
  commonValidationRules,
  positiveAmountValidator,
  notFutureDateValidator,
  safeStringValidator,
  numericStringValidator,
  createAccountNameValidation,
  createAmountValidation,
  createDateValidation,
  createCategoryNameValidation,
  createDescriptionValidation,
  createDebouncedValidator,
  formatValidationError,
  hasValidationErrors,
  getFirstValidationError,
} from '../form-validation';
import { ValidationRule, ValidationSchema } from '../../types/components/forms.types';

describe('Built-in Validators', () => {
  describe('requiredValidator', () => {
    it('should return false for null', () => {
      expect(requiredValidator(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(requiredValidator(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(requiredValidator('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(requiredValidator('   ')).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(requiredValidator([])).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(requiredValidator('test')).toBe(true);
    });

    it('should return true for non-empty array', () => {
      expect(requiredValidator(['item'])).toBe(true);
    });

    it('should return true for number 0', () => {
      expect(requiredValidator(0)).toBe(true);
    });

    it('should return true for boolean false', () => {
      expect(requiredValidator(false)).toBe(true);
    });
  });

  describe('minLengthValidator', () => {
    it('should return true for empty value', () => {
      expect(minLengthValidator('', 5)).toBe(true);
    });

    it('should return false when string is shorter than minimum', () => {
      expect(minLengthValidator('abc', 5)).toBe(false);
    });

    it('should return true when string equals minimum length', () => {
      expect(minLengthValidator('abcde', 5)).toBe(true);
    });

    it('should return true when string is longer than minimum', () => {
      expect(minLengthValidator('abcdef', 5)).toBe(true);
    });
  });

  describe('maxLengthValidator', () => {
    it('should return true for empty value', () => {
      expect(maxLengthValidator('', 5)).toBe(true);
    });

    it('should return true when string is shorter than maximum', () => {
      expect(maxLengthValidator('abc', 5)).toBe(true);
    });

    it('should return true when string equals maximum length', () => {
      expect(maxLengthValidator('abcde', 5)).toBe(true);
    });

    it('should return false when string is longer than maximum', () => {
      expect(maxLengthValidator('abcdef', 5)).toBe(false);
    });
  });

  describe('minValidator', () => {
    it('should return true for null/undefined values', () => {
      expect(minValidator(null as any, 5)).toBe(true);
      expect(minValidator(undefined as any, 5)).toBe(true);
    });

    it('should return false when number is less than minimum', () => {
      expect(minValidator(3, 5)).toBe(false);
    });

    it('should return true when number equals minimum', () => {
      expect(minValidator(5, 5)).toBe(true);
    });

    it('should return true when number is greater than minimum', () => {
      expect(minValidator(7, 5)).toBe(true);
    });
  });

  describe('maxValidator', () => {
    it('should return true for null/undefined values', () => {
      expect(maxValidator(null as any, 5)).toBe(true);
      expect(maxValidator(undefined as any, 5)).toBe(true);
    });

    it('should return true when number is less than maximum', () => {
      expect(maxValidator(3, 5)).toBe(true);
    });

    it('should return true when number equals maximum', () => {
      expect(maxValidator(5, 5)).toBe(true);
    });

    it('should return false when number is greater than maximum', () => {
      expect(maxValidator(7, 5)).toBe(false);
    });
  });

  describe('patternValidator', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should return true for empty value', () => {
      expect(patternValidator('', emailPattern)).toBe(true);
    });

    it('should return true when value matches pattern', () => {
      expect(patternValidator('test@example.com', emailPattern)).toBe(true);
    });

    it('should return false when value does not match pattern', () => {
      expect(patternValidator('invalid-email', emailPattern)).toBe(false);
    });
  });

  describe('emailValidator', () => {
    it('should return true for empty value', () => {
      expect(emailValidator('')).toBe(true);
    });

    it('should return true for valid email', () => {
      expect(emailValidator('test@example.com')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(emailValidator('invalid-email')).toBe(false);
      expect(emailValidator('test@')).toBe(false);
      expect(emailValidator('@example.com')).toBe(false);
      expect(emailValidator('test@example')).toBe(false);
    });
  });
});

describe('Validation Rule Executor', () => {
  describe('executeValidationRule', () => {
    it('should execute required validation rule', () => {
      const rule: ValidationRule = {
        type: 'required',
        message: 'Field is required',
      };

      expect(executeValidationRule(rule, '')).toEqual({
        isValid: false,
        error: 'Field is required',
      });

      expect(executeValidationRule(rule, 'test')).toEqual({
        isValid: true,
      });
    });

    it('should execute minLength validation rule', () => {
      const rule: ValidationRule = {
        type: 'minLength',
        value: 5,
        message: 'Must be at least 5 characters',
      };

      expect(executeValidationRule(rule, 'abc')).toEqual({
        isValid: false,
        error: 'Must be at least 5 characters',
      });

      expect(executeValidationRule(rule, 'abcdef')).toEqual({
        isValid: true,
      });
    });

    it('should execute custom validation rule', () => {
      const rule: ValidationRule = {
        type: 'custom',
        validator: (value: number) => value > 0,
        message: 'Must be positive',
      };

      expect(executeValidationRule(rule, -1)).toEqual({
        isValid: false,
        error: 'Must be positive',
      });

      expect(executeValidationRule(rule, 5)).toEqual({
        isValid: true,
      });
    });

    it('should handle unknown validation rule type', () => {
      const rule: ValidationRule = {
        type: 'unknown' as any,
        message: 'Unknown rule',
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = executeValidationRule(rule, 'test');

      expect(consoleSpy).toHaveBeenCalledWith('Unknown validation rule type: unknown');
      expect(result).toEqual({ isValid: true });

      consoleSpy.mockRestore();
    });
  });
});

describe('Field Validation', () => {
  describe('validateField', () => {
    it('should validate field with single rule', () => {
      const rules: ValidationRule[] = [
        {
          type: 'required',
          message: 'Field is required',
        },
      ];

      expect(validateField('name', '', rules)).toEqual({
        isValid: false,
        error: 'Field is required',
      });

      expect(validateField('name', 'test', rules)).toEqual({
        isValid: true,
      });
    });

    it('should validate field with multiple rules', () => {
      const rules: ValidationRule[] = [
        {
          type: 'required',
          message: 'Field is required',
        },
        {
          type: 'minLength',
          value: 5,
          message: 'Must be at least 5 characters',
        },
      ];

      expect(validateField('name', '', rules)).toEqual({
        isValid: false,
        error: 'Field is required',
      });

      expect(validateField('name', 'abc', rules)).toEqual({
        isValid: false,
        error: 'Must be at least 5 characters',
      });

      expect(validateField('name', 'abcdef', rules)).toEqual({
        isValid: true,
      });
    });

    it('should stop at first validation error', () => {
      const rules: ValidationRule[] = [
        {
          type: 'required',
          message: 'Field is required',
        },
        {
          type: 'minLength',
          value: 5,
          message: 'Must be at least 5 characters',
        },
      ];

      const result = validateField('name', '', rules);
      expect(result.error).toBe('Field is required');
    });
  });
});

describe('Form Validation', () => {
  describe('validateForm', () => {
    interface TestFormData {
      name: string;
      email: string;
      age: number;
    }

    const validationSchema: ValidationSchema<TestFormData> = {
      name: [
        {
          type: 'required',
          message: 'Name is required',
        },
        {
          type: 'minLength',
          value: 2,
          message: 'Name must be at least 2 characters',
        },
      ],
      email: [
        {
          type: 'required',
          message: 'Email is required',
        },
        {
          type: 'email',
          message: 'Must be a valid email',
        },
      ],
      age: [
        {
          type: 'min',
          value: 0,
          message: 'Age must be positive',
        },
      ],
    };

    it('should validate valid form data', () => {
      const formData: TestFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const result = validateForm(formData, validationSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should validate invalid form data', () => {
      const formData: TestFormData = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      const result = validateForm(formData, validationSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        name: 'Name is required',
        email: 'Must be a valid email',
        age: 'Age must be positive',
      });
    });

    it('should validate partially invalid form data', () => {
      const formData: TestFormData = {
        name: 'John',
        email: 'john@example.com',
        age: -5,
      };

      const result = validateForm(formData, validationSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        age: 'Age must be positive',
      });
    });
  });
});

describe('Common Validation Rules', () => {
  describe('commonValidationRules', () => {
    it('should create required rule with default message', () => {
      const rule = commonValidationRules.required();
      expect(rule).toEqual({
        type: 'required',
        message: 'This field is required',
      });
    });

    it('should create required rule with custom message', () => {
      const rule = commonValidationRules.required('Name is required');
      expect(rule).toEqual({
        type: 'required',
        message: 'Name is required',
      });
    });

    it('should create minLength rule', () => {
      const rule = commonValidationRules.minLength(5);
      expect(rule).toEqual({
        type: 'minLength',
        value: 5,
        message: 'Must be at least 5 characters',
      });
    });

    it('should create custom rule', () => {
      const validator = (value: number) => value > 0;
      const rule = commonValidationRules.custom(validator, 'Must be positive');
      expect(rule).toEqual({
        type: 'custom',
        validator,
        message: 'Must be positive',
      });
    });
  });
});

describe('Form-Specific Validation Helpers', () => {
  describe('positiveAmountValidator', () => {
    it('should return false for negative numbers', () => {
      expect(positiveAmountValidator(-1)).toBe(false);
    });

    it('should return false for zero', () => {
      expect(positiveAmountValidator(0)).toBe(false);
    });

    it('should return true for positive numbers', () => {
      expect(positiveAmountValidator(1)).toBe(true);
      expect(positiveAmountValidator(0.01)).toBe(true);
    });
  });

  describe('notFutureDateValidator', () => {
    it('should return true for empty value', () => {
      expect(notFutureDateValidator('')).toBe(true);
    });

    it('should return true for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(notFutureDateValidator(pastDate.toISOString())).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(notFutureDateValidator(today)).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(notFutureDateValidator(futureDate.toISOString())).toBe(false);
    });
  });

  describe('safeStringValidator', () => {
    it('should return true for empty value', () => {
      expect(safeStringValidator('')).toBe(true);
    });

    it('should return true for safe strings', () => {
      expect(safeStringValidator('Hello World')).toBe(true);
      expect(safeStringValidator('Test-123_456')).toBe(true);
      expect(safeStringValidator('Question?')).toBe(true);
      expect(safeStringValidator('Exclamation!')).toBe(true);
    });

    it('should return false for unsafe strings', () => {
      expect(safeStringValidator('<script>')).toBe(false);
      expect(safeStringValidator('test@email')).toBe(false);
      expect(safeStringValidator('test#hash')).toBe(false);
    });
  });

  describe('numericStringValidator', () => {
    it('should return true for empty value', () => {
      expect(numericStringValidator('')).toBe(true);
    });

    it('should return true for valid numeric strings', () => {
      expect(numericStringValidator('123')).toBe(true);
      expect(numericStringValidator('123.45')).toBe(true);
      expect(numericStringValidator('-123')).toBe(true);
      expect(numericStringValidator('0')).toBe(true);
    });

    it('should return false for invalid numeric strings', () => {
      expect(numericStringValidator('abc')).toBe(false);
      expect(numericStringValidator('12abc')).toBe(false);
      expect(numericStringValidator('Infinity')).toBe(false);
    });
  });
});

describe('Validation Schema Builders', () => {
  describe('createAccountNameValidation', () => {
    it('should create validation rules for account names', () => {
      const rules = createAccountNameValidation();
      expect(rules).toHaveLength(4);
      expect(rules[0].type).toBe('required');
      expect(rules[1].type).toBe('minLength');
      expect(rules[2].type).toBe('maxLength');
      expect(rules[3].type).toBe('custom');
    });
  });

  describe('createAmountValidation', () => {
    it('should create validation rules for amounts', () => {
      const rules = createAmountValidation();
      expect(rules).toHaveLength(3);
      expect(rules[0].type).toBe('required');
      expect(rules[1].type).toBe('min');
      expect(rules[2].type).toBe('max');
    });
  });

  describe('createDateValidation', () => {
    it('should create validation rules for dates', () => {
      const rules = createDateValidation();
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe('required');
      expect(rules[1].type).toBe('custom');
    });
  });

  describe('createCategoryNameValidation', () => {
    it('should create validation rules for category names', () => {
      const rules = createCategoryNameValidation();
      expect(rules).toHaveLength(4);
      expect(rules[0].type).toBe('required');
      expect(rules[1].type).toBe('minLength');
      expect(rules[2].type).toBe('maxLength');
      expect(rules[3].type).toBe('custom');
    });
  });

  describe('createDescriptionValidation', () => {
    it('should create validation rules for optional descriptions', () => {
      const rules = createDescriptionValidation(false);
      expect(rules).toHaveLength(2);
      expect(rules[0].type).toBe('maxLength');
      expect(rules[1].type).toBe('custom');
    });

    it('should create validation rules for required descriptions', () => {
      const rules = createDescriptionValidation(true);
      expect(rules).toHaveLength(3);
      expect(rules[0].type).toBe('required');
      expect(rules[1].type).toBe('maxLength');
      expect(rules[2].type).toBe('custom');
    });
  });
});

describe('Utility Functions', () => {
  describe('createDebouncedValidator', () => {
    it('should create a debounced validator function', () => {
      const mockValidator = jest.fn().mockReturnValue({ isValid: true, errors: {} });
      const debouncedValidator = createDebouncedValidator(mockValidator, 100);

      expect(typeof debouncedValidator).toBe('function');
    });

    it('should return a promise', () => {
      const mockValidator = jest.fn().mockReturnValue({ isValid: true, errors: {} });
      const debouncedValidator = createDebouncedValidator(mockValidator, 100);

      const result = debouncedValidator({ test: 'value' });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('formatValidationError', () => {
    it('should capitalize first letter of error message', () => {
      expect(formatValidationError('field is required')).toBe('Field is required');
      expect(formatValidationError('ALREADY CAPITALIZED')).toBe('ALREADY CAPITALIZED');
      expect(formatValidationError('')).toBe('');
    });
  });

  describe('hasValidationErrors', () => {
    it('should return false for empty errors object', () => {
      expect(hasValidationErrors({})).toBe(false);
    });

    it('should return false for errors with undefined values', () => {
      expect(hasValidationErrors({ name: undefined, email: undefined })).toBe(false);
    });

    it('should return false for errors with empty string values', () => {
      expect(hasValidationErrors({ name: '', email: '' })).toBe(false);
    });

    it('should return true for errors with actual error messages', () => {
      expect(hasValidationErrors({ name: 'Name is required' })).toBe(true);
    });
  });

  describe('getFirstValidationError', () => {
    it('should return undefined for empty errors object', () => {
      expect(getFirstValidationError({})).toBeUndefined();
    });

    it('should return undefined for errors with no actual messages', () => {
      expect(getFirstValidationError({ name: undefined, email: '' })).toBeUndefined();
    });

    it('should return first error message', () => {
      const errors = {
        name: 'Name is required',
        email: 'Email is invalid',
      };
      expect(getFirstValidationError(errors)).toBe('Name is required');
    });
  });
});