import dayjs from 'dayjs';
import { AutoApplyEngine } from '../AutoApplyEngine';
import { EnhancedRecurring, AutoApplyResult } from '@/src/types/enhanced-recurring';
import { RecurringType } from '@/src/types/enums/recurring';

// Mock UUID
jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000000" }));

describe('AutoApplyEngine Integration Tests', () => {
  let mockRecurringRepo: any;
  let mockTransactionRepo: any;
  let mockAccountRepo: any;
  let autoApplyEngine: AutoApplyEngine;

  const tenantId = 'test-tenant-id';
  const userId = 'test-user-id';

  beforeEach(() => {
    mockRecurringRepo = {
      findDueRecurringTransactions: jest.fn(),
      updateNextOccurrenceDates: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      resetFailedAttempts: jest.fn(),
      updateAutoApplyStatus: jest.fn(),
      updateEnhanced: jest.fn(),
    };

    mockTransactionRepo = {
      create: jest.fn(),
      createMultipleTransactions: jest.fn(),
    };

    mockAccountRepo = {
      updateAccountBalance: jest.fn(),
      findById: jest.fn(),
    };

    autoApplyEngine = new AutoApplyEngine(
      mockRecurringRepo,
      mockTransactionRepo,
      mockAccountRepo
    );
  });

  describe('End-to-End Auto-Apply Workflow', () => {
    it('should successfully process a complete auto-apply workflow', async () => {
      // Setup test data
      const dueRecurring: EnhancedRecurring = {
        id: 'recurring-123',
        name: 'Monthly Salary',
        description: 'Monthly salary payment',
        amount: 5000,
        sourceaccountid: 'checking-account',
        categoryid: 'salary-category',
        type: 'Income',
        isactive: true,
        autoapplyenabled: true,
        recurringtype: RecurringType.Standard,
        intervalmonths: 1,
        nextoccurrencedate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), // Due yesterday
        isamountflexible: false,
        isdateflexible: false,
        failedattempts: 0,
        maxfailedattempts: 3,
        tenantid: tenantId,
        createdby: userId,
        createdat: dayjs().toISOString(),
        updatedby: userId,
        updatedat: dayjs().toISOString(),
        isdeleted: false,
        payeename: 'Employer',
        notes: 'Monthly salary',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
      } as EnhancedRecurring;

      // Mock repository responses
      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([dueRecurring]);
      mockTransactionRepo.create.mockResolvedValue({ id: 'new-transaction-id' });
      mockAccountRepo.updateAccountBalance.mockResolvedValue(undefined);
      mockRecurringRepo.updateNextOccurrenceDates.mockResolvedValue(undefined);
      mockRecurringRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateEnhanced.mockResolvedValue(undefined);

      // Execute the workflow
      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      // Verify results
      expect(result.appliedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.pendingCount).toBe(0);

      // Verify repository calls
      expect(mockRecurringRepo.findDueRecurringTransactions).toHaveBeenCalledWith(tenantId, expect.any(Date));
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Monthly Salary',
          amount: 5000,
          accountid: 'checking-account',
          type: 'Income'
        }),
        tenantId
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('checking-account', 5000, tenantId);
      expect(mockRecurringRepo.updateNextOccurrenceDates).toHaveBeenCalledWith([{
        id: 'recurring-123',
        nextDate: expect.any(Date)
      }]);
      expect(mockRecurringRepo.updateEnhanced).toHaveBeenCalledWith(
        'recurring-123',
        expect.objectContaining({
          lastautoappliedat: expect.any(String),
          updatedby: userId
        })
      );
    });

    it('should handle mixed success and failure scenarios', async () => {
      const successfulRecurring: EnhancedRecurring = createMockRecurring({
        id: 'success-recurring',
        name: 'Successful Transaction',
        autoapplyenabled: true
      });

      const failedRecurring: EnhancedRecurring = createMockRecurring({
        id: 'failed-recurring',
        name: 'Failed Transaction',
        autoapplyenabled: true,
        isactive: false // This will cause validation failure
      });

      const pendingRecurring: EnhancedRecurring = createMockRecurring({
        id: 'pending-recurring',
        name: 'Pending Transaction',
        autoapplyenabled: false // This will be marked as pending
      });

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([
        successfulRecurring,
        failedRecurring,
        pendingRecurring
      ]);

      // Mock successful transaction creation for the first one
      mockTransactionRepo.create.mockResolvedValue({ id: 'transaction-id' });
      mockAccountRepo.updateAccountBalance.mockResolvedValue(undefined);
      mockRecurringRepo.updateNextOccurrenceDates.mockResolvedValue(undefined);
      mockRecurringRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateEnhanced.mockResolvedValue(undefined);
      mockRecurringRepo.incrementFailedAttempts.mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(1); // Only successful one
      expect(result.failedCount).toBe(1);  // Failed validation
      expect(result.pendingCount).toBe(1); // Auto-apply disabled
    });

    it('should handle transfer transactions correctly', async () => {
      const transferRecurring: EnhancedRecurring = createMockRecurring({
        recurringtype: RecurringType.Transfer,
        amount: 1000,
        sourceaccountid: 'checking-account',
        transferaccountid: 'savings-account',
        autoapplyenabled: true
      });

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([transferRecurring]);
      mockTransactionRepo.createMultipleTransactions.mockResolvedValue([
        { id: 'primary-transaction-id' },
        { id: 'transfer-transaction-id' }
      ]);
      mockAccountRepo.updateAccountBalance.mockResolvedValue(undefined);
      mockRecurringRepo.updateNextOccurrenceDates.mockResolvedValue(undefined);
      mockRecurringRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateEnhanced.mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(1);
      expect(mockTransactionRepo.createMultipleTransactions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ amount: 1000, accountid: 'checking-account' }),
          expect.objectContaining({ amount: -1000, accountid: 'savings-account' })
        ])
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledTimes(2);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('checking-account', 1000, tenantId);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('savings-account', -1000, tenantId);
    });

    it('should handle credit card payments correctly', async () => {
      const creditCardRecurring: EnhancedRecurring = createMockRecurring({
        recurringtype: RecurringType.CreditCardPayment,
        sourceaccountid: 'checking-account',
        categoryid: 'credit-card-account',
        autoapplyenabled: true
      });

      const mockCreditCardAccount = {
        id: 'credit-card-account',
        name: 'Credit Card',
        balance: -750 // $750 debt
      };

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([creditCardRecurring]);
      mockAccountRepo.findById.mockResolvedValue(mockCreditCardAccount);
      mockTransactionRepo.create.mockResolvedValue({ id: 'payment-transaction-id' });
      mockAccountRepo.updateAccountBalance.mockResolvedValue(undefined);
      mockRecurringRepo.updateNextOccurrenceDates.mockResolvedValue(undefined);
      mockRecurringRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateEnhanced.mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(1);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 750, // Payment amount equals debt
          accountid: 'checking-account'
        }),
        tenantId
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('checking-account', 750, tenantId);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('credit-card-account', -750, tenantId);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database errors gracefully', async () => {
      const recurringWithError: EnhancedRecurring = createMockRecurring({
        autoapplyenabled: true
      });

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([recurringWithError]);
      mockTransactionRepo.create.mockRejectedValue(new Error('Database connection failed'));
      mockRecurringRepo.incrementFailedAttempts.mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(mockRecurringRepo.incrementFailedAttempts).toHaveBeenCalledWith([recurringWithError.id]);
    });

    it('should disable auto-apply after max failed attempts', async () => {
      const recurringWithMaxFailures: EnhancedRecurring = createMockRecurring({
        autoapplyenabled: true,
        failedattempts: 2, // One more failure will hit the max
        maxfailedattempts: 3
      });

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue([recurringWithMaxFailures]);
      mockTransactionRepo.create.mockRejectedValue(new Error('Persistent failure'));
      mockRecurringRepo.incrementFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateAutoApplyStatus.mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(mockRecurringRepo.updateAutoApplyStatus).toHaveBeenCalledWith(recurringWithMaxFailures.id, false);
    });
  });

  describe('Configuration and Settings', () => {
    it('should respect global auto-apply disabled setting', async () => {
      const engine = new AutoApplyEngine(
        mockRecurringRepo,
        mockTransactionRepo,
        mockAccountRepo,
        { globalEnabled: false }
      );

      const result = await engine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(0);
      expect(mockRecurringRepo.findDueRecurringTransactions).not.toHaveBeenCalled();
    });

    it('should respect batch size limits', async () => {
      const engine = new AutoApplyEngine(
        mockRecurringRepo,
        mockTransactionRepo,
        mockAccountRepo,
        { maxBatchSize: 2 }
      );

      const recurrings = [
        createMockRecurring({ id: '1', autoapplyenabled: true }),
        createMockRecurring({ id: '2', autoapplyenabled: true }),
        createMockRecurring({ id: '3', autoapplyenabled: true })
      ];

      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue(recurrings);
      mockTransactionRepo.create.mockResolvedValue({ id: 'transaction-id' });
      mockAccountRepo.updateAccountBalance.mockResolvedValue(undefined);
      mockRecurringRepo.updateNextOccurrenceDates.mockResolvedValue(undefined);
      mockRecurringRepo.resetFailedAttempts.mockResolvedValue(undefined);
      mockRecurringRepo.updateEnhanced.mockResolvedValue(undefined);

      const result = await engine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(3); // All should still be processed, just in batches
    });
  });
});

// Helper function to create mock recurring transactions
function createMockRecurring(overrides: Partial<EnhancedRecurring> = {}): EnhancedRecurring {
  return {
    id: 'recurring-123',
    name: 'Test Recurring',
    description: 'Test Description',
    amount: 100,
    sourceaccountid: 'account-123',
    categoryid: 'category-123',
    type: 'Expense',
    isactive: true,
    autoapplyenabled: true,
    recurringtype: RecurringType.Standard,
    intervalmonths: 1,
    nextoccurrencedate: dayjs().format('YYYY-MM-DD'),
    isamountflexible: false,
    isdateflexible: false,
    failedattempts: 0,
    maxfailedattempts: 3,
    tenantid: 'test-tenant',
    createdby: 'test-user',
    createdat: dayjs().toISOString(),
    updatedby: 'test-user',
    updatedat: dayjs().toISOString(),
    isdeleted: false,
    payeename: 'Test Payee',
    notes: 'Test Notes',
    recurrencerule: 'FREQ=MONTHLY;INTERVAL=1',
    ...overrides
  } as EnhancedRecurring;
}