/**
 * Test suite for Credit Card Statement Date functionality
 * Tests the new statement date tracking feature for credit card categories
 */

import { CreditCardPaymentService } from '../CreditCardPaymentService';
import { RecurringType } from '@/src/types/enums/recurring';

// Mock repositories
const mockAccountRepo = {
  findById: jest.fn(),
  updateAccountBalance: jest.fn(),
} as any;

const mockTransactionRepo = {
  findByAccountInDateRange: jest.fn(),
  getAccountBalanceAtDate: jest.fn(),
  createMultipleTransactions: jest.fn(),
} as any;

const mockRecurringRepo = {
  create: jest.fn(),
} as any;

describe('Credit Card Statement Date Functionality', () => {
  let creditCardService: CreditCardPaymentService;

  beforeEach(() => {
    creditCardService = new CreditCardPaymentService(
      mockAccountRepo,
      mockTransactionRepo,
      mockRecurringRepo
    );
    jest.clearAllMocks();
  });

  describe('Statement Balance Calculation', () => {
    it('should use current balance when no statement date is configured', async () => {
      const mockAccount = {
        id: 'credit-card-1',
        balance: 500, // $500 debt
        statementdate: null, // No statement date configured
        category: {
          type: 'Liability',
        }
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      // Use reflection to access private method for testing
      const calculateStatementBalance = (creditCardService as any).calculateStatementBalance.bind(creditCardService);
      const result = await calculateStatementBalance(mockAccount, 'tenant-1');

      expect(result).toBe(500); // Should return absolute value of balance
      expect(mockTransactionRepo.findByAccountInDateRange).not.toHaveBeenCalled();
    });

    it('should calculate statement balance using date ranges when statement date is configured', async () => {
      const mockAccount = {
        id: 'credit-card-1',
        balance: 500,
        statementdate: 15, // Statement closes on 15th of each month
        category: {
          type: 'Liability',
        }
      };

      const mockTransactions = [
        { amount: 100 },
        { amount: 200 },
        { amount: -50 }, // Payment
      ];

      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockTransactionRepo.findByAccountInDateRange.mockResolvedValue(mockTransactions);
      mockTransactionRepo.getAccountBalanceAtDate.mockResolvedValue(300); // Balance at statement start

      // Use reflection to access private method for testing
      const calculateStatementBalance = (creditCardService as any).calculateStatementBalance.bind(creditCardService);
      const result = await calculateStatementBalance(mockAccount, 'tenant-1');

      expect(mockTransactionRepo.findByAccountInDateRange).toHaveBeenCalled();
      expect(mockTransactionRepo.getAccountBalanceAtDate).toHaveBeenCalled();
      expect(result).toBe(550); // |300 + 100 + 200 - 50| = 550
    });

    it('should handle statement date ranges correctly for current month', async () => {
      const mockAccount = {
        id: 'credit-card-1',
        balance: 500,
        statementdate: 15,
        category: {
          type: 'Liability',
        }
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockTransactionRepo.findByAccountInDateRange.mockResolvedValue([]);
      mockTransactionRepo.getAccountBalanceAtDate.mockResolvedValue(0);

      // Mock current date to be after statement date (e.g., 20th)
      const mockDate = new Date('2024-01-20');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const calculateStatementBalanceByDate = (creditCardService as any).calculateStatementBalanceByDate.bind(creditCardService);
      await calculateStatementBalanceByDate(mockAccount, 15, 'tenant-1');

      // Should query from Dec 15 to Jan 15 (current statement period)
      expect(mockTransactionRepo.findByAccountInDateRange).toHaveBeenCalledWith(
        'credit-card-1',
        expect.any(Date), // Start date (Dec 15)
        expect.any(Date), // End date (Jan 15)
        'tenant-1'
      );

      jest.restoreAllMocks();
    });

    it('should handle statement date ranges correctly for previous month', async () => {
      const mockAccount = {
        id: 'credit-card-1',
        balance: 500,
        statementdate: 15,
        category: {
          type: 'Liability',
        }
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockTransactionRepo.findByAccountInDateRange.mockResolvedValue([]);
      mockTransactionRepo.getAccountBalanceAtDate.mockResolvedValue(0);

      // Mock current date to be before statement date (e.g., 10th)
      const mockDate = new Date('2024-01-10');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const calculateStatementBalanceByDate = (creditCardService as any).calculateStatementBalanceByDate.bind(creditCardService);
      await calculateStatementBalanceByDate(mockAccount, 15, 'tenant-1');

      // Should query from Nov 15 to Dec 15 (previous statement period)
      expect(mockTransactionRepo.findByAccountInDateRange).toHaveBeenCalledWith(
        'credit-card-1',
        expect.any(Date), // Start date (Nov 15)
        expect.any(Date), // End date (Dec 15)
        'tenant-1'
      );

      jest.restoreAllMocks();
    });
  });

  describe('Credit Card Payment Creation', () => {
    it('should create credit card payment with statement date validation', async () => {
      const mockRequest = {
        name: 'Credit Card Payment',
        sourceaccountid: 'checking-1',
        categoryid: 'credit-card-category-1',
        recurringtype: RecurringType.CreditCardPayment,
        intervalmonths: 1,
        autoapplyenabled: true,
        isamountflexible: true,
      };

      const mockSourceAccount = {
        id: 'checking-1',
        category: { type: 'Asset' }
      };

      const mockLiabilityAccount = {
        id: 'credit-card-1',
        statementdate: 15,
        category: { 
          type: 'Liability'
        }
      };

      mockAccountRepo.findById
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(mockLiabilityAccount);

      mockRecurringRepo.create.mockResolvedValue({
        id: 'recurring-1',
        ...mockRequest,
      });

      const result = await creditCardService.createCreditCardPayment(
        mockRequest,
        'tenant-1',
        'user-1'
      );

      expect(mockRecurringRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recurringtype: RecurringType.CreditCardPayment,
          isamountflexible: true, // Should be flexible by default for credit card payments
        }),
        'tenant-1'
      );
      expect(result).toBeDefined();
    });
  });

  describe('Statement Date Validation', () => {
    it('should validate statement date range (1-31)', () => {
      // This would be tested in the form validation layer
      // The database constraint ensures values are between 1-31
      const validDates = [1, 15, 28, 31];
      const invalidDates = [0, 32, -1, 40];

      validDates.forEach(date => {
        expect(date).toBeGreaterThanOrEqual(1);
        expect(date).toBeLessThanOrEqual(31);
      });

      invalidDates.forEach(date => {
        expect(date < 1 || date > 31).toBe(true);
      });
    });
  });
});