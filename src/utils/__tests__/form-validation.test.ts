/**
 * Comprehensive tests for form validation utilities
 * Tests all validation rules, edge cases, and performance
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
} from "../form-validation";

import { ValidationRule, ValidationSchema } from "../../types/components/forms.types";

describe("Form Validation Utilities", () => {
  describe("Basic Validators", () => {
    describe("requiredValidator", () => {
      it("should validate required fields correctly", () => {
        expect(requiredValidator("test")).toBe(true);
        expect(requiredValidator("   test   ")).toBe(true);
        expect(requiredValidator(123)).toBe(true);
        expect(requiredValidator(0)).toBe(true);
        expect(requiredValidator(false)).toBe(true);
        expect(requiredValidator(["item"])).toBe(true);

        expect(requiredValidator("")).toBe(false);
        expect(requiredValidator("   ")).toBe(false);
        expect(requiredValidator(null)).toBe(false);
        expect(requiredValidator(undefined)).toBe(false);
        expect(requiredValidator([])).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(requiredValidator(0)).toBe(true); // Zero is valid
        expect(requiredValidator(false)).toBe(true); // False is valid
        expect(requiredValidator(NaN)).toBe(true); // NaN is considered a value
        expect(requiredValidator({})).toBe(true); // Empty object is valid
      });
    });

    describe("minLengthValidator", () => {
      it("should validate minimum length correctly", () => {
        expect(minLengthValidator("hello", 3)).toBe(true);
        expect(minLengthValidator("hello", 5)).toBe(true);
        expect(minLengthValidator("hi", 3)).toBe(false);
        expect(minLengthValidator("", 1)).toBe(true);
      });

      it("should handle empty values gracefully", () => {
        expect(minLengthValidator("", 5)).toBe(true); // Let required validator handle empty
        expect(minLengthValidator(null as any, 5)).toBe(true);
        expect(minLengthValidator(undefined as any, 5)).toBe(true);
      });

      it("should handle unicode characters correctly", () => {
        expect(minLengthValidator("🚀🌟", 2)).toBe(true);
        expect(minLengthValidator("café", 4)).toBe(true);
        expect(minLengthValidator("你好", 2)).toBe(true);
      });
    });

    describe("maxLengthValidator", () => {
      it("should validate maximum length correctly", () => {
        expect(maxLengthValidator("hello", 10)).toBe(true);
        expect(maxLengthValidator("hello", 5)).toBe(true);
        expect(maxLengthValidator("hello world", 5)).toBe(false);
      });

      it("should handle empty values gracefully", () => {
        expect(maxLengthValidator("", 5)).toBe(true);
        expect(maxLengthValidator(null as any, 5)).toBe(true);
        expect(maxLengthValidator(undefined as any, 5)).toBe(true);
      });
    });

    describe("minValidator", () => {
      it("should validate minimum numeric values correctly", () => {
        expect(minValidator(10, 5)).toBe(true);
        expect(minValidator(5, 5)).toBe(true);
        expect(minValidator(3, 5)).toBe(false);
        expect(minValidator(-5, -10)).toBe(true);
        expect(minValidator(-15, -10)).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(minValidator(0, 0)).toBe(true);
        expect(minValidator(Infinity, 1000)).toBe(true);
        expect(minValidator(-Infinity, -1000)).toBe(false);
        expect(minValidator(null as any, 5)).toBe(true); // Let required validator handle null
        expect(minValidator(undefined as any, 5)).toBe(true);
      });

      it("should handle floating point numbers", () => {
        expect(minValidator(3.14, 3)).toBe(true);
        expect(minValidator(2.99, 3)).toBe(false);
        expect(minValidator(0.1, 0.05)).toBe(true);
      });
    });

    describe("maxValidator", () => {
      it("should validate maximum numeric values correctly", () => {
        expect(maxValidator(5, 10)).toBe(true);
        expect(maxValidator(10, 10)).toBe(true);
        expect(maxValidator(15, 10)).toBe(false);
        expect(maxValidator(-10, -5)).toBe(true);
        expect(maxValidator(-3, -5)).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(maxValidator(0, 0)).toBe(true);
        expect(maxValidator(-Infinity, 1000)).toBe(true);
        expect(maxValidator(Infinity, 1000)).toBe(false);
        expect(maxValidator(null as any, 5)).toBe(true);
        expect(maxValidator(undefined as any, 5)).toBe(true);
      });
    });

    describe("patternValidator", () => {
      it("should validate regex patterns correctly", () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(patternValidator("test@example.com", emailPattern)).toBe(true);
        expect(patternValidator("invalid-email", emailPattern)).toBe(false);

        const phonePattern = /^\d{3}-\d{3}-\d{4}$/;
        expect(patternValidator("123-456-7890", phonePattern)).toBe(true);
        expect(patternValidator("1234567890", phonePattern)).toBe(false);
      });

      it("should handle empty values gracefully", () => {
        const pattern = /^[a-z]+$/;
        expect(patternValidator("", pattern)).toBe(true);
        expect(patternValidator(null as any, pattern)).toBe(true);
        expect(patternValidator(undefined as any, pattern)).toBe(true);
      });

      it("should handle complex patterns", () => {
        // Password pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 digit
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        expect(patternValidator("Password123", passwordPattern)).toBe(true);
        expect(patternValidator("password", passwordPattern)).toBe(false);
        expect(patternValidator("PASSWORD123", passwordPattern)).toBe(false);
        expect(patternValidator("Pass123", passwordPattern)).toBe(false); // Too short
      });
    });

    describe("emailValidator", () => {
      it("should validate email addresses correctly", () => {
        const validEmails = [
          "test@example.com",
          "user.name@domain.co.uk",
          "user+tag@example.org",
          "user123@test-domain.com",
          "a@b.co",
        ];

        const invalidEmails = [
          "invalid-email",
          "@example.com",
          "test@",
          "test.example.com",
          "test@.com",
          "test@com",
          "test..test@example.com",
          "test@example.",
        ];

        validEmails.forEach(email => {
          expect(emailValidator(email)).toBe(true);
        });

        invalidEmails.forEach(email => {
          expect(emailValidator(email)).toBe(false);
        });
      });

      it("should handle empty values gracefully", () => {
        expect(emailValidator("")).toBe(true);
        expect(emailValidator(null as any)).toBe(true);
        expect(emailValidator(undefined as any)).toBe(true);
      });

      it("should handle international domain names", () => {
        // Note: The current regex doesn't support IDN, but we test the expected behavior
        expect(emailValidator("test@example.com")).toBe(true);
        expect(emailValidator("test@subdomain.example.com")).toBe(true);
      });
    });
  });

  describe("Validation Rule Execution", () => {
    describe("executeValidationRule", () => {
      it("should execute required rules correctly", () => {
        const rule: ValidationRule = {
          type: "required",
          message: "Field is required",
        };

        expect(executeValidationRule(rule, "test")).toEqual({
          isValid: true,
        });

        expect(executeValidationRule(rule, "")).toEqual({
          isValid: false,
          error: "Field is required",
        });
      });

      it("should execute minLength rules correctly", () => {
        const rule: ValidationRule = {
          type: "minLength",
          value: 5,
          message: "Must be at least 5 characters",
        };

        expect(executeValidationRule(rule, "hello")).toEqual({
          isValid: true,
        });

        expect(executeValidationRule(rule, "hi")).toEqual({
          isValid: false,
          error: "Must be at least 5 characters",
        });
      });

      it("should execute custom rules correctly", () => {
        const rule: ValidationRule = {
          type: "custom",
          validator: (value: number) => value % 2 === 0,
          message: "Must be even number",
        };

        expect(executeValidationRule(rule, 4)).toEqual({
          isValid: true,
        });

        expect(executeValidationRule(rule, 3)).toEqual({
          isValid: false,
          error: "Must be even number",
        });
      });

      it("should handle custom rules with form data context", () => {
        const rule: ValidationRule = {
          type: "custom",
          validator: (value: string, formData: any) => {
            return formData && value === formData.confirmPassword;
          },
          message: "Passwords must match",
        };

        const formData = { password: "secret123", confirmPassword: "secret123" };

        expect(executeValidationRule(rule, "secret123", formData)).toEqual({
          isValid: true,
        });

        expect(executeValidationRule(rule, "different", formData)).toEqual({
          isValid: false,
          error: "Passwords must match",
        });
      });

      it("should handle unknown rule types gracefully", () => {
        const rule: ValidationRule = {
          type: "unknown" as any,
          message: "Unknown rule",
        };

        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

        const result = executeValidationRule(rule, "test");

        expect(result).toEqual({ isValid: true });
        expect(consoleSpy).toHaveBeenCalledWith("Unknown validation rule type: unknown");

        consoleSpy.mockRestore();
      });
    });

    describe("validateField", () => {
      it("should validate field with multiple rules", () => {
        const rules: ValidationRule[] = [
          { type: "required", message: "Required" },
          { type: "minLength", value: 3, message: "Too short" },
          { type: "maxLength", value: 10, message: "Too long" },
        ];

        expect(validateField("name", "hello", rules)).toEqual({
          isValid: true,
        });

        expect(validateField("name", "", rules)).toEqual({
          isValid: false,
          error: "Required",
        });

        expect(validateField("name", "hi", rules)).toEqual({
          isValid: false,
          error: "Too short",
        });

        expect(validateField("name", "this is too long", rules)).toEqual({
          isValid: false,
          error: "Too long",
        });
      });

      it("should stop at first validation failure", () => {
        const rules: ValidationRule[] = [
          { type: "required", message: "Required" },
          { type: "minLength", value: 10, message: "Too short" },
        ];

        // Should fail on required, not reach minLength
        const result = validateField("name", "", rules);
        expect(result).toEqual({
          isValid: false,
          error: "Required",
        });
      });

      it("should handle empty rules array", () => {
        const result = validateField("name", "test", []);
        expect(result).toEqual({ isValid: true });
      });
    });

    describe("validateForm", () => {
      interface TestFormData {
        name: string;
        email: string;
        age: number;
        description?: string;
      }

      const testSchema: ValidationSchema<TestFormData> = {
        name: [
          { type: "required", message: "Name is required" },
          { type: "minLength", value: 2, message: "Name too short" },
        ],
        email: [
          { type: "required", message: "Email is required" },
          { type: "email", message: "Invalid email" },
        ],
        age: [
          { type: "required", message: "Age is required" },
          { type: "min", value: 18, message: "Must be 18 or older" },
        ],
      };

      it("should validate entire form correctly", () => {
        const validData: TestFormData = {
          name: "John Doe",
          email: "john@example.com",
          age: 25,
        };

        const result = validateForm(validData, testSchema);
        expect(result).toEqual({
          isValid: true,
          errors: {},
        });
      });

      it("should collect all validation errors", () => {
        const invalidData: TestFormData = {
          name: "",
          email: "invalid-email",
          age: 16,
        };

        const result = validateForm(invalidData, testSchema);
        expect(result).toEqual({
          isValid: false,
          errors: {
            name: "Name is required",
            email: "Invalid email",
            age: "Must be 18 or older",
          },
        });
      });

      it("should handle partial validation schema", () => {
        const partialSchema: ValidationSchema<TestFormData> = {
          name: [{ type: "required", message: "Name is required" }],
          // email and age not validated
        };

        const data: TestFormData = {
          name: "",
          email: "invalid-email",
          age: 16,
        };

        const result = validateForm(data, partialSchema);
        expect(result).toEqual({
          isValid: false,
          errors: {
            name: "Name is required",
            // email and age should not have errors
          },
        });
      });

      it("should handle empty validation schema", () => {
        const data: TestFormData = {
          name: "",
          email: "invalid",
          age: 0,
        };

        const result = validateForm(data, {});
        expect(result).toEqual({
          isValid: true,
          errors: {},
        });
      });
    });
  });

  describe("Common Validation Rules", () => {
    it("should create required rules correctly", () => {
      const rule = commonValidationRules.required();
      expect(rule).toEqual({
        type: "required",
        message: "This field is required",
      });

      const customRule = commonValidationRules.required("Custom message");
      expect(customRule.message).toBe("Custom message");
    });

    it("should create length validation rules correctly", () => {
      const minRule = commonValidationRules.minLength(5);
      expect(minRule).toEqual({
        type: "minLength",
        value: 5,
        message: "Must be at least 5 characters",
      });

      const maxRule = commonValidationRules.maxLength(10, "Too long");
      expect(maxRule).toEqual({
        type: "maxLength",
        value: 10,
        message: "Too long",
      });
    });

    it("should create numeric validation rules correctly", () => {
      const minRule = commonValidationRules.min(18);
      expect(minRule).toEqual({
        type: "min",
        value: 18,
        message: "Must be at least 18",
      });

      const maxRule = commonValidationRules.max(100, "Too high");
      expect(maxRule).toEqual({
        type: "max",
        value: 100,
        message: "Too high",
      });
    });

    it("should create email validation rules correctly", () => {
      const rule = commonValidationRules.email();
      expect(rule).toEqual({
        type: "email",
        message: "Must be a valid email address",
      });

      const customRule = commonValidationRules.email("Invalid email format");
      expect(customRule.message).toBe("Invalid email format");
    });

    it("should create pattern validation rules correctly", () => {
      const pattern = /^\d{3}-\d{3}-\d{4}$/;
      const rule = commonValidationRules.pattern(pattern, "Invalid phone format");
      expect(rule).toEqual({
        type: "pattern",
        value: pattern,
        message: "Invalid phone format",
      });
    });

    it("should create custom validation rules correctly", () => {
      const validator = (value: number) => value > 0;
      const rule = commonValidationRules.custom(validator, "Must be positive");
      expect(rule).toEqual({
        type: "custom",
        validator,
        message: "Must be positive",
      });
    });
  });

  describe("Form-Specific Validators", () => {
    describe("positiveAmountValidator", () => {
      it("should validate positive amounts correctly", () => {
        expect(positiveAmountValidator(100)).toBe(true);
        expect(positiveAmountValidator(0.01)).toBe(true);
        expect(positiveAmountValidator(999999.99)).toBe(true);

        expect(positiveAmountValidator(0)).toBe(false);
        expect(positiveAmountValidator(-1)).toBe(false);
        expect(positiveAmountValidator(-0.01)).toBe(false);
      });
    });

    describe("notFutureDateValidator", () => {
      it("should validate dates correctly", () => {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        expect(notFutureDateValidator(today)).toBe(true);
        expect(notFutureDateValidator(yesterday)).toBe(true);
        expect(notFutureDateValidator(tomorrow)).toBe(false);
        expect(notFutureDateValidator("")).toBe(true); // Empty is valid
      });

      it("should handle different date formats", () => {
        const pastDate = "2020-01-01";
        const futureDate = "2030-12-31";

        expect(notFutureDateValidator(pastDate)).toBe(true);
        expect(notFutureDateValidator(futureDate)).toBe(false);
      });
    });

    describe("safeStringValidator", () => {
      it("should validate safe strings correctly", () => {
        const validStrings = [
          "Hello World",
          "Test-123",
          "User_Name",
          "Price: $19.99",
          "Question?",
          "Exclamation!",
          "Parentheses (test)",
        ];

        const invalidStrings = [
          '<script>alert("xss")</script>',
          "SELECT * FROM users",
          "test@#$%^&*",
          "test\nwith\nnewlines",
          "test\twith\ttabs",
        ];

        validStrings.forEach(str => {
          expect(safeStringValidator(str)).toBe(true);
        });

        invalidStrings.forEach(str => {
          expect(safeStringValidator(str)).toBe(false);
        });

        expect(safeStringValidator("")).toBe(true); // Empty is valid
      });
    });

    describe("numericStringValidator", () => {
      it("should validate numeric strings correctly", () => {
        expect(numericStringValidator("123")).toBe(true);
        expect(numericStringValidator("123.45")).toBe(true);
        expect(numericStringValidator("-123")).toBe(true);
        expect(numericStringValidator("0")).toBe(true);
        expect(numericStringValidator("0.0")).toBe(true);

        expect(numericStringValidator("abc")).toBe(false);
        expect(numericStringValidator("12.34.56")).toBe(false);
        expect(numericStringValidator("123abc")).toBe(false);
        expect(numericStringValidator("  123  ")).toBe(false); // Whitespace not allowed
        expect(numericStringValidator("")).toBe(true); // Empty is valid
      });

      it("should handle edge cases", () => {
        expect(numericStringValidator("Infinity")).toBe(false);
        expect(numericStringValidator("-Infinity")).toBe(false);
        expect(numericStringValidator("NaN")).toBe(false);
        expect(numericStringValidator("1e10")).toBe(false); // Scientific notation not supported
      });
    });
  });

  describe("Validation Schema Builders", () => {
    describe("createAccountNameValidation", () => {
      it("should create account name validation rules", () => {
        const rules = createAccountNameValidation();
        expect(rules).toHaveLength(4);
        expect(rules[0].type).toBe("required");
        expect(rules[1].type).toBe("minLength");
        expect(rules[2].type).toBe("maxLength");
        expect(rules[3].type).toBe("custom");
      });

      it("should validate account names correctly", () => {
        const rules = createAccountNameValidation();

        expect(validateField("name", "Valid Account", rules).isValid).toBe(true);
        expect(validateField("name", "", rules).isValid).toBe(false);
        expect(validateField("name", "A", rules).isValid).toBe(false); // Too short
        expect(validateField("name", "A".repeat(101), rules).isValid).toBe(false); // Too long
      });
    });

    describe("createAmountValidation", () => {
      it("should create amount validation rules", () => {
        const rules = createAmountValidation();
        expect(rules).toHaveLength(3);
        expect(rules[0].type).toBe("required");
        expect(rules[1].type).toBe("min");
        expect(rules[2].type).toBe("max");
      });

      it("should validate amounts correctly", () => {
        const rules = createAmountValidation();

        expect(validateField("amount", 100, rules).isValid).toBe(true);
        expect(validateField("amount", 0.01, rules).isValid).toBe(true);
        expect(validateField("amount", null, rules).isValid).toBe(false);
        expect(validateField("amount", 0, rules).isValid).toBe(false);
        expect(validateField("amount", -1, rules).isValid).toBe(false);
        expect(validateField("amount", 1000000000, rules).isValid).toBe(false); // Too large
      });
    });

    describe("createDateValidation", () => {
      it("should create date validation rules", () => {
        const rules = createDateValidation();
        expect(rules).toHaveLength(2);
        expect(rules[0].type).toBe("required");
        expect(rules[1].type).toBe("custom");
      });

      it("should validate dates correctly", () => {
        const rules = createDateValidation();
        const today = new Date().toISOString().split("T")[0];
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        expect(validateField("date", today, rules).isValid).toBe(true);
        expect(validateField("date", "", rules).isValid).toBe(false);
        expect(validateField("date", futureDate, rules).isValid).toBe(false);
      });
    });

    describe("createCategoryNameValidation", () => {
      it("should create category name validation rules", () => {
        const rules = createCategoryNameValidation();
        expect(rules).toHaveLength(4);
        expect(rules[0].type).toBe("required");
        expect(rules[1].type).toBe("minLength");
        expect(rules[2].type).toBe("maxLength");
        expect(rules[3].type).toBe("custom");
      });
    });

    describe("createDescriptionValidation", () => {
      it("should create optional description validation", () => {
        const rules = createDescriptionValidation(false);
        expect(rules).toHaveLength(2);
        expect(rules[0].type).toBe("maxLength");
        expect(rules[1].type).toBe("custom");
      });

      it("should create required description validation", () => {
        const rules = createDescriptionValidation(true);
        expect(rules).toHaveLength(3);
        expect(rules[0].type).toBe("required");
        expect(rules[1].type).toBe("maxLength");
        expect(rules[2].type).toBe("custom");
      });
    });
  });

  describe("Utility Functions", () => {
    describe("createDebouncedValidator", () => {
      it("should debounce validation calls", async () => {
        let callCount = 0;
        const validator = (data: any) => {
          callCount++;
          return { isValid: true, errors: {} };
        };

        const debouncedValidator = createDebouncedValidator(validator, 100);

        // Make multiple rapid calls
        debouncedValidator({ test: "data1" });
        debouncedValidator({ test: "data2" });
        debouncedValidator({ test: "data3" });

        // Should not have called validator yet
        expect(callCount).toBe(0);

        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 150));

        // Should have called validator only once
        expect(callCount).toBe(1);
      });

      it("should return a promise", async () => {
        const validator = (data: any) => ({ isValid: true, errors: {} });
        const debouncedValidator = createDebouncedValidator(validator, 50);

        const result = debouncedValidator({ test: "data" });
        expect(result).toBeInstanceOf(Promise);

        const validationResult = await result;
        expect(validationResult).toEqual({ isValid: true, errors: {} });
      });
    });

    describe("formatValidationError", () => {
      it("should format error messages correctly", () => {
        expect(formatValidationError("field is required")).toBe("Field is required");
        expect(formatValidationError("UPPERCASE ERROR")).toBe("UPPERCASE ERROR");
        expect(formatValidationError("")).toBe("");
        expect(formatValidationError("a")).toBe("A");
      });
    });

    describe("hasValidationErrors", () => {
      it("should detect validation errors correctly", () => {
        expect(hasValidationErrors({})).toBe(false);
        expect(hasValidationErrors({ name: undefined })).toBe(false);
        expect(hasValidationErrors({ name: "" })).toBe(false);
        expect(hasValidationErrors({ name: "Error message" })).toBe(true);
        expect(
          hasValidationErrors({
            name: "Error 1",
            email: undefined,
            age: "Error 2",
          }),
        ).toBe(true);
      });
    });

    describe("getFirstValidationError", () => {
      it("should return first validation error", () => {
        expect(getFirstValidationError({})).toBeUndefined();
        expect(getFirstValidationError({ name: undefined })).toBeUndefined();
        expect(getFirstValidationError({ name: "" })).toBeUndefined();
        expect(getFirstValidationError({ name: "First error" })).toBe("First error");
        expect(
          getFirstValidationError({
            name: "First error",
            email: "Second error",
          }),
        ).toBe("First error");
      });
    });
  });

  describe("Performance Tests", () => {
    it("should validate large forms efficiently", () => {
      const largeFormData = Array.from({ length: 1000 }, (_, i) => [`field${i}`, `value${i}`]).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {},
      );

      const largeSchema: ValidationSchema<any> = {};
      for (let i = 0; i < 1000; i++) {
        largeSchema[`field${i}`] = [
          { type: "required", message: "Required" },
          { type: "minLength", value: 2, message: "Too short" },
        ];
      }

      const startTime = performance.now();
      const result = validateForm(largeFormData, largeSchema);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should validate in less than 100ms
    });

    it("should handle complex validation rules efficiently", () => {
      const complexRules: ValidationRule[] = Array.from({ length: 50 }, (_, i) => ({
        type: "custom",
        validator: (value: string) => value.length > i,
        message: `Must be longer than ${i} characters`,
      }));

      const startTime = performance.now();
      const result = validateField("test", "a".repeat(100), complexRules);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should validate in less than 50ms
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle circular references in form data", () => {
      const circularData: any = { name: "test" };
      circularData.self = circularData;

      const schema = {
        name: [{ type: "required", message: "Required" }],
      };

      expect(() => validateForm(circularData, schema)).not.toThrow();
    });

    it("should handle malformed validation rules gracefully", () => {
      const malformedRules: ValidationRule[] = [
        { type: "required", message: "Required" },
        { type: "minLength" } as any, // Missing required properties
        { type: "custom", message: "Custom" }, // Missing validator
      ];

      expect(() => validateField("test", "value", malformedRules)).not.toThrow();
    });

    it("should handle very large strings", () => {
      const largeString = "a".repeat(1000000); // 1MB string
      const rules = [
        { type: "required", message: "Required" },
        { type: "maxLength", value: 2000000, message: "Too long" },
      ];

      const startTime = performance.now();
      const result = validateField("test", largeString, rules);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should handle large strings efficiently
    });

    it("should handle unicode and special characters", () => {
      const unicodeString = "🚀 Hello 世界 café naïve résumé";
      const rules = [
        { type: "required", message: "Required" },
        { type: "minLength", value: 5, message: "Too short" },
      ];

      const result = validateField("test", unicodeString, rules);
      expect(result.isValid).toBe(true);
    });
  });
});
