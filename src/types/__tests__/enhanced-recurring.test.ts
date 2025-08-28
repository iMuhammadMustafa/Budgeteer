import { 
  EnhancedRecurring, 
  RecurringValidationRules,
  CreateTransferRequest,
  CreateCreditCardPaymentRequest,
  DEFAULT_AUTO_APPLY_SETTINGS
} from '../enhanced-recurring';
import { RecurringType } from '../enums/recurring';
import { 
  validateRecurring,
  validateTransferRecurring,
  validateCreditCardPaymentRecurring,
  validateIntervalMonths,
  getDefaultEnhancedRecurringValues,
  isRecurringDue,
  calculateNextOccurrence,
  validateEnhancedRecurring,
  isEnhancedRecurring
} from '../../utils/recurring-validation';

describe('Enhanced Recurring Transaction Types', () => {
  describe('RecurringType Enum', () => {
    it('should have correct enum values', () => {
      expect(RecurringType.Standard).toBe('Standard');
      expect(RecurringType.Transfer).toBe('Transfer');
      expect(RecurringType.CreditCardPayment).toBe('CreditCardPayment');
    });
  });

  describe('Validation Rules', () => {
    it('should have correct interval months constraints', () => {
      expect(RecurringValidationRules.intervalMonths.min).toBe(1);
      expect(RecurringValidationRules.intervalMonths.max).toBe(24);
      expect(RecurringValidationRules.intervalMonths.required).toBe(true);
    });

    it('should have correct recurring type enum', () => {
      expect(RecurringValidationRules.recurringType.enum).toContain(RecurringType.Standard);
      expect(RecurringValidationRules.recurringType.enum).toContain(RecurringType.Transfer);
      expect(RecurringValidationRules.recurringType.enum).toContain(RecurringType.CreditCardPayment);
    });
  });

  describe('Default Values', () => {
    it('should provide correct default values', () => {
      const defaults = getDefaultEnhancedRecurringValues();
      
      expect(defaults.intervalmonths).toBe(1);
      expect(defaults.autoapplyenabled).toBe(false);
      expect(defaults.isamountflexible).toBe(false);
      expect(defaults.isdateflexible).toBe(false);
      expect(defaults.recurringtype).toBe(RecurringType.Standard);
      expect(defaults.failedattempts).toBe(0);
      expect(defaults.maxfailedattempts).toBe(3);
      expect(defaults.transferaccountid).toBeNull();
      expect(defaults.lastautoappliedat).toBeNull();
    });
  });

  describe('Auto Apply Settings', () => {
    it('should have correct default auto apply settings', () => {
      expect(DEFAULT_AUTO_APPLY_SETTINGS.globalEnabled).toBe(true);
      expect(DEFAULT_AUTO_APPLY_SETTINGS.maxBatchSize).toBe(50);
      expect(DEFAULT_AUTO_APPLY_SETTINGS.timeoutMs).toBe(30000);
      expect(DEFAULT_AUTO_APPLY_SETTINGS.retryAttempts).toBe(3);
    });
  });
});

