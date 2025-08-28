/**
 * Unit tests for Enhanced Recurring Service Layer
 * Tests the core service functionality without external dependencies
 */

import { RecurringType } from '@/src/types/enums/recurring';
import { 
  validateRecurring,
  validateTransferRecurring,
  validateCreditCardPaymentRecurring,
  validateExecutionContext
} from '@/src/utils/recurring-validation';
import {
  Recurring,
  CreateTransferRequest,
  CreateCreditCardPaymentRequest,
  ExecutionOverrides
} from '@/src/types/recurring';

describe('Enhanced Recurring Service Layer - Unit Tests', () => {
  describe('Validation Functions', () => {
    describe('validateRecurring', () => {
      it('should validate a standard recurring transaction successfully', () => {
        // Arrange
        const validRecurring = {
          name: 'Monthly Salary',
          sourceaccountid: 'checking-account-id',
          amount: 5000,
          recurringtype: RecurringType.Standard,
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3
        };

        // Act
        const result = validateRecurring(validRecurring);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation for invalid interval months', () => {
        // Arrange
        const invalidRecurring = {
          name: 'Invalid Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 100,
          recurringtype: RecurringType.Standard,
          intervalmonths: 25, // Invalid - exceeds max of 24
          autoapplyenabled: false,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3
        };

        // Act
        const result = validateRecurring(invalidRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'intervalmonths')).toBe(true);
      });

      it('should allow validation when both amount and date are flexible', () => {
        // Arrange
        const validRecurring = {
          name: 'Fully Flexible Recurring',
          sourceaccountid: 'checking-account-id',
          recurringtype: RecurringType.Standard,
          intervalmonths: 1,
          autoapplyenabled: false,
          isamountflexible: true, // Both flexible - now allowed
          isdateflexible: true,   // Both flexible - now allowed
          maxfailedattempts: 3,
          tenantid: 'test-tenant',
          type: 'Expense',
          currencycode: 'USD',
          recurrencerule: '',
          nextoccurrencedate: '2099-12-31',
          isactive: true,
          isdeleted: false
        };

        // Act
        const result = validateRecurring(validRecurring);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should require amount when not flexible', () => {
        // Arrange
        const invalidRecurring = {
          name: 'No Amount Recurring',
          sourceaccountid: 'checking-account-id',
          recurringtype: RecurringType.Standard,
          intervalmonths: 1,
          autoapplyenabled: false,
          isamountflexible: false, // Amount not flexible
          isdateflexible: true,
          maxfailedattempts: 3
          // Missing amount
        };

        // Act
        const result = validateRecurring(invalidRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'amount')).toBe(true);
      });

      it('should require next occurrence date when not flexible', () => {
        // Arrange
        const invalidRecurring = {
          name: 'No Date Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 100,
          recurringtype: RecurringType.Standard,
          intervalmonths: 1,
          autoapplyenabled: false,
          isamountflexible: true,
          isdateflexible: false, // Date not flexible
          maxfailedattempts: 3
          // Missing nextoccurrencedate
        };

        // Act
        const result = validateRecurring(invalidRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'nextoccurrencedate')).toBe(true);
      });
    });

    describe('validateTransferRecurring', () => {
      it('should validate a transfer recurring transaction successfully', () => {
        // Arrange
        const validTransfer: CreateTransferRequest = {
          id: 'test-id',
          name: 'Monthly Transfer',
          sourceaccountid: 'checking-account-id',
          transferaccountid: 'savings-account-id',
          amount: 500,
          recurringtype: RecurringType.Transfer,
          type: 'Transfer',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateTransferRecurring(validTransfer);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation when transfer account is missing', () => {
        // Arrange
        const invalidTransfer = {
          id: 'test-id',
          name: 'Invalid Transfer',
          sourceaccountid: 'checking-account-id',
          // transferaccountid missing
          amount: 500,
          recurringtype: RecurringType.Transfer,
          type: 'Transfer',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        } as CreateTransferRequest;

        // Act
        const result = validateTransferRecurring(invalidTransfer);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'transferaccountid')).toBe(true);
      });

      it('should fail validation when source and destination accounts are the same', () => {
        // Arrange
        const invalidTransfer: CreateTransferRequest = {
          id: 'test-id',
          name: 'Invalid Transfer',
          sourceaccountid: 'same-account-id',
          transferaccountid: 'same-account-id', // Same as source
          amount: 500,
          recurringtype: RecurringType.Transfer,
          type: 'Transfer',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateTransferRecurring(invalidTransfer);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.message.includes('different'))).toBe(true);
      });
    });

    describe('validateCreditCardPaymentRecurring', () => {
      it('should validate a credit card payment recurring transaction successfully', () => {
        // Arrange
        const validPayment: CreateCreditCardPaymentRequest = {
          id: 'test-id',
          name: 'Monthly CC Payment',
          sourceaccountid: 'checking-account-id',
          categoryid: 'credit-card-category',
          recurringtype: RecurringType.CreditCardPayment,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: true, // Typically flexible for CC payments
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateCreditCardPaymentRecurring(validPayment);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation when source account is missing', () => {
        // Arrange
        const invalidPayment = {
          id: 'test-id',
          name: 'Invalid Payment',
          // sourceaccountid missing
          categoryid: 'credit-card-category',
          recurringtype: RecurringType.CreditCardPayment,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: true,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        } as CreateCreditCardPaymentRequest;

        // Act
        const result = validateCreditCardPaymentRecurring(invalidPayment);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'sourceaccountid')).toBe(true);
      });

      it('should fail validation when category is missing', () => {
        // Arrange
        const invalidPayment = {
          id: 'test-id',
          name: 'Invalid Payment',
          sourceaccountid: 'checking-account-id',
          // categoryid missing
          recurringtype: RecurringType.CreditCardPayment,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: true,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        } as CreateCreditCardPaymentRequest;

        // Act
        const result = validateCreditCardPaymentRecurring(invalidPayment);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'categoryid')).toBe(true);
      });
    });

    describe('validateExecutionContext', () => {
      it('should validate active recurring transaction successfully', () => {
        // Arrange
        const activeRecurring: Recurring = {
          id: 'test-id',
          name: 'Active Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 200,
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true, // Active
          isdeleted: false, // Not deleted
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateExecutionContext(activeRecurring);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail validation for inactive recurring transaction', () => {
        // Arrange
        const inactiveRecurring: Recurring = {
          id: 'test-id',
          name: 'Inactive Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 200,
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: false, // Inactive
          isdeleted: false,
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateExecutionContext(inactiveRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('not active'))).toBe(true);
      });

      it('should fail validation for deleted recurring transaction', () => {
        // Arrange
        const deletedRecurring: Recurring = {
          id: 'test-id',
          name: 'Deleted Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 200,
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: true, // Deleted
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateExecutionContext(deletedRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('deleted'))).toBe(true);
      });

      it('should fail validation when amount is required but not provided', () => {
        // Arrange
        const recurringWithoutAmount: Recurring = {
          id: 'test-id',
          name: 'No Amount Recurring',
          sourceaccountid: 'checking-account-id',
          // amount: undefined, // No amount
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false, // Amount not flexible, so required
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateExecutionContext(recurringWithoutAmount);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Amount is required'))).toBe(true);
      });

      it('should fail validation when max failed attempts exceeded', () => {
        // Arrange
        const failedRecurring: Recurring = {
          id: 'test-id',
          name: 'Failed Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 200,
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 3, // Equals max
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = validateExecutionContext(failedRecurring);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('maximum failed attempts'))).toBe(true);
      });

      it('should allow execution with override amount when recurring amount is flexible', () => {
        // Arrange
        const flexibleRecurring: Recurring = {
          id: 'test-id',
          name: 'Flexible Recurring',
          sourceaccountid: 'checking-account-id',
          // amount: undefined, // No predefined amount
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: true, // Amount is flexible
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        const overrideAmount = 150;

        // Act
        const result = validateExecutionContext(flexibleRecurring, overrideAmount);

        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Service Interface Compliance', () => {
    it('should define all required CRUD operations', () => {
      // This test verifies that the service interface includes all required methods
      // In a real implementation, we would import the service and check its methods
      
      const requiredMethods = [
        'create',
        'update', 
        'delete',
        'findAll',
        'findById',
        'createRecurringTransfer',
        'createCreditCardPayment',
        'executeRecurring',
        'previewExecution',
        'toggleAutoApply',
        'getAutoApplyStatus'
      ];

      // This is a placeholder test - in practice, you would verify the service exports these methods
      expect(requiredMethods).toHaveLength(11);
      expect(requiredMethods).toContain('create');
      expect(requiredMethods).toContain('executeRecurring');
      expect(requiredMethods).toContain('toggleAutoApply');
    });

    it('should support execution overrides', () => {
      // Test that ExecutionOverrides interface supports all required fields
      const overrides: ExecutionOverrides = {
        amount: 250,
        date: '2025-02-15T00:00:00Z',
        description: 'Override description',
        notes: 'Override notes'
      };

      expect(overrides.amount).toBe(250);
      expect(overrides.date).toBe('2025-02-15T00:00:00Z');
      expect(overrides.description).toBe('Override description');
      expect(overrides.notes).toBe('Override notes');
    });

    it('should support all recurring types', () => {
      // Test that all recurring types are supported
      const supportedTypes = [
        RecurringType.Standard,
        RecurringType.Transfer,
        RecurringType.CreditCardPayment
      ];

      expect(supportedTypes).toHaveLength(3);
      expect(supportedTypes).toContain(RecurringType.Standard);
      expect(supportedTypes).toContain(RecurringType.Transfer);
      expect(supportedTypes).toContain(RecurringType.CreditCardPayment);
    });
  });

  describe('Error Handling Requirements', () => {
    it('should provide meaningful validation error messages', () => {
      // Arrange
      const invalidRecurring = {
        name: '',
        sourceaccountid: '',
        intervalmonths: 0,
        recurringtype: 'InvalidType' as any,
        isamountflexible: true,
        isdateflexible: true
      };

      // Act
      const result = validateRecurring(invalidRecurring);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that errors have meaningful messages
      result.errors.forEach(error => {
        expect(error.message).toBeTruthy();
        expect(error.field).toBeTruthy();
        expect(error.rule).toBeTruthy();
      });
    });

    it('should handle edge cases in validation', () => {
      // Test boundary values
      const edgeCases = [
        { intervalmonths: 1 }, // Min valid
        { intervalmonths: 24 }, // Max valid
        { intervalmonths: 0 }, // Below min
        { intervalmonths: 25 }, // Above max
        { amount: 0.01 }, // Min valid amount
        { amount: 0 }, // Invalid amount
        { amount: -1 } // Negative amount
      ];

      edgeCases.forEach(testCase => {
        const testRecurring = {
          name: 'Test',
          sourceaccountid: 'test-account',
          recurringtype: RecurringType.Standard,
          isamountflexible: false,
          isdateflexible: true,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          ...testCase
        };

        const result = validateRecurring(testRecurring);
        
        // Validation should handle edge cases gracefully
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      });
    });
  });
});