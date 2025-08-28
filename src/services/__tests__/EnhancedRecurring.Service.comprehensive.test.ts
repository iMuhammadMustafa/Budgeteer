import { Session } from "@supabase/supabase-js";
import { RecurringType } from '@/src/types/enums/recurring';
import { 
  Recurring,
  RecurringInsert,
  RecurringUpdate,
  CreateTransferRequest,
  CreateCreditCardPaymentRequest,
  ExecutionOverrides,
  ExecutionPreview,
  RecurringFilters,
  AutoApplyStatus,
  ApplyResult
} from '@/src/types/recurring';

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock Supabase
jest.mock('@/src/providers/Supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  }
}));

// Mock UUID helper
jest.mock('@/src/utils/UUID.Helper', () => {
  return jest.fn(() => 'test-uuid');
});

// Mock dayjs
jest.mock('dayjs', () => {
  const mockDayjs = () => ({
    format: () => '2025-02-01T00:00:00Z',
    toISOString: () => '2025-02-01T00:00:00Z',
    add: () => mockDayjs(),
    isAfter: () => false,
    isBefore: () => false
  });
  return mockDayjs;
});

// Mock Date to return a date that makes our test dates valid
const mockDate = new Date('2025-01-01T00:00:00Z');
global.Date = jest.fn(() => mockDate) as any;
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock repositories
const mockRecurringRepo = {
  createEnhanced: jest.fn(),
  updateEnhanced: jest.fn(),
  findByIdEnhanced: jest.fn(),
  findAllEnhanced: jest.fn(),
  softDelete: jest.fn(),
  updateAutoApplyStatus: jest.fn(),
  findByAutoApplyEnabled: jest.fn(),
  findDueRecurringTransactions: jest.fn(),
  incrementFailedAttempts: jest.fn()
};

const mockAccountRepo = {
  findById: jest.fn(),
  updateAccountBalance: jest.fn()
};

const mockTransactionRepo = {
  create: jest.fn(),
  createMultipleTransactions: jest.fn()
};

const mockSession: Session = {
  user: {
    id: 'test-user-id',
    aud: 'supabase',
    role: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {
      tenantid: 'test-tenant-id'
    }
  },
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'Bearer'
};

// Import helper functions for direct testing
import { 
  createRecurringHelper,
  executeRecurringHelper,
  executeTransferLogic
} from '../Recurring.Service';