describe('Enhanced Recurring Validation', () => {
  const validRecurring: Partial<EnhancedRecurring> = {
    id: 'test-id',
    name: 'Test Recurring',
    sourceaccountid: 'account-1',
    amount: 100,
    intervalmonths: 1,
    autoapplyenabled: false,
    isamountflexible: false,
    isdateflexible: false,
    recurringtype: RecurringType.Standard,
    nextoccurrencedate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    failedattempts: 0,
    maxfailedattempts: 3
  };

  describe('Basic Validation', () => {
    it('should validate a valid recurring transaction', () => {
      const result = validateRecurring(validRecurring);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid interval months', () => {
      const invalid = { ...validRecurring, intervalmonths: 0 };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'intervalmonths')).toBe(true);
    });

    it('should reject interval months above maximum', () => {
      const invalid = { ...validRecurring, intervalmonths: 25 };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'intervalmonths')).toBe(true);
    });

    it('should reject non-integer interval months', () => {
      const invalid = { ...validRecurring, intervalmonths: 1.5 };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'intervalmonths')).toBe(true);
    });

    it('should allow both amount and date flexible', () => {
      const valid = { 
        ...validRecurring, 
        isamountflexible: true, 
        isdateflexible: true,
        nextoccurrencedate: '2099-12-31', // Placeholder for flexible date
        recurrencerule: '' // Empty for flexible date
      };
      const result = validateRecurring(valid);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Transfer Validation', () => {
    it('should validate a valid transfer recurring transaction', () => {
      const transfer: Partial<EnhancedRecurring> = {
        ...validRecurring,
        recurringtype: RecurringType.Transfer,
        transferaccountid: 'account-2'
      };
      const result = validateTransferRecurring(transfer);
      expect(result.isValid).toBe(true);
    });

    it('should reject transfer without transfer account', () => {
      const invalid = {
        ...validRecurring,
        recurringtype: RecurringType.Transfer,
        transferaccountid: undefined
      };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'transferaccountid')).toBe(true);
    });

    it('should reject transfer with same source and destination accounts', () => {
      const invalid = {
        ...validRecurring,
        recurringtype: RecurringType.Transfer,
        transferaccountid: 'account-1' // Same as sourceaccountid
      };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'transferaccountid')).toBe(true);
    });
  });

  describe('Credit Card Payment Validation', () => {
    it('should validate a valid credit card payment recurring transaction', () => {
      const payment: Partial<EnhancedRecurring> = {
        ...validRecurring,
        recurringtype: RecurringType.CreditCardPayment
      };
      const result = validateCreditCardPaymentRecurring(payment);
      expect(result.isValid).toBe(true);
    });

    it('should reject credit card payment without source account', () => {
      const invalid = {
        ...validRecurring,
        recurringtype: RecurringType.CreditCardPayment,
        sourceaccountid: undefined
      };
      const result = validateRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'sourceaccountid')).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should validate interval months correctly', () => {
      expect(validateIntervalMonths(1)).toBe(true);
      expect(validateIntervalMonths(12)).toBe(true);
      expect(validateIntervalMonths(24)).toBe(true);
      expect(validateIntervalMonths(0)).toBe(false);
      expect(validateIntervalMonths(25)).toBe(false);
    });

    it('should check if recurring is due', () => {
      const dueRecurring: EnhancedRecurring = {
        ...validRecurring,
        nextoccurrencedate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        isactive: true,
        isdeleted: false
      } as EnhancedRecurring;

      expect(isRecurringDue(dueRecurring)).toBe(true);
    });

    it('should calculate next occurrence correctly', () => {
      const currentDate = new Date(2024, 0, 15); // January 15, 2024 (month is 0-indexed)
      const nextDate = calculateNextOccurrence(currentDate, 1);
      
      expect(nextDate.getMonth()).toBe(1); // February (0-indexed)
      expect(nextDate.getDate()).toBe(15);
    });

    it('should handle month-end dates correctly', () => {
      const currentDate = new Date(2024, 0, 31); // January 31, 2024
      const nextDate = calculateNextOccurrence(currentDate, 1);
      
      // Should be last day of February (29 in 2024, leap year)
      expect(nextDate.getMonth()).toBe(1); // February
      expect(nextDate.getDate()).toBe(29);
    });

    it('should identify enhanced recurring transactions', () => {
      const enhanced: EnhancedRecurring = {
        ...validRecurring,
        intervalmonths: 1,
        autoapplyenabled: false,
        isamountflexible: false,
        isdateflexible: false,
        recurringtype: RecurringType.Standard,
        failedattempts: 0,
        maxfailedattempts: 3
      } as EnhancedRecurring;

      expect(isEnhancedRecurring(enhanced)).toBe(true);
      expect(isEnhancedRecurring({})).toBe(false);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should perform comprehensive validation', () => {
      const result = validateEnhancedRecurring(validRecurring);
      expect(result.isValid).toBe(true);
    });

    it('should combine all validation errors', () => {
      const invalid = {
        ...validRecurring,
        intervalmonths: 0,
        recurringtype: RecurringType.Transfer,
        transferaccountid: undefined,
        isamountflexible: true,
        isdateflexible: true
      };
      
      const result = validateEnhancedRecurring(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

describe('Request Types', () => {
  describe('CreateTransferRequest', () => {
    it('should have correct type structure', () => {
      const request: CreateTransferRequest = {
        name: 'Monthly Transfer',
        sourceaccountid: 'account-1',
        transferaccountid: 'account-2',
        recurringtype: RecurringType.Transfer,
        amount: 500,
        nextoccurrencedate: new Date().toISOString(),
        tenantid: 'tenant-1'
      };

      expect(request.recurringtype).toBe(RecurringType.Transfer);
      expect(request.transferaccountid).toBe('account-2');
    });
  });

  describe('CreateCreditCardPaymentRequest', () => {
    it('should have correct type structure', () => {
      const request: CreateCreditCardPaymentRequest = {
        name: 'Credit Card Payment',
        sourceaccountid: 'checking-account',
        categoryid: 'credit-card-category',
        recurringtype: RecurringType.CreditCardPayment,
        nextoccurrencedate: new Date().toISOString(),
        tenantid: 'tenant-1'
      };

      expect(request.recurringtype).toBe(RecurringType.CreditCardPayment);
      expect(request.sourceaccountid).toBe('checking-account');
      expect(request.categoryid).toBe('credit-card-category');
    });
  });
});