import { describe, it, expect, beforeEach, jest } from '@jest/globals';
// Mock UUID helper to avoid import issues
jest.mock('@/src/utils/UUID.Helper', () => ({
  __esModule: true,
  default: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
}));

import { CreditCardPaymentService } from '../CreditCardPaymentService';
import { CreateCreditCardPaymentRequest, Recurring } from '@/src/types/recurring';
import { RecurringType } from '@/src/types/enums/recurring';
import { Account, Transaction } from '@/src/types/db/Tables.Types';
import dayjs from 'dayjs';

// Mock dependencies
const mockAccountRepo = {
  findById: jest.fn(),
  updateAccountBalance: jest.fn(),
};

const mockTransactionRepo = {
  createMultipleTransactions: jest.fn(),
  create: jest.fn(),
};

const mockRecurringRepo = {
  createEnhanced: jest.fn(),
};

describe('CreditCardPaymentService', () => {
  let service: CreditCardPaymentService;
  const tenantId = 'test-tenant-id';
  const userId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CreditCardPaymentService(
      mockAccountRepo as any,
      mockTransactionRepo as any,
      mockRecurringRepo as any
    );
  });

  describe('createCreditCardPayment', () => {
    const validRequest: CreateCreditCardPaymentRequest = {
      name: 'Credit Card Payment',
      sourceaccountid: 'source-account-id',
      categoryid: 'liability-account-id',
      recurringtype: RecurringType.CreditCardPayment,
      nextoccurrencedate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      intervalmonths: 1,
      autoapplyenabled: true,
      isamountflexible: true,
      isdateflexible: false,
      maxfailedattempts: 3,
    };

    const mockSourceAccount: Account = {
      id: 'source-account-id',
      name: 'Checking Account',
      balance: 1000,
      categoryid: 'asset-category-id',
      currency: 'USD',
      color: 'blue',
      icon: 'bank',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'asset-category-id',
        name: 'Asset Category',
        type: 'Asset',
        color: 'blue',
        icon: 'bank',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    const mockLiabilityAccount: Account = {
      id: 'liability-account-id',
      name: 'Credit Card',
      balance: 500, // Positive balance means debt
      categoryid: 'liability-category-id',
      currency: 'USD',
      color: 'red',
      icon: 'credit-card',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'liability-category-id',
        name: 'Liability Category',
        type: 'Liability',
        color: 'red',
        icon: 'credit-card',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    it('should create a credit card payment recurring transaction successfully', async () => {
      // Arrange
      mockAccountRepo.findById
        .mockResolvedValueOnce(mockSourceAccount) // First call for source account
        .mockResolvedValueOnce(mockLiabilityAccount); // Second call for liability account

      const expectedRecurring: Recurring = {
        ...validRequest,
        id: 'generated-id',
        type: 'Transfer',
        tenantid: tenantId,
        createdby: userId,
        createdat: dayjs().toISOString(),
        failedattempts: 0,
        isactive: true,
        isdeleted: false,
      } as Recurring;

      mockRecurringRepo.create.mockResolvedValue(expectedRecurring);

      // Act
      const result = await service.createCreditCardPayment(validRequest, tenantId, userId);

      // Assert
      expect(result).toEqual(expectedRecurring);
      expect(mockAccountRepo.findById).toHaveBeenCalledWith('source-account-id', tenantId);
      expect(mockRecurringRepo.createEnhanced).toHaveBeenCalledWith(
        expect.objectContaining({
          recurringtype: RecurringType.CreditCardPayment,
          type: 'Transfer',
          isamountflexible: true,
          tenantid: tenantId,
          createdby: userId,
        }),
        tenantId
      );
    });

    it('should throw error if source account not found', async () => {
      // Arrange
      mockAccountRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createCreditCardPayment(validRequest, tenantId, userId)
      ).rejects.toThrow('Source account not found or does not belong to user');
    });

    it('should throw error if liability account not found', async () => {
      // Arrange
      mockAccountRepo.findById
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.createCreditCardPayment(validRequest, tenantId, userId)
      ).rejects.toThrow('Category must reference a liability account (credit card)');
    });

    it('should throw error if source and liability accounts are the same', async () => {
      // Arrange
      const sameAccountRequest = {
        ...validRequest,
        categoryid: 'source-account-id', // Same as source account
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(mockSourceAccount);

      // Act & Assert
      await expect(
        service.createCreditCardPayment(sameAccountRequest, tenantId, userId)
      ).rejects.toThrow('Source account and liability account must be different');
    });

    it('should throw error for invalid interval months', async () => {
      // Arrange
      const invalidRequest = {
        ...validRequest,
        intervalmonths: 25, // Exceeds maximum
      };

      // Act & Assert
      await expect(
        service.createCreditCardPayment(invalidRequest, tenantId, userId)
      ).rejects.toThrow('Interval months must be between 1 and 24');
    });
  });

  describe('executeCreditCardPayment', () => {
    const mockRecurring: Recurring = {
      id: 'recurring-id',
      name: 'Credit Card Payment',
      sourceaccountid: 'source-account-id',
      categoryid: 'liability-account-id',
      recurringtype: RecurringType.CreditCardPayment,
      type: 'Transfer',
      intervalmonths: 1,
      autoapplyenabled: true,
      isamountflexible: true,
      isdateflexible: false,
      failedattempts: 0,
      maxfailedattempts: 3,
      nextoccurrencedate: dayjs().format('YYYY-MM-DD'),
      isactive: true,
      isdeleted: false,
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
    } as Recurring;

    const mockSourceAccount: Account = {
      id: 'source-account-id',
      name: 'Checking Account',
      balance: 1000,
      categoryid: 'asset-category-id',
      currency: 'USD',
      color: 'blue',
      icon: 'bank',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'asset-category-id',
        name: 'Asset Category',
        type: 'Asset',
        color: 'blue',
        icon: 'bank',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    const mockLiabilityAccount: Account = {
      id: 'liability-account-id',
      name: 'Credit Card',
      balance: 500, // Positive balance means debt
      categoryid: 'liability-category-id',
      currency: 'USD',
      color: 'red',
      icon: 'credit-card',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'liability-category-id',
        name: 'Liability Category',
        type: 'Liability',
        color: 'red',
        icon: 'credit-card',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    it('should execute credit card payment successfully', async () => {
      // Arrange
      mockAccountRepo.findById
        .mockResolvedValueOnce(mockLiabilityAccount) // For getLiabilityAccountFromCategory
        .mockResolvedValueOnce(mockSourceAccount); // For source account validation

      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          name: 'Credit Card Payment',
          amount: -500,
          accountid: 'source-account-id',
          type: 'Transfer',
          date: dayjs().toISOString(),
          tenantid: tenantId,
          createdby: userId,
          createdat: dayjs().toISOString(),
        } as Transaction,
        {
          id: 'transaction-2',
          name: 'Credit Card Payment',
          amount: -500,
          accountid: 'liability-account-id',
          type: 'Transfer',
          date: dayjs().toISOString(),
          tenantid: tenantId,
          createdby: userId,
          createdat: dayjs().toISOString(),
        } as Transaction,
      ];

      mockTransactionRepo.createMultipleTransactions.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.executeCreditCardPayment(mockRecurring, tenantId, userId);

      // Assert
      expect(result.paymentAmount).toBe(500);
      expect(result.transactions).toEqual(mockTransactions);
      expect(mockTransactionRepo.createMultipleTransactions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            amount: -500,
            accountid: 'source-account-id',
            transferaccountid: 'liability-account-id',
          }),
          expect.objectContaining({
            amount: -500,
            accountid: 'liability-account-id',
            transferaccountid: 'source-account-id',
          }),
        ])
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('source-account-id', -500, tenantId);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('liability-account-id', -500, tenantId);
    });

    it('should skip payment when no balance exists', async () => {
      // Arrange
      const zeroBalanceLiabilityAccount = {
        ...mockLiabilityAccount,
        balance: 0,
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(zeroBalanceLiabilityAccount)
        .mockResolvedValueOnce(mockSourceAccount);

      // Act
      const result = await service.executeCreditCardPayment(mockRecurring, tenantId, userId);

      // Assert
      expect(result.paymentAmount).toBe(0);
      expect(result.transactions).toEqual([]);
      expect(mockTransactionRepo.createMultipleTransactions).not.toHaveBeenCalled();
      expect(mockAccountRepo.updateAccountBalance).not.toHaveBeenCalled();
    });

    it('should throw error for insufficient funds', async () => {
      // Arrange
      const insufficientFundsSourceAccount = {
        ...mockSourceAccount,
        balance: 100, // Less than the 500 debt
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(mockLiabilityAccount)
        .mockResolvedValueOnce(insufficientFundsSourceAccount);

      // Act & Assert
      await expect(
        service.executeCreditCardPayment(mockRecurring, tenantId, userId)
      ).rejects.toThrow('Insufficient funds in source account for credit card payment');
    });

    it('should throw error for invalid recurring type', async () => {
      // Arrange
      const invalidRecurring = {
        ...mockRecurring,
        recurringtype: RecurringType.Standard,
      };

      // Act & Assert
      await expect(
        service.executeCreditCardPayment(invalidRecurring, tenantId, userId)
      ).rejects.toThrow('Invalid recurring type for credit card payment');
    });

    it('should handle override amount', async () => {
      // Arrange
      const overrideAmount = 300;
      
      mockAccountRepo.findById
        .mockResolvedValueOnce(mockLiabilityAccount)
        .mockResolvedValueOnce(mockSourceAccount);

      const mockTransactions: Transaction[] = [
        {
          id: 'transaction-1',
          name: 'Credit Card Payment',
          amount: -overrideAmount,
          accountid: 'source-account-id',
          type: 'Transfer',
          date: dayjs().toISOString(),
          tenantid: tenantId,
          createdby: userId,
          createdat: dayjs().toISOString(),
        } as Transaction,
      ];

      mockTransactionRepo.createMultipleTransactions.mockResolvedValue(mockTransactions);

      // Act
      const result = await service.executeCreditCardPayment(mockRecurring, tenantId, userId, overrideAmount);

      // Assert
      expect(result.paymentAmount).toBe(overrideAmount);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('source-account-id', -overrideAmount, tenantId);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith('liability-account-id', -overrideAmount, tenantId);
    });
  });

  describe('previewCreditCardPayment', () => {
    const mockRecurring: Recurring = {
      id: 'recurring-id',
      name: 'Credit Card Payment',
      sourceaccountid: 'source-account-id',
      categoryid: 'liability-account-id',
      recurringtype: RecurringType.CreditCardPayment,
      type: 'Transfer',
      intervalmonths: 1,
      autoapplyenabled: true,
      isamountflexible: true,
      isdateflexible: false,
      failedattempts: 0,
      maxfailedattempts: 3,
      nextoccurrencedate: dayjs().format('YYYY-MM-DD'),
      isactive: true,
      isdeleted: false,
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
    } as Recurring;

    const mockSourceAccount: Account = {
      id: 'source-account-id',
      name: 'Checking Account',
      balance: 1000,
      categoryid: 'asset-category-id',
      currency: 'USD',
      color: 'blue',
      icon: 'bank',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'asset-category-id',
        name: 'Asset Category',
        type: 'Asset',
        color: 'blue',
        icon: 'bank',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    const mockLiabilityAccount: Account = {
      id: 'liability-account-id',
      name: 'Credit Card',
      balance: 500,
      categoryid: 'liability-category-id',
      currency: 'USD',
      color: 'red',
      icon: 'credit-card',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
      category: {
        id: 'liability-category-id',
        name: 'Liability Category',
        type: 'Liability',
        color: 'red',
        icon: 'credit-card',
        displayorder: 1,
        tenantid: tenantId,
        isdeleted: false,
        createdat: dayjs().toISOString(),
        createdby: userId,
      }
    };

    it('should generate preview successfully', async () => {
      // Arrange
      mockAccountRepo.findById
        .mockResolvedValueOnce(mockLiabilityAccount)
        .mockResolvedValueOnce(mockSourceAccount);

      // Act
      const result = await service.previewCreditCardPayment(mockRecurring, tenantId);

      // Assert
      expect(result).toEqual({
        recurring: mockRecurring,
        estimatedAmount: 500,
        estimatedDate: mockRecurring.nextoccurrencedate,
        sourceAccount: mockSourceAccount,
        destinationAccount: mockLiabilityAccount,
        warnings: [],
      });
    });

    it('should include warning for no balance', async () => {
      // Arrange
      const zeroBalanceLiabilityAccount = {
        ...mockLiabilityAccount,
        balance: 0,
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(zeroBalanceLiabilityAccount)
        .mockResolvedValueOnce(mockSourceAccount);

      // Act
      const result = await service.previewCreditCardPayment(mockRecurring, tenantId);

      // Assert
      expect(result.warnings).toContain('No balance to pay on the credit card');
    });

    it('should include warning for insufficient funds', async () => {
      // Arrange
      const insufficientFundsSourceAccount = {
        ...mockSourceAccount,
        balance: 100,
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(mockLiabilityAccount)
        .mockResolvedValueOnce(insufficientFundsSourceAccount);

      // Act
      const result = await service.previewCreditCardPayment(mockRecurring, tenantId);

      // Assert
      expect(result.warnings).toContain('Insufficient funds in source account (100 < 500)');
    });

    it('should throw error for invalid recurring type', async () => {
      // Arrange
      const invalidRecurring = {
        ...mockRecurring,
        recurringtype: RecurringType.Standard,
      };

      // Act & Assert
      await expect(
        service.previewCreditCardPayment(invalidRecurring, tenantId)
      ).rejects.toThrow('Invalid recurring type for credit card payment preview');
    });
  });

  describe('handleInsufficientFunds', () => {
    const mockRecurring: Recurring = {
      id: 'recurring-id',
      name: 'Credit Card Payment',
      sourceaccountid: 'source-account-id',
      categoryid: 'liability-account-id',
      recurringtype: RecurringType.CreditCardPayment,
      autoapplyenabled: true,
      isactive: true,
      isdeleted: false,
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
    } as Recurring;

    const mockSourceAccount: Account = {
      id: 'source-account-id',
      name: 'Checking Account',
      balance: 100,
      categoryid: 'asset-category-id',
      currency: 'USD',
      color: 'blue',
      icon: 'bank',
      displayorder: 1,
      tenantid: tenantId,
      isdeleted: false,
      createdat: dayjs().toISOString(),
      createdby: userId,
    };

    it('should skip and reschedule for auto-apply enabled', async () => {
      // Act
      const result = await service.handleInsufficientFunds(mockRecurring, mockSourceAccount, 500, tenantId);

      // Assert
      expect(result.action).toBe('SKIP_AND_RESCHEDULE');
      expect(result.message).toContain('Insufficient funds for credit card payment');
    });

    it('should offer partial payment for manual execution with available funds', async () => {
      // Arrange
      const manualRecurring = {
        ...mockRecurring,
        autoapplyenabled: false,
      };

      // Act
      const result = await service.handleInsufficientFunds(manualRecurring, mockSourceAccount, 500, tenantId);

      // Assert
      expect(result.action).toBe('PARTIAL_PAYMENT_AVAILABLE');
      expect(result.message).toContain('Partial payment of 100 available');
    });

    it('should indicate no funds available for manual execution with zero balance', async () => {
      // Arrange
      const manualRecurring = {
        ...mockRecurring,
        autoapplyenabled: false,
      };
      const zeroBalanceAccount = {
        ...mockSourceAccount,
        balance: 0,
      };

      // Act
      const result = await service.handleInsufficientFunds(manualRecurring, zeroBalanceAccount, 500, tenantId);

      // Assert
      expect(result.action).toBe('NO_FUNDS_AVAILABLE');
      expect(result.message).toBe('No funds available for credit card payment.');
    });
  });
});