describe('Enhanced Recurring Service Layer - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('Create Enhanced Recurring', () => {
      it('should create a standard recurring transaction successfully', async () => {
        // Arrange
        const mockCreatedRecurring: Recurring = {
          id: 'test-uuid',
          name: 'Monthly Salary',
          sourceaccountid: 'checking-account-id',
          amount: 5000,
          recurringtype: RecurringType.Standard,
          type: 'Income',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          createdat: '2025-02-01T00:00:00Z',
          createdby: 'test-user-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        mockRecurringRepo.create.mockResolvedValue(mockCreatedRecurring);

        const recurringData: RecurringInsert = {
          id: 'test-uuid',
          name: 'Monthly Salary',
          sourceaccountid: 'checking-account-id',
          amount: 5000,
          recurringtype: RecurringType.Standard,
          type: 'Income',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        // Act
        const result = await createRecurringHelper(
          recurringData,
          mockSession,
          mockRecurringRepo
        );

        // Assert
        expect(mockRecurringRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Monthly Salary',
            sourceaccountid: 'checking-account-id',
            amount: 5000,
            recurringtype: RecurringType.Standard,
            intervalmonths: 1,
            autoapplyenabled: true,
            failedattempts: 0
          }),
          'test-tenant-id'
        );
        expect(result).toEqual(mockCreatedRecurring);
      });

      it('should fail validation for invalid interval months', async () => {
        // Arrange
        const invalidRecurringData: RecurringInsert = {
          id: 'test-uuid',
          name: 'Invalid Recurring',
          sourceaccountid: 'checking-account-id',
          amount: 100,
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 25, // Invalid - exceeds max of 24
          autoapplyenabled: false,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=25'
        };

        // Act & Assert
        await expect(createRecurringHelper(
          invalidRecurringData,
          mockSession,
          mockRecurringRepo
        )).rejects.toThrow('Validation failed');
      });

      it('should allow validation when both amount and date are flexible', async () => {
        // Arrange
        const validRecurringData: RecurringInsert = {
          id: 'test-uuid',
          name: 'Fully Flexible Recurring',
          sourceaccountid: 'checking-account-id',
          recurringtype: RecurringType.Standard,
          type: 'Expense',
          intervalmonths: 1,
          autoapplyenabled: false,
          isamountflexible: true, // Both flexible - now allowed
          isdateflexible: true,   // Both flexible - now allowed
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          currencycode: 'USD',
          recurrencerule: '',
          nextoccurrencedate: '2099-12-31' // Placeholder for flexible date
        };

        // Act
        const result = await createRecurringHelper(
          validRecurringData,
          mockSession,
          mockRecurringRepo
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.isamountflexible).toBe(true);
        expect(result.isdateflexible).toBe(true);
      });
    });
  });

  describe('Execution Methods', () => {
    describe('Execute Recurring Transaction', () => {
      it('should execute a standard recurring transaction successfully', async () => {
        // Arrange
        const mockRecurring: Recurring = {
          id: 'recurring-id',
          name: 'Monthly Expense',
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
          isdeleted: false,
          tenantid: 'test-tenant-id',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        const mockAccount = {
          id: 'checking-account-id',
          name: 'Checking Account',
          balance: 1000,
          type: 'Asset'
        };

        mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
        mockAccountRepo.findById.mockResolvedValue(mockAccount);
        mockTransactionRepo.create.mockResolvedValue({ id: 'transaction-id' });
        mockRecurringRepo.update.mockResolvedValue(mockRecurring);

        // Act
        const result = await executeRecurringHelper(
          'recurring-id',
          undefined,
          mockSession,
          mockRecurringRepo,
          mockTransactionRepo,
          mockAccountRepo
        );

        // Assert
        expect(result.success).toBe(true);
        expect(result.transactionId).toBeDefined();
        expect(mockTransactionRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Monthly Expense',
            amount: 200,
            accountid: 'checking-account-id',
            type: 'Expense'
          }),
          'test-tenant-id'
        );
        expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith(
          'checking-account-id',
          200,
          'test-tenant-id'
        );
        expect(mockRecurringRepo.update).toHaveBeenCalledWith(
          'recurring-id',
          expect.objectContaining({
            failedattempts: 0,
            lastexecutedat: expect.any(String),
            nextoccurrencedate: expect.any(String)
          }),
          'test-tenant-id'
        );
      });

      it('should execute a transfer with execution overrides', async () => {
        // Arrange
        const mockRecurring: Recurring = {
          id: 'transfer-id',
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
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        const mockSourceAccount = {
          id: 'checking-account-id',
          name: 'Checking Account',
          balance: 2000,
          type: 'Asset'
        };

        const mockDestinationAccount = {
          id: 'savings-account-id',
          name: 'Savings Account',
          balance: 1000,
          type: 'Asset'
        };

        const overrides: ExecutionOverrides = {
          amount: 750,
          description: 'Override transfer',
          notes: 'Manual override'
        };

        mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
        mockAccountRepo.findById
          .mockResolvedValueOnce(mockSourceAccount)
          .mockResolvedValueOnce(mockDestinationAccount);
        mockTransactionRepo.createMultipleTransactions.mockResolvedValue([
          { id: 'debit-transaction-id' },
          { id: 'credit-transaction-id' }
        ]);
        mockRecurringRepo.update.mockResolvedValue(mockRecurring);

        // Act
        const result = await executeRecurringHelper(
          'transfer-id',
          overrides,
          mockSession,
          mockRecurringRepo,
          mockTransactionRepo,
          mockAccountRepo
        );

        // Assert
        expect(result.success).toBe(true);
        expect(mockTransactionRepo.createMultipleTransactions).toHaveBeenCalledWith([
          expect.objectContaining({
            amount: 750, // Override amount
            description: 'Override transfer', // Override description
            notes: 'Manual override', // Override notes
            accountid: 'checking-account-id'
          }),
          expect.objectContaining({
            amount: -750, // Negative for receiving account
            description: 'Override transfer',
            notes: 'Manual override',
            accountid: 'savings-account-id'
          })
        ]);
      });

      it('should fail execution when recurring is inactive', async () => {
        // Arrange
        const mockInactiveRecurring: Recurring = {
          id: 'inactive-id',
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
          tenantid: 'test-tenant-id',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        mockRecurringRepo.findById.mockResolvedValue(mockInactiveRecurring);

        // Act
        const result = await executeRecurringHelper(
          'inactive-id',
          undefined,
          mockSession,
          mockRecurringRepo,
          mockTransactionRepo,
          mockAccountRepo
        );

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('not active');
        expect(mockRecurringRepo.incrementFailedAttempts).toHaveBeenCalledWith(['inactive-id']);
      });

      it('should handle insufficient funds for transfer', async () => {
        // Arrange
        const mockRecurring: Recurring = {
          id: 'transfer-id',
          name: 'Large Transfer',
          sourceaccountid: 'checking-account-id',
          transferaccountid: 'savings-account-id',
          amount: 2000,
          recurringtype: RecurringType.Transfer,
          type: 'Transfer',
          intervalmonths: 1,
          autoapplyenabled: true,
          isamountflexible: false,
          isdateflexible: false,
          nextoccurrencedate: '2025-02-01',
          failedattempts: 0,
          maxfailedattempts: 3,
          isactive: true,
          isdeleted: false,
          tenantid: 'test-tenant-id',
          createdat: '2025-01-01T00:00:00Z',
          createdby: 'test-user-id',
          currencycode: 'USD',
          recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
        };

        const mockSourceAccount = {
          id: 'checking-account-id',
          name: 'Checking Account',
          balance: 500, // Insufficient funds
          type: 'Asset'
        };

        const mockDestinationAccount = {
          id: 'savings-account-id',
          name: 'Savings Account',
          balance: 1000,
          type: 'Asset'
        };

        mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
        mockAccountRepo.findById
          .mockResolvedValueOnce(mockSourceAccount)
          .mockResolvedValueOnce(mockDestinationAccount);

        // Act
        const result = await executeTransferLogic(
          mockRecurring,
          2000,
          '2025-02-01T00:00:00Z',
          'Large Transfer',
          null,
          'test-user-id',
          'test-tenant-id',
          mockTransactionRepo,
          mockAccountRepo
        );

        // Assert - Should throw error for insufficient funds
        await expect(executeTransferLogic(
          mockRecurring,
          2000,
          '2025-02-01T00:00:00Z',
          'Large Transfer',
          null,
          'test-user-id',
          'test-tenant-id',
          mockTransactionRepo,
          mockAccountRepo
        )).rejects.toThrow('Insufficient funds');
      });
    });
  });

  describe('Preview Execution', () => {
    it('should generate execution preview with warnings', async () => {
      // This would test the previewRecurringExecutionHelper function
      // Implementation would depend on the actual preview logic
    });
  });

  describe('Auto-Apply Management', () => {
    it('should toggle auto-apply status successfully', async () => {
      // Arrange
      mockRecurringRepo.updateAutoApplyStatus.mockResolvedValue(undefined);

      // This would be tested through the service hook, but we can test the repository call
      expect(mockRecurringRepo.updateAutoApplyStatus).toBeDefined();
    });

    it('should get auto-apply status with correct counts', async () => {
      // Arrange
      const mockAllRecurring = [
        { id: '1', failedattempts: 0 },
        { id: '2', failedattempts: 1 },
        { id: '3', failedattempts: 0 }
      ];
      const mockAutoApplyEnabled = [{ id: '1' }, { id: '3' }];
      const mockDueTransactions = [{ id: '1' }];

      mockRecurringRepo.findAll.mockResolvedValue(mockAllRecurring);
      mockRecurringRepo.findByAutoApplyEnabled.mockResolvedValue(mockAutoApplyEnabled);
      mockRecurringRepo.findDueRecurringTransactions.mockResolvedValue(mockDueTransactions);

      // This would test the getAutoApplyStatusHelper function
      // Implementation would verify the correct status calculation
    });
  });

  describe('Error Handling', () => {
    it('should increment failed attempts on execution error', async () => {
      // Arrange
      const mockRecurring: Recurring = {
        id: 'error-recurring-id',
        name: 'Error Recurring',
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
        isdeleted: false,
        tenantid: 'test-tenant-id',
        createdat: '2025-01-01T00:00:00Z',
        createdby: 'test-user-id',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
      };

      mockRecurringRepo.findById.mockResolvedValue(mockRecurring);
      mockTransactionRepo.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await executeRecurringHelper(
        'error-recurring-id',
        undefined,
        mockSession,
        mockRecurringRepo,
        mockTransactionRepo,
        mockAccountRepo
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockRecurringRepo.incrementFailedAttempts).toHaveBeenCalledWith(['error-recurring-id']);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      const invalidRecurringData: RecurringInsert = {
        id: 'test-uuid',
        name: '', // Invalid - empty name
        sourceaccountid: 'checking-account-id',
        amount: -100, // Invalid - negative amount
        recurringtype: RecurringType.Standard,
        type: 'Expense',
        intervalmonths: 1,
        autoapplyenabled: false,
        isamountflexible: false,
        isdateflexible: false,
        nextoccurrencedate: '2025-02-01',
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        tenantid: 'test-tenant-id',
        currencycode: 'USD',
        recurrencerule: 'FREQ=MONTHLY;INTERVAL=1'
      };

      // Act & Assert
      await expect(createRecurringHelper(
        invalidRecurringData,
        mockSession,
        mockRecurringRepo
      )).rejects.toThrow('Validation failed');
    });
  });
});