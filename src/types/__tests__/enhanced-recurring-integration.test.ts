import { EnhancedRecurring, EnhancedRecurringInsert, EnhancedRecurringUpdate } from '../enhanced-recurring';
import { RecurringType } from '../enums/recurring';
import { Recurring } from '../db/sqllite/schema';

describe('Enhanced Recurring Integration Tests', () => {
  describe('Type Compatibility', () => {
    it('should be compatible with base Recurring type', () => {
      const baseRecurring: Recurring = {
        id: 'test-id',
        name: 'Test Recurring',
        sourceaccountid: 'account-1',
        categoryid: 'category-1',
        amount: 100,
        type: 'Expense',
        description: 'Test description',
        payeename: 'Test Payee',
        notes: 'Test notes',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
        nextoccurrencedate: '2024-02-01',
        enddate: null,
        lastexecutedat: null,
        isactive: true,
        
        // Enhanced fields
        intervalmonths: 1,
        autoapplyenabled: false,
        transferaccountid: null,
        isamountflexible: false,
        isdateflexible: false,
        recurringtype: 'Standard',
        lastautoappliedat: null,
        failedattempts: 0,
        maxfailedattempts: 3,
        
        tenantid: 'tenant-1',
        isdeleted: false,
        createdat: '2024-01-01T00:00:00Z',
        createdby: 'user-1',
        updatedat: null,
        updatedby: null
      };

      // Should be assignable to EnhancedRecurring
      const enhanced: EnhancedRecurring = baseRecurring;
      expect(enhanced.intervalmonths).toBe(1);
      expect(enhanced.autoapplyenabled).toBe(false);
      expect(enhanced.recurringtype).toBe('Standard');
    });

    it('should support enhanced insert operations', () => {
      const insertData: EnhancedRecurringInsert = {
        name: 'New Recurring',
        sourceaccountid: 'account-1',
        categoryid: 'category-1',
        amount: 200,
        type: 'Income',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=3',
        nextoccurrencedate: '2024-03-01',
        tenantid: 'tenant-1',
        
        // Enhanced fields
        intervalmonths: 3,
        autoapplyenabled: true,
        recurringtype: RecurringType.Standard,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 5
      };

      expect(insertData.intervalmonths).toBe(3);
      expect(insertData.autoapplyenabled).toBe(true);
      expect(insertData.recurringtype).toBe(RecurringType.Standard);
    });

    it('should support enhanced update operations', () => {
      const updateData: EnhancedRecurringUpdate = {
        intervalmonths: 6,
        autoapplyenabled: true,
        transferaccountid: 'account-2',
        recurringtype: RecurringType.Transfer
      };

      expect(updateData.intervalmonths).toBe(6);
      expect(updateData.autoapplyenabled).toBe(true);
      expect(updateData.transferaccountid).toBe('account-2');
      expect(updateData.recurringtype).toBe(RecurringType.Transfer);
    });
  });

  describe('Transfer Recurring', () => {
    it('should create a valid transfer recurring transaction', () => {
      const transfer: EnhancedRecurring = {
        id: 'transfer-id',
        name: 'Monthly Savings Transfer',
        sourceaccountid: 'checking-account',
        categoryid: 'transfer-category',
        amount: 500,
        type: 'Transfer',
        description: 'Monthly transfer to savings',
        payeename: null,
        notes: 'Automated savings',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
        nextoccurrencedate: '2024-02-01',
        enddate: null,
        lastexecutedat: null,
        isactive: true,
        
        // Enhanced fields for transfer
        intervalmonths: 1,
        autoapplyenabled: true,
        transferaccountid: 'savings-account',
        isamountflexible: false,
        isdateflexible: false,
        recurringtype: RecurringType.Transfer,
        lastautoappliedat: null,
        failedattempts: 0,
        maxfailedattempts: 3,
        
        tenantid: 'tenant-1',
        isdeleted: false,
        createdat: '2024-01-01T00:00:00Z',
        createdby: 'user-1',
        updatedat: null,
        updatedby: null
      };

      expect(transfer.recurringtype).toBe(RecurringType.Transfer);
      expect(transfer.transferaccountid).toBe('savings-account');
      expect(transfer.autoapplyenabled).toBe(true);
    });
  });

  describe('Credit Card Payment Recurring', () => {
    it('should create a valid credit card payment recurring transaction', () => {
      const payment: EnhancedRecurring = {
        id: 'payment-id',
        name: 'Credit Card Payment',
        sourceaccountid: 'checking-account',
        categoryid: 'credit-card-category',
        amount: null, // Amount flexible for statement balance
        type: 'Expense',
        description: 'Monthly credit card payment',
        payeename: 'Credit Card Company',
        notes: 'Auto-pay statement balance',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
        nextoccurrencedate: '2024-02-15',
        enddate: null,
        lastexecutedat: null,
        isactive: true,
        
        // Enhanced fields for credit card payment
        intervalmonths: 1,
        autoapplyenabled: true,
        transferaccountid: null,
        isamountflexible: true, // Amount determined at execution time
        isdateflexible: false,
        recurringtype: RecurringType.CreditCardPayment,
        lastautoappliedat: null,
        failedattempts: 0,
        maxfailedattempts: 3,
        
        tenantid: 'tenant-1',
        isdeleted: false,
        createdat: '2024-01-01T00:00:00Z',
        createdby: 'user-1',
        updatedat: null,
        updatedby: null
      };

      expect(payment.recurringtype).toBe(RecurringType.CreditCardPayment);
      expect(payment.isamountflexible).toBe(true);
      expect(payment.amount).toBeNull();
      expect(payment.autoapplyenabled).toBe(true);
    });
  });

  describe('Custom Interval Recurring', () => {
    it('should create a valid quarterly recurring transaction', () => {
      const quarterly: EnhancedRecurring = {
        id: 'quarterly-id',
        name: 'Quarterly Insurance Payment',
        sourceaccountid: 'checking-account',
        categoryid: 'insurance-category',
        amount: 1200,
        type: 'Expense',
        description: 'Quarterly insurance premium',
        payeename: 'Insurance Company',
        notes: 'Auto insurance premium',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=3',
        nextoccurrencedate: '2024-04-01',
        enddate: null,
        lastexecutedat: null,
        isactive: true,
        
        // Enhanced fields for quarterly payment
        intervalmonths: 3,
        autoapplyenabled: false, // Manual approval required
        transferaccountid: null,
        isamountflexible: false,
        isdateflexible: false,
        recurringtype: RecurringType.Standard,
        lastautoappliedat: null,
        failedattempts: 0,
        maxfailedattempts: 3,
        
        tenantid: 'tenant-1',
        isdeleted: false,
        createdat: '2024-01-01T00:00:00Z',
        createdby: 'user-1',
        updatedat: null,
        updatedby: null
      };

      expect(quarterly.intervalmonths).toBe(3);
      expect(quarterly.recurringtype).toBe(RecurringType.Standard);
      expect(quarterly.autoapplyenabled).toBe(false);
    });
  });

  describe('Flexible Recurring Transactions', () => {
    it('should create a valid amount-flexible recurring transaction', () => {
      const flexible: EnhancedRecurring = {
        id: 'flexible-id',
        name: 'Variable Utility Bill',
        sourceaccountid: 'checking-account',
        categoryid: 'utilities-category',
        amount: null, // Amount varies each month
        type: 'Expense',
        description: 'Monthly utility bill',
        payeename: 'Utility Company',
        notes: 'Amount varies based on usage',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
        nextoccurrencedate: '2024-02-01',
        enddate: null,
        lastexecutedat: null,
        isactive: true,
        
        // Enhanced fields for flexible amount
        intervalmonths: 1,
        autoapplyenabled: false, // Requires manual amount entry
        transferaccountid: null,
        isamountflexible: true,
        isdateflexible: false,
        recurringtype: RecurringType.Standard,
        lastautoappliedat: null,
        failedattempts: 0,
        maxfailedattempts: 3,
        
        tenantid: 'tenant-1',
        isdeleted: false,
        createdat: '2024-01-01T00:00:00Z',
        createdby: 'user-1',
        updatedat: null,
        updatedby: null
      };

      expect(flexible.isamountflexible).toBe(true);
      expect(flexible.amount).toBeNull();
      expect(flexible.autoapplyenabled).toBe(false);
    });
  });
});